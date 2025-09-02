# 🚌 CeBot - Cebu City Transport Chatbot

**CeBot** is an intelligent transport assistant web application that helps users find jeepney routes, bus schedules, and get real-time transport information in Cebu City, Philippines.

## ✨ Features

- 🤖 **AI-Powered Chat**: Natural language processing for transport queries
- 🗺️ **Interactive Maps**: Visual representation of all transport routes
- 🔍 **Smart Search**: Find routes by origin, destination, or route code
- 📱 **Real-time Updates**: WebSocket integration for live chat
- 📊 **Route Statistics**: Comprehensive transport data analytics
- 🎨 **Modern UI**: Material-UI based responsive design
- 📍 **Location-based**: Uses actual Cebu transport route data

## 🏗️ Architecture

```
CeBot/
├── backend/                 # Node.js + Express API server
│   ├── config/             # Database and service configurations
│   ├── controllers/        # Route and chat logic controllers
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoint definitions
│   ├── scripts/            # Database seeding scripts
│   ├── socket/             # WebSocket handlers
│   └── server.js           # Main server file
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/          # Redux store and slices
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── index.html          # HTML template
│   └── package.json        # Frontend dependencies
├── cebu_transport_routes.json  # Transport route dataset
└── package.json            # Root project configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local or Atlas)
- **Google Cloud** account (for Dialogflow)
- **Mapbox** account (for maps)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd CeBot

# Install all dependencies
npm run install-all
```

### 2. Environment Setup

#### Backend Environment

Create `backend/.env` file:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cebot
# For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cebot

# Google Cloud & Dialogflow
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-key.json
DIALOGFLOW_PROJECT_ID=your-dialogflow-project-id
DIALOGFLOW_LANGUAGE_CODE=en

# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token

# Security
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Environment

Create `frontend/.env` file:

```bash
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
REACT_APP_API_URL=http://localhost:5000
```

### 3. Database Setup

#### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

#### Option B: Local MongoDB

```bash
# Install MongoDB locally
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
# Windows: Download from mongodb.com

# Start MongoDB service
mongod
```

### 4. Google Cloud & Dialogflow Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Dialogflow API

2. **Create Service Account**
   ```bash
   # In Google Cloud Console
   # IAM & Admin > Service Accounts > Create Service Account
   # Download JSON key file
   # Place in backend/config/service-account-key.json
   ```

3. **Create Dialogflow Agent**
   - Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
   - Create new agent named "CeBot"
   - Set language to English
   - Copy Project ID to `.env`

4. **Create Intents**
   ```
   route_lookup:
     - "How do I get from {origin} to {destination}?"
     - "What jeepney should I ride from {origin} to {destination}?"
     - "Route from {origin} to {destination}"
   
   route_code_lookup:
     - "What is route {route_code}?"
     - "Tell me about {route_code}"
     - "Route {route_code} information"
   
   general_help:
     - "Help"
     - "What can you do?"
     - "Transport information"
   ```

### 5. Mapbox Setup

1. Go to [Mapbox](https://www.mapbox.com/)
2. Create free account
3. Get access token
4. Add to environment variables

### 6. Database Seeding

```bash
# Seed the database with Cebu transport routes
cd backend
npm run seed
```

### 7. Start Development Servers

```bash
# Start both frontend and backend (from root directory)
npm run dev

# Or start separately:
npm run server    # Backend on port 5000
npm run client    # Frontend on port 5173
```

## 🎯 Usage Examples

### Chat Queries

- **Route Lookup**: "How do I get from Apas to Fuente?"
- **Route Code**: "What is route 17B?"
- **General Help**: "What transport options are available?"

### API Endpoints

```bash
# Get all routes
GET /api/routes

# Search routes
POST /api/routes/search
{
  "origin": "Apas",
  "destination": "Fuente"
}

# Get route by code
GET /api/routes/17B

# Chat with Dialogflow
POST /api/chat/message
{
  "message": "How do I get from Apas to Fuente?",
  "sessionId": "user-123"
}
```

## 🔧 Configuration

### Backend Configuration

- **Port**: Default 5000, configurable via `PORT` env var
- **CORS**: Configured for frontend development
- **WebSocket**: Real-time chat and route updates
- **Rate Limiting**: Basic request throttling
- **Security**: Helmet.js for security headers

### Frontend Configuration

- **Port**: Default 5173, configurable via Vite
- **Proxy**: API requests proxied to backend
- **State Management**: Redux Toolkit for global state
- **UI Framework**: Material-UI with custom theme
- **Routing**: React Router for navigation

## 📱 Features in Detail

### 1. Intelligent Chat Interface

- Natural language processing via Dialogflow
- Context-aware responses
- Route suggestions and alternatives
- Multi-language support (configurable)

### 2. Interactive Route Map

- Mapbox GL JS integration
- Route visualization with polylines
- Origin/destination markers
- Route filtering by type
- Responsive design for mobile

### 3. Advanced Search

- Origin-destination search
- Route code lookup
- Filtering by transport type
- Search history and favorites
- Quick search suggestions

### 4. Real-time Features

- WebSocket connection for live chat
- Real-time route updates
- User typing indicators
- Connection status monitoring

## 🚀 Deployment

### Frontend Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Set environment variables in Vercel dashboard
```

#### Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
# Drag and drop dist/ folder to Netlify
```

### Backend Deployment

#### Render

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Heroku

```bash
# Install Heroku CLI
# Create app and deploy
heroku create cebot-backend
git push heroku main
```

### Environment Variables for Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cebot
CORS_ORIGIN=https://yourdomain.com
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

### API Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test routes endpoint
curl http://localhost:5000/api/routes
```

## 📊 Performance Optimization

### Backend

- Database indexing on searchable fields
- Response compression
- Request caching
- Connection pooling

### Frontend

- Code splitting and lazy loading
- Image optimization
- Bundle analysis
- Service worker for offline support

## 🔒 Security Features

- CORS configuration
- Helmet.js security headers
- Input validation and sanitization
- Rate limiting
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cebu Transport Data**: CommuteTour Cebu and MyBus schedules
- **Open Source Libraries**: React, Node.js, Express, MongoDB
- **AI Services**: Google Dialogflow for natural language processing
- **Map Services**: Mapbox for interactive maps

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cebot/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/cebot/wiki)
- **Email**: support@cebot.com

## 🔄 Updates

### Version 1.0.0
- Initial release with core functionality
- Chat interface with Dialogflow integration
- Interactive route map
- Route search and filtering
- WebSocket real-time features

### Roadmap
- [ ] Multi-language support (Cebuano, Tagalog)
- [ ] Real-time bus tracking
- [ ] User accounts and favorites
- [ ] Mobile app (React Native)
- [ ] Route optimization algorithms
- [ ] Integration with transport APIs

---

**Made with ❤️ for Cebu City commuters**
