import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import RouteMap from './components/RouteMap';
import RouteSearch from './components/RouteSearch';
import Dashboard from './components/Dashboard';

// Create a custom theme for CeBot
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue for transport theme
    },
    secondary: {
      main: '#ff9800', // Orange for Cebu theme
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          // Smooth scrolling for the entire app
          html: {
            scrollBehavior: 'smooth',
          },
          // Enhanced fade-in animation
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(15px) scale(0.95)',
            },
            '50%': {
              opacity: 0.7,
              transform: 'translateY(5px) scale(0.98)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0) scale(1)',
            },
          },
          // Smooth slide-up animation for messages
          '@keyframes slideUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('MAPBOX Token:', import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2, md: 3 }, flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chatbot />} />
              <Route path="/map" element={<RouteMap />} />
              <Route path="/search" element={<RouteSearch />} />
            </Routes>
          </Container>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
