// Helper functions for API calls

/**
 * Fetch data from the API with proper credentials
 * @param {string} url - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Resolved with the JSON response
 */
export async function fetchApi(url, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const defaultOptions = {
    credentials: 'include', // This ensures cookies are sent with requests
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...defaultOptions,
    ...options,
  });
  
  if (!response.ok) {
    const error = new Error(`Error: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  
  return response.json();
}

/**
 * Get tasks from the API
 * @returns {Promise} - Resolved with tasks
 */
export async function getTasks() {
  return fetchApi('/api/tasks');
}

// Add other API functions as needed
