import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk for sending chat messages
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, sessionId }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/chat/message', {
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
      const response = await axios.get('/api/chat/history');
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
      message: "Hello! I'm CeBot, your Cebu transport assistant. How can I help you today?",
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
          message: "Hello! I'm CeBot, your Cebu transport assistant. How can I help you today?",
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
        if (action.payload.data.routes) {
          state.searchResults = action.payload.data;
        }
        if (action.payload.data.suggestions) {
          state.suggestions = action.payload.data.suggestions;
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
