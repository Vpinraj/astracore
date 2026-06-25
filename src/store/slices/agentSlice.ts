import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Agent, RoleBlueprint } from '../../types';

export interface CreateAgentPayload {
  name: string;
  role: string;
  subsidiaryId: string;
  instructions?: string;
  modelId?: string;
  customOverrides?: any;
}

interface AgentState {
  items: Agent[];
  activeChatAgentId: string | null;
  openChatIds: string[];
  isChatFullScreen: boolean;
  roles: RoleBlueprint[];
}

const initialState: AgentState = {
  items: [],
  activeChatAgentId: null,
  openChatIds: [],
  isChatFullScreen: false,
  roles: [],
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setAgents: (state, action: PayloadAction<Agent[]>) => {
      state.items = action.payload;
    },
    setRoles: (state, action: PayloadAction<RoleBlueprint[]>) => {
      state.roles = action.payload;
    },
    createAgentRequest: (state, action: PayloadAction<any>) => {},
    createAgentSuccess: (state, action: PayloadAction<Agent>) => {},
    openAgentChat: (state, action: PayloadAction<{ agentId: string, fullScreen?: boolean }>) => {
      state.activeChatAgentId = action.payload.agentId;
      if (!state.openChatIds.includes(action.payload.agentId)) {
        state.openChatIds.push(action.payload.agentId);
      }
      if (action.payload.fullScreen !== undefined) {
        state.isChatFullScreen = action.payload.fullScreen;
      }
    },
    closeAgentChatTab: (state, action: PayloadAction<string>) => {
      const agentId = action.payload;
      state.openChatIds = state.openChatIds.filter(id => id !== agentId);
      if (state.activeChatAgentId === agentId) {
        state.activeChatAgentId = state.openChatIds.length > 0 ? state.openChatIds[state.openChatIds.length - 1] : null;
      }
      if (state.openChatIds.length === 0) {
        state.isChatFullScreen = false;
      }
    },
    closeAgentChat: (state) => {
      state.activeChatAgentId = null;
      state.openChatIds = [];
      state.isChatFullScreen = false;
    },
    toggleAgentChatFullScreen: (state) => {
      state.isChatFullScreen = !state.isChatFullScreen;
    },
  },
});

export const { setAgents, setRoles, createAgentRequest, createAgentSuccess, openAgentChat, closeAgentChatTab, closeAgentChat, toggleAgentChatFullScreen } = agentSlice.actions;
export default agentSlice.reducer;
