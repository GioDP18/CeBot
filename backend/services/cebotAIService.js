const Route = require('../models/Route');
const routePlanningService = require('./routePlanningService');

class CebotAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    console.log('✅ CeBot AI Service initialized (enhanced mode)');
    this.isInitialized = true;
    return true;
  }

  async processMessage(userMessage, sessionId = null) {
    try {
      const routeQuery = this.extractRouteQuery(userMessage);
      let routeContext = null;
      let searchResults = null;

      if (routeQuery) {
        try {
          // Use the new route planning service for intelligent route planning
          if (routeQuery.origin && routeQuery.destination) {
            const routePlan = await routePlanningService.findRoutePlan(
              routeQuery.origin, 
              routeQuery.destination
            );
            
            routeContext = {
              query: routeQuery,
              routePlan: routePlan,
              foundRoutes: routePlan.routes && routePlan.routes.length > 0
            };
            
            searchResults = routePlan.routes || [];
          } else {
            // Fallback to traditional search for single location queries
            searchResults = await this.searchTraditionalRoutes(routeQuery);
            routeContext = {
              query: routeQuery,
              results: searchResults,
              foundRoutes: searchResults.length > 0
            };
          }
        } catch (error) {
          console.error('Route search error:', error);
          searchResults = [];
          routeContext = {
            query: routeQuery,
            results: [],
            foundRoutes: false
          };
        }
      }

      const aiResponse = this.generateResponse(userMessage, routeContext);

      return {
        response: aiResponse,
        routeContext,
        searchResults,
        sessionId,
        aiPowered: true
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        response: "I'm having trouble processing your request. Please try asking about routes like 'I am currently in Ayala, how can I get to SM?'",
        error: error.message,
        aiPowered: false
      };
    }
  }

  extractRouteQuery(message) {
    const lowerMessage = message.toLowerCase();
    const cleanMessage = lowerMessage.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const routeKeywords = ['get to', 'go to', 'route', 'from', 'to', 'jeep', 'bus', 'transport', 'how', 'where', 'way', 'currently in', 'i am in'];
    const hasRouteKeywords = routeKeywords.some(keyword => cleanMessage.includes(keyword));
    
    if (!hasRouteKeywords) return null;

    const routePatterns = [
      // Most specific patterns first
      /(?:i am from|i'm from)\s+([a-zA-Z\s]+?)[\s,]+(?:how (?:can|do) i get to|how to get to)\s+(.+)/,
      /(?:i am currently in|currently in)\s+([^,]+?)[\s,]+(?:how (?:can|do) i get to|how to get to)\s+(.+)/,
      /how\s+do\s+i\s+get\s+from\s+(.*?)\s+to\s+(.+)/,
      /how\s+can\s+i\s+get\s+from\s+(.*?)\s+to\s+(.+)/,
      /route\s+from\s+(.*?)\s+to\s+(.+)/,
      // Generic patterns last
      /from\s+(.*?)\s+to\s+(.+)/,
      /^([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)$/,
    ];

    for (const pattern of routePatterns) {
      const match = cleanMessage.match(pattern);
      if (match && match[1] && match[2]) {
        const origin = this.cleanLocationName(match[1].trim());
        const destination = this.cleanLocationName(match[2].trim());
        
        if (origin && destination && origin.length > 1 && destination.length > 1 && origin !== destination) {
          return { origin, destination };
        }
      }
    }

    const locationKeywords = ['ayala', 'sm', 'carbon', 'colon', 'fuente', 'lahug', 'banilad', 'usc', 'capitol', 'it park', 'apas'];
    const foundLocations = locationKeywords.filter(keyword => cleanMessage.includes(keyword));
    
    if (foundLocations.length >= 2) {
      return { origin: foundLocations[0], destination: foundLocations[foundLocations.length - 1] };
    } else if (foundLocations.length === 1) {
      return { destination: foundLocations[0] };
    }

    return null;
  }

  cleanLocationName(location) {
    if (!location) return null;
    return location.replace(/^(?:brgy|barangay)\s+/i, '').replace(/^(?:the|sa)\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  async searchTraditionalRoutes(routeQuery) {
    try {
      let searchQueries = [];
      
      if (routeQuery.origin && routeQuery.destination) {
        searchQueries = [
          // Forward direction: origin to destination
          { origin: { $regex: routeQuery.origin, $options: 'i' }, destination: { $regex: routeQuery.destination, $options: 'i' } },
          // Reverse direction: destination to origin (bidirectional support)
          { origin: { $regex: routeQuery.destination, $options: 'i' }, destination: { $regex: routeQuery.origin, $options: 'i' } },
          // Route descriptions (both directions)
          { route_description: { $regex: routeQuery.origin + '.*' + routeQuery.destination, $options: 'i' } },
          { route_description: { $regex: routeQuery.destination + '.*' + routeQuery.origin, $options: 'i' } },
          // Route landmarks search (bidirectional)
          {
            $and: [
              { route_landmarks: { $elemMatch: { $regex: routeQuery.origin, $options: 'i' } } },
              { route_landmarks: { $elemMatch: { $regex: routeQuery.destination, $options: 'i' } } }
            ]
          }
        ];
      } else if (routeQuery.destination) {
        searchQueries = [
          { destination: { $regex: routeQuery.destination, $options: 'i' } },
          { origin: { $regex: routeQuery.destination, $options: 'i' } },
          { route_description: { $regex: routeQuery.destination, $options: 'i' } },
          { route_landmarks: { $elemMatch: { $regex: routeQuery.destination, $options: 'i' } } }
        ];
      }

      if (searchQueries.length === 0) return [];
      const routes = await Route.find({ $or: searchQueries }).limit(10);
      return routes || [];

    } catch (error) {
      console.error('Traditional route search error:', error);
      return [];
    }
  }

  generateResponse(userMessage, routeContext = null) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('kumusta')) {
      return "Kumusta! I'm CeBot, your intelligent Cebu transport assistant. Ask me 'I am currently in Ayala, how can I get to SM?' or any transportation question!";
    }

    if (routeContext) {
      // Handle new route planning results
      if (routeContext.routePlan) {
        const { routePlan } = routeContext;
        
        if (routePlan.type === 'direct') {
          return routePlan.instructions;
        } else if (routePlan.type === 'multi_ride') {
          return routePlan.instructions;
        } else if (routePlan.type === 'no_route') {
          return routePlan.instructions;
        } else if (routePlan.type === 'error') {
          return routePlan.instructions;
        }
      }
      
      // Fallback to traditional handling for single location queries
      if (routeContext.foundRoutes && routeContext.results && routeContext.results.length > 0) {
        const routes = routeContext.results;
        let response = '🚌 **Route Search Results**\n\n';
        
        if (routeContext.query.origin && routeContext.query.destination) {
          response += `From **${this.capitalizeLocation(routeContext.query.origin)}** to **${this.capitalizeLocation(routeContext.query.destination)}**:\n\n`;
        } else if (routeContext.query.destination) {
          response += `Routes to **${this.capitalizeLocation(routeContext.query.destination)}**:\n\n`;
        }
        
        routes.forEach((route, index) => {
          response += `**Route ${index + 1}:** ${route.route_code}\n`;
          response += `   📍 ${route.origin} → ${route.destination}`;
          if (route.fare) response += ` (₱${route.fare})`;
          response += '\n';
          if (route.notes) response += `   💡 ${route.notes}\n`;
          response += '\n';
        });
        
        // Add bidirectional note
        if (routeContext.query.origin && routeContext.query.destination) {
          response += '✅ **Note:** These routes work in BOTH directions!\n';
          response += 'You can use the same route codes for your return trip.\n\n';
        }
        
        response += 'Would you like more details about any of these routes?';
        return response;
      } else {
        const origin = routeContext.query.origin ? this.capitalizeLocation(routeContext.query.origin) : null;
        const destination = routeContext.query.destination ? this.capitalizeLocation(routeContext.query.destination) : null;
        
        let response = '🤔 **Route Planning Help**\n\n';
        response += 'I understand you want to travel';
        if (origin && destination) response += ` from **${origin}** to **${destination}**`;
        else if (destination) response += ` to **${destination}**`;
        response += '. While I don\'t have a direct route in my database, here are some helpful tips:\n\n';
        
        response += '🚌 **Smart Travel Strategies:**\n\n';
        response += '• **Major Transfer Points:** Most routes connect through:\n';
        response += '   - Colon Street (downtown hub)\n';
        response += '   - Fuente Circle (major intersection)\n';
        response += '   - Carbon Market (central terminal)\n\n';
        response += '• **Two-Part Journey:** Try breaking your trip into segments\n';
        response += '• **Landmark Navigation:** Look for jeepneys going to nearby landmarks\n\n';
        response += '💡 **Try asking:** "Routes to SM" or "How to get to Ayala"';
        return response;
      }
    }

    if (lowerMessage.includes('help')) {
      return "🚌 **CeBot - Your Cebu Transportation Assistant**\n\n" +
             "I'm here to help you navigate Cebu's jeepney routes!\n\n" +
             "**Ask me naturally like:**\n\n" +
             "• 'I am currently in Ayala, how can I get to SM?'\n" +
             "• 'From USC to Carbon Market'\n" +
             "• 'What's the best way to get to IT Park?'\n" +
             "• 'How do I get from Apas to Ayala?'\n\n" +
             "**I can help with:**\n" +
             "✅ Direct route planning\n" +
             "✅ Multi-ride journeys with transfers\n" +
             "✅ Route recommendations\n" +
             "✅ Travel tips and landmarks\n\n" +
             "Just ask away! 😊";
    }

    const popularRoutes = {
      'ayala': "🏢 **Ayala Center:** Take jeepneys with 'Lahug' signs (04L, 06B, 06H). From downtown, transfer at Fuente Circle.",
      'sm': "🛒 **SM City Cebu:** Look for jeepneys with 'SM' or 'North Reclamation' signs (01C, 04D, 06B).",
      'carbon': "🛍️ **Carbon Market:** Almost all jeepneys pass through here. Perfect transfer point!",
      'colon': "🏛️ **Colon Street:** Historic downtown hub where most jeepneys converge.",
      'fuente': "⭕ **Fuente Circle:** Major intersection and transfer hub.",
      'it park': "💼 **Cebu IT Park:** Take 04L routes or jeepneys going to 'Lahug'.",
      'apas': "🏘️ **Apas:** Take 04L routes towards Lahug direction."
    };

    for (const [location, info] of Object.entries(popularRoutes)) {
      if (lowerMessage.includes(location)) {
        return info;
      }
    }

    return "👋 **Hi! I'm CeBot**\n\n" +
           "Your smart Cebu transportation guide! 🚌✨\n\n" +
           "**Just tell me where you want to go:**\n\n" +
           "• 'I am currently in Ayala, how can I get to SM?'\n" +
           "• 'Best route from USC to Carbon Market'\n" +
           "• 'How do I get from Apas to Ayala?'\n\n" +
           "I'll find the best routes and give you helpful travel tips!";
  }

  capitalizeLocation(location) {
    if (!location) return '';
    return location.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

module.exports = new CebotAIService();
