import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import loansReducer from "./slices/loansSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loans: loansReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
