import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for fetching all routes
export const fetchAllRoutes = createAsyncThunk(
  'routes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/routes');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch routes');
    }
  }
);

// Async thunk for searching routes
export const searchRoutes = createAsyncThunk(
  'routes/search',
  async ({ origin, destination }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/routes/search', {
        origin,
        destination
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to search routes');
    }
  }
);

// Async thunk for getting route by code
export const getRouteByCode = createAsyncThunk(
  'routes/getByCode',
  async (code, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/routes/${code}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get route');
    }
  }
);

// Async thunk for getting routes by type
export const getRoutesByType = createAsyncThunk(
  'routes/getByType',
  async (type, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/routes/type/${type}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get routes by type');
    }
  }
);

// Async thunk for getting route statistics
export const getRouteStats = createAsyncThunk(
  'routes/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/routes/stats/summary');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get route stats');
    }
  }
);

const initialState = {
  allRoutes: [],
  filteredRoutes: [],
  currentRoute: null,
  searchResults: null,
  stats: null,
  isLoading: false,
  error: null,
  searchQuery: {
    origin: '',
    destination: ''
  },
  filters: {
    type: 'all',
    sortBy: 'route_code'
  }
};

const routesSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = { ...state.searchQuery, ...action.payload };
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setFilteredRoutes: (state, action) => {
      state.filteredRoutes = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.filteredRoutes = [];
    },
    setCurrentRoute: (state, action) => {
      state.currentRoute = action.payload;
    },
    filterRoutes: (state, action) => {
      const { type, sortBy } = state.filters;
      let filtered = [...state.allRoutes];
      
      if (type !== 'all') {
        filtered = filtered.filter(route => route.type === type);
      }
      
      if (sortBy === 'route_code') {
        filtered.sort((a, b) => a.route_code.localeCompare(b.route_code));
      } else if (sortBy === 'origin') {
        filtered.sort((a, b) => a.origin.localeCompare(b.origin));
      } else if (sortBy === 'destination') {
        filtered.sort((a, b) => a.destination.localeCompare(b.destination));
      }
      
      state.filteredRoutes = filtered;
    },
    filterRoutesByType: (state, action) => {
      const type = action.payload;
      if (type === 'all') {
        state.filteredRoutes = [...state.allRoutes];
      } else {
        state.filteredRoutes = state.allRoutes.filter(route => route.type === type);
      }
      state.filters.type = type;
    },
    resetRoutes: (state) => {
      state.filteredRoutes = [];
      state.currentRoute = null;
      state.searchResults = null;
      state.searchQuery = { origin: '', destination: '' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRoutes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllRoutes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allRoutes = action.payload.data;
        state.filteredRoutes = action.payload.data;
      })
      .addCase(fetchAllRoutes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(searchRoutes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchRoutes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
        if (action.payload.data) {
          state.filteredRoutes = action.payload.data;
        }
      })
      .addCase(searchRoutes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getRouteByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRouteByCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRoute = action.payload.data;
        
        // Update filteredRoutes with the found route(s)
        if (action.payload.data) {
          state.filteredRoutes = Array.isArray(action.payload.data) 
            ? action.payload.data 
            : [action.payload.data];
        }
      })
      .addCase(getRouteByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getRoutesByType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRoutesByType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.filteredRoutes = action.payload.data;
      })
      .addCase(getRoutesByType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getRouteStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRouteStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(getRouteStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSearchQuery,
  setFilters,
  setFilteredRoutes,
  clearSearchResults,
  setCurrentRoute,
  filterRoutes,
  filterRoutesByType,
  resetRoutes
} = routesSlice.actions;

export default routesSlice.reducer;
