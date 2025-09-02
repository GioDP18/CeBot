import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search as SearchIcon, MyLocation as LocationIcon } from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { searchRoutes, fetchAllRoutes, filterRoutesByType } from '../store/slices/routesSlice';

// Helper function to check if the route_coordinates object contains actual coordinate data
const hasActualCoordinates = (coords) => {
  if (!coords || typeof coords !== 'object') return false;
  
  // Check if object is empty
  if (Object.keys(coords).length === 0) return false;
  
  // Check if at least one street has valid coordinates
  return Object.values(coords).some(streetCoords => {
    // Check if streetCoords is an array with content
    if (!Array.isArray(streetCoords) || streetCoords.length === 0) return false;
    
    // Check if at least one coordinate point is valid
    return streetCoords.some(point => {
      // Check if point is a valid coordinate array [lng, lat]
      return Array.isArray(point) && 
             point.length >= 2 && 
             typeof point[0] === 'number' && 
             typeof point[1] === 'number' &&
             !isNaN(point[0]) && 
             !isNaN(point[1]);
    });
  });
};

// Set your Mapbox access token here
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const RouteMap = () => {
  const dispatch = useDispatch();
  const { filteredRoutes, isLoading, error } = useSelector((state) => state.routes);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [searchQuery, setSearchQuery] = useState({ origin: '', destination: '' });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedRouteType, setSelectedRouteType] = useState('all');

  // Cebu City coordinates
  const CEBU_CENTER = [123.8854, 10.3157];

  // Common Cebu locations with coordinates
  const CEBU_LOCATIONS = {
    'Colon': [123.9025, 10.2969],
    'Carbon': [123.9025, 10.2969],
    'Ayala': [123.9147, 10.3188],
    'SM': [123.9147, 10.3188],
    'Fuente': [123.9025, 10.2969],
    'Parkmall': [123.9147, 10.3188],
    'Mabolo': [123.9147, 10.3188],
    'Lahug': [123.9147, 10.3188],
    'Urgello': [123.9025, 10.2969],
    'Plaza Housing': [123.9025, 10.2969],
    'South Bus Terminal': [123.9025, 10.2969],
    'Private': [123.9025, 10.2969],
    'SM City': [123.9147, 10.3188],
    'Ayala Center': [123.9147, 10.3188],
    'Carbon Market': [123.9025, 10.2969],
    'Fuente Osmeña': [123.9025, 10.2969],
    'Parkmall Mandaue': [123.9147, 10.3188],
    'Mabolo Church': [123.9147, 10.3188],
    'Lahug Airport': [123.9147, 10.3188],
    'Urgello Church': [123.9025, 10.2969],
    'Plaza Housing Lahug': [123.9147, 10.3188],
    'South Bus Terminal Cebu': [123.9025, 10.2969],
    'Private Hospital': [123.9025, 10.2969]
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return;
  
    requestAnimationFrame(() => {
      if (!mapContainer.current) return;
  
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: CEBU_CENTER,
        zoom: 12,
      });
  
      map.current.on("load", () => {
        console.log("✅ Map fully loaded");
        setMapLoaded(true);
        addRouteSources();
      });
  
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
    });
  
    return () => map.current?.remove();
  }, []);
  

  // Add route sources when map loads
  const addRouteSources = () => {
    if (!map.current) return;

    // Add a source for route lines
    map.current.addSource('routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add a source for route markers
    map.current.addSource('route-markers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add route lines layer
    map.current.addLayer({
      id: 'route-lines',
      type: 'line',
      source: 'routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'type'], 'jeepney'], '#1976d2',
          ['==', ['get', 'type'], 'modern_jeep'], '#4caf50',
          ['==', ['get', 'type'], 'bus'], '#ff9800',
          '#1976d2' // default color
        ],
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add route markers layer
    map.current.addLayer({
      id: 'route-markers',
      type: 'circle',
      source: 'route-markers',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'jeepney'], '#1976d2',
          ['==', ['get', 'type'], 'modern_jeep'], '#4caf50',
          ['==', ['get', 'type'], 'bus'], '#ff9800',
          '#1976d2' // default color
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Add popup on marker click and select the route
    map.current.on('click', 'route-markers', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      const routeCode = properties.route_code;
      
      // Find the full route object from filteredRoutes
      const selectedRouteObj = filteredRoutes.find(r => r.route_code === routeCode);
      
      if (selectedRouteObj) {
        console.log("Selected route:", selectedRouteObj);
        setSelectedRoute(selectedRouteObj);
      }

      const popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 8px 0;">Route ${properties.route_code}</h4>
            <p style="margin: 0 0 4px 0;"><strong>From:</strong> ${properties.origin}</p>
            <p style="margin: 0 0 4px 0;"><strong>To:</strong> ${properties.destination}</p>
            <p style="margin: 0 0 4px 0;"><strong>Type:</strong> ${properties.type}</p>
            ${properties.notes ? `<p style="margin: 0 0 4px 0;"><strong>Notes:</strong> ${properties.notes}</p>` : ''}
          </div>
        `)
        .addTo(map.current);
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'route-markers', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'route-markers', () => {
      map.current.getCanvas().style.cursor = '';
    });
    
    // Add click handler for route lines
    map.current.on('click', 'route-lines', (e) => {
      if (e.features && e.features.length > 0) {
        const properties = e.features[0].properties;
        const routeCode = properties.route_code;
        
        // Find the full route object from filteredRoutes
        const selectedRouteObj = filteredRoutes.find(r => r.route_code === routeCode);
        
        if (selectedRouteObj) {
          console.log("Selected route from line click:", selectedRouteObj);
          setSelectedRoute(selectedRouteObj);
        }
      }
    });
    
    // Change cursor on hover over route lines
    map.current.on('mouseenter', 'route-lines', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    
    map.current.on('mouseleave', 'route-lines', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  // Get coordinates for a location
  const getLocationCoordinates = (location) => {
    // Try to find exact match first
    if (CEBU_LOCATIONS[location]) {
      return CEBU_LOCATIONS[location];
    }
    
    // Try partial matches
    for (const [key, coords] of Object.entries(CEBU_LOCATIONS)) {
      if (key.toLowerCase().includes(location.toLowerCase()) || 
          location.toLowerCase().includes(key.toLowerCase())) {
        return coords;
      }
    }
    
    // Return default Cebu coordinates if no match found
    return CEBU_CENTER;
  };

  // Get actual route path using Mapbox Directions API
  const getRoutePath = async (origin, destination) => {
    try {
      const originCoords = getLocationCoordinates(origin);
      const destCoords = getLocationCoordinates(destination);
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        return data.routes[0].geometry.coordinates;
      }
      
      // Fallback to direct line if API fails
      return [originCoords, destCoords];
    } catch (error) {
      console.error('Error fetching route path:', error);
      // Fallback to direct line
      const originCoords = getLocationCoordinates(origin);
      const destCoords = getLocationCoordinates(destination);
      return [originCoords, destCoords];
    }
  };

  // Update map with routes
  useEffect(() => {
    if (!map.current || !filteredRoutes) return;

    updateMapWithRoutes(filteredRoutes);
  }, [filteredRoutes]);

  // Update map with route data
  const updateMapWithRoutes = async (routes) => {
    if (!map.current || !map.current.getSource('routes')) return;

    // Add console logging to debug route data
    console.log("Routes to display:", routes.map(r => ({
      code: r.route_code,
      hasCoords: r.route_coordinates ? Object.keys(r.route_coordinates).length > 0 : false
    })));

    // Get route paths for all routes
    const routePromises = routes.map(async (route) => {
      let coordinates;
      
      // Debug specific route
      if (route.route_code === "01C") {
        console.log("01C route data:", route);
        console.log("01C route_coordinates:", route.route_coordinates);
        console.log("Has coordinates?", route.route_coordinates && Object.keys(route.route_coordinates).length > 0);
        console.log("Has actual coordinates?", hasActualCoordinates(route.route_coordinates));
      }
      
      // Use route_coordinates if available and not empty AND contains actual coordinates
      if (route.route_coordinates && 
          Object.keys(route.route_coordinates).length > 0 && 
          hasActualCoordinates(route.route_coordinates)) {
        
        let allCoordinates = [];
        // Flatten the coordinates from all streets
        Object.values(route.route_coordinates).forEach(streetCoords => {
          if (Array.isArray(streetCoords) && streetCoords.length > 0) {
            allCoordinates = [...allCoordinates, ...streetCoords];
          }
        });
        
        // If no valid coordinates were found, skip
        if (allCoordinates.length === 0) {
          console.log(`Route ${route.route_code} has no valid coordinates, skipping`);
          return null;
        }
        
        // Remove duplicate consecutive coordinates for smoother path
        const uniqueCoords = [];
        for (let i = 0; i < allCoordinates.length; i++) {
          const current = allCoordinates[i];
          if (i === 0 || 
              current[0] !== allCoordinates[i-1][0] || 
              current[1] !== allCoordinates[i-1][1]) {
            uniqueCoords.push(current);
          }
        }
        
        coordinates = uniqueCoords;
      } else {
        // Skip drawing the route if route_coordinates is empty
        console.log(`Route ${route.route_code} has no coordinates, skipping`);
        return null;
      }
      
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        },
        properties: {
          route_code: route.route_code,
          type: route.type,
          origin: route.origin,
          destination: route.destination
        }
      };
    });

    const routeFeatures = (await Promise.all(routePromises)).filter(feature => feature !== null);

    // Create marker features only for routes with valid coordinates
    const routesWithCoordinates = routes.filter(route => 
      route.route_coordinates && 
      Object.keys(route.route_coordinates).length > 0 &&
      hasActualCoordinates(route.route_coordinates)
    );
    
    const markerFeatures = routesWithCoordinates.map((route) => {
      const originCoords = getLocationCoordinates(route.origin);
      const destCoords = getLocationCoordinates(route.destination);
      
      return [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: originCoords
          },
          properties: {
            route: route,
            type: 'origin',
            label: route.origin
          }
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: destCoords
          },
          properties: {
            route: route,
            type: 'destination',
            label: route.destination
          }
        }
      ];
    }).flat();

    // Update sources
    map.current.getSource('routes').setData({
      type: 'FeatureCollection',
      features: routeFeatures
    });

    map.current.getSource('route-markers').setData({
      type: 'FeatureCollection',
      features: markerFeatures
    });

    // Fit map to show all routes
    if (routeFeatures.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      routeFeatures.forEach(feature => {
        feature.geometry.coordinates.forEach(coord => {
          bounds.extend(coord);
        });
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.origin || !searchQuery.destination) return;
    
    try {
      await dispatch(searchRoutes(searchQuery)).unwrap();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Handle route type filter
  const handleRouteTypeChange = async (event) => {
    const type = event.target.value;
    setSelectedRouteType(type);
    
    if (type === 'all') {
      await dispatch(fetchAllRoutes());
    } else {
      // Use the new action to filter routes by type
      dispatch(filterRoutesByType(type));
    }
  };

  // Load all routes on component mount
  useEffect(() => {
    dispatch(fetchAllRoutes());
  }, [dispatch]);
  
  // Effect to update selected route if it changes in state
  useEffect(() => {
    if (selectedRoute && filteredRoutes.length > 0) {
      // Update the selected route with fresh data from filteredRoutes
      const updatedRoute = filteredRoutes.find(r => r.route_code === selectedRoute.route_code);
      if (updatedRoute && JSON.stringify(updatedRoute) !== JSON.stringify(selectedRoute)) {
        setSelectedRoute(updatedRoute);
      }
    }
  }, [filteredRoutes, selectedRoute]);

  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      px: { xs: 1, sm: 2, md: 3 },
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        align="center" 
        color="primary"
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 },
          flexShrink: 0
        }}
      >
        🗺️ Cebu Transport Routes Map
      </Typography>
  
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ flex: 1 }}>
          {/* Map Container */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              height: { xs: '50vh', sm: '50vh', md: '60vh', lg: '70vh' }, 
              position: 'relative',
              minHeight: { xs: '250px', sm: '350px', md: '400px' },
              overflow: 'hidden'
            }}>
              <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />
              
              {/* Loading overlay */}
              {!mapLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 1
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Card>
          </Grid>
  
          {/* Controls and Info Panel */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              {/* Search Panel */}
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    🔍 Search Routes
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                    <TextField
                      fullWidth
                      label="Origin"
                      value={searchQuery.origin}
                      onChange={(e) => setSearchQuery({ ...searchQuery, origin: e.target.value })}
                      placeholder="e.g., Apas, Ayala, Colon"
                      size="small"
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          fontSize: { xs: '0.875rem', sm: '1rem' } 
                        } 
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Destination"
                      value={searchQuery.destination}
                      onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
                      placeholder="e.g., Fuente, SM, Carbon"
                      size="small"
                      sx={{ 
                        '& .MuiInputBase-root': { 
                          fontSize: { xs: '0.875rem', sm: '1rem' } 
                        } 
                      }}
                    />
                    
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      disabled={!searchQuery.origin || !searchQuery.destination || isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                      sx={{ 
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Search Routes
                    </Button>
                  </Box>
                </CardContent>
              </Card>
  
              {/* Route Type Filter */}
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    🚌 Filter by Type
                  </Typography>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Route Type</InputLabel>
                    <Select
                      value={selectedRouteType}
                      label="Route Type"
                      onChange={handleRouteTypeChange}
                      sx={{ 
                        '& .MuiSelect-select': { 
                          fontSize: { xs: '0.875rem', sm: '1rem' } 
                        } 
                      }}
                    >
                      <MenuItem value="all">All Routes</MenuItem>
                      <MenuItem value="jeepney">Jeepney</MenuItem>
                      <MenuItem value="modern_jeep">Modern Jeepney</MenuItem>
                      <MenuItem value="bus">Bus</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
  
              {/* Route Information */}
              {selectedRoute && (
                <Card>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                    >
                      📍 Route Details
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Chip
                        label={`Route ${selectedRoute.route_code}`}
                        color="primary"
                        size="small"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        <strong>From:</strong> {selectedRoute.origin}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        <strong>To:</strong> {selectedRoute.destination}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        <strong>Type:</strong> {selectedRoute.type}
                      </Typography>
                      {selectedRoute.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          <strong>Notes:</strong> {selectedRoute.notes}
                        </Typography>
                      )}
                      
                      {/* Display streets for the route */}
                      {selectedRoute.route_coordinates && Object.keys(selectedRoute.route_coordinates).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            <strong>Streets:</strong>
                          </Typography>
                          <Box sx={{ 
                            mt: 1, 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1 
                          }}>
                            {Object.keys(selectedRoute.route_coordinates).map((street, index) => (
                              <Chip
                                key={index}
                                label={street}
                                size="small"
                                variant="outlined"
                                color="info"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              )}
  
              {/* Map Legend */}
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    🎨 Map Legend
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 16, sm: 20 },
                          height: { xs: 3, sm: 4 },
                          backgroundColor: '#1976d2',
                          borderRadius: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Jeepney Routes
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 16, sm: 20 },
                          height: { xs: 3, sm: 4 },
                          backgroundColor: '#4caf50',
                          borderRadius: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Modern Jeepney Routes
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 16, sm: 20 },
                          height: { xs: 3, sm: 4 },
                          backgroundColor: '#ff9800',
                          borderRadius: 1
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Bus Routes
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: { xs: 12, sm: 16 },
                          height: { xs: 12, sm: 16 },
                          backgroundColor: '#ff9800',
                          borderRadius: '50%',
                          border: '2px solid white'
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        Route Markers
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
  
              {/* Error Display */}
              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default RouteMap;
