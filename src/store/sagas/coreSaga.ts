import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../api';
import {
  fetchStateRequest, fetchStateSuccess, fetchStateFailure,
  resetStateRequest, resetStateSuccess, resetStateFailure,
  clearLogsRequest, clearLogsSuccess, clearLogsFailure,
  parseCommandRequest, parseCommandSuccess, parseCommandFailure,
  tickRequest, tickSuccess, tickFailure,
} from '../slices/coreSlice';
import { setSubsidiaries } from '../slices/subsidiarySlice';
import { setAgents, setRoles } from '../slices/agentSlice';
import { setTasks } from '../slices/taskSlice';
import { setTransactions } from '../slices/financeSlice';
import { setLeads, setEmployees } from '../slices/crmSlice';
import { PayloadAction } from '@reduxjs/toolkit';

function* fetchStateSaga() {
  try {
    const data: any = yield call(api.fetchState);
    yield put(setSubsidiaries(data.subsidiaries || []));
    yield put(setAgents(data.agents || []));
    yield put(setTasks(data.tasks || []));
    yield put(setTransactions(data.transactions || []));
    yield put(setLeads(data.leads || []));
    yield put(setEmployees(data.employees || []));
    yield put(setRoles(data.roleBlueprints || []));
    yield put(fetchStateSuccess(data));
  } catch (error: any) {
    yield put(fetchStateFailure(error.message));
  }
}

function* tickSaga() {
  try {
    const data: any = yield call(api.tick);
    yield put(setSubsidiaries(data.subsidiaries || []));
    yield put(setAgents(data.agents || []));
    yield put(setTasks(data.tasks || []));
    yield put(setTransactions(data.transactions || []));
    yield put(setLeads(data.leads || []));
    yield put(setEmployees(data.employees || []));
    yield put(setRoles(data.roleBlueprints || []));
    yield put(tickSuccess(data));
  } catch (error: any) {
    yield put(tickFailure(error.message));
  }
}

function* resetStateSaga() {
  try {
    yield call(api.resetState);
    yield put(resetStateSuccess());
    yield put(fetchStateRequest());
  } catch (error: any) {
    yield put(resetStateFailure(error.message));
  }
}

function* clearLogsSaga() {
  try {
    yield call(api.clearLogs);
    yield put(clearLogsSuccess());
    yield put(fetchStateRequest());
  } catch (error: any) {
    yield put(clearLogsFailure(error.message));
  }
}

function* parseCommandSaga(action: PayloadAction<{ command: string; onSuccess?: (res: any) => void }>) {
  try {
    const res: any = yield call(api.parseDirectorCommand, action.payload.command);
    yield put(parseCommandSuccess());
    yield put(fetchStateRequest());
    if (action.payload.onSuccess) {
      action.payload.onSuccess(res);
    }
  } catch (error: any) {
    yield put(parseCommandFailure(error.message));
  }
}

export default function* coreSaga() {
  yield takeLatest(fetchStateRequest.type, fetchStateSaga);
  yield takeLatest(resetStateRequest.type, resetStateSaga);
  yield takeLatest(clearLogsRequest.type, clearLogsSaga);
  yield takeLatest(parseCommandRequest.type, parseCommandSaga);
  yield takeLatest(tickRequest.type, tickSaga);
}
