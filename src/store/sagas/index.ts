import { all } from 'redux-saga/effects';
import coreSaga from './coreSaga';
import subsidiarySaga from './subsidiarySaga';
import agentSaga from './agentSaga';
import taskSaga from './taskSaga';
import financeSaga from './financeSaga';
import crmSaga from './crmSaga';

export default function* rootSaga() {
  yield all([
    coreSaga(),
    subsidiarySaga(),
    agentSaga(),
    taskSaga(),
    financeSaga(),
    crmSaga(),
  ]);
}
