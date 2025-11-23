// Simple API client for Droppin backend using shop API key.
// Assumes prisma stores apiKey per shop (loader retrieves). Base URL configurable via env.
const DEFAULT_BASE = (typeof process !== 'undefined' && process.env.DROPPIN_API_URL) || null;

export function makeClient(apiKey, baseUrl = DEFAULT_BASE) {
  if (!apiKey) throw new Error('Droppin API key missing');
  if (!baseUrl) throw new Error('Droppin API base URL missing');
  const authHeader = { Authorization: `Bearer ${apiKey}` };

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
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
