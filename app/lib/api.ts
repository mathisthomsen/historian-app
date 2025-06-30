// Client-side API utility for making authenticated requests

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include', // This ensures cookies are sent with the request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh the token
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (refreshResponse.ok) {
          // Get the new access token from the response (if provided)
          const refreshData = await refreshResponse.json();
          if (refreshData && refreshData.accessToken && typeof window !== 'undefined') {
            document.cookie = `accessToken=${refreshData.accessToken}; path=/;`;
          }
          // Retry the original request with the new token
          const retryResponse = await fetch(url, defaultOptions);
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Redirect to login if unauthorized
      window.location.href = '/auth/login';
      return;
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Clear any client-side stored tokens
    if (typeof window !== 'undefined') {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    // Redirect to login page
    window.location.href = '/auth/login';
  } catch (error) {
    console.error('Logout failed:', error);
    // Still redirect to login even if logout request fails
    window.location.href = '/auth/login';
  }
};

// Helper functions for common API operations
export const api = {
  get: (url: string) => apiFetch(url),
  post: (url: string, data?: any) => apiFetch(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: (url: string, data?: any) => apiFetch(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (url: string, data?: any) => apiFetch(url, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  }),
}; 