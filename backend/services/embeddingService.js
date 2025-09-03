const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

class EmbeddingService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔄 Loading Universal Sentence Encoder...');
      this.model = await use.load();
      this.isInitialized = true;
      console.log('✅ Universal Sentence Encoder loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Universal Sentence Encoder:', error);
      return false;
    }
  }

  async generateEmbedding(text) {
    if (!this.isInitialized) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const embeddings = await this.model.embed([text]);
      const embeddingArray = await embeddings.data();
      embeddings.dispose(); // Clean up memory
      
      // Convert to regular array (USE outputs 512-dimensional vectors)
      return Array.from(embeddingArray);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateRouteEmbedding(routeData) {
    // Create a comprehensive text representation of the route
    const routeText = [
      routeData.route_code,
      routeData.origin,
      routeData.destination,
      routeData.type || '',
      routeData.notes || '',
      // Add location aliases if available
      ...(routeData.origin_aliases || []),
      ...(routeData.destination_aliases || [])
    ].filter(Boolean).join(' ');

    return await this.generateEmbedding(routeText);
  }

  async generateQueryEmbedding(query) {
    // Clean and normalize the query
    const normalizedQuery = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return await this.generateEmbedding(normalizedQuery);
  }
}

module.exports = new EmbeddingService();
