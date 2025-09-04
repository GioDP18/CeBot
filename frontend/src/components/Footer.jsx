import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Public as PublicIcon
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.main',
        color: 'white',
        mt: 'auto',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={2}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  fontSize: { xs: '1.25rem', md: '1.5rem' }
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="CeBot Logo" 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    objectFit: 'contain'
                  }}
                />
                CeBot
              </Typography>
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
            </Box>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Your intelligent Cebu City transport assistant. Find jeepney routes, 
              bus schedules, and get real-time transport information to navigate 
              the Queen City of the South.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                sx={{ color: 'inherit' }}
                component="a"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                size="small"
                sx={{ color: 'inherit' }}
                component="a"
                href="mailto:info@cebot.com"
              >
                <EmailIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="/"
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                Home
              </Link>
              <Link
                href="/chat"
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                Chat Assistant
              </Link>
              <Link
                href="/map"
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                Route Map
              </Link>
              <Link
                href="/search"
                color="inherit"
                underline="hover"
                sx={{ fontSize: '0.875rem' }}
              >
                Route Search
              </Link>
            </Box>
          </Grid>

          {/* Transport Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Transport Types
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#1976d2',
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">Traditional Jeepney</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#ff9800',
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">Modern Jeepney</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#2196f3',
                    borderRadius: '50%'
                  }}
                />
                <Typography variant="body2">City Bus</Typography>
              </Box>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                <Typography variant="body2">
                  Cebu City, Philippines
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                <Typography variant="body2">
                  +63 (32) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                <Typography variant="body2">
                  info@cebot.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublicIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                <Typography variant="body2">
                  www.cebot.com
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {currentYear} CeBot. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              href="/privacy"
              color="inherit"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              color="inherit"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Terms of Service
            </Link>
            <Link
              href="/about"
              color="inherit"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              About Us
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

