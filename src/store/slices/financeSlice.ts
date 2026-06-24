import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types';

interface FinanceState {
  transactions: Transaction[];
}

const initialState: FinanceState = {
  transactions: [],
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    createTransactionRequest: (state, action: PayloadAction<any>) => {},
    createTransactionSuccess: (state, action: PayloadAction<Transaction>) => {},
  },
});

export const { setTransactions, createTransactionRequest, createTransactionSuccess } = financeSlice.actions;
export default financeSlice.reducer;
