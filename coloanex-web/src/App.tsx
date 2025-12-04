import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { RootState, AppDispatch } from "./store";
import { updateUserActivity } from "./store/slices/authSlice";

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        dispatch(updateUserActivity());
      }, 60000);

      const handleBeforeUnload = () => {
        if (isAuthenticated) {
          navigator.sendBeacon("/api/users/mark-offline");
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && isAuthenticated) {
          dispatch(updateUserActivity());
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
