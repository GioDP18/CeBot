require('dotenv').config();
const dialogflow = require('@google-cloud/dialogflow');

console.log('=== Dialogflow Configuration Test ===');
console.log('Environment Variables:');
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('DIALOGFLOW_PROJECT_ID:', process.env.DIALOGFLOW_PROJECT_ID);
console.log('DIALOGFLOW_LANGUAGE_CODE:', process.env.DIALOGFLOW_LANGUAGE_CODE);

// Test Dialogflow client initialization
try {
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
  
  console.log('\n✅ Dialogflow client initialized successfully');
  
  // Test session path creation
  const sessionPath = sessionClient.projectAgentSessionPath(
    process.env.DIALOGFLOW_PROJECT_ID, 
    'test-session'
  );
  console.log('✅ Session path created:', sessionPath);
  
  // Test intent detection
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: 'How do I get from Apas to Fuente?',
        languageCode: process.env.DIALOGFLOW_LANGUAGE_CODE || 'en',
      },
    },
  };
  
  console.log('\n🔄 Testing intent detection...');
  sessionClient.detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult;
      console.log('✅ Intent detected successfully!');
      console.log('Intent:', result.intent.displayName);
      console.log('Confidence:', result.intentDetectionConfidence);
      console.log('Response:', result.fulfillmentText);
      console.log('Parameters:', JSON.stringify(result.parameters.fields, null, 2));
    })
    .catch(error => {
      console.error('❌ Error detecting intent:', error.message);
      console.error('Full error:', error);
    });
    
} catch (error) {
  console.error('❌ Error initializing Dialogflow client:', error.message);
  console.error('Full error:', error);
}

console.log('\n=== Test Complete ===');
