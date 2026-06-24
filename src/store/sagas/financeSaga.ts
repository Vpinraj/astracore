import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import { createTransactionRequest, createTransactionSuccess } from '../slices/financeSlice';
import { fetchStateRequest } from '../slices/coreSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* createTransactionSaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createTransaction, action.payload);
    yield put(createTransactionSuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

export default function* financeSaga() {
  yield takeLatest(createTransactionRequest.type, createTransactionSaga);
}
