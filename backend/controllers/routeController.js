const Route = require('../models/Route');

// Get all routes
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ type: 1, route_code: 1 });
    
    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching all routes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching routes',
      error: error.message
    });
  }
};

// Get routes by type
exports.getRoutesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const routes = await Route.findByType(type);
    
    res.json({
      success: true,
      type,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching routes by type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching routes by type',
      error: error.message
    });
  }
};

// Get route by code
exports.getRouteByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const route = await Route.findByCode(code);
    
    if (!route) {
      return res.status(200).json({
        success: true,
        message: `Route with code ${code} not found`,
        data: []
      });
    }
    
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error fetching route by code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching route by code',
      error: error.message
    });
  }
};

// Search routes by origin and destination
exports.searchRoutes = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required'
      });
    }
    
    // Use the custom static method to find routes
    const routes = await Route.findRoutes(origin, destination);
    
    if (routes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No routes found for the specified origin and destination',
        suggestions: await getRouteSuggestions(origin, destination),
        data: []
      });
    }
    
    res.json({
      success: true,
      count: routes.length,
      origin,
      destination,
      data: routes
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

// Get route statistics
exports.getRouteStats = async (req, res) => {
  try {
    const stats = await Route.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          routes: { $push: '$route_code' }
        }
      }
    ]);
    
    const totalRoutes = await Route.countDocuments();
    
    res.json({
      success: true,
      totalRoutes,
      stats
    });
  } catch (error) {
    console.error('Error fetching route stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching route statistics',
      error: error.message
    });
  }
};

// Get popular routes (most searched)
exports.getPopularRoutes = async (req, res) => {
  try {
    // For now, return some common routes
    // In a real app, you'd track search frequency
    const popularRoutes = await Route.find({
      route_code: { $in: ['17B', '04L', '03Q', '06H', '12L'] }
    }).sort({ route_code: 1 });
    
    res.json({
      success: true,
      data: popularRoutes
    });
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular routes',
      error: error.message
    });
  }
};

// Helper function to get route suggestions
async function getRouteSuggestions(origin, destination) {
  try {
    // Find routes that might be similar
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
