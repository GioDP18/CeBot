import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  preferences: {
    language: 'en',
    theme: 'light',
    notifications: true
  },
  recentSearches: [],
  favorites: []
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    addRecentSearch: (state, action) => {
      const search = action.payload;
      const existingIndex = state.recentSearches.findIndex(
        s => s.origin === search.origin && s.destination === search.destination
      );
      
      if (existingIndex !== -1) {
        state.recentSearches.splice(existingIndex, 1);
      }
      
      state.recentSearches.unshift({
        ...search,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 10 searches
      state.recentSearches = state.recentSearches.slice(0, 10);
    },
    addFavorite: (state, action) => {
      const favorite = action.payload;
      const existingIndex = state.favorites.findIndex(
        f => f.route_code === favorite.route_code
      );
      
      if (existingIndex === -1) {
        state.favorites.push({
          ...favorite,
          addedAt: new Date().toISOString()
        });
      }
    },
    removeFavorite: (state, action) => {
      const routeCode = action.payload;
      state.favorites = state.favorites.filter(f => f.route_code !== routeCode);
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    clearFavorites: (state) => {
      state.favorites = [];
    }
  }
});

export const {
  setUser,
  updatePreferences,
  addRecentSearch,
  addFavorite,
  removeFavorite,
  clearRecentSearches,
  clearFavorites
} = userSlice.actions;

export default userSlice.reducer;
