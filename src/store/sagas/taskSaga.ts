import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import {
  createTaskRequest, createTaskSuccess,
  assignAgentRequest, assignAgentSuccess,
  startTaskRequest, startTaskSuccess
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

export default function* taskSaga() {
  yield takeLatest(createTaskRequest.type, createTaskSaga);
  yield takeLatest(assignAgentRequest.type, assignAgentSaga);
  yield takeLatest(startTaskRequest.type, startTaskSaga);
  yield takeLatest('task/answerTaskRequest', answerTaskSaga);
}
