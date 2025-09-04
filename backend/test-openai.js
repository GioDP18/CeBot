require('dotenv').config();
const { OpenAI } = require('openai');

async function testOpenAIConnection() {
  console.log('🧪 Testing OpenAI connection...\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    console.log('   Please add your OpenAI API key to the .env file:');
    console.log('   OPENAI_API_KEY=sk-your-api-key-here\n');
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are CeBot, a helpful transport assistant for Metro Cebu. Respond briefly.'
        },
        {
          role: 'user',
          content: 'Hello! How do I get from Ayala to SM?'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    console.log('✅ OpenAI connection successful!');
    console.log('📝 Test response:');
    console.log(completion.choices[0].message.content);
    console.log('\n💰 Token usage:');
    console.log(`   - Prompt tokens: ${completion.usage.prompt_tokens}`);
    console.log(`   - Completion tokens: ${completion.usage.completion_tokens}`);
    console.log(`   - Total tokens: ${completion.usage.total_tokens}`);
    console.log(`   - Estimated cost: $${(completion.usage.total_tokens * 0.000002).toFixed(6)}`);
    
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('   Please check your API key is correct and active.');
    } else if (error.code === 'insufficient_quota') {
      console.log('   Please add credits to your OpenAI account.');
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('   Rate limit exceeded. Please wait a moment and try again.');
    }
  }
}

testOpenAIConnection();
