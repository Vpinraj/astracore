import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog } from '../../types';

interface CoreState {
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  logs: ActivityLog[];
}

const initialState: CoreState = {
  isSyncing: false,
  syncError: null,
  lastSyncedAt: null,
  logs: [],
};

const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    fetchStateRequest: (state) => { state.isSyncing = true; state.syncError = null; },
    fetchStateSuccess: (state, action: PayloadAction<any>) => {
      state.isSyncing = false;
      state.lastSyncedAt = new Date().toISOString();
      state.logs = action.payload.logs || [];
    },
    fetchStateFailure: (state, action: PayloadAction<string>) => {
      state.isSyncing = false;
      state.syncError = action.payload;
    },
    resetStateRequest: (state) => { state.isSyncing = true; },
    resetStateSuccess: (state) => { state.isSyncing = false; },
    resetStateFailure: (state, action: PayloadAction<string>) => { state.isSyncing = false; state.syncError = action.payload; },
    clearLogsRequest: (state) => { state.isSyncing = true; },
    clearLogsSuccess: (state) => { state.isSyncing = false; },
    clearLogsFailure: (state, action: PayloadAction<string>) => { state.isSyncing = false; state.syncError = action.payload; },
    parseCommandRequest: (state, action: PayloadAction<{ command: string; onSuccess?: (res: any) => void }>) => { state.isSyncing = true; },
    parseCommandSuccess: (state) => { state.isSyncing = false; },
    parseCommandFailure: (state, action: PayloadAction<string>) => { state.isSyncing = false; state.syncError = action.payload; },
    tickRequest: (state) => { /* Tick logic runs in background, optionally set syncing state here */ },
    tickSuccess: (state, action: PayloadAction<any>) => {
      state.lastSyncedAt = new Date().toISOString();
      state.logs = action.payload.logs || [];
    },
    tickFailure: (state, action: PayloadAction<string>) => {
      state.syncError = action.payload;
    },
  },
});

export const {
  fetchStateRequest, fetchStateSuccess, fetchStateFailure,
  resetStateRequest, resetStateSuccess, resetStateFailure,
  clearLogsRequest, clearLogsSuccess, clearLogsFailure,
  parseCommandRequest, parseCommandSuccess, parseCommandFailure,
  tickRequest, tickSuccess, tickFailure,
} = coreSlice.actions;

export default coreSlice.reducer;
