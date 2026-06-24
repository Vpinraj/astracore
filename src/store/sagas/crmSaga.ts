import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import {
  createLeadRequest, createLeadSuccess,
  updateLeadStageRequest, updateLeadStageSuccess,
  deleteLeadRequest, deleteLeadSuccess,
  createEmployeeRequest, createEmployeeSuccess,
  deleteEmployeeRequest, deleteEmployeeSuccess
} from '../slices/crmSlice';
import { fetchStateRequest } from '../slices/coreSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* createLeadSaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createLead, action.payload);
    yield put(createLeadSuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* updateLeadStageSaga(action: PayloadAction<any>) {
  try {
    yield call(api.updateLeadStage, action.payload.leadId, action.payload);
    yield put(updateLeadStageSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* deleteLeadSaga(action: PayloadAction<string>) {
  try {
    yield call(api.deleteLead, action.payload);
    yield put(deleteLeadSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* createEmployeeSaga(action: PayloadAction<any>) {
  try {
    const data: any = yield call(api.createEmployee, action.payload);
    yield put(createEmployeeSuccess(data));
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

function* deleteEmployeeSaga(action: PayloadAction<string>) {
  try {
    yield call(api.deleteEmployee, action.payload);
    yield put(deleteEmployeeSuccess());
    yield put(fetchStateRequest());
  } catch (error) {
    console.error(error);
  }
}

export default function* crmSaga() {
  yield takeLatest(createLeadRequest.type, createLeadSaga);
  yield takeLatest(updateLeadStageRequest.type, updateLeadStageSaga);
  yield takeLatest(deleteLeadRequest.type, deleteLeadSaga);
  yield takeLatest(createEmployeeRequest.type, createEmployeeSaga);
  yield takeLatest(deleteEmployeeRequest.type, deleteEmployeeSaga);
}
