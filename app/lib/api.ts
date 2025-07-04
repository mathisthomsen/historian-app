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
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
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