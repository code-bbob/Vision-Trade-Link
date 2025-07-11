import { createSlice } from "@reduxjs/toolkit";

function isAccess(){
  if (localStorage.getItem('accessToken') != null){
    return true;
  }
  else {
    return false;
  }
}

function getSelectedBranch(){
  const branchData = localStorage.getItem('selectedBranch');
  return branchData ? JSON.parse(branchData) : null;
}

const initialState = {
  isAuthenticated: isAccess(),
  selectedBranch: getSelectedBranch(), // Store full branch object
  branchSelected: !!getSelectedBranch(),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state) {
      state.isAuthenticated = true;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.selectedBranch = null;
      state.branchSelected = false;
      localStorage.removeItem('selectedBranch');
    },
    setBranch(state, action) {
      state.selectedBranch = action.payload; // Store full branch object
      state.branchSelected = true;
      localStorage.setItem('selectedBranch', JSON.stringify(action.payload));
    },
    clearBranch(state) {
      state.selectedBranch = null;
      state.branchSelected = false;
      localStorage.removeItem('selectedBranch');
    },
  },
});

export const { login, logout, setBranch, clearBranch } = authSlice.actions;
export default authSlice.reducer;
