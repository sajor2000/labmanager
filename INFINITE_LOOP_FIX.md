# GlobalSearch Infinite Loop Fix

## Problem
The GlobalSearch component was causing a "Maximum update depth exceeded" error due to an infinite render loop.

## Root Cause
The `performSearch` function was being recreated on every render because it depended on:
- `config` (created with useMemo)
- `currentLab` (from context)
- `onSearch` (prop)

When any of these changed, `performSearch` was recreated, which triggered the `useEffect` that depends on it, causing another search, which could update state and trigger another render, creating an infinite loop.

## Solution Implemented

### 1. Created Stable References with useRef
```typescript
// Store refs to prevent recreating dependencies
const configRef = useRef(config);
const currentLabRef = useRef(currentLab);
const onSearchRef = useRef(onSearch);

// Update refs when props change
useEffect(() => {
  configRef.current = config;
}, [config]);

useEffect(() => {
  currentLabRef.current = currentLab;
}, [currentLab]);

useEffect(() => {
  onSearchRef.current = onSearch;
}, [onSearch]);
```

### 2. Made performSearch Stable
```typescript
const performSearch = useCallback(async (searchQuery: string) => {
  // Use refs instead of direct dependencies
  const currentConfig = configRef.current;
  const currentLabValue = currentLabRef.current;
  const onSearchCallback = onSearchRef.current;
  
  // ... rest of search logic
}, []); // Empty dependency array - function is now stable
```

### 3. Simplified the Search Effect
```typescript
// Effect to perform search when debounced query changes
useEffect(() => {
  // Always perform search when debounced query changes
  // This handles both searching and clearing
  performSearch(debouncedQuery);
}, [debouncedQuery, performSearch]); // Only respond to query changes
```

## Benefits
- ✅ No more infinite loops
- ✅ Stable function references prevent unnecessary re-renders
- ✅ Search still works correctly with debouncing
- ✅ Props and context changes are still properly handled via refs

## Testing
- The app now loads without console errors
- Global search functionality works as expected
- No performance issues or infinite loops
- API endpoint `/api/search` responds correctly

## Files Modified
- `/components/layout/global-search.tsx` - Fixed the infinite loop issue