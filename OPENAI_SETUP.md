# OpenAI Integration Setup Guide for CeBot

This guide will walk you through setting up OpenAI integration for CeBot's chatbot functionality.

## Prerequisites

- Existing CeBot project setup
- Node.js and npm installed
- OpenAI account

## Step 1: Get OpenAI API Key

1. **Create/Login to OpenAI Account**
   - Go to [https://platform.openai.com/](https://platform.openai.com/)
   - Create an account or log in with existing credentials

2. **Generate API Key**
   - Navigate to [API Keys section](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Give it a descriptive name like "CeBot Integration"
   - Copy the API key (you won't be able to see it again)

3. **Add Credits (if needed)**
   - Go to [Billing](https://platform.openai.com/account/billing)
   - Add payment method and credits
   - For testing, $5-10 should be sufficient

## Step 2: Install Dependencies

Navigate to your backend directory and install the OpenAI package:

```bash
cd backend
npm install openai@^4.20.1
```

## Step 3: Environment Configuration

1. **Update your `.env` file** in the backend directory:

```env
# Add this line with your actual API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

2. **For Vercel deployment**, add the environment variable:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `OPENAI_API_KEY` with your API key value

## Step 4: Verify Installation

1. **Start your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check the console logs** - you should see:
   - `🤖 CeBot AI Service ready`
   - `🧠 OpenAI Service ready` (if API key is valid)
   - If you see `⚠️ OpenAI Service not available - check OPENAI_API_KEY`, there's an issue with your API key

## Step 5: Test the Integration

1. **Start your frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test both models**:
   - Go to your CeBot application
   - You should see a "Model" dropdown beside the chat input
   - Try asking the same question with both "Local" and "OpenAI" models
   - Example: "How do I get from Ayala to SM?"

## Step 6: Usage and Billing

### Expected Usage:
- **GPT-3.5-turbo**: ~$0.002 per 1K tokens
- Average chat message: 50-200 tokens
- Cost per message: ~$0.0001-$0.0004

### Monitoring:
- Monitor usage at [OpenAI Usage](https://platform.openai.com/account/usage)
- Set up usage alerts in billing settings

## Features Comparison

| Feature | Local AI | OpenAI |
|---------|----------|--------|
| Route Search | ✅ Same database | ✅ Same database |
| Response Quality | Good, structured | Excellent, conversational |
| Cost | Free | ~$0.0001-$0.0004 per message |
| Speed | Fast | Slightly slower |
| Internet Required | No | Yes |

## Troubleshooting

### Common Issues:

1. **"OpenAI Service not available" message**
   - Check if `OPENAI_API_KEY` is set correctly
   - Verify API key hasn't expired
   - Ensure you have sufficient credits

2. **API Rate Limit Errors**
   - OpenAI has rate limits for new accounts
   - Wait a moment between requests
   - Consider upgrading your OpenAI plan

3. **Slow responses**
   - Normal for OpenAI API calls
   - Consider using GPT-3.5-turbo instead of GPT-4

### Error Messages:
- If OpenAI service fails, the app gracefully falls back to local AI
- Check browser console for detailed error messages
- Monitor backend logs for API issues

## Advanced Configuration

### Customizing the OpenAI Model

Edit `backend/services/openaiService.js`:

```javascript
// Change model (line ~71)
model: 'gpt-4', // or 'gpt-3.5-turbo-16k' for longer contexts

// Adjust temperature (line ~76)
temperature: 0.3, // Lower = more consistent, Higher = more creative

// Modify max tokens (line ~75)
max_tokens: 800, // Increase for longer responses
```

### Cost Optimization

1. **Use GPT-3.5-turbo** instead of GPT-4 (cheaper)
2. **Implement caching** for common queries
3. **Set token limits** to control costs
4. **Monitor usage** regularly

## Security Notes

- Never commit your API key to version control
- Use environment variables for all deployments
- Regularly rotate your API keys
- Monitor for unusual usage patterns

## Production Deployment

### Vercel:
1. Add `OPENAI_API_KEY` in Vercel environment variables
2. Redeploy your application
3. Test both models in production

### Other Platforms:
- Ensure `OPENAI_API_KEY` environment variable is set
- Verify network access to OpenAI API
- Check logs for successful initialization

## Support

- **OpenAI Issues**: Check [OpenAI Status](https://status.openai.com/)
- **API Documentation**: [OpenAI API Docs](https://platform.openai.com/docs)
- **CeBot Issues**: Check application logs and console

---

## Quick Test Script

Create `test-openai.js` in your backend directory:

```javascript
require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
      max_tokens: 10
    });
    console.log('✅ OpenAI connection successful!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
  }
}

test();
```

Run with: `node test-openai.js`
