const mongoose = require('mongoose');
const Route = require('./models/Route');

async function testRouteSearch() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/cebot_transport', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Test search for Carbon to Apas
    console.log('\n=== Testing: Carbon to Apas ===');
    const carbonToApas = await Route.find({
      $or: [
        // Forward: Carbon to Apas
        {
          $and: [
            { origin: { $regex: 'carbon', $options: 'i' } },
            { destination: { $regex: 'apas', $options: 'i' } }
          ]
        },
        // Reverse: Apas to Carbon
        {
          $and: [
            { origin: { $regex: 'apas', $options: 'i' } },
            { destination: { $regex: 'carbon', $options: 'i' } }
          ]
        },
        // Route landmarks search
        {
          $and: [
            { route_landmarks: { $elemMatch: { $regex: 'carbon', $options: 'i' } } },
            { route_landmarks: { $elemMatch: { $regex: 'apas', $options: 'i' } } }
          ]
        }
      ]
    }).limit(5);

    console.log('Found routes:', carbonToApas.length);
    carbonToApas.forEach(route => {
      console.log(`- ${route.route_code}: ${route.origin} → ${route.destination}`);
      if (route.route_landmarks && route.route_landmarks.length > 0) {
        console.log(`  Landmarks: ${route.route_landmarks.slice(0, 5).join(', ')}...`);
      }
    });

    // Test search for Apas to Carbon
    console.log('\n=== Testing: Apas to Carbon ===');
    const apasToCarbon = await Route.find({
      $or: [
        {
          $and: [
            { origin: { $regex: 'apas', $options: 'i' } },
            { destination: { $regex: 'carbon', $options: 'i' } }
          ]
        },
        {
          $and: [
            { origin: { $regex: 'carbon', $options: 'i' } },
            { destination: { $regex: 'apas', $options: 'i' } }
          ]
        },
        {
          $and: [
            { route_landmarks: { $elemMatch: { $regex: 'apas', $options: 'i' } } },
            { route_landmarks: { $elemMatch: { $regex: 'carbon', $options: 'i' } } }
          ]
        }
      ]
    }).limit(5);

    console.log('Found routes:', apasToCarbon.length);
    apasToCarbon.forEach(route => {
      console.log(`- ${route.route_code}: ${route.origin} → ${route.destination}`);
      if (route.route_landmarks && route.route_landmarks.length > 0) {
        console.log(`  Landmarks: ${route.route_landmarks.slice(0, 5).join(', ')}...`);
      }
    });

    await mongoose.disconnect();
    console.log('\nTest completed');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRouteSearch();
