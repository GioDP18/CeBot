const Route = require('../models/Route');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Handle route search requests
    socket.on('search_routes', async (data) => {
      try {
        const { origin, destination } = data;
        
        if (!origin || !destination) {
          socket.emit('search_error', { message: 'Origin and destination are required' });
          return;
        }

        const routes = await Route.findRoutes(origin, destination);
        
        socket.emit('routes_found', {
          origin,
          destination,
          routes,
          count: routes.length
        });

      } catch (error) {
        console.error('Socket search error:', error);
        socket.emit('search_error', { message: 'Error searching routes' });
      }
    });

    // Handle route code lookup
    socket.on('lookup_route', async (data) => {
      try {
        const { routeCode } = data;
        
        if (!routeCode) {
          socket.emit('lookup_error', { message: 'Route code is required' });
          return;
        }

        const route = await Route.findByCode(routeCode);
        
        if (route) {
          socket.emit('route_found', { route });
        } else {
          socket.emit('route_not_found', { message: `Route ${routeCode} not found` });
        }

      } catch (error) {
        console.error('Socket lookup error:', error);
        socket.emit('lookup_error', { message: 'Error looking up route' });
      }
    });

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const { message, sessionId } = data;
        
        // Broadcast message to all connected clients
        io.emit('new_message', {
          id: Date.now(),
          message,
          timestamp: new Date().toISOString(),
          sender: 'user'
        });

        // Process message through improved chat processing
        const response = await processChatMessage(message);
        
        // Send bot response
        setTimeout(() => {
          io.emit('new_message', {
            id: Date.now() + 1,
            message: response,
            timestamp: new Date().toISOString(),
            sender: 'bot'
          });
        }, 1000);

      } catch (error) {
        console.error('Socket chat error:', error);
        socket.emit('chat_error', { message: 'Error processing message' });
      }
    });

    // Handle user typing
    socket.on('typing', (data) => {
      socket.broadcast.emit('user_typing', {
        userId: socket.id,
        isTyping: data.isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};

// Improved chat message processing
async function processChatMessage(message) {
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
        const routeList = routes.map(route => 
          `• ${route.route_code} (${route.type}): ${route.origin} → ${route.destination}`
        ).join('\n');
        
        return `I found ${routes.length} route(s) from ${origin} to ${destination}:\n${routeList}`;
      } else {
        return `Sorry, I couldn't find any direct routes from ${origin} to ${destination}. Try checking the spelling or ask for nearby locations.`;
      }
    } catch (error) {
      console.error('Route search error:', error);
      return "I'm having trouble searching for routes right now. Please try again later.";
    }
  }
  
  // Simple keyword-based responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm CeBot, your Cebu transport assistant. How can I help you today? You can ask me about routes, jeepney codes, or how to get from one place to another.";
  }
  
  if (lowerMessage.includes('route') || lowerMessage.includes('jeepney') || lowerMessage.includes('bus')) {
    return "I can help you find transport routes! Just tell me where you want to go from and to, like 'from Apas to Fuente' or 'how do I get from Ayala to SM'.";
  }
  
  if (lowerMessage.includes('help')) {
    return "I can help you with: finding routes, looking up jeepney codes, and getting transport information in Cebu City. What do you need?";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Is there anything else I can help you with regarding Cebu transport?";
  }
  
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Goodbye! Have a safe journey in Cebu City!";
  }
  
  // Default response
  return "I'm here to help with Cebu transport! You can ask me about routes, jeepney codes, or how to get from one place to another. Try asking something like 'How do I get from Apas to Fuente?'";
}
