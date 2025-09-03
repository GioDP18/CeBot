const { Ollama } = require('ollama');

class OllamaConfig {
  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.model = process.env.OLLAMA_MODEL || 'llama3';
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check if Ollama is running and model is available
      const models = await this.ollama.list();
      const hasModel = models.models.some(model => model.name.includes(this.model));
      
      if (!hasModel) {
        console.warn(`⚠️  Model ${this.model} not found. Please run: ollama pull ${this.model}`);
        return false;
      }
      
      console.log(`✅ Ollama initialized with model: ${this.model}`);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Ollama:', error.message);
      console.log('💡 Make sure Ollama is running: ollama serve');
      return false;
    }
  }

  async generateResponse(prompt, systemPrompt = null) {
    if (!this.isInitialized) {
      throw new Error('Ollama not initialized');
    }

    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
      
      const response = await this.ollama.generate({
        model: this.model,
        prompt: fullPrompt,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      });

      return response.response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw error;
    }
  }

  async generateCebuResponse(userMessage, routeContext = null) {
    const systemPrompt = `You are CeBot, a helpful and friendly assistant specialized in Cebu City transportation. You have deep knowledge about:

- Jeepney routes and codes in Cebu City
- Public transportation in Metro Cebu
- Popular destinations and landmarks
- Local culture and helpful travel tips
- Cebu's geography and districts

Guidelines:
- Always respond in a helpful, conversational tone
- Focus specifically on Cebu City and Metro Cebu transportation
- If asked about routes, provide practical advice about jeepneys, buses, or modern PUVs
- Include local insights and tips when relevant
- If you don't have specific route information, suggest alternatives or direct them to ask about specific locations
- Keep responses concise but informative
- Use Filipino/Cebuano terms when appropriate (like "sakay" for board, "baba" for get off)

${routeContext ? `Current route context: ${JSON.stringify(routeContext)}` : ''}

Remember: You are specifically designed to help with Cebu transportation. Always relate your responses back to helping people navigate Cebu City effectively.`;

    return await this.generateResponse(userMessage, systemPrompt);
  }
}

module.exports = new OllamaConfig();
