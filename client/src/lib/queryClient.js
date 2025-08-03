import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0]);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${queryKey[0]}`);
        }
        return response.json();
      },
    },
  },
});

export async function apiRequest(method, url, data) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `${method} request failed`);
  }

  return response;
}