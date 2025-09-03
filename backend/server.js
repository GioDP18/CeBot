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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', routes);
app.use('/api/chat', dialogflowRoutes);

// Health check endpoint with API prefix
app.get('/api/health', (req, res) => {
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
