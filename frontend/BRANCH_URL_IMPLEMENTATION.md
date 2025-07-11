# Branch Selection Implementation - URL with Branch ID

## Overview
This implementation keeps the branch ID in the URL for better navigation while fetching branches only once on login and storing the selected branch ID in localStorage for performance.

## How It Works

### 1. **Branch Selection on Login**
- User logs in and sees branch selection page
- Branches are fetched **once** from API
- Selected branch ID is stored in localStorage
- No need to fetch branches again

### 2. **URL Structure**
- URLs include branch ID: `/inventory/branch/1`, `/sales/branch/1`, etc.
- This allows for:
  - Better bookmarking
  - Direct navigation to specific branches
  - Browser back/forward navigation
  - Shareable URLs

### 3. **Smart Branch ID Resolution**
- Pages check URL params first: `const { branchId: urlBranchId } = useParams()`
- If no URL branch ID, fallback to localStorage: `getBranchId(urlBranchId)`
- This ensures consistent behavior whether user navigates directly or through sidebar

### 4. **Navigation System**
- `useBranchNavigate()` hook automatically adds branch ID to URLs
- When user clicks "Inventory" in sidebar, it navigates to `/inventory/branch/1`
- Forms and edit pages maintain branch context in URL

## Key Components

### Redux Store (`src/redux/accessSlice.jsx`)
```javascript
const initialState = {
  isAuthenticated: isAccess(),
  selectedBranchId: getSelectedBranch(), // Just the ID
  branchSelected: !!getSelectedBranch(),
};
```

### Branch Navigation Hook (`src/hooks/useBranchNavigate.js`)
```javascript
const useBranchNavigate = () => {
  // Automatically adds branch ID to navigation paths
  const navigateWithBranch = (path) => {
    // /inventory -> /inventory/branch/1
  };
};
```

### Branch ID Resolution (`src/hooks/useBranchNavigate.js`)
```javascript
const getBranchId = (urlBranchId) => {
  // URL first, then localStorage
  return urlBranchId || localStorage.getItem('selectedBranchId');
};
```

## Updated Components

### Pages Updated
- ✅ `AllInventoryPageComponent` - Uses URL + localStorage branch ID
- ✅ `AllPurchaseTransactions` - Uses URL + localStorage branch ID  
- ✅ Sidebar now navigates with branch ID in URL

### Example Usage in Components
```javascript
export function AllInventoryPageComponent() {
  const { branchId: urlBranchId } = useParams();
  const branchId = getBranchId(urlBranchId); // Smart resolution
  const branchNavigate = useBranchNavigate();
  
  // Navigate with branch ID automatically added
  const handleClick = () => {
    branchNavigate('/inventory/brand/123'); // -> /inventory/branch/1/brand/123
  };
}
```

## Benefits

1. **Performance**: Branches fetched only once on login
2. **URLs**: Clean, bookmarkable URLs with branch context
3. **Navigation**: Consistent navigation with branch ID
4. **Fallback**: Works whether user navigates directly or through app
5. **Caching**: Branch ID persists in localStorage

## Testing

1. Login to see branch selection
2. Select a branch (ID stored in localStorage)
3. Click "Inventory" in sidebar
4. Should navigate to `/inventory/branch/1` (where 1 is your branch ID)
5. URL shows branch ID, but no extra API calls needed

This approach gives you the best of both worlds: fast navigation with branch context preserved in URLs!
