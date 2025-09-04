require('dotenv').config();
const mongoose = require('mongoose');
const openaiService = require('./services/openaiService');

async function testOpenAIQuery() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cebot');
    console.log('🧪 Testing OpenAI query extraction and route search...\n');

    // Test the exact message from the screenshot
    const testMessage = "I am currently in Brgy Apas, how can I get to Carbon? What route/jeepney code should I ride?";
    
    // Test query extraction
    const routeQuery = openaiService.extractRouteQuery(testMessage);
    console.log('📝 Extracted route query:', routeQuery);

    if (routeQuery) {
      // Test route search
      const routes = await openaiService.searchTraditionalRoutes(routeQuery);
      console.log(`\n🗺️ Found ${routes.length} routes:`);
      routes.forEach((route, index) => {
        console.log(`${index + 1}. ${route.route_code} (${route.type}): ${route.origin} → ${route.destination}`);
        if (route.notes) console.log(`   Notes: ${route.notes}`);
      });

      // Test the full processMessage function
      console.log('\n🤖 Testing full OpenAI process...');
      const result = await openaiService.processMessage(testMessage, 'test-session');
      console.log('Response:', result.response);
      console.log('Route Context:', result.routeContext);
      console.log('Search Results Count:', result.searchResults ? result.searchResults.length : 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

testOpenAIQuery();
