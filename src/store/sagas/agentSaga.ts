import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import { createAgentRequest, createAgentSuccess } from '../slices/agentSlice';
import { fetchStateRequest } from '../slices/coreSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* createAgentSaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createAgent, action.payload);
    yield put(createAgentSuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

export default function* agentSaga() {
  yield takeLatest(createAgentRequest.type, createAgentSaga);
}
