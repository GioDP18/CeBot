const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const dialogflowRoutes = require('./routes/dialogflow');
const socketHandler = require('./socket/socketHandler');
const cebotAIService = require('./services/cebotAIService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://cebot-nine.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean),
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Initialize CeBot AI Service
cebotAIService.initialize().then(success => {
  if (success) {
    console.log('🤖 CeBot AI Service ready');
  } else {
    console.warn('⚠️  CeBot AI Service running with limited functionality');
  }
}).catch(error => {
  console.error('❌ Failed to initialize CeBot AI Service:', error);
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Configure CORS for both development and production
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'https://cebot-nine.vercel.app',   // Production frontend
  process.env.CORS_ORIGIN            // Additional origin from env
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', routes);
app.use('/api/chat', dialogflowRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CeBot API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚌 CeBot Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
