const cebotAI = require('./services/cebotAIService');
const openaiService = require('./services/openaiService');

// Test route query extraction
function testRouteExtraction() {
  console.log('=== Testing Route Query Extraction ===');
  
  const testMessages = [
    'How do I get from Carbon to Apas?',
    'From Apas to Carbon',
    'Route from Carbon to Apas'
  ];

  testMessages.forEach(message => {
    const extracted = cebotAI.extractRouteQuery(message);
    console.log(`Message: "${message}"`);
    console.log('Extracted:', extracted);
    console.log('---');
  });
}

testRouteExtraction();
