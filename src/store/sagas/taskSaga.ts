import { call, put, takeLatest, delay } from 'redux-saga/effects';
import { api } from '../../api';
import {
  createTaskRequest, createTaskSuccess,
  assignAgentRequest, assignAgentSuccess,
  startTaskRequest, startTaskSuccess,
  deleteTaskRequest, deleteTaskSuccess,
  updateTaskRequest, updateTaskSuccess,
  updateTaskDiscussion,
} from '../slices/taskSlice';
import { fetchStateRequest } from '../slices/coreSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* createTaskSaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createTask, action.payload);
    yield put(createTaskSuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* assignAgentSaga(action: PayloadAction<{ taskId: string; agentId: string }>) {
  try {
    yield call(api.assignAgentToTask, action.payload.taskId, action.payload.agentId);
    yield put(assignAgentSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* startTaskSaga(action: PayloadAction<{ taskId: string }>) {
  try {
    yield call(api.startTask, action.payload.taskId);
    yield put(startTaskSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* answerTaskSaga(action: PayloadAction<{ taskId: string; answer: string }>) {
  try {
    yield call(api.answerTaskQuestion, action.payload.taskId, action.payload.answer);
    yield put(startTaskSuccess()); // Re-using success or can dispatch answerTaskSuccess
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* deleteTaskSaga(action: PayloadAction<{ taskId: string }>) {
  try {
    yield call(api.deleteTask, action.payload.taskId);
    yield put(deleteTaskSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* updateTaskSaga(action: PayloadAction<{ taskId: string; data: any }>) {
  try {
    yield call(api.updateTask, action.payload.taskId, action.payload.data);
    yield put(updateTaskSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* postDiscussionSaga(action: PayloadAction<{ taskId: string; content: string; senderName?: string }>) {
  try {
    const { taskId } = action.payload;

    // Post the user message to the backend (optimistic UI update already happened in the reducer)
    yield call(api.postTaskDiscussionMessage, taskId, action.payload.content, action.payload.senderName);
    yield put({ type: 'task/postTaskDiscussionSuccess' });

    // Capture baseline assistant message count BEFORE starting the polling loop
    let previousCount = 0;
    try {
      const initialDiscussion: any[] = yield call(api.getTaskDiscussion, taskId);
      previousCount = initialDiscussion.filter((m: any) => m.role === 'assistant' || m.role === 'agent').length;
    } catch (_) {
      // If initial fetch fails, proceed with 0 baseline
    }

    // Poll for the agent's async reply (up to 10 attempts, every 3 seconds = 30s max)
    const maxAttempts = 10;
    const pollIntervalMs = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      yield delay(pollIntervalMs);

      try {
        const discussion: any[] = yield call(api.getTaskDiscussion, taskId);
        const assistantCount = discussion.filter((m: any) => m.role === 'assistant' || m.role === 'agent').length;

        // Always update the discussion so user sees the latest state
        yield put(updateTaskDiscussion({ taskId, discussion }));

        if (assistantCount > previousCount) {
          // Agent replied — stop polling
          break;
        }
      } catch (pollError) {
        console.error('Discussion polling error:', pollError);
        break;
      }
    }
  } catch (error) {
    console.error(error);
  }
}


export default function* taskSaga() {
  yield takeLatest(createTaskRequest.type, createTaskSaga);
  yield takeLatest(assignAgentRequest.type, assignAgentSaga);
  yield takeLatest(startTaskRequest.type, startTaskSaga);
  yield takeLatest('task/answerTaskRequest', answerTaskSaga);
  yield takeLatest(deleteTaskRequest.type, deleteTaskSaga);
  yield takeLatest(updateTaskRequest.type, updateTaskSaga);
  yield takeLatest('task/postTaskDiscussionRequest', postDiscussionSaga);
}
