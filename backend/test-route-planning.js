const routePlanningService = require('./services/routePlanningService');
const mongoose = require('mongoose');

async function testRoutePlanning() {
  try {
    console.log('=== Testing Route Planning Service ===\n');

    // Test direct route (should work)
    console.log('1. Testing direct route: Apas to Carbon');
    const directRoute = await routePlanningService.findRoutePlan('Apas', 'Carbon');
    console.log('Result:', directRoute.type);
    console.log('Instructions:', directRoute.instructions);
    console.log('---\n');

    // Test multi-ride route (should find transfers)
    console.log('2. Testing multi-ride route: Apas to Ayala');
    const multiRide = await routePlanningService.findRoutePlan('Apas', 'Ayala');
    console.log('Result:', multiRide.type);
    console.log('Transfers:', multiRide.transfers);
    console.log('Instructions:', multiRide.instructions);
    console.log('---\n');

    // Test another multi-ride
    console.log('3. Testing multi-ride route: Carbon to SM');
    const carbonToSm = await routePlanningService.findRoutePlan('Carbon', 'SM');
    console.log('Result:', carbonToSm.type);
    console.log('Transfers:', carbonToSm.transfers);
    console.log('Instructions:', carbonToSm.instructions);

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  testRoutePlanning();
}
