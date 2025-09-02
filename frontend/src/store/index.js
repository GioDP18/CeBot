import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import routesReducer from './slices/routesSlice';
import userReducer from './slices/userSlice';
import mapReducer from './slices/mapSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    routes: routesReducer,
    user: userReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['chat/setSocket'],
        ignoredPaths: ['chat.socket'],
      },
    }),
});

export default store;
