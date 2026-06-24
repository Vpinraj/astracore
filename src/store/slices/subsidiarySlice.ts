import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subsidiary } from '../../types';

interface SubsidiaryState {
  items: Subsidiary[];
}

const initialState: SubsidiaryState = {
  items: [],
};

const subsidiarySlice = createSlice({
  name: 'subsidiary',
  initialState,
  reducers: {
    setSubsidiaries: (state, action: PayloadAction<Subsidiary[]>) => {
      state.items = action.payload;
    },
    createSubsidiaryRequest: (state, action: PayloadAction<any>) => {},
    createSubsidiarySuccess: (state, action: PayloadAction<Subsidiary>) => {
      // API typically updates state. The fetchStateSuccess will pull all data down.
      // Or we can proactively add it here.
    },
    allocateFundsRequest: (state, action: PayloadAction<{ subsidiaryId: string; amount: number }>) => {},
    allocateFundsSuccess: (state) => {},
  },
});

export const {
  setSubsidiaries,
  createSubsidiaryRequest,
  createSubsidiarySuccess,
  allocateFundsRequest,
  allocateFundsSuccess,
} = subsidiarySlice.actions;

export default subsidiarySlice.reducer;
