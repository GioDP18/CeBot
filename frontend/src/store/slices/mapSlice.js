import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  center: [123.8854, 10.3157], // Cebu City coordinates
  zoom: 12,
  selectedRoute: null,
  highlightedRoutes: [],
  mapStyle: 'mapbox://styles/mapbox/streets-v11',
  showRouteLines: true,
  showMarkers: true,
  showPopups: true
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapCenter: (state, action) => {
      state.center = action.payload;
    },
    setMapZoom: (state, action) => {
      state.zoom = action.payload;
    },
    setSelectedRoute: (state, action) => {
      state.selectedRoute = action.payload;
    },
    setHighlightedRoutes: (state, action) => {
      state.highlightedRoutes = action.payload;
    },
    addHighlightedRoute: (state, action) => {
      if (!state.highlightedRoutes.find(r => r.route_code === action.payload.route_code)) {
        state.highlightedRoutes.push(action.payload);
      }
    },
    removeHighlightedRoute: (state, action) => {
      state.highlightedRoutes = state.highlightedRoutes.filter(
        r => r.route_code !== action.payload
      );
    },
    setMapStyle: (state, action) => {
      state.mapStyle = action.payload;
    },
    toggleRouteLines: (state) => {
      state.showRouteLines = !state.showRouteLines;
    },
    toggleMarkers: (state) => {
      state.showMarkers = !state.showMarkers;
    },
    togglePopups: (state) => {
      state.showPopups = !state.showPopups;
    },
    resetMap: (state) => {
      state.center = [123.8854, 10.3157];
      state.zoom = 12;
      state.selectedRoute = null;
      state.highlightedRoutes = [];
    }
  }
});

export const {
  setMapCenter,
  setMapZoom,
  setSelectedRoute,
  setHighlightedRoutes,
  addHighlightedRoute,
  removeHighlightedRoute,
  setMapStyle,
  toggleRouteLines,
  toggleMarkers,
  togglePopups,
  resetMap
} = mapSlice.actions;

export default mapSlice.reducer;
