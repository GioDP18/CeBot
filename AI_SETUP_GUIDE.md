# CeBot AI Setup Guide

This guide will help you set up CeBot with Ollama (LLaMA 3), LangChain.js, and MongoDB Atlas Vector Search for advanced Cebu-focused conversational AI.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **MongoDB Atlas account** (free tier works)
3. **Git** for version control

## Step 1: Install Ollama and LLaMA 3

### Windows Installation

1. **Download Ollama**
   - Visit: https://ollama.ai/download
   - Download the Windows installer
   - Run the installer and follow the setup wizard

2. **Install LLaMA 3**
   ```bash
   # Open Command Prompt or PowerShell as Administrator
   ollama pull llama3
   ```

3. **Verify Installation**
   ```bash
   ollama list
   ollama run llama3
   # Type "hello" to test, then "/bye" to exit
   ```

4. **Start Ollama Service** (if not auto-started)
   ```bash
   ollama serve
   ```

### macOS Installation

1. **Download Ollama**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Install LLaMA 3**
   ```bash
   ollama pull llama3
   ```

### Linux Installation

1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Install LLaMA 3**
   ```bash
   ollama pull llama3
   ```

## Step 2: MongoDB Atlas Vector Search Setup

### Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create a free account or log in

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (free tier)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "cebot-cluster")
   - Click "Create Cluster"

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: add your specific IP addresses
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Clusters" and click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Create Vector Search Index

1. **Create Database and Collection**
   - In Atlas, go to "Collections"
   - Click "Create Database"
   - Database name: `cebot`
   - Collection name: `routes_embeddings`
   - Click "Create"

2. **Create Vector Search Index**
   - In your collection, click "Search Indexes"
   - Click "Create Search Index"
   - Choose "Atlas Vector Search" 
   - Choose "JSON Editor"
   - Index name: `vector_index`
   - Use this configuration:

   ```json
   {
     "fields": [
       {
         "numDimensions": 512,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       },
       {
         "path": "route_code",
         "type": "string"
       },
       {
         "path": "origin",
         "type": "string"
       },
       {
         "path": "destination",
         "type": "string"
       }
     ]
   }
   ```

3. **Create the Index**
   - Click "Next" and then "Create Search Index"
   - Wait for the index to be built (this may take a few minutes)

## Step 3: Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

1. **Copy the example environment file**
   ```bash
   cp env.example .env
   ```

2. **Update .env file** with your configurations:
   ```plaintext
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration (replace with your Atlas connection string)
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cebot

   # Ollama Configuration
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3

   # Google Cloud & Dialogflow (optional)
   GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-key.json
   DIALOGFLOW_PROJECT_ID=your-dialogflow-project-id
   DIALOGFLOW_LANGUAGE_CODE=en

   # Security
   JWT_SECRET=your-super-secret-jwt-key-here
   CORS_ORIGIN=https://cebot-nine.vercel.app
   ```

### Seed the Database

```bash
# Populate with route data
npm run seed

# Create vector embeddings for routes
npm run populate-vectors
```

### Test the Setup

```bash
# Test vector search functionality
npm run test-vectors

# Start the development server
npm run dev
```

## Step 4: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Step 5: Testing the AI Features

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test in browser**
   - Open http://localhost:5173
   - Try these sample queries:
     - "Hello, how are you?"
     - "How do I get from Ayala to SM?"
     - "What jeepney goes to University of San Carlos?"
     - "Routes to Colon Street"

## Features

### AI-Powered Chat
- **Natural Language Understanding**: Uses LLaMA 3 for human-like responses
- **Cebu-Specific Knowledge**: Trained responses focused on Cebu transportation
- **Context Awareness**: Remembers conversation context

### Advanced Route Search
- **Vector Search**: Semantic similarity matching for routes
- **Fuzzy Matching**: Finds routes even with typos or variations
- **Smart Suggestions**: Recommends alternative routes and nearby locations

### Fallback Systems
- **Multiple Fallbacks**: Graceful degradation if services are unavailable
- **Error Handling**: Comprehensive error management
- **Performance**: Optimized for speed and reliability

## Troubleshooting

### Common Issues

1. **Ollama not starting**
   ```bash
   # Manually start Ollama
   ollama serve
   
   # Check if port 11434 is available
   netstat -an | grep 11434
   ```

2. **MongoDB connection issues**
   - Verify connection string in .env
   - Check network access settings in Atlas
   - Ensure database user credentials are correct

3. **Vector search not working**
   ```bash
   # Test vector search independently
   npm run test-vectors
   ```

4. **Dependencies issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Tips

1. **For Production**
   - Use MongoDB Atlas dedicated clusters
   - Configure proper indexes
   - Set up monitoring

2. **For Development**
   - Use local MongoDB if preferred
   - Monitor Ollama resource usage
   - Use smaller models for testing

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use strong JWT secrets
   - Restrict database access

2. **Network Security**
   - Configure proper CORS origins
   - Use HTTPS in production
   - Implement rate limiting

## Next Steps

1. **Customize AI Responses**: Modify prompts in `services/cebotAIService.js`
2. **Add More Models**: Try different Ollama models
3. **Enhance Vector Search**: Tune similarity thresholds
4. **Scale**: Deploy to cloud services

For support, check the GitHub repository or create an issue.
