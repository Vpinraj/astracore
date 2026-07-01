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
    updateSubsidiaryRequest: (state, action: PayloadAction<{ id: string; data: any }>) => {},
    updateSubsidiarySuccess: (state, action: PayloadAction<Subsidiary>) => {
      const index = state.items.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const {
  setSubsidiaries,
  createSubsidiaryRequest,
  createSubsidiarySuccess,
  allocateFundsRequest,
  allocateFundsSuccess,
  updateSubsidiaryRequest,
  updateSubsidiarySuccess,
} = subsidiarySlice.actions;

export default subsidiarySlice.reducer;
