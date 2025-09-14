const Route = require('../models/Route');

class RoutePlanningService {
  constructor() {
    this.maxTransfers = 3; // Maximum number of transfers to prevent infinite loops
  }

  /**
   * Find the best route plan from origin to destination
   * @param {string} origin - Starting location
   * @param {string} destination - Target destination
   * @returns {Object} Route plan with transfers
   */
  async findRoutePlan(origin, destination) {
    try {
      // First, try to find direct routes
      const directRoutes = await this.findDirectRoutes(origin, destination);
      if (directRoutes.length > 0) {
        return {
          type: 'direct',
          routes: directRoutes,
          transfers: 0,
          instructions: this.generateDirectInstructions(directRoutes, origin, destination)
        };
      }

      // If no direct route, find multi-ride journey
      const multiRideJourney = await this.findMultiRideJourney(origin, destination);
      if (multiRideJourney) {
        return multiRideJourney;
      }

      return {
        type: 'no_route',
        routes: [],
        transfers: 0,
        instructions: `Sorry, I couldn't find a route from ${origin} to ${destination}. Try breaking your journey or ask for routes to nearby landmarks.`
      };

    } catch (error) {
      console.error('Route planning error:', error);
      return {
        type: 'error',
        routes: [],
        transfers: 0,
        instructions: 'Sorry, I encountered an error while planning your route. Please try again.'
      };
    }
  }

  /**
   * Find direct routes between origin and destination
   */
  async findDirectRoutes(origin, destination) {
    return await Route.find({
      $or: [
        // Forward direction
        {
          $and: [
            { 
              $or: [
                { origin: { $regex: origin, $options: 'i' } },
                { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } }
              ]
            },
            { 
              $or: [
                { destination: { $regex: destination, $options: 'i' } },
                { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
              ]
            }
          ]
        },
        // Reverse direction (bidirectional)
        {
          $and: [
            { 
              $or: [
                { origin: { $regex: destination, $options: 'i' } },
                { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
              ]
            },
            { 
              $or: [
                { destination: { $regex: origin, $options: 'i' } },
                { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } }
              ]
            }
          ]
        },
        // Routes that pass through both locations in landmarks
        {
          $and: [
            { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } },
            { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
          ]
        }
      ]
    }).limit(5);
  }

  /**
   * Find multi-ride journey with transfers
   */
  async findMultiRideJourney(origin, destination) {
    // Find routes from origin
    const fromOriginRoutes = await Route.find({
      $or: [
        { origin: { $regex: origin, $options: 'i' } },
        { route_landmarks: { $elemMatch: { $regex: origin, $options: 'i' } } }
      ]
    }).limit(20);

    // Find routes to destination
    const toDestinationRoutes = await Route.find({
      $or: [
        { destination: { $regex: destination, $options: 'i' } },
        { route_landmarks: { $elemMatch: { $regex: destination, $options: 'i' } } }
      ]
    }).limit(20);

    // Find connecting points
    const connections = this.findConnections(fromOriginRoutes, toDestinationRoutes, origin, destination);
    
    if (connections.length > 0) {
      const bestConnection = connections[0]; // Take the first/best connection
      return {
        type: 'multi_ride',
        routes: [bestConnection.firstRoute, bestConnection.secondRoute],
        transfers: 1,
        transferPoint: bestConnection.connectionPoint,
        instructions: this.generateMultiRideInstructions(bestConnection, origin, destination)
      };
    }

    // Try 3-ride journey if 2-ride didn't work
    return await this.findThreeRideJourney(origin, destination, fromOriginRoutes, toDestinationRoutes);
  }

  /**
   * Find connections between routes from origin and routes to destination
   */
  findConnections(fromOriginRoutes, toDestinationRoutes, origin, destination) {
    const connections = [];

    fromOriginRoutes.forEach(firstRoute => {
      // Get all possible stops from the first route (after origin)
      const firstRouteStops = this.getRouteStops(firstRoute, origin);
      
      toDestinationRoutes.forEach(secondRoute => {
        // Get all possible stops from the second route (before destination)
        const secondRouteStops = this.getRouteStops(secondRoute, destination, true);
        
        // Find common stops
        firstRouteStops.forEach(stop1 => {
          secondRouteStops.forEach(stop2 => {
            if (this.locationsMatch(stop1, stop2)) {
              connections.push({
                firstRoute,
                secondRoute,
                connectionPoint: stop1,
                priority: this.calculateConnectionPriority(stop1, firstRoute, secondRoute)
              });
            }
          });
        });
      });
    });

    // Sort by priority (higher is better)
    return connections.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get all stops/landmarks from a route
   */
  getRouteStops(route, referenceLocation, isDestinationRoute = false) {
    const stops = [];
    
    // Add origin and destination
    if (!isDestinationRoute) {
      stops.push(route.destination);
    } else {
      stops.push(route.origin);
    }
    
    // Add all landmarks
    if (route.route_landmarks && route.route_landmarks.length > 0) {
      stops.push(...route.route_landmarks);
    }
    
    // Filter out the reference location to avoid circular routes
    return stops.filter(stop => !this.locationsMatch(stop, referenceLocation));
  }

  /**
   * Check if two location names match (fuzzy matching)
   */
  locationsMatch(loc1, loc2) {
    if (!loc1 || !loc2) return false;
    
    const clean1 = loc1.toLowerCase().trim();
    const clean2 = loc2.toLowerCase().trim();
    
    // Exact match
    if (clean1 === clean2) return true;
    
    // Partial match (one contains the other)
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    return false;
  }

  /**
   * Calculate priority for a connection point
   */
  calculateConnectionPriority(connectionPoint, firstRoute, secondRoute) {
    let priority = 0;
    
    // Major hubs get higher priority
    const majorHubs = ['fuente', 'colon', 'carbon', 'ayala', 'sm', 'lahug', 'jones'];
    const cleanPoint = connectionPoint.toLowerCase();
    
    if (majorHubs.some(hub => cleanPoint.includes(hub))) {
      priority += 10;
    }
    
    // Prefer connections that appear in route notes
    if (firstRoute.notes && firstRoute.notes.toLowerCase().includes(cleanPoint)) {
      priority += 5;
    }
    if (secondRoute.notes && secondRoute.notes.toLowerCase().includes(cleanPoint)) {
      priority += 5;
    }
    
    return priority;
  }

  /**
   * Find three-ride journey (for complex routes)
   */
  async findThreeRideJourney(origin, destination, fromOriginRoutes, toDestinationRoutes) {
    // Get intermediate routes that could connect the first and last segments
    const intermediateRoutes = await Route.find({}).limit(50);
    
    for (const firstRoute of fromOriginRoutes.slice(0, 5)) {
      const firstRouteStops = this.getRouteStops(firstRoute, origin);
      
      for (const lastRoute of toDestinationRoutes.slice(0, 5)) {
        const lastRouteStops = this.getRouteStops(lastRoute, destination, true);
        
        for (const middleRoute of intermediateRoutes) {
          const middleRouteStops = this.getRouteStops(middleRoute, '');
          
          // Find if middle route can connect first and last routes
          const firstConnection = firstRouteStops.find(stop1 => 
            middleRouteStops.some(stop2 => this.locationsMatch(stop1, stop2))
          );
          
          const secondConnection = lastRouteStops.find(stop1 => 
            middleRouteStops.some(stop2 => this.locationsMatch(stop1, stop2))
          );
          
          if (firstConnection && secondConnection) {
            return {
              type: 'multi_ride',
              routes: [firstRoute, middleRoute, lastRoute],
              transfers: 2,
              transferPoints: [firstConnection, secondConnection],
              instructions: this.generateThreeRideInstructions({
                firstRoute,
                middleRoute,
                lastRoute,
                firstConnection,
                secondConnection
              }, origin, destination)
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Generate instructions for direct routes
   */
  generateDirectInstructions(routes, origin, destination) {
    if (routes.length === 1) {
      const route = routes[0];
      return `🚌 **Direct Route Available!**\n\n` +
             `Take **${route.route_code}** (${route.type})\n` +
             `📍 From: ${origin}\n` +
             `📍 To: ${destination}\n\n` +
             `✅ **Note:** This route works in BOTH directions!`;
    } else {
      let instructions = `🚌 **Multiple Direct Routes Available!**\n\n` +
                        `From **${origin}** to **${destination}**:\n\n`;
      
      routes.forEach((route, index) => {
        instructions += `**Option ${index + 1}:** ${route.route_code} (${route.type})\n`;
        instructions += `   Route: ${route.origin} → ${route.destination}\n`;
        if (route.notes) instructions += `   💡 ${route.notes}\n`;
        instructions += `\n`;
      });
      
      instructions += `✅ **Note:** All these routes work in BOTH directions!`;
      return instructions;
    }
  }

  /**
   * Generate instructions for multi-ride journey
   */
  generateMultiRideInstructions(connection, origin, destination) {
    const { firstRoute, secondRoute, connectionPoint } = connection;
    
    return `🚌 **Multi-Ride Journey Plan**\n\n` +
           `From **${origin}** to **${destination}**:\n\n` +
           `**Step 1:** 🚌 Take **${firstRoute.route_code}**\n` +
           `   • Board at: ${origin}\n` +
           `   • Get off at: **${connectionPoint}**\n\n` +
           `**Step 2:** 🚌 Transfer to **${secondRoute.route_code}**\n` +
           `   • Board at: **${connectionPoint}**\n` +
           `   • Get off at: ${destination}\n\n` +
           `📍 **Transfer Point:** ${connectionPoint}\n` +
           `🎯 **Total Rides:** 2 jeepneys (1 transfer)\n\n` +
           `💡 **Tip:** Keep an eye out for the route codes displayed on the front of each jeepney!`;
  }

  /**
   * Generate instructions for three-ride journey
   */
  generateThreeRideInstructions(journey, origin, destination) {
    const { firstRoute, middleRoute, lastRoute, firstConnection, secondConnection } = journey;
    
    return `🚌 **Complex Multi-Ride Journey Plan**\n\n` +
           `From **${origin}** to **${destination}**:\n\n` +
           `**Step 1:** 🚌 Take **${firstRoute.route_code}**\n` +
           `   • Board at: ${origin}\n` +
           `   • Get off at: **${firstConnection}**\n\n` +
           `**Step 2:** 🚌 Transfer to **${middleRoute.route_code}**\n` +
           `   • Board at: **${firstConnection}**\n` +
           `   • Get off at: **${secondConnection}**\n\n` +
           `**Step 3:** 🚌 Transfer to **${lastRoute.route_code}**\n` +
           `   • Board at: **${secondConnection}**\n` +
           `   • Get off at: ${destination}\n\n` +
           `📍 **Transfer Points:** ${firstConnection}, ${secondConnection}\n` +
           `🎯 **Total Rides:** 3 jeepneys (2 transfers)\n\n` +
           `💡 **Tip:** This journey requires patience but will get you to your destination! Allow extra time for transfers.`;
  }
}

module.exports = new RoutePlanningService();
