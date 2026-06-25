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
  },
});

export const {
  setTasks,
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
} = taskSlice.actions;

export default taskSlice.reducer;
