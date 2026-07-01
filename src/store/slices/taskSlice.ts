import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';

interface TaskState {
  items: Task[];
}

const initialState: TaskState = {
  items: [],
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.items = action.payload;
    },
    updateTaskDiscussion: (state, action: PayloadAction<{ taskId: string; discussion: any[] }>) => {
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) {
        task.discussion = action.payload.discussion;
      }
    },
    createTaskRequest: (state, action: PayloadAction<any>) => {},
    createTaskSuccess: (state, action: PayloadAction<Task>) => {},
    assignAgentRequest: (state, action: PayloadAction<{ taskId: string; agentId: string }>) => {},
    assignAgentSuccess: (state) => {},
    startTaskRequest: (state, action: PayloadAction<{ taskId: string }>) => {},
    startTaskSuccess: (state) => {},
    answerTaskRequest: (state, action: PayloadAction<{ taskId: string; answer: string }>) => {},
    answerTaskSuccess: (state) => {},
    deleteTaskRequest: (state, action: PayloadAction<{ taskId: string }>) => {},
    deleteTaskSuccess: (state) => {},
    updateTaskRequest: (state, action: PayloadAction<{ taskId: string; data: any }>) => {},
    updateTaskSuccess: (state) => {},
    postTaskDiscussionRequest: (state, action: PayloadAction<{ taskId: string; content: string; senderName?: string }>) => {
      // Optimistic update: add the user message immediately before API call
      const task = state.items.find(t => t.id === action.payload.taskId);
      if (task) {
        if (!task.discussion) task.discussion = [];
        task.discussion.push({
          role: 'user',
          content: action.payload.content,
          senderName: action.payload.senderName || 'User',
          timestamp: new Date().toISOString(),
        });
      }
    },
    postTaskDiscussionSuccess: (state) => {},
  },
});

export const {
  setTasks,
  updateTaskDiscussion,
  createTaskRequest,
  createTaskSuccess,
  assignAgentRequest,
  assignAgentSuccess,
  startTaskRequest,
  startTaskSuccess,
  answerTaskRequest,
  answerTaskSuccess,
  deleteTaskRequest,
  deleteTaskSuccess,
  updateTaskRequest,
  updateTaskSuccess,
  postTaskDiscussionRequest,
  postTaskDiscussionSuccess,
} = taskSlice.actions;

export default taskSlice.reducer;
