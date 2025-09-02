const dialogflow = require('@google-cloud/dialogflow');
const Route = require('../models/Route');

// Initialize Dialogflow client with error handling
let sessionClient;
let projectId;
let languageCode;

try {
  sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
  projectId = process.env.DIALOGFLOW_PROJECT_ID;
  languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'en';
} catch (error) {
  console.warn('Dialogflow not properly configured, using fallback responses');
  sessionClient = null;
}

// Process user message through Dialogflow or fallback
exports.processMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    let response;

    // Try Dialogflow first, fallback to simple processing if not available
    if (sessionClient && projectId) {
      try {
        // Create session path
        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId || 'default-session');

        // Create request for Dialogflow
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: message,
              languageCode: languageCode,
            },
          },
        };

        // Detect intent
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        
        // Extract intent and parameters
        const intent = result.intent.displayName;
        const parameters = result.parameters.fields;
        
        // Process based on intent
        response = {
          text: result.fulfillmentText,
          intent: intent,
          confidence: result.intentDetectionConfidence,
          parameters: parameters
        };

        // Handle route lookup intent
        if (intent === 'route_lookup') {
          const origin = parameters.origin?.stringValue;
          const destination = parameters.destination?.stringValue;
          
          if (origin && destination) {
            const routes = await Route.findRoutes(origin, destination);
            
            if (routes.length > 0) {
              response.routes = routes;
              response.text = `I found ${routes.length} route(s) from ${origin} to ${destination}:`;
              
              // Format route information
              response.routeDetails = routes.map(route => ({
                code: route.route_code,
                type: route.type,
                origin: route.origin,
                destination: route.destination,
                notes: route.notes
              }));
            } else {
              response.text = `Sorry, I couldn't find any direct routes from ${origin} to ${destination}. Would you like me to suggest alternative routes?`;
              response.suggestions = await getRouteSuggestions(origin, destination);
            }
          }
        }

        // Handle general help intent
        if (intent === 'general_help') {
          const routeStats = await Route.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ]);
          
          response.text = `I can help you find transport routes in Cebu City! There are currently ${routeStats.reduce((sum, stat) => sum + stat.count, 0)} routes available. You can ask me about specific routes, or ask how to get from one place to another.`;
          response.stats = routeStats;
        }

        // Handle route code lookup
        if (intent === 'route_code_lookup') {
          const routeCode = parameters.route_code?.stringValue;
          
          if (routeCode) {
            const route = await Route.findByCode(routeCode);
            
            if (route) {
              response.text = `Route ${routeCode} goes from ${route.origin} to ${route.destination}. ${route.notes ? `Note: ${route.notes}` : ''}`;
              response.route = route;
            } else {
              response.text = `Sorry, I couldn't find route ${routeCode}. Please check the route code and try again.`;
            }
          }
        }

      } catch (dialogflowError) {
        console.error('Dialogflow error:', dialogflowError);
        // Fallback to simple processing
        response = await processMessageFallback(message);
      }
    } else {
      // Use fallback processing
      response = await processMessageFallback(message);
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing message',
      error: error.message
    });
  }
};

// Fallback message processing when Dialogflow is not available
async function processMessageFallback(message) {
  const lowerMessage = message.toLowerCase();
  
  // Route search patterns
  const routePattern = /(?:from|go to|get to|route|jeepney|bus).*?(?:from|to|between)\s+([^,\s]+)(?:\s+to\s+|\s+and\s+)([^,\s]+)/i;
  const match = message.match(routePattern);
  
  if (match) {
    const origin = match[1];
    const destination = match[2];
    
    try {
      const routes = await Route.findRoutes(origin, destination);
      
      if (routes.length > 0) {
        return {
          text: `I found ${routes.length} route(s) from ${origin} to ${destination}:`,
          routes: routes,
          routeDetails: routes.map(route => ({
            code: route.route_code,
            type: route.type,
            origin: route.origin,
            destination: route.destination,
            notes: route.notes
          }))
        };
      } else {
        const suggestions = await getRouteSuggestions(origin, destination);
        return {
          text: `Sorry, I couldn't find any direct routes from ${origin} to ${destination}. Would you like me to suggest alternative routes?`,
          suggestions: suggestions
        };
      }
    } catch (error) {
      console.error('Route search error:', error);
      return {
        text: `I'm having trouble searching for routes right now. Please try again later.`
      };
    }
  }
  
  // Simple keyword-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      text: "Hello! I'm CeBot, your Cebu transport assistant. How can I help you today? You can ask me about routes, jeepney codes, or how to get from one place to another."
    };
  }
  
  if (lowerMessage.includes('route') || lowerMessage.includes('jeepney') || lowerMessage.includes('bus')) {
    return {
      text: "I can help you find transport routes! Just tell me where you want to go from and to, like 'from Apas to Fuente' or 'how do I get from Ayala to SM'."
    };
  }
  
  if (lowerMessage.includes('help')) {
    return {
      text: "I can help you with: finding routes, looking up jeepney codes, and getting transport information in Cebu City. What do you need?"
    };
  }
  
  if (lowerMessage.includes('thank')) {
    return {
      text: "You're welcome! Is there anything else I can help you with regarding Cebu transport?"
    };
  }
  
  return {
    text: "I'm here to help with Cebu transport! You can ask me about routes, jeepney codes, or how to get from one place to another. Try asking something like 'How do I get from Apas to Fuente?'"
  };
}

// Get chat history (placeholder for future implementation)
exports.getChatHistory = async (req, res) => {
  try {
    // In a real app, you'd store chat history in a database
    res.json({
      success: true,
      message: 'Chat history feature coming soon',
      data: []
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
};

// Clear chat history
exports.clearChatHistory = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Chat history cleared'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
      error: error.message
    });
  }
};

// Helper function to get route suggestions
async function getRouteSuggestions(origin, destination) {
  try {
    const originRoutes = await Route.find({
      searchable_origin: { $regex: origin.toLowerCase(), $options: 'i' }
    }).limit(3);
    
    const destinationRoutes = await Route.find({
      searchable_destination: { $regex: destination.toLowerCase(), $options: 'i' }
    }).limit(3);
    
    return {
      similarOrigins: originRoutes.map(r => ({ code: r.route_code, location: r.origin })),
      similarDestinations: destinationRoutes.map(r => ({ code: r.route_code, location: r.destination }))
    };
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return { similarOrigins: [], similarDestinations: [] };
  }
}
