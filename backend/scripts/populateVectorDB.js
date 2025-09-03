require('dotenv').config();
const mongoose = require('mongoose');
const Route = require('../models/Route');
const vectorSearchService = require('../services/vectorSearchService');
const connectDB = require('../config/database');

async function populateVectorDatabase() {
  try {
    console.log('🔄 Starting vector database population...');
    
    // Connect to database
    await connectDB();
    
    // Initialize vector search service
    const initialized = await vectorSearchService.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize vector search service');
    }
    
    // Get all routes from the database
    console.log('📊 Fetching routes from database...');
    const routes = await Route.find({}).lean();
    console.log(`Found ${routes.length} routes to process`);
    
    if (routes.length === 0) {
      console.log('⚠️  No routes found. Please run the seed script first.');
      return;
    }
    
    // Process routes in batches to avoid memory issues
    const batchSize = 10;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < routes.length; i += batchSize) {
      const batch = routes.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(routes.length / batchSize)}...`);
      
      const result = await vectorSearchService.batchAddRouteEmbeddings(batch);
      
      successCount += result.results.length;
      errorCount += result.errors.length;
      processedCount += batch.length;
      
      if (result.errors.length > 0) {
        console.log(`❌ Errors in batch:`, result.errors);
      }
      
      console.log(`✅ Batch complete: ${result.results.length} success, ${result.errors.length} errors`);
      
      // Add a small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📈 Vector Database Population Summary:');
    console.log(`Total routes processed: ${processedCount}`);
    console.log(`Successfully embedded: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${((successCount / processedCount) * 100).toFixed(2)}%`);
    
    if (successCount > 0) {
      console.log('\n🎉 Vector database populated successfully!');
      console.log('You can now use advanced semantic search for routes.');
    }
    
  } catch (error) {
    console.error('❌ Error populating vector database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
}

// Test vector search functionality
async function testVectorSearch() {
  try {
    console.log('\n🔍 Testing vector search...');
    
    const testQueries = [
      'from ayala to sm',
      'route to university',
      'jeepney to mall',
      'how to get to airport'
    ];
    
    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      const results = await vectorSearchService.searchSimilarRoutes(query, 3, 0.5);
      
      if (results.length > 0) {
        console.log('Results:');
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.route_code}: ${result.origin} → ${result.destination} (score: ${result.score?.toFixed(3) || 'N/A'})`);
        });
      } else {
        console.log('  No results found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing vector search:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-only')) {
    await connectDB();
    const initialized = await vectorSearchService.initialize();
    if (initialized) {
      await testVectorSearch();
    }
    await mongoose.connection.close();
    process.exit(0);
  }
  
  await populateVectorDatabase();
  
  if (args.includes('--test')) {
    await testVectorSearch();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Process interrupted, cleaning up...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main();
