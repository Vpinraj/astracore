import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import coreReducer from './slices/coreSlice';
import subsidiaryReducer from './slices/subsidiarySlice';
import agentReducer from './slices/agentSlice';
import taskReducer from './slices/taskSlice';
import financeReducer from './slices/financeSlice';
import crmReducer from './slices/crmSlice';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    core: coreReducer,
    subsidiaries: subsidiaryReducer,
    agents: agentReducer,
    tasks: taskReducer,
    finance: financeReducer,
    crm: crmReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
