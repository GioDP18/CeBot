const mongoose = require('mongoose');
const RouteEmbedding = require('../models/RouteEmbedding');
const embeddingService = require('../services/embeddingService');

class VectorSearchService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize embedding service
      await embeddingService.initialize();
      this.isInitialized = true;
      console.log('✅ Vector Search Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Vector Search Service:', error);
      return false;
    }
  }

  async searchSimilarRoutes(query, limit = 10, threshold = 0.7) {
    if (!this.isInitialized) {
      throw new Error('Vector Search Service not initialized');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query);

      // Use MongoDB Atlas Vector Search (if available) or fallback to cosine similarity
      let results;
      
      try {
        // Try MongoDB Atlas Vector Search first
        results = await this.atlasVectorSearch(queryEmbedding, limit, threshold);
      } catch (error) {
        console.log('Atlas Vector Search not available, using fallback method');
        // Fallback to manual cosine similarity calculation
        results = await this.fallbackVectorSearch(queryEmbedding, limit, threshold);
      }

      return results;
    } catch (error) {
      console.error('Error in vector search:', error);
      throw error;
    }
  }

  async atlasVectorSearch(queryEmbedding, limit, threshold) {
    // MongoDB Atlas Vector Search aggregation pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index", // Name of your vector search index
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 3,
          limit: limit
        }
      },
      {
        $project: {
          route_code: 1,
          origin: 1,
          destination: 1,
          type: 1,
          fare: 1,
          notes: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        $match: {
          score: { $gte: threshold }
        }
      }
    ];

    return await RouteEmbedding.aggregate(pipeline);
  }

  async fallbackVectorSearch(queryEmbedding, limit, threshold) {
    // Get all routes and calculate cosine similarity manually
    const allRoutes = await RouteEmbedding.find({}).lean();
    
    const similarities = allRoutes.map(route => {
      const similarity = this.cosineSimilarity(queryEmbedding, route.embedding);
      return {
        ...route,
        score: similarity
      };
    });

    // Filter by threshold and sort by similarity
    return similarities
      .filter(route => route.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async addRouteEmbedding(routeData) {
    try {
      // Generate embedding for the route
      const embedding = await embeddingService.generateRouteEmbedding(routeData);
      
      // Create new route embedding document
      const routeEmbedding = new RouteEmbedding({
        ...routeData,
        embedding
      });

      await routeEmbedding.save();
      console.log(`✅ Added embedding for route: ${routeData.route_code}`);
      return routeEmbedding;
    } catch (error) {
      console.error('Error adding route embedding:', error);
      throw error;
    }
  }

  async batchAddRouteEmbeddings(routesData) {
    const results = [];
    const errors = [];

    for (const routeData of routesData) {
      try {
        const result = await this.addRouteEmbedding(routeData);
        results.push(result);
      } catch (error) {
        errors.push({ route: routeData.route_code, error: error.message });
      }
    }

    return { results, errors };
  }

  async searchRoutesByText(query, limit = 10) {
    // Fallback text search for when vector search is not available
    const textSearchResults = await RouteEmbedding.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);

    return textSearchResults;
  }
}

module.exports = new VectorSearchService();
