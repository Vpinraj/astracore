import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import { createSubsidiaryRequest, createSubsidiarySuccess, allocateFundsRequest, allocateFundsSuccess, updateSubsidiaryRequest, updateSubsidiarySuccess } from '../slices/subsidiarySlice';
import { fetchStateRequest } from '../slices/coreSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* createSubsidiarySaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createSubsidiary, action.payload);
    yield put(createSubsidiarySuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* allocateFundsSaga(action: PayloadAction<{ subsidiaryId: string; amount: number }>) {
  try {
    yield call(api.allocateFunds, action.payload.subsidiaryId, action.payload.amount);
    yield put(allocateFundsSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* updateSubsidiarySaga(action: PayloadAction<{ id: string; data: any }>) {
  try {
    const data: any = yield call(api.updateSubsidiary, action.payload.id, action.payload.data);
    yield put(updateSubsidiarySuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

export default function* subsidiarySaga() {
  yield takeLatest(createSubsidiaryRequest.type, createSubsidiarySaga);
  yield takeLatest(allocateFundsRequest.type, allocateFundsSaga);
  yield takeLatest(updateSubsidiaryRequest.type, updateSubsidiarySaga);
}
