import { useNavigate } from 'react-router-dom';
import { useBranchId } from './useBranch';

// Hook to navigate to routes with branch ID
export const useBranchNavigate = () => {
  const navigate = useNavigate();
  const branchId = useBranchId();

  const navigateWithBranch = (path) => {
    if (branchId) {
      // Check if the path already has /branch/ in it
      if (path.includes('/branch/')) {
        navigate(path);
      } else {
        // Add branch ID to the path
        const pathParts = path.split('/');
        if (pathParts.length >= 2) {
          const basePath = pathParts[1]; // e.g., 'inventory', 'sales', etc.
          const remainingPath = pathParts.slice(2).join('/'); // everything after base path
          
          if (remainingPath) {
            navigate(`/${basePath}/${remainingPath}/branch/${branchId}`);
          } else {
            navigate(`/${basePath}/branch/${branchId}`);
          }
        } else {
          navigate(path);
        }
      }
    } else {
      navigate(path);
    }
  };

  return navigateWithBranch;
};

// Utility function to get branch ID from URL params or localStorage
export const getBranchId = (urlBranchId) => {
  // If branchId is in URL, use it
  if (urlBranchId) {
    return urlBranchId;
  }
  
  // Otherwise, get from localStorage
  const branchData = localStorage.getItem('selectedBranch');
  if (branchData) {
    const branch = JSON.parse(branchData);
    return branch.id;
  }
  
  return null;
};
