import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  DirectionsBus as BusIcon,
  DirectionsCar as JeepIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import {
  addUserMessage,
  addBotMessage,
  setSocket,
  setConnectionStatus,
  sendChatMessage,
  clearChat
} from '../store/slices/chatSlice';

const Chatbot = () => {
  const dispatch = useDispatch();
  const {
    messages,
    isLoading,
    error,
    socket,
    isConnected,
    searchResults,
    suggestions
  } = useSelector((state) => state.chat);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize WebSocket connection with retry logic
  useEffect(() => {
    const connectSocket = () => {
      if (!socketRef.current && connectionAttempts < 3) {
        console.log(`Attempting to connect to WebSocket server (attempt ${connectionAttempts + 1})`);
        
        socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
          timeout: 5000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });
        
        socketRef.current.on('connect', () => {
          console.log('Connected to WebSocket server');
          dispatch(setConnectionStatus(true));
          dispatch(setSocket(socketRef.current));
          setConnectionAttempts(0);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from WebSocket server');
          dispatch(setConnectionStatus(false));
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          dispatch(setConnectionStatus(false));
          setConnectionAttempts(prev => prev + 1);
        });

        socketRef.current.on('new_message', (data) => {
          if (data.sender === 'bot') {
            dispatch(addBotMessage(data.message));
          }
        });

        socketRef.current.on('routes_found', (data) => {
          const message = `I found ${data.count} route(s) from ${data.origin} to ${data.destination}:`;
          dispatch(addBotMessage(message));
        });

        socketRef.current.on('search_error', (data) => {
          dispatch(addBotMessage(`Error: ${data.message}`));
        });
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [dispatch, connectionAttempts]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    dispatch(addUserMessage(message));
    setInputMessage('');
    setIsTyping(true);

    try {
      // Try WebSocket first if connected
      if (socketRef.current && isConnected) {
        socketRef.current.emit('chat_message', { message });
      } else {
        // Fallback to HTTP API
        const result = await dispatch(sendChatMessage({ 
          message, 
          sessionId: 'user-session' 
        })).unwrap();

        if (result.data.text) {
          dispatch(addBotMessage(result.data.text));
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Provide fallback response
      const fallbackResponse = getFallbackResponse(message);
      dispatch(addBotMessage(fallbackResponse));
    } finally {
      setIsTyping(false);
    }
  };

  // Fallback response when API is not available
  const getFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm CeBot, your Cebu transport assistant. How can I help you today? You can ask me about routes, jeepney codes, or how to get from one place to another.";
    }
    
    if (lowerMessage.includes('route') || lowerMessage.includes('jeepney') || lowerMessage.includes('bus')) {
      return "I can help you find transport routes! Just tell me where you want to go from and to, like 'from Apas to Fuente' or 'how do I get from Ayala to SM'.";
    }
    
    if (lowerMessage.includes('help')) {
      return "I can help you with: finding routes, looking up jeepney codes, and getting transport information in Cebu City. What do you need?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with regarding Cebu transport?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! Have a safe journey in Cebu City!";
    }
    
    return "I'm here to help with Cebu transport! You can ask me about routes, jeepney codes, or how to get from one place to another. Try asking something like 'How do I get from Apas to Fuente?'";
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle route search
  const handleRouteSearch = (origin, destination) => {
    const message = `How do I get from ${origin} to ${destination}?`;
    setInputMessage(message);
  };

  // Get route type icon
  const getRouteTypeIcon = (type) => {
    switch (type) {
      case 'jeepney':
        return <JeepIcon fontSize="small" color="primary" />;
      case 'modern_jeep':
        return <JeepIcon fontSize="small" color="secondary" />;
      case 'bus':
        return <BusIcon fontSize="small" color="primary" />;
      default:
        return <JeepIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        align="center" 
        color="primary"
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' },
          mb: { xs: 2, md: 3 }
        }}
      >
        🚌 CeBot - Cebu Transport Assistant
      </Typography>
      
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: { xs: '60vh', sm: '65vh', md: '70vh' }, 
            display: 'flex', 
            flexDirection: 'column',
            mb: { xs: 2, md: 0 } 
          }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Messages Area */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                <List>
                  {messages.map((msg, index) => (
                    <ListItem key={msg.id || index} sx={{ 
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' 
                    }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: { xs: 1.5, md: 2 },
                          maxWidth: { xs: '80%', md: '70%' },
                          backgroundColor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
                          color: msg.sender === 'user' ? 'white' : 'text.primary',
                          borderRadius: 2,
                          wordBreak: 'break-word'
                        }}
                      >
                        <Typography variant="body1">{msg.message}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: 'block' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </ListItem>
                  ))}
                  {isTyping && (
                    <ListItem sx={{ justifyContent: 'flex-start' }}>
                      <Paper elevation={1} sx={{ p: 2, backgroundColor: 'grey.100' }}>
                        <Typography variant="body1">CeBot is typing...</Typography>
                      </Paper>
                    </ListItem>
                  )}
                  <div ref={messagesEndRef} />
                </List>
              </Box>

              {/* Input Area */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about Cebu transport routes..."
                  variant="outlined"
                  size="small"
                  disabled={isLoading}
                  InputProps={{
                    sx: { fontSize: { xs: '0.9rem', md: '1rem' } }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  sx={{ 
                    minWidth: { xs: '40px', md: 'auto' }, 
                    px: { xs: 1, md: 2 },
                    height: { xs: '40px', md: 'auto' }
                  }}
                >
                  {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                </Button>
                <IconButton
                  onClick={() => dispatch(clearChat())}
                  color="secondary"
                  title="Clear chat"
                >
                  <ClearIcon />
                </IconButton>
              </Box>

              {/* Connection Status */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  size="small"
                />
                {!isConnected && connectionAttempts > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Retrying connection... (attempt {connectionAttempts}/3)
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Route Results & Suggestions */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Search Results */}
            {searchResults && (
              <Card sx={{ height: { md: '350px', display: 'flex', flexDirection: 'column' } }}>
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  overflow: { md: 'hidden' }
                }}>
                  <Typography variant="h6" gutterBottom>
                    🗺️ Route Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    From {searchResults.origin} to {searchResults.destination}
                  </Typography>
                  
                  {searchResults.data && searchResults.data.length > 0 ? (
                    <List dense sx={{
                      overflow: { md: 'auto' }, 
                      maxHeight: { md: '250px' },
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                      },
                      flexGrow: 1
                    }}>
                      {searchResults.data.map((route, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getRouteTypeIcon(route.type)}
                                <Typography variant="body2" fontWeight="bold">
                                  {route.route_code}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {route.origin} → {route.destination}
                                </Typography>
                                {route.notes && (
                                  <Typography variant="caption" color="text.secondary">
                                    {route.notes}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No direct routes found
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {suggestions && (suggestions.similarOrigins?.length > 0 || suggestions.similarDestinations?.length > 0) && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    💡 Suggestions
                  </Typography>
                  
                  {suggestions.similarOrigins?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Similar origins:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {suggestions.similarOrigins.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={`${suggestion.code} (${suggestion.location})`}
                            size="small"
                            variant="outlined"
                            onClick={() => handleRouteSearch(suggestion.location, '')}
                            clickable
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {suggestions.similarDestinations?.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Similar destinations:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {suggestions.similarDestinations.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={`${suggestion.code} (${suggestion.location})`}
                            size="small"
                            variant="outlined"
                            onClick={() => handleRouteSearch('', suggestion.location)}
                            clickable
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ⚡ Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleRouteSearch('Apas', 'Fuente')}
                    startIcon={<SearchIcon />}
                  >
                    Apas → Fuente
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleRouteSearch('Ayala', 'SM')}
                    startIcon={<SearchIcon />}
                  >
                    Ayala → SM
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleRouteSearch('Colon', 'Carbon')}
                    startIcon={<SearchIcon />}
                  >
                    Colon → Carbon
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default Chatbot;
