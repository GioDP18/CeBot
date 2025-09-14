const Route = require('../models/Route');
const routePlanningService = require('./routePlanningService');

class OpenAIService {
  constructor() {
    this.isInitialized = false;
    this.openai = null;
  }

  async initialize() {
    try {
      // Use standard require instead of dynamic import
      const { OpenAI } = require('openai');
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found in environment variables');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Test the connection
      await this.testConnection();
      
      console.log('✅ OpenAI Service initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ OpenAI Service initialization failed:', error.message);
      this.isInitialized = false;
      return false;
    }
  }

  async testConnection() {
    if (!this.openai) throw new Error('OpenAI client not initialized');
    
    // Simple test to verify the API key works
    await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });
  }

  async processMessage(userMessage, sessionId = null) {
    try {
      if (!this.isInitialized) {
        throw new Error('OpenAI Service not properly initialized');
      }

      // First, try to extract route information from the message
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

      // Create context-aware prompt for OpenAI
      const systemPrompt = this.createSystemPrompt();
      const contextualPrompt = this.createContextualPrompt(userMessage, routeContext);

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextualPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || 
        "I'm having trouble processing your request. Please try asking about routes like 'How do I get from Ayala to SM?'";

      return {
        response: aiResponse,
        routeContext,
        searchResults,
        sessionId,
        aiPowered: true,
        provider: 'openai'
      };

    } catch (error) {
      console.error('Error processing message with OpenAI:', error);
      return {
        response: "I'm currently experiencing technical difficulties with the OpenAI service. Please try using the Local AI model or try again later.",
        error: error.message,
        aiPowered: false,
        provider: 'openai'
      };
    }
  }

  createSystemPrompt() {
    return `You are CeBot, a smart and helpful transport assistant for Metro Cebu, Philippines. You specialize in helping people navigate the city using public transportation including jeepneys, buses, multicabs, and modern PUVs (Public Utility Vehicles).

Key responsibilities:
1. Help users find the best routes between locations in Metro Cebu
2. Provide information about jeepney routes, bus routes, and other public transport
3. Give practical advice about fares, travel times, and alternative routes
4. Plan multi-ride journeys with transfers when no direct route exists
5. Be friendly, conversational, and use some Filipino expressions naturally
6. Always prioritize safety and convenience for travelers

IMPORTANT ROUTE LOGIC:
- ALL ROUTE COORDINATES ARE BIDIRECTIONAL: Routes work in both directions
- If a route shows "Apas to Carbon" with code 17B, it also works "Carbon to Apas" with the same 17B code
- When users ask for directions between two locations, the same route code applies regardless of direction
- Example: 17B works for both "Apas → Carbon" AND "Carbon → Apas"
- Always mention that the route works in both directions when applicable

MULTI-RIDE JOURNEY PLANNING:
- When no direct route exists, provide clear step-by-step transfer instructions
- Explain transfer points and which route codes to look for
- Be encouraging about multi-ride journeys - they're normal and effective
- Provide practical tips for transfers (look for route codes, ask locals, etc.)

Guidelines:
- Use a warm, helpful tone but don't start every message with greetings
- Only use Filipino expressions like "Kumusta!", "Salamat", "Ingat" when naturally appropriate
- When route information is provided, present it clearly and suggest practical tips
- ALWAYS clarify that routes work bidirectionally when showing route codes
- For multi-ride journeys, make instructions clear and encouraging
- If no suitable routes found, offer alternatives or suggestions
- Keep responses concise but informative
- Focus on practical transportation advice for Metro Cebu

Remember: You're helping people navigate Metro Cebu's complex but extensive public transportation network. Be encouraging and helpful, especially when transfers are needed!`;
  }

  createContextualPrompt(userMessage, routeContext) {
    let prompt = `User message: "${userMessage}"\n\n`;

    if (routeContext && routeContext.routePlan) {
      const { routePlan } = routeContext;
      
      if (routePlan.type === 'direct') {
        prompt += `Direct routes found:\n`;
        prompt += `From: ${routeContext.query.origin}\n`;
        prompt += `To: ${routeContext.query.destination}\n\n`;
        
        prompt += `Available routes (BIDIRECTIONAL - work in both directions):\n`;
        routePlan.routes.forEach((route, index) => {
          prompt += `${index + 1}. ${route.route_code} (${route.type}): ${route.origin} → ${route.destination}`;
          if (route.notes) prompt += ` - ${route.notes}`;
          prompt += `\n`;
        });
        
        prompt += `\nIMPORTANT: These routes work BOTH ways! Please provide a helpful response emphasizing bidirectional nature.`;
        
      } else if (routePlan.type === 'multi_ride') {
        prompt += `Multi-ride journey plan found:\n`;
        prompt += `From: ${routeContext.query.origin}\n`;
        prompt += `To: ${routeContext.query.destination}\n`;
        prompt += `Transfers needed: ${routePlan.transfers}\n\n`;
        
        prompt += `Journey plan:\n`;
        prompt += routePlan.instructions;
        
        prompt += `\n\nPlease present this multi-ride journey in a clear, encouraging way. Emphasize that while it requires transfers, it will get the user to their destination.`;
        
      } else if (routePlan.type === 'no_route') {
        prompt += `No suitable route found:\n`;
        prompt += `From: ${routeContext.query.origin}\n`;
        prompt += `To: ${routeContext.query.destination}\n\n`;
        prompt += `Please suggest alternative approaches like breaking the journey, using nearby landmarks, or asking for specific popular destinations.`;
      }
      
    } else if (routeContext && routeContext.foundRoutes && routeContext.results) {
      // Fallback for single location queries
      prompt += `Route search results found:\n`;
      prompt += `From: ${routeContext.query.origin || 'Not specified'}\n`;
      prompt += `To: ${routeContext.query.destination || 'Not specified'}\n\n`;
      
      prompt += `Available routes (BIDIRECTIONAL - work in both directions):\n`;
      routeContext.results.forEach((route, index) => {
        prompt += `${index + 1}. ${route.route_code} (${route.type}): ${route.origin} → ${route.destination}`;
        if (route.notes) prompt += ` - ${route.notes}`;
        prompt += `\n`;
      });

      prompt += `\nIMPORTANT: These routes work BOTH ways! Please provide a helpful response that includes these route options and emphasize the bidirectional nature.`;
    } else if (routeContext && routeContext.query) {
      prompt += `Route search attempted but no direct routes found:\n`;
      prompt += `From: ${routeContext.query.origin || 'Not specified'}\n`;
      prompt += `To: ${routeContext.query.destination || 'Not specified'}\n\n`;
      
      prompt += `Please provide helpful suggestions for alternative routes or ask for clarification about the locations.`;
    } else {
      prompt += `This seems to be a general query about Metro Cebu transportation. Please provide helpful information or ask clarifying questions to better assist the user.`;
    }

    return prompt;
  }

  extractRouteQuery(message) {
    const lowerMessage = message.toLowerCase();
    const cleanMessage = lowerMessage.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    const routeKeywords = ['get to', 'go to', 'route', 'from', 'to', 'jeep', 'bus', 'transport', 'how', 'where', 'way', 'currently in', 'i am in'];
    const hasRouteKeywords = routeKeywords.some(keyword => cleanMessage.includes(keyword));
    
    if (!hasRouteKeywords) return null;

    const routePatterns = [
      /(?:i am currently in|currently in)\s+(brgy\s+)?([a-zA-Z\s]+?)[\s,]+(?:how (?:can|do) i get to|how to get to)\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
      /how\s+do\s+i\s+get\s+from\s+(.*?)\s+to\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
      /how\s+can\s+i\s+get\s+from\s+(.*?)\s+to\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
      /route\s+from\s+(.*?)\s+to\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
      /from\s+(.*?)\s+to\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
      /^([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+what|\s+which|\?|$)/,
    ];

    for (const pattern of routePatterns) {
      const match = cleanMessage.match(pattern);
      if (match && match.length >= 3) {
        // For patterns with 3 groups (brgy + location + destination)
        const origin = match.length === 4 ? 
          this.cleanLocationName((match[2] || match[1]).trim()) : 
          this.cleanLocationName(match[1].trim());
        const destination = match.length === 4 ? 
          this.cleanLocationName(match[3].trim()) : 
          this.cleanLocationName(match[2].trim());
        
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
    
    return location
      .replace(/\b(brgy|the|sa|ng)\b/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async searchTraditionalRoutes(routeQuery) {
    try {
      const { origin, destination } = routeQuery;
      let routes = [];

      if (origin && destination) {
        // Search for routes that connect both locations (bidirectional)
        routes = await Route.find({
          $or: [
            // Forward direction: origin to destination
            {
              $and: [
                { 
                  $or: [
                    { origin: { $regex: new RegExp(`\\b${origin}\\b`, 'i') } },
                    { origin: { $regex: origin, $options: 'i' } }
                  ]
                },
                { 
                  $or: [
                    { destination: { $regex: new RegExp(`\\b${destination}\\b`, 'i') } },
                    { destination: { $regex: destination, $options: 'i' } }
                  ]
                }
              ]
            },
            // Reverse direction: destination to origin (bidirectional support)
            {
              $and: [
                { 
                  $or: [
                    { origin: { $regex: new RegExp(`\\b${destination}\\b`, 'i') } },
                    { origin: { $regex: destination, $options: 'i' } }
                  ]
                },
                { 
                  $or: [
                    { destination: { $regex: new RegExp(`\\b${origin}\\b`, 'i') } },
                    { destination: { $regex: origin, $options: 'i' } }
                  ]
                }
              ]
            },
            // Routes that pass through both locations (broader search including landmarks)
            {
              $and: [
                {
                  $or: [
                    { origin: { $regex: origin, $options: 'i' } },
                    { destination: { $regex: origin, $options: 'i' } },
                    { notes: { $regex: origin, $options: 'i' } },
                    { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } }
                  ]
                },
                {
                  $or: [
                    { origin: { $regex: destination, $options: 'i' } },
                    { destination: { $regex: destination, $options: 'i' } },
                    { notes: { $regex: destination, $options: 'i' } },
                    { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
                  ]
                }
              ]
            }
          ]
        }).limit(10);

        // If still no direct routes, search for routes from origin (including landmarks)
        if (routes.length === 0) {
          routes = await Route.find({
            $or: [
              { origin: { $regex: origin, $options: 'i' } },
              { destination: { $regex: origin, $options: 'i' } },
              { notes: { $regex: origin, $options: 'i' } },
              { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } }
            ]
          }).limit(8);
        }
      } else if (destination) {
        // Search by destination only (including landmarks)
        routes = await Route.find({
          $or: [
            { origin: { $regex: destination, $options: 'i' } },
            { destination: { $regex: destination, $options: 'i' } },
            { notes: { $regex: destination, $options: 'i' } },
            { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
          ]
        }).limit(8);
      }

      return routes;
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }
}

module.exports = new OpenAIService();
