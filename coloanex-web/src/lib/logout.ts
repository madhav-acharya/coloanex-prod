import { logout as logoutAction } from "@/store/slices/authSlice";

export const handleLogout = async (
  logoutMutation: any,
  dispatch: any,
  navigate: any
) => {
  try {
    await logoutMutation().unwrap();
  } catch (error) {
  } finally {
    dispatch(logoutAction());
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }
};
