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
  const data = await response.json();
  
  if (!response.ok) {
    // Return the error response instead of throwing
    return { error: data.error || `API request failed: ${response.status} ${response.statusText}`, status: response.status };
  }
  
  return data;
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