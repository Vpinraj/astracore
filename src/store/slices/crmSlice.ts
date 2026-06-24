import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Lead, Employee } from '../../types';

interface CrmState {
  leads: Lead[];
  employees: Employee[];
}

const initialState: CrmState = {
  leads: [],
  employees: [],
};

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setLeads: (state, action: PayloadAction<Lead[]>) => {
      state.leads = action.payload;
    },
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload;
    },
    createLeadRequest: (state, action: PayloadAction<any>) => {},
    createLeadSuccess: (state, action: PayloadAction<Lead>) => {},
    updateLeadStageRequest: (state, action: PayloadAction<any>) => {},
    updateLeadStageSuccess: (state) => {},
    deleteLeadRequest: (state, action: PayloadAction<string>) => {},
    deleteLeadSuccess: (state) => {},
    createEmployeeRequest: (state, action: PayloadAction<any>) => {},
    createEmployeeSuccess: (state, action: PayloadAction<Employee>) => {},
    deleteEmployeeRequest: (state, action: PayloadAction<string>) => {},
    deleteEmployeeSuccess: (state) => {},
  },
});

export const {
  setLeads,
  setEmployees,
  createLeadRequest,
  createLeadSuccess,
  updateLeadStageRequest,
  updateLeadStageSuccess,
  deleteLeadRequest,
  deleteLeadSuccess,
  createEmployeeRequest,
  createEmployeeSuccess,
  deleteEmployeeRequest,
  deleteEmployeeSuccess,
} = crmSlice.actions;

export default crmSlice.reducer;
