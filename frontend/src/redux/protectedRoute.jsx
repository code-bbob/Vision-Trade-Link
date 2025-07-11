import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import BranchSelection from "../pages/branchSelection";

const ProtectedRoute = ({
  isAuthenticated,
  branchSelected,
  children,
  redirect = "/login",
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirect} />;
  }

  // If authenticated but no branch selected, show branch selection
  if (!branchSelected) {
    return <BranchSelection />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;