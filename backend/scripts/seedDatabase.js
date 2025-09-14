const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Route = require('../models/Route');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cebot');
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Load routes data from JSON file
const loadRoutesData = () => {
  try {
    const routesPath = path.join(__dirname, '../../cebu_transport_routes.json');
    const data = fs.readFileSync(routesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading routes data:', error.message);
    process.exit(1);
  }
};

// Seed jeepney routes
const seedJeepneyRoutes = async (jeepneyRoutes) => {
  try {
    console.log('🚌 Seeding jeepney routes...');
    
    for (const route of jeepneyRoutes) {
      const routeData = {
        route_code: route.route_code,
        type: route.type,
        origin: route.origin,
        destination: route.destination,
        route_landmarks: route.route_landmarks || [],
        route_coordinates: route.route_coordinates || {},
        notes: route.notes || '',
        last_verified: new Date(route.last_verified)
      };
      
      // Check if route already exists
      const existingRoute = await Route.findOne({ route_code: route.route_code });
      
      if (existingRoute) {
        await Route.findOneAndUpdate(
          { route_code: route.route_code },
          routeData,
          { new: true, upsert: true }
        );
        console.log(`✅ Updated route: ${route.route_code}`);
      } else {
        await Route.create(routeData);
        console.log(`✅ Created route: ${route.route_code}`);
      }
    }
    
    console.log(`🎉 Successfully seeded ${jeepneyRoutes.length} jeepney routes`);
  } catch (error) {
    console.error('❌ Error seeding jeepney routes:', error.message);
  }
};

// Seed modern jeepney routes
const seedModernJeepneyRoutes = async (modernJeepneyRoutes) => {
  try {
    console.log('🚌 Seeding modern jeepney routes...');
    
    for (const route of modernJeepneyRoutes) {
      const routeData = {
        route_code: route.route_code,
        type: route.type,
        origin: route.origin,
        destination: route.destination,
        route_landmarks: route.route_landmarks || [],
        route_coordinates: route.route_coordinates || {},
        notes: route.notes || '',
        last_verified: new Date(route.last_verified)
      };
      
      // Check if route already exists
      const existingRoute = await Route.findOne({ route_code: route.route_code });
      
      if (existingRoute) {
        await Route.findOneAndUpdate(
          { route_code: route.route_code },
          routeData,
          { new: true, upsert: true }
        );
        console.log(`✅ Updated route: ${route.route_code}`);
      } else {
        await Route.create(routeData);
        console.log(`✅ Created route: ${route.route_code}`);
      }
    }
    
    console.log(`🎉 Successfully seeded ${modernJeepneyRoutes.length} modern jeepney routes`);
  } catch (error) {
    console.error('❌ Error seeding modern jeepney routes:', error.message);
  }
};

// Seed bus routes
const seedBusRoutes = async (busRoutes) => {
  try {
    console.log('🚌 Seeding bus routes...');
    
    for (const route of busRoutes) {
      const routeData = {
        route_code: `BUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'bus',
        origin: route.route_name.split('↔')[1]?.trim() || 'Unknown',
        destination: route.route_name.split('↔')[0]?.trim() || 'Unknown',
        service: route.service,
        route_name: route.route_name,
        fare: route.fare,
        frequency: route.frequency,
        notes: route.notes || '',
        route_coordinates: route.route_coordinates || {},
        last_verified: new Date(route.last_verified)
      };
      
      await Route.create(routeData);
      console.log(`✅ Created bus route: ${route.service} - ${route.route_name}`);
    }
    
    console.log(`🎉 Successfully seeded ${busRoutes.length} bus routes`);
  } catch (error) {
    console.error('❌ Error seeding bus routes:', error.message);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Clear existing routes
    console.log('🧹 Clearing existing routes...');
    await Route.deleteMany({});
    console.log('✅ Existing routes cleared');
    
    // Load routes data
    const routesData = loadRoutesData();
    
    // Seed jeepney routes
    if (routesData.jeepney_routes) {
      await seedJeepneyRoutes(routesData.jeepney_routes);
    }
    
    // Seed modern jeepney routes
    if (routesData.modern_jeepney_routes) {
      await seedModernJeepneyRoutes(routesData.modern_jeepney_routes);
    }
    
    // Seed bus routes
    if (routesData.bus_routes) {
      await seedBusRoutes(routesData.bus_routes);
    }
    
    // Get final count
    const totalRoutes = await Route.countDocuments();
    console.log(`🎯 Total routes in database: ${totalRoutes}`);
    
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
