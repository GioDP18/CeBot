require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./models/Route');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cebot');
    console.log('📦 MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Test route coordinates
async function testRouteCoordinates() {
  try {
    // Find a route with route_coordinates
    const route = await Route.findOne({ route_code: '01C' }).lean();
    
    if (route) {
      console.log('✅ Found route:', route.route_code);
      console.log('🗺️ Route coordinates:', JSON.stringify(route.route_coordinates, null, 2));
      
      // Check if the coordinates are stored as expected
      if (route.route_coordinates && Object.keys(route.route_coordinates).length > 0) {
        console.log('✅ Route coordinates successfully saved and retrieved');
      } else {
        console.log('❌ Route coordinates are missing or empty');
      }
    } else {
      console.log('❌ No routes found in database');
    }
  } catch (error) {
    console.error('❌ Error testing route coordinates:', error);
  }
  
  // Disconnect
  mongoose.disconnect();
}

// Run the test
async function runTest() {
  await connectDB();
  await testRouteCoordinates();
}

runTest();
