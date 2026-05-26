import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ── Async thunks ──────────────────────────────────────────────────────────────
export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  } catch (error) {

    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, thunkAPI) => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return thunkAPI.rejectWithValue('Session expired');
  }
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    bootstrapping: true,   // true until we know if user is logged in
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.bootstrapping = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.bootstrapping = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // fetchMe (bootstrap)
      .addCase(fetchMe.pending, (state) => { state.bootstrapping = true; })
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; state.bootstrapping = false; })
      .addCase(fetchMe.rejected, (state) => { state.user = null; state.bootstrapping = false; });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
