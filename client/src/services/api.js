const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('notes_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth
export const auth = {
  signup: (name, email, password) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
};

// Notes
export const notes = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notes${query ? `?${query}` : ''}`);
  },
  get: (id) => request(`/notes/${id}`),
  create: (data) =>
    request('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) =>
    request(`/notes/${id}`, { method: 'DELETE' }),
  archive: (id) =>
    request(`/notes/${id}/archive`, { method: 'PATCH' }),
  share: (id) =>
    request(`/notes/${id}/share`, { method: 'POST' }),
  generateSummary: (id) =>
    request(`/notes/${id}/generate-summary`, { method: 'POST' }),
};

// Tags
export const tags = {
  list: () => request('/tags'),
  create: (name, color) =>
    request('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
  delete: (id) =>
    request(`/tags/${id}`, { method: 'DELETE' }),
};

// Shared
export const shared = {
  get: (shareId) => request(`/shared/${shareId}`),
};

// Insights
export const insights = {
  get: () => request('/insights'),
};
