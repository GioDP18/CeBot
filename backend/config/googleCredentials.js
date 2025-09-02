// config/googleCredentials.js
const fs = require('fs');
const path = require('path');

function getGoogleCredentials() {
  // Check if we're in Vercel production environment
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Use the environment variable that contains the JSON content
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Error parsing Google credentials from environment variable:', error);
      throw new Error('Invalid Google credentials format in environment variable');
    }
  } else {
    // Local development - use the file path
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!credentialsPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      }
      
      // If it's a relative path, resolve it from the project root
      const absolutePath = path.isAbsolute(credentialsPath) 
        ? credentialsPath 
        : path.join(__dirname, '..', credentialsPath);
      
      const credentials = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      return credentials;
    } catch (error) {
      console.error('Error loading Google credentials from file:', error);
      throw error;
    }
  }
}

module.exports = getGoogleCredentials;
