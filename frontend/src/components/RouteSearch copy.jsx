import React, { useState, useEffect, useRef } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  DirectionsBus as BusIcon,
  DirectionsCar as JeepIcon,
  ExpandMore as ExpandMoreIcon,
  Map as MapIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import {
  searchRoutes,
  fetchAllRoutes,
  getRoutesByType,
  getRouteByCode
} from '../store/slices/routesSlice';
import { 
  setSelectedRoute,
  addHighlightedRoute 
} from '../store/slices/mapSlice';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token here
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_TOKEN';

// Common Cebu locations with coordinates
const CEBU_LOCATIONS = {
  'Gaisano Country Mall': [123.909825, 10.340333],
  'Carbon': [123.9003, 10.2926],
  'Colon': [123.8989, 10.2963],
  'Ayala': [123.9055, 10.3177],
  'SM': [123.9183, 10.3113],
  'Fuente': [123.8991, 10.3096],
  'Parkmall': [123.9305, 10.3340],
  'Mabolo': [123.9181, 10.3226],
  'Lahug': [123.9015, 10.3259],
  'Cebu IT Park': [123.9028, 10.3305],
  'Cebu IT Park Transport Terminal': [123.9042, 10.3311]

// We'll use route_coordinates from the database instead of hard-coded streets

const RouteSearch = () => {
  const dispatch = useDispatch();
  const { filteredRoutes, isLoading, error } = useSelector((state) => state.routes);
  
  const [searchQuery, setSearchQuery] = useState({ origin: '', destination: '' });
  const [routeCode, setRouteCode] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    sortBy: 'route_code'
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedRoute, setSelectedRouteLocal] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    dispatch(fetchAllRoutes());
  }, [dispatch]);
  
  // Initialize map when showing map and not already initialized
  useEffect(() => {
    if (map.current || !showMap) return;
    
    // Initialize the map only when map container is available
    requestAnimationFrame(() => {
      if (!mapContainer.current) return;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [123.8854, 10.3157], // Default Cebu City coordinates
        zoom: 12,
      });
      
      map.current.on("load", () => {
        console.log("✅ Map fully loaded");
        setMapLoaded(true);
        setupMapLayers();
        
        if (selectedRoute) {
          displayRouteOnMap(selectedRoute);
        }
      });
      
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    });
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap]);
  
  // Setup map layers
  const setupMapLayers = () => {
    if (!map.current) return;
    
    // Add a source for route lines
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });
    
    // Add route line layer
    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1976d2',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });
    
    // Add a source for markers
    map.current.addSource('markers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
    
    // Add markers layer
      map.current.addLayer({
      id: 'route-markers',
      type: 'circle',
      source: 'markers',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'pointType'], 'via'], 6,
          8
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'pointType'], 'origin'], '#4caf50',
          ['==', ['get', 'pointType'], 'destination'], '#f44336',
          ['==', ['get', 'pointType'], 'via'], '#ff9800',
          '#1976d2' // default
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });    // Add popup on marker click
    map.current.on('click', 'route-markers', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;
      
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 10px;">
            <h4 style="margin: 0 0 8px 0;">${properties.pointType === 'origin' ? 'Origin' : 'Destination'}</h4>
            <p style="margin: 0;">${properties.location}</p>
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
  };

  // Handle route search
  const handleSearch = async () => {
    if (!searchQuery.origin || !searchQuery.destination) return;
    
    try {
      const result = await dispatch(searchRoutes(searchQuery)).unwrap();
      
      // Add to search history
      const newSearch = {
        id: Date.now(),
        query: { ...searchQuery },
        timestamp: new Date().toISOString(),
        resultCount: result.data ? result.data.length : 0
      };
      
      setSearchHistory(prev => [newSearch, ...prev.slice(0, 9)]); // Keep last 10 searches
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Handle route code lookup
  const handleRouteCodeLookup = async () => {
    if (!routeCode.trim()) return;
    
    try {
      const result = await dispatch(getRouteByCode(routeCode.trim())).unwrap();
      if (result && result.data) {
        // Update filtered routes to show just this route
        dispatch({ 
          type: 'routes/setFilteredRoutes', 
          payload: Array.isArray(result.data) ? result.data : [result.data] 
        });
        
        // If we found a route, also show it on the map
        if (!Array.isArray(result.data)) {
          handleRouteSelect(result.data);
        } else if (result.data.length > 0) {
          handleRouteSelect(result.data[0]);
        }
        
        // Add to search history
        const newSearch = {
          id: Date.now(),
          query: { routeCode: routeCode.trim() },
          timestamp: new Date().toISOString(),
          resultCount: Array.isArray(result.data) ? result.data.length : 1
        };
        
        setSearchHistory(prev => [newSearch, ...prev.slice(0, 9)]); // Keep last 10 searches
      }
    } catch (error) {
      console.error('Route lookup failed:', error);
    }
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
    return [123.8854, 10.3157];
  };
  
  // Generate route path using the route coordinates directly from the database
  const generateRoutePath = (route) => {
    // If route_coordinates are provided, use them
    if (route.route_coordinates && Object.keys(route.route_coordinates).length > 0) {
      let allCoordinates = [];
      // Flatten the coordinates from all streets
      Object.values(route.route_coordinates).forEach(streetCoords => {
        allCoordinates = [...allCoordinates, ...streetCoords];
      });
      
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
      
      return uniqueCoords;
    }
    
    // Fallback to direct line if no coordinates are available
    return [
      getLocationCoordinates(route.origin), 
      getLocationCoordinates(route.destination)
    ];
      if (i === 0 || 
          current[0] !== routeCoordinates[i-1][0] || 
          current[1] !== routeCoordinates[i-1][1]) {
        uniqueCoords.push(current);
      }
    }
    
    return uniqueCoords;
  };
  
  // Get route path between two points using Mapbox Directions API (fallback)
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
  
  // Display a route on the map
  const displayRouteOnMap = async (route) => {
    if (!map.current || !mapLoaded) return;
    
    try {
      // Get route path coordinates based on route_coordinates if available
      let routeCoordinates;
      
      // Check if we have route_coordinates data
      if (route.route_coordinates && Object.keys(route.route_coordinates).length > 0) {
        console.log("Using route_coordinates data for plotting");
        routeCoordinates = generateRoutePath(route);
      } else {
        // Fall back to Mapbox Directions API
        console.log("No route_coordinates data, using Mapbox Directions API");
        routeCoordinates = await getRoutePath(route.origin, route.destination);
      }
      
      // Update route line source
      map.current.getSource('route').setData({
        type: 'Feature',
        properties: {
          route_code: route.route_code,
          type: route.type
        },
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      });
      
      // Create markers for origin and destination only
      const originCoords = getLocationCoordinates(route.origin);
      const destCoords = getLocationCoordinates(route.destination);
      
      // Update markers source - only adding origin and destination points, not the route coordinates
      map.current.getSource('markers').setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: originCoords
            },
            properties: {
              pointType: 'origin',
              location: route.origin
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: destCoords
            },
            properties: {
              pointType: 'destination',
              location: route.destination
            }
          }
        ]
      });
      
      // Fit map bounds to include the entire route
      const bounds = new mapboxgl.LngLatBounds();
      routeCoordinates.forEach((coord) => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 80 });
      
    } catch (error) {
      console.error('Error displaying route on map:', error);
    }
  };
  
  // Handle route selection
  const handleRouteSelect = (route) => {
    setSelectedRouteLocal(route);
    dispatch(setSelectedRoute(route));
    dispatch(addHighlightedRoute(route));
    setShowMap(true);
    
    // Display the route on map if map is already loaded
    if (map.current && mapLoaded) {
      displayRouteOnMap(route);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    
    if (filterType === 'type') {
      if (value === 'all') {
        dispatch(fetchAllRoutes());
      } else {
        dispatch(getRoutesByType(value));
      }
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery({ origin: '', destination: '' });
    setRouteCode('');
    setSelectedRouteLocal(null);
    setShowMap(false);
    dispatch(fetchAllRoutes());
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

  // Get route type color
  const getRouteTypeColor = (type) => {
    switch (type) {
      case 'jeepney':
        return 'primary';
      case 'modern_jeep':
        return 'secondary';
      case 'bus':
        return 'info';
      default:
        return 'default';
    }
  };

  // Sort routes based on current sort filter
  const getSortedRoutes = () => {
    if (!filteredRoutes) return [];
    
    const sorted = [...filteredRoutes];
    switch (filters.sortBy) {
      case 'route_code':
        return sorted.sort((a, b) => a.route_code.localeCompare(b.route_code));
      case 'origin':
        return sorted.sort((a, b) => a.origin.localeCompare(b.origin));
      case 'destination':
        return sorted.sort((a, b) => a.destination.localeCompare(b.destination));
      case 'type':
        return sorted.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return sorted;
    }
  };

  const sortedRoutes = getSortedRoutes();

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        🔍 Route Search & Discovery
      </Typography>

      {/* Show map when a route is selected */}
      {showMap && selectedRoute && (
        <Card sx={{ mb: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
            <IconButton 
              onClick={() => setShowMap(false)} 
              sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.8)' } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ height: '400px', width: '100%' }} ref={mapContainer} />
          </CardContent>
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Route {selectedRoute.route_code}: {selectedRoute.origin} → {selectedRoute.destination}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                icon={getRouteTypeIcon(selectedRoute.type)} 
                label={selectedRoute.type} 
                color={getRouteTypeColor(selectedRoute.type)} 
                size="small" 
              />
              {selectedRoute.fare && (
                <Chip label={`Fare: ₱${selectedRoute.fare}`} size="small" variant="outlined" />
              )}
              {selectedRoute.schedule && (
                <Chip label={`Schedule: ${selectedRoute.schedule}`} size="small" variant="outlined" />
              )}
            </Box>
            
            {/* Via points */}
            {selectedRoute.via && selectedRoute.via.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Via:</strong> {selectedRoute.via.join(', ')}
              </Typography>
            )}
            
            {/* Route streets */}
            {selectedRoute.route_coordinates && Object.keys(selectedRoute.route_coordinates).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
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
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {selectedRoute.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                <strong>Notes:</strong> {selectedRoute.notes}
              </Typography>
            )}
            
            {selectedRoute.last_verified && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Last verified: {new Date(selectedRoute.last_verified).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Search Panel */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Origin-Destination Search */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚌 Search by Location
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Origin"
                    value={searchQuery.origin}
                    onChange={(e) => setSearchQuery({ ...searchQuery, origin: e.target.value })}
                    placeholder="e.g., Apas, Ayala, Colon"
                    size="small"
                  />
                  
                  <TextField
                    fullWidth
                    label="Destination"
                    value={searchQuery.destination}
                    onChange={(e) => setSearchQuery({ ...searchQuery, destination: e.target.value })}
                    placeholder="e.g., Fuente, SM, Carbon"
                    size="small"
                  />
                  
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={!searchQuery.origin || !searchQuery.destination || isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                    fullWidth
                  >
                    Search Routes
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Route Code Lookup */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔢 Lookup by Route Code
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Route Code"
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    placeholder="e.g., 17B, 04L, 03Q"
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && routeCode.trim()) {
                        handleRouteCodeLookup();
                      }
                    }}
                  />
                  
                  <Button
                    variant="outlined"
                    onClick={handleRouteCodeLookup}
                    disabled={!routeCode.trim() || isLoading}
                    startIcon={<SearchIcon />}
                    fullWidth
                  >
                    Find Route
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Filters & Sorting
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Route Type</InputLabel>
                    <Select
                      value={filters.type}
                      label="Route Type"
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                      <MenuItem value="all">All Routes</MenuItem>
                      <MenuItem value="jeepney">Jeepney</MenuItem>
                      <MenuItem value="modern_jeep">Modern Jeepney</MenuItem>
                      <MenuItem value="bus">Bus</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy}
                      label="Sort By"
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <MenuItem value="route_code">Route Code</MenuItem>
                      <MenuItem value="origin">Origin</MenuItem>
                      <MenuItem value="destination">Destination</MenuItem>
                      <MenuItem value="type">Type</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    onClick={handleClearSearch}
                    startIcon={<ClearIcon />}
                    fullWidth
                  >
                    Clear All
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📚 Search History
                  </Typography>
                  
                  <List dense>
                    {searchHistory.map((search) => (
                      <ListItem key={search.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={search.query.routeCode 
                            ? `Route Code: ${search.query.routeCode}`
                            : `${search.query.origin} → ${search.query.destination}`}
                          secondary={`${search.resultCount} routes found • ${new Date(search.timestamp).toLocaleString()}`}
                        />
                        <Button
                          size="small"
                          onClick={() => {
                            if (search.query.routeCode) {
                              setRouteCode(search.query.routeCode);
                              handleRouteCodeLookup();
                            } else {
                              setSearchQuery(search.query);
                            }
                          }}
                        >
                          Reuse
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🗺️ Search Results
                </Typography>
                {filteredRoutes && (
                  <Chip
                    label={`${filteredRoutes.length} routes found`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Loading State */}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* Error State */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Results */}
              {sortedRoutes && sortedRoutes.length > 0 ? (
                <List>
                  {sortedRoutes.map((route, index) => (
                    <React.Fragment key={route._id || index}>
                      <ListItem 
                        sx={{ 
                          px: 0, 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' },
                          transition: 'background-color 0.2s',
                          borderRadius: 1
                        }}
                        onClick={() => handleRouteSelect(route)}
                      >
                        <ListItemIcon>
                          <Chip
                            icon={getRouteTypeIcon(route.type)}
                            label={route.route_code}
                            color={getRouteTypeColor(route.type)}
                            size="small"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {route.origin}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                →
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {route.destination}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={route.type}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                              {route.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {route.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <MapIcon fontSize="small" color="primary" />
                        </IconButton>
                      </ListItem>
                      {index < sortedRoutes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                !isLoading && (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No routes found. Try adjusting your search criteria.
                    </Typography>
                  </Box>
                )
              )}
            </CardContent>
          </Card>

          {/* Quick Search Suggestions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💡 Popular Searches
              </Typography>
              
              <Grid container spacing={2}>
                {[
                  { origin: 'Apas', destination: 'Fuente' },
                  { origin: 'Ayala', destination: 'SM' },
                  { origin: 'Colon', destination: 'Carbon' },
                  { origin: 'Lahug', destination: 'Ayala' },
                  { origin: 'Guadalupe', destination: 'Carbon' },
                  { origin: 'Mabolo', destination: 'Carbon' }
                ].map((suggestion, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSearchQuery(suggestion)}
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {suggestion.origin} → {suggestion.destination}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RouteSearch;
