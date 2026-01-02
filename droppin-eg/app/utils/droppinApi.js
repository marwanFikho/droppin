// Simple API client for Droppin backend using only the shop API key.
// Base URL removed as requested; assumes a reverse proxy or Remix server route
// forwards requests under /droppin to the backend. Adjust BASE_PATH if needed.

export function makeClient(apiKey, apiBaseUrl = 'https://api.droppin-eg.com') {
  if (!apiKey) throw new Error('Droppin API key missing');
  const authHeader = { Authorization: `Bearer ${apiKey}` };
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
    }
    // Some endpoints may return empty; try to parse JSON safely
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return null;
  }

  return {
    listPackages: async (params = {}) => {
      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') usp.append(k, v); });
      return request(`/packages?${usp.toString()}`);
    },
    getPackage: async (id) => request(`/packages/${id}`),
    updatePackage: async (id, body) => request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: async (id, statusPayload) => request(`/packages/${id}/status`, { method: 'PATCH', body: JSON.stringify(statusPayload) }),
    cancelPackage: async (id) => request(`/packages/${id}/cancel`, { method: 'PATCH' }),
    addNote: async (id, note) => request(`/packages/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ note }) }),
    requestReturn: async (id) => request(`/packages/${id}/request-return`, { method: 'POST' }),
    requestExchange: async (id) => request(`/packages/${id}/request-exchange`, { method: 'POST' }),
    // Items
    listItems: async (packageId) => request(`/items/package/${packageId}`),
    createItem: async (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
    updateItem: async (id, payload) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteItem: async (id) => request(`/items/${id}`, { method: 'DELETE' }),
  };
}
