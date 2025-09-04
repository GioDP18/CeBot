require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('./models/Route');

async function testRouteSearch() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cebot');
    console.log('📊 Testing route search for "Apas to Carbon"...\n');

    // Test the exact search logic from OpenAI service
    const origin = 'apas';
    const destination = 'carbon';

    const routes = await Route.find({
      $or: [
        // Direct routes from origin to destination
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
        // Routes that pass through both locations (broader search)
        {
          $and: [
            {
              $or: [
                { origin: { $regex: origin, $options: 'i' } },
                { destination: { $regex: origin, $options: 'i' } },
                { notes: { $regex: origin, $options: 'i' } }
              ]
            },
            {
              $or: [
                { origin: { $regex: destination, $options: 'i' } },
                { destination: { $regex: destination, $options: 'i' } },
                { notes: { $regex: destination, $options: 'i' } }
              ]
            }
          ]
        }
      ]
    }).limit(10);

    console.log(`✅ Found ${routes.length} routes from Apas to Carbon:`);
    routes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.route_code} (${route.type}): ${route.origin} → ${route.destination}`);
      if (route.notes) console.log(`   Notes: ${route.notes}`);
    });

    // Also search specifically for 17B, 17C, 17D routes
    console.log('\n🔍 Searching for routes containing "17"...');
    const route17s = await Route.find({
      route_code: { $regex: '17', $options: 'i' }
    });

    console.log(`Found ${route17s.length} routes with "17" in code:`);
    route17s.forEach((route) => {
      console.log(`- ${route.route_code}: ${route.origin} → ${route.destination}`);
      if (route.notes) console.log(`  Notes: ${route.notes}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

testRouteSearch();
