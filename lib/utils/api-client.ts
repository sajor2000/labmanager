// API client with automatic user context headers

export async function apiClient(url: string, options: RequestInit = {}) {
  // Get selected user ID from localStorage
  const getSelectedUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('labmanage_selected_user');
      if (stored) {
        const user = JSON.parse(stored);
        return user.id;
      }
    } catch (error) {
      console.error('Error reading stored user:', error);
    }
    
    return null;
  };

  const selectedUserId = getSelectedUserId();
  
  // Add user context headers
  const headers = new Headers(options.headers);
  if (selectedUserId) {
    headers.set('x-selected-user-id', selectedUserId);
  }

  // Add default content type for JSON requests
  if (options.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper for common API calls
export const api = {
  get: (url: string, options?: RequestInit) => 
    apiClient(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options?: RequestInit) =>
    apiClient(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (url: string, data?: any, options?: RequestInit) =>
    apiClient(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (url: string, options?: RequestInit) =>
    apiClient(url, { ...options, method: 'DELETE' }),
};