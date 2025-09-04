import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Container,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon,
  Map as MapIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  
  const handleOpenMobileMenu = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuAnchorEl(null);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/chat', label: 'Chat', icon: <ChatIcon /> },
    { path: '/map', label: 'Map', icon: <MapIcon /> },
    { path: '/search', label: 'Search', icon: <SearchIcon /> }
  ];

  return (
    <AppBar position="static" elevation={2}>
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <img 
                src="/logo.png" 
                alt="CeBot Logo" 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  objectFit: 'contain'
                }}
              />
              CeBot
            </Typography>
            {!isMobile && (
              <Chip
                label="Cebu Transport Assistant"
                size="small"
                variant="outlined"
                sx={{ 
                  color: 'inherit',
                  borderColor: 'rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }}
              />
            )}
          </Box>

          {/* Desktop Navigation */}
          {!isMobile ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: 'inherit',
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          ) : (
            <>
              {/* Mobile Navigation */}
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={handleOpenMobileMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="mobile-menu"
                anchorEl={mobileMenuAnchorEl}
                keepMounted
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleCloseMobileMenu}
                PaperProps={{
                  style: {
                    maxHeight: '65vh',
                    width: '200px',
                  },
                }}
              >
                {navItems.map((item) => (
                  <MenuItem 
                    key={item.path}
                    onClick={handleCloseMobileMenu}
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.icon}
                      <Typography variant="body1">{item.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
