import { useSelector } from 'react-redux';

// Hook to get the current selected branch object
export const useSelectedBranch = () => {
  const { selectedBranch } = useSelector((state) => state.root);
  return selectedBranch;
};

// Hook to get the current selected branch ID
export const useBranchId = () => {
  const { selectedBranch } = useSelector((state) => state.root);
  return selectedBranch?.id;
};

// Hook to check if a branch is selected
export const useBranchSelected = () => {
  const { branchSelected } = useSelector((state) => state.root);
  return branchSelected;
};
