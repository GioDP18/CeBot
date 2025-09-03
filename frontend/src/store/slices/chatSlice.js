import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunk for sending chat messages
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, sessionId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/chat/message', {
        message,
        sessionId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send message');
    }
  }
);

// Async thunk for getting chat history
export const getChatHistory = createAsyncThunk(
  'chat/getHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/chat/history');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get chat history');
    }
  }
);

const initialState = {
  messages: [
    {
      id: 1,
      message: "Kumusta! I'm CeBot, your smart Cebu transport assistant! 🚌 I can help you find the best routes around Metro Cebu using jeepneys, buses, and modern PUVs. Try asking me 'How do I get from Ayala to SM?' or 'What jeep goes to USC?'",
      timestamp: new Date().toISOString(),
      sender: 'bot'
    }
  ],
  isTyping: false,
  isLoading: false,
  error: null,
  socket: null,
  isConnected: false,
  searchResults: null,
  suggestions: []
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    clearChat: (state) => {
      state.messages = [
        {
          id: Date.now(),
          message: "Kumusta! I'm CeBot, your smart Cebu transport assistant! 🚌 I can help you find the best routes around Metro Cebu using jeepneys, buses, and modern PUVs. Try asking me 'How do I get from Ayala to SM?' or 'What jeep goes to USC?'",
          timestamp: new Date().toISOString(),
          sender: 'bot'
        }
      ];
      state.searchResults = null;
      state.suggestions = [];
    },
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        message: action.payload,
        timestamp: new Date().toISOString(),
        sender: 'user'
      });
    },
    addBotMessage: (state, action) => {
      state.messages.push({
        id: Date.now(),
        message: action.payload,
        timestamp: new Date().toISOString(),
        sender: 'bot'
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle search results from our AI service
        if (action.payload.searchResults && action.payload.searchResults.length > 0) {
          state.searchResults = {
            data: action.payload.searchResults,
            origin: action.payload.data.parameters?.query?.origin || '',
            destination: action.payload.data.parameters?.query?.destination || '',
            count: action.payload.searchResults.length
          };
        }
        // Handle suggestions from our AI service
        if (action.payload.suggestions) {
          state.suggestions = action.payload.suggestions;
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getChatHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data && action.payload.data.length > 0) {
          state.messages = action.payload.data;
        }
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addMessage,
  setTyping,
  setSocket,
  setConnectionStatus,
  setSearchResults,
  setSuggestions,
  clearChat,
  addUserMessage,
  addBotMessage
} = chatSlice.actions;

export default chatSlice.reducer;
