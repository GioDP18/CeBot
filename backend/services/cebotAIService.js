const ollamaConfig = require('../config/ollama');
const vectorSearchService = require('../services/vectorSearchService');
const Route = require('../models/Route');

class CebotAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize Ollama
      const ollamaReady = await ollamaConfig.initialize();
      
      // Initialize Vector Search
      const vectorReady = await vectorSearchService.initialize();
      
      this.isInitialized = ollamaReady || vectorReady; // At least one should work
      
      if (this.isInitialized) {
        console.log('✅ CeBot AI Service initialized');
      } else {
        console.warn('⚠️  CeBot AI Service initialized with limited functionality');
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error('❌ Failed to initialize CeBot AI Service:', error);
      return false;
    }
  }

  async processMessage(userMessage, sessionId = null) {
    try {
      // 1. Check if message is asking for routes
      const routeQuery = this.extractRouteQuery(userMessage);
      let routeContext = null;
      let searchResults = null;

      if (routeQuery) {
        // Search for relevant routes using vector search
        try {
          const vectorResults = await vectorSearchService.searchSimilarRoutes(
            userMessage, 
            5, 
            0.6
          );
          
          if (vectorResults.length === 0) {
            // Fallback to traditional route search
            searchResults = await this.searchTraditionalRoutes(routeQuery);
          } else {
            searchResults = vectorResults;
          }
          
          routeContext = {
            query: routeQuery,
            results: searchResults,
            foundRoutes: searchResults.length > 0
          };
        } catch (error) {
          console.error('Route search error:', error);
          // Fallback to traditional search
          searchResults = await this.searchTraditionalRoutes(routeQuery);
          routeContext = {
            query: routeQuery,
            results: searchResults,
            foundRoutes: searchResults.length > 0
          };
        }
      }

      // 2. Generate AI response
      let aiResponse;
      
      try {
        if (ollamaConfig.isInitialized) {
          aiResponse = await ollamaConfig.generateCebuResponse(userMessage, routeContext);
        } else {
          aiResponse = this.generateFallbackResponse(userMessage, routeContext);
        }
      } catch (error) {
        console.error('AI response error:', error);
        aiResponse = this.generateFallbackResponse(userMessage, routeContext);
      }

      return {
        response: aiResponse,
        routeContext,
        searchResults,
        sessionId
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        response: "I'm having trouble processing your request right now. Please try asking about specific routes in Cebu City, like 'How do I get from Ayala to SM?'",
        error: error.message
      };
    }
  }

  extractRouteQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Patterns for route queries
    const patterns = [
      /(?:from|gikan)\s+([^to]+?)\s+(?:to|ngadto|sa)\s+(.+)/,
      /(?:how to get|unsaon|pila|route)\s+(?:from|gikan)?\s*([^to]+?)\s+(?:to|ngadto|sa)\s+(.+)/,
      /([a-zA-Z\s]+?)\s+(?:to|ngadto|sa)\s+([a-zA-Z\s]+)/,
      /(?:route|jeep|bus)\s+(?:from|gikan)?\s*([^to]+?)\s+(?:to|ngadto|sa)?\s*(.+)/
    ];

    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return {
          origin: match[1].trim(),
          destination: match[2].trim(),
          type: 'route_search'
        };
      }
    }

    // Check for single location queries
    const locationPatterns = [
      /(?:jeep|bus|route)\s+(?:to|sa|ngadto)\s+([a-zA-Z\s]+)/,
      /(?:how to get to|paano|unsaon)\s+([a-zA-Z\s]+)/
    ];

    for (const pattern of locationPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return {
          destination: match[1].trim(),
          type: 'destination_search'
        };
      }
    }

    return null;
  }

  async searchTraditionalRoutes(routeQuery) {
    try {
      let searchCriteria = {};

      if (routeQuery.origin && routeQuery.destination) {
        // Search for routes from origin to destination
        searchCriteria = {
          $or: [
            {
              $and: [
                { origin: { $regex: routeQuery.origin, $options: 'i' } },
                { destination: { $regex: routeQuery.destination, $options: 'i' } }
              ]
            },
            {
              $and: [
                { route_description: { $regex: routeQuery.origin, $options: 'i' } },
                { route_description: { $regex: routeQuery.destination, $options: 'i' } }
              ]
            }
          ]
        };
      } else if (routeQuery.destination) {
        // Search for routes to destination
        searchCriteria = {
          $or: [
            { destination: { $regex: routeQuery.destination, $options: 'i' } },
            { origin: { $regex: routeQuery.destination, $options: 'i' } },
            { route_description: { $regex: routeQuery.destination, $options: 'i' } }
          ]
        };
      }

      const routes = await Route.find(searchCriteria).limit(5);
      return routes;
    } catch (error) {
      console.error('Traditional route search error:', error);
      return [];
    }
  }

  generateFallbackResponse(userMessage, routeContext = null) {
    const lowerMessage = userMessage.toLowerCase();

    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('kumusta')) {
      return "Hello! I'm CeBot, your Cebu transport assistant. I can help you find jeepney routes, bus routes, and navigate around Cebu City. Try asking me 'How do I get from Ayala to SM?' or 'What jeep goes to Fuente?'";
    }

    // Route-specific responses
    if (routeContext) {
      if (routeContext.foundRoutes && routeContext.results.length > 0) {
        const routes = routeContext.results;
        let response = `Here are the routes I found for your trip:\n\n`;
        
        routes.forEach((route, index) => {
          response += `${index + 1}. **${route.route_code}** - ${route.origin} to ${route.destination}`;
          if (route.fare) response += ` (₱${route.fare})`;
          if (route.notes) response += `\n   Note: ${route.notes}`;
          response += '\n\n';
        });
        
        response += "Need more specific directions or have questions about any of these routes? Just ask!";
        return response;
      } else {
        return `I couldn't find direct routes for "${routeContext.query.origin || ''} to ${routeContext.query.destination || ''}". Try checking for nearby landmarks or major stops like malls, schools, or terminals. You can also ask about specific jeepney codes or areas you know.`;
      }
    }

    // General help
    if (lowerMessage.includes('help')) {
      return "I can help you with Cebu transportation! Here's what you can ask:\n\n• 'How do I get from [place] to [place]?'\n• 'What jeep goes to [destination]?'\n• 'Routes to Ayala Center'\n• 'Jeepney codes for SM'\n\nI know about jeepneys, buses, and modern PUVs in Cebu City and Metro Cebu.";
    }

    // Specific popular routes
    const popularRoutes = {
      'ayala': "To get to Ayala Center, you can take jeepneys with codes like 04L, 06B, 06H, or modern jeepneys. From most areas in the city, look for jeeps going to 'Lahug' or 'Ayala'.",
      'sm': "SM City Cebu is accessible via jeepneys 01C, 04D, 06B, or buses. Look for jeeps with 'SM' or 'North Reclamation' on their signboards.",
      'colon': "Colon Street is the heart of downtown. Almost all jeepneys pass through here. Look for routes 01A, 01B, 02A, 03A, and many others.",
      'fuente': "Fuente Circle is a major hub. Take jeepneys 04A, 04B, 04C, or any jeep with 'Fuente' on the signboard."
    };

    for (const [location, info] of Object.entries(popularRoutes)) {
      if (lowerMessage.includes(location)) {
        return info;
      }
    }

    // Default response
    return "I'm CeBot, specialized in Cebu City transportation! Ask me about routes between places, jeepney codes, or how to get around Metro Cebu. For example: 'How do I get from Capitol to Ayala?' or 'What jeep goes to University of San Carlos?'";
  }

  async getRouteRecommendations(location) {
    try {
      // Get popular routes for a location
      const routes = await Route.find({
        $or: [
          { origin: { $regex: location, $options: 'i' } },
          { destination: { $regex: location, $options: 'i' } },
          { route_description: { $regex: location, $options: 'i' } }
        ]
      }).limit(5);

      return routes;
    } catch (error) {
      console.error('Error getting route recommendations:', error);
      return [];
    }
  }
}

module.exports = new CebotAIService();
