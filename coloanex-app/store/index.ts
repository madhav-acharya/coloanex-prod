import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import loansReducer from './slices/loansSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loans: loansReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
