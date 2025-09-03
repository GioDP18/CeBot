const dialogflow = require('@google-cloud/dialogflow');
const Route = require('../models/Route');
const getGoogleCredentials = require('../config/googleCredentials');
const cebotAIService = require('../services/cebotAIService');

// Initialize Dialogflow client with error handling
let sessionClient;
let projectId;
let languageCode;

try {
  // For Vercel deployment and local development
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
    ? { credentials: getGoogleCredentials() }
    : { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  
  sessionClient = new dialogflow.SessionsClient(credentials);
  projectId = process.env.DIALOGFLOW_PROJECT_ID;
  languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'en';
} catch (error) {
  console.warn('Dialogflow not properly configured, using CeBot AI fallback:', error);
  sessionClient = null;
}

// Process user message through CeBot AI Service
exports.processMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Use CeBot AI Service for processing
    const aiResult = await cebotAIService.processMessage(message, sessionId);

    const response = {
      success: true,
      data: {
        text: aiResult.response,
        intent: aiResult.routeContext ? 'route.search' : 'general.chat',
        parameters: aiResult.routeContext || {},
        sessionId: aiResult.sessionId || sessionId || 'default-session'
      },
      searchResults: aiResult.searchResults,
      suggestions: aiResult.routeContext ? await generateSuggestions(aiResult.routeContext) : null
    };

    res.json(response);
  } catch (error) {
    console.error('Error in processMessage:', error);
    
    // Enhanced fallback response
    const fallbackResponse = generateEnhancedFallback(req.body.message);
    
    res.json({
      success: true,
      data: {
        text: fallbackResponse,
        intent: 'fallback',
        sessionId: req.body.sessionId || 'default-session'
      }
    });
  }
};

// Generate suggestions based on route context
async function generateSuggestions(routeContext) {
  try {
    if (!routeContext.query) return null;

    const suggestions = {};

    // Get similar origins
    if (routeContext.query.origin) {
      const similarOrigins = await Route.find({
        origin: { $regex: routeContext.query.origin, $options: 'i' }
      }).limit(3).select('route_code origin');
      
      suggestions.similarOrigins = similarOrigins.map(route => ({
        code: route.route_code,
        location: route.origin
      }));
    }

    // Get similar destinations
    if (routeContext.query.destination) {
      const similarDestinations = await Route.find({
        destination: { $regex: routeContext.query.destination, $options: 'i' }
      }).limit(3).select('route_code destination');
      
      suggestions.similarDestinations = similarDestinations.map(route => ({
        code: route.route_code,
        location: route.destination
      }));
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return null;
  }
}

// Enhanced fallback response
function generateEnhancedFallback(message) {
  const lowerMessage = message ? message.toLowerCase() : '';
  
  // Cebu-specific greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('kumusta')) {
    return "Kumusta! I'm CeBot, your Cebu transport assistant. I can help you find the best routes around Metro Cebu using jeepneys, buses, and modern PUVs. Try asking 'How do I get from Ayala to SM?' or 'What jeep goes to USC?'";
  }
  
  // Route-related keywords
  if (lowerMessage.includes('route') || lowerMessage.includes('jeep') || lowerMessage.includes('bus')) {
    return "I can help you find transport routes in Cebu! Tell me where you want to go from and to, like 'from Capitol to Ayala' or 'Colon to SM'. I know about traditional jeepneys, modern jeepneys, and buses in Metro Cebu.";
  }
  
  // Help requests
  if (lowerMessage.includes('help')) {
    return "Here's how I can help with Cebu transportation:\n\n🚌 Find routes between locations\n🗺️ Get jeepney codes and fare info\n📍 Navigate to popular destinations\n💡 Suggest alternative routes\n\nJust ask me something like 'How do I get from [your location] to [destination]?'";
  }
  
  // Default enhanced response
  return "I'm CeBot, your smart assistant for navigating Cebu City and Metro Cebu! I specialize in helping you find the best transport routes using jeepneys, buses, and modern PUVs. Ask me about routes, fares, or how to get around - I'm here to make your Cebu travel easier! 🚌🗺️";
}

// Legacy route search for backward compatibility
exports.searchRoutes = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }

    const routes = await Route.findRoutes(origin, destination);
    
    res.json({
      success: true,
      data: routes,
      origin: origin,
      destination: destination,
      count: routes.length
    });

  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching routes',
      error: error.message
    });
  }
};

// Get chat history (placeholder for future implementation)
exports.getChatHistory = async (req, res) => {
  try {
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
