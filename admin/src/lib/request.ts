import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig() || {};

export const API_ENDPOINT = publicRuntimeConfig?.API_ENDPOINT || 'http://localhost:5001';

export async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ENDPOINT}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  return response.json();
}
