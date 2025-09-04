import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import {
  Chat as ChatIcon,
  Map as MapIcon,
  Search as SearchIcon,
  DirectionsBus as BusIcon,
  DirectionsCar as JeepIcon,
  TrendingUp as TrendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { fetchAllRoutes, getRouteStats } from '../store/slices/routesSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { allRoutes, stats, isLoading } = useSelector((state) => state.routes);

  useEffect(() => {
    dispatch(fetchAllRoutes());
    dispatch(getRouteStats());
  }, [dispatch]);

  const getRouteTypeCount = (type) => {
    if (!allRoutes) return 0;
    return allRoutes.filter(route => route.type === type).length;
  };

  const getPopularRoutes = () => {
    if (!allRoutes) return [];
    // Return some popular routes for demonstration
    return allRoutes.slice(0, 5);
  };

  const quickActions = [
    {
      title: 'Chat with CeBot',
      description: 'Ask questions about transport routes',
      icon: <ChatIcon color="primary" />,
      path: '/chat',
      color: 'primary'
    },
    {
      title: 'View Routes Map',
      description: 'Interactive map of all transport routes',
      icon: <MapIcon color="secondary" />,
      path: '/map',
      color: 'secondary'
    },
    {
      title: 'Search Routes',
      description: 'Find specific routes by location',
      icon: <SearchIcon color="info" />,
      path: '/search',
      color: 'info'
    }
  ];

  const routeExamples = [
    { origin: 'Apas', destination: 'Fuente', code: '17B' },
    { origin: 'Ayala', destination: 'SM', code: '03Q' },
    { origin: 'Colon', destination: 'Carbon', code: '01C' },
    { origin: 'Lahug', destination: 'Ayala', code: '04L' }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Hero Section */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          fontWeight="bold"
          sx={{ 
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <img 
            src="/logo.png" 
            alt="CeBot Logo" 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              objectFit: 'contain'
            }}
          />
          Welcome to CeBot
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3, 
            opacity: 0.9,
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.25rem' } 
          }}
        >
          Your intelligent Cebu City transport assistant
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            opacity: 0.8,
            px: { xs: 1, sm: 2, md: 4 }
          }}
        >
          Find jeepney routes, bus schedules, and get real-time transport information
        </Typography>
        
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/chat"
            variant="contained"
            size="large"
            startIcon={<ChatIcon />}
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              '&:hover': { backgroundColor: 'grey.100' }
            }}
          >
            Start Chatting
          </Button>
          <Button
            component={Link}
            to="/map"
            variant="outlined"
            size="large"
            startIcon={<MapIcon />}
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              '&:hover': { borderColor: 'grey.100', backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            View Map
          </Button>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        ⚡ Quick Actions
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              component={Link}
              to={action.path}
              sx={{ 
                height: '100%',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Statistics */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📊 Transport Statistics
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <JeepIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary" gutterBottom>
                {getRouteTypeCount('jeepney')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Jeepney Routes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <JeepIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="secondary" gutterBottom>
                {getRouteTypeCount('modern_jeep')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modern Jeepney
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BusIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main" gutterBottom>
                {getRouteTypeCount('bus')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bus Routes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main" gutterBottom>
                {allRoutes ? allRoutes.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Routes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Popular Routes */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        🚌 Popular Routes
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Route Examples
              </Typography>
              <List dense>
                {routeExamples.map((route, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Chip 
                          label={route.code} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${route.origin} → ${route.destination}`}
                        secondary="Popular jeepney route"
                      />
                    </ListItem>
                    {index < routeExamples.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 How to Use CeBot
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ChatIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ask natural language questions"
                    secondary="e.g., 'How do I get from Apas to Fuente?'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SearchIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Search by route code"
                    secondary="e.g., 'What is route 17B?'"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MapIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="View routes on interactive map"
                    secondary="See all transport routes visually"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        ✨ Features
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 AI-Powered Chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Natural language processing to understand your transport queries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗺️ Interactive Maps
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visual representation of all transport routes in Cebu City
              </Typography>
            </CardContent>
          </Card>
        
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔍 Smart Search
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Find routes by origin, destination, or route code
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Call to Action */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          mt: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Ready to explore Cebu transport?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Start chatting with CeBot or explore the interactive map
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/chat"
            variant="contained"
            size="large"
            startIcon={<ChatIcon />}
          >
            Start Chatting
          </Button>
          <Button
            component={Link}
            to="/map"
            variant="outlined"
            size="large"
            startIcon={<MapIcon />}
          >
            View Map
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
