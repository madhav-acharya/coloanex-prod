import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Loan } from '@/types';

interface LoansState {
  loans: Loan[];
  selectedLoan: Loan | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LoansState = {
  loans: [],
  selectedLoan: null,
  isLoading: false,
  error: null,
};

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoans: (state, action: PayloadAction<Loan[]>) => {
      state.loans = action.payload;
      state.isLoading = false;
    },
    setSelectedLoan: (state, action: PayloadAction<Loan | null>) => {
      state.selectedLoan = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setLoans, setSelectedLoan, setLoading, setError, clearError } = loansSlice.actions;
export default loansSlice.reducer;
