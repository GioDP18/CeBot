import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactMarkdown from 'react-markdown';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  DirectionsBus as BusIcon,
  DirectionsCar as JeepIcon,
  Memory as LocalIcon,
  OpenInNew as OpenAIIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import {
  addUserMessage,
  addBotMessage,
  setSocket,
  setConnectionStatus,
  sendChatMessage,
  clearChat,
  setSearchResults,
  setSuggestions
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
  const [selectedModel, setSelectedModel] = useState('openai'); // 'local' or 'openai'
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize WebSocket connection with retry logic and fallback
  useEffect(() => {
    const connectSocket = () => {
      // Skip WebSocket connection in production for now due to Vercel limitations
      if (import.meta.env.PROD) {
        console.log('Production environment detected - using HTTP API only');
        dispatch(setConnectionStatus(false));
        return;
      }

      if (!socketRef.current && connectionAttempts < 3) {
        console.log(`Attempting to connect to WebSocket server (attempt ${connectionAttempts + 1})`);
        console.log(`Connecting to: ${import.meta.env.VITE_API_URL}`);
        
        socketRef.current = io(`${import.meta.env.VITE_API_URL}`, {
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          transports: ['websocket', 'polling'], // Allow fallback to polling
          upgrade: true,
          autoConnect: true
        });
        
        socketRef.current.on('connect', () => {
          console.log('✅ Connected to WebSocket server');
          dispatch(setConnectionStatus(true));
          dispatch(setSocket(socketRef.current));
          setConnectionAttempts(0);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('❌ Disconnected from WebSocket server:', reason);
          dispatch(setConnectionStatus(false));
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          dispatch(setConnectionStatus(false));
          setConnectionAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= 3) {
              console.log('🔄 Max connection attempts reached, using HTTP fallback');
            }
            return newAttempts;
          });
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

    // Small delay to allow environment detection
    const timer = setTimeout(connectSocket, 100);

    return () => {
      clearTimeout(timer);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [dispatch, connectionAttempts]);

  // Auto-scroll to bottom when new messages arrive or typing changes
  useEffect(() => {
    if (messagesEndRef.current) {
      // Add a small delay to ensure the DOM is updated
      const timer = setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping]);

  // Additional smooth scroll when user sends a message
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    dispatch(addUserMessage(message));
    setInputMessage('');
    setIsTyping(true);

    // Immediately scroll to show the user's message
    setTimeout(() => scrollToBottom(), 50);

    try {
      // Always use HTTP API for our AI services
      console.log(`Using ${selectedModel === 'local' ? 'CeBot AI Service' : 'OpenAI'} API for message sending`);
      const result = await dispatch(sendChatMessage({ 
        message, 
        sessionId: 'user-session',
        model: selectedModel
      })).unwrap();

      // Handle the AI service response
      if (result.success && result.data && result.data.text) {
        dispatch(addBotMessage(result.data.text));
        
        // Update search results if routes were found
        if (result.searchResults && result.searchResults.length > 0) {
          dispatch(setSearchResults({
            data: result.searchResults,
            origin: result.data.parameters?.query?.origin || '',
            destination: result.data.parameters?.query?.destination || '',
            count: result.searchResults.length
          }));
        }
        
        // Update suggestions if available
        if (result.suggestions) {
          dispatch(setSuggestions(result.suggestions));
        }
      } else {
        // Fallback if response format is unexpected
        dispatch(addBotMessage(result.message || 'I received your message!'));
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 2, md: 3 } }}>
        <img 
          src="/logo.png" 
          alt="CeBot Logo" 
          style={{ 
            height: '48px', 
            width: '48px', 
            marginRight: '12px',
            borderRadius: '8px'
          }} 
        />
        <Typography 
          variant="h4" 
          component="h1"
          color="primary"
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' }
          }}
        >
          CeBot - Cebu Transport Assistant
        </Typography>
        {/* <Chip 
          label={selectedModel === 'local' ? 'Local AI' : 'OpenAI GPT-3.5'} 
          size="small" 
          color={selectedModel === 'local' ? 'primary' : 'secondary'}
          sx={{ ml: 1, fontSize: '0.7rem' }}
        /> */}
      </Box>
      
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: { xs: '70vh', sm: '75vh', md: '80vh' }, 
            display: 'flex', 
            flexDirection: 'column',
            mb: { xs: 2, md: 0 },
            overflow: 'hidden'
          }}>
            <CardContent sx={{ 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              p: { xs: 1, sm: 2 },
              '&:last-child': { pb: { xs: 1, sm: 2 } }
            }}>
              {/* Messages Area */}
              <Box sx={{ 
                flex: '1 1 0',
                minHeight: 0,
                overflow: 'auto', 
                mb: 2,
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#a8a8a8',
                  },
                },
                scrollbarWidth: 'thin',
                scrollbarColor: '#c1c1c1 #f1f1f1',
                // Enhanced smooth scrolling
                scrollPaddingBottom: '20px',
              }}>
                <List sx={{ pb: 0 }}>
                  {messages.map((msg, index) => (
                    <ListItem key={msg.id || index} sx={{ 
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      py: 0.5
                    }}>
                      <Paper
                        elevation={msg.sender === 'user' ? 2 : 1}
                        sx={{
                          p: { xs: 1.5, md: 2 },
                          maxWidth: { xs: '85%', md: '75%' },
                          backgroundColor: msg.sender === 'user' ? 'primary.main' : 'grey.100',
                          color: msg.sender === 'user' ? 'white' : 'text.primary',
                          borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          wordBreak: 'break-word',
                          animation: 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {msg.sender === 'bot' ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    lineHeight: 1.6,
                                    mb: 1,
                                    '&:last-child': { mb: 0 }
                                  }}
                                >
                                  {children}
                                </Typography>
                              ),
                              strong: ({ children }) => (
                                <Typography 
                                  component="span" 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: 'inherit'
                                  }}
                                >
                                  {children}
                                </Typography>
                              ),
                              ul: ({ children }) => (
                                <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                                  {children}
                                </Box>
                              ),
                              li: ({ children }) => (
                                <Typography 
                                  component="li" 
                                  variant="body1"
                                  sx={{ lineHeight: 1.6, mb: 0.3 }}
                                >
                                  {children}
                                </Typography>
                              )
                            }}
                          >
                            {msg.message}
                          </ReactMarkdown>
                        ) : (
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}
                          >
                            {msg.message}
                          </Typography>
                        )}
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.7, 
                            mt: 1, 
                            display: 'block',
                            fontSize: '0.7rem'
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </ListItem>
                  ))}
                  
                  {/* Bot Typing Indicator */}
                  {isTyping && (
                    <ListItem sx={{ justifyContent: 'flex-start', py: 0.5 }}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          backgroundColor: 'grey.100',
                          borderRadius: '18px 18px 18px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            CeBot is typing
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.3 }}>
                            {[0, 1, 2].map((index) => (
                              <Box
                                key={index}
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  backgroundColor: 'primary.main',
                                  animation: `typingDot 1.4s infinite ease-in-out`,
                                  animationDelay: `${index * 0.16}s`,
                                  '@keyframes typingDot': {
                                    '0%, 80%, 100%': {
                                      opacity: 0.3,
                                      transform: 'scale(0.8)',
                                    },
                                    '40%': {
                                      opacity: 1,
                                      transform: 'scale(1)',
                                    },
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  )}
                  
                  <div ref={messagesEndRef} />
                </List>
              </Box>

              {/* Input Area */}
              <Box sx={{ 
                flexShrink: 0,
                display: 'flex', 
                gap: 1, 
                alignItems: 'flex-end',
                pt: 1
              }}>
                {/* Model Selector */}
                {/* <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={selectedModel}
                    label="Model"
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={isLoading}
                  >
                    <MenuItem value="local">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalIcon fontSize="small" />
                        Local
                      </Box>
                    </MenuItem>
                    <MenuItem value="openai">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OpenAIIcon fontSize="small" />
                        OpenAI
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl> */}

                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask me about Cebu transport routes...`}
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
                {/* <IconButton
                  onClick={() => dispatch(clearChat())}
                  color="secondary"
                  title="Clear chat"
                >
                  <ClearIcon />
                </IconButton> */}
              </Box>

              {/* Connection Status */}
              {/* <Box sx={{ mt: 1, textAlign: 'center' }}>
                {import.meta.env.PROD ? (
                  <Chip
                    label="HTTP Mode"
                    color="primary"
                    size="small"
                  />
                ) : (
                  <>
                    <Chip
                      label={isConnected ? 'WebSocket Connected' : 'HTTP Mode (WebSocket Disconnected)'}
                      color={isConnected ? 'success' : 'warning'}
                      size="small"
                    />
                    {!isConnected && connectionAttempts > 0 && connectionAttempts < 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Retrying WebSocket connection... (attempt {connectionAttempts}/3)
                      </Typography>
                    )}
                  </>
                )}
              </Box> */}
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
