const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('hauliq_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login:  (data) => request('/api/auth/login',  { method: 'POST', body: JSON.stringify(data) }),
  me:     ()     => request('/api/auth/me'),
  update: (data) => request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Loads ─────────────────────────────────────────────────────────────────────
export const loadsApi = {
  list:       (params = {}) => request('/api/loads?' + new URLSearchParams(params)),
  get:        (id)          => request(`/api/loads/${id}`),
  post:       (data)        => request('/api/loads', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id, data)    => request(`/api/loads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete:     (id)          => request(`/api/loads/${id}`, { method: 'DELETE' }),
  save:       (id)          => request(`/api/loads/${id}/save`, { method: 'POST' }),
  unsave:     (id)          => request(`/api/loads/${id}/save`, { method: 'DELETE' }),
  savedList:  ()            => request('/api/loads/saved'),
  history:    ()            => request('/api/loads/history'),
};

// ─── Brokers ───────────────────────────────────────────────────────────────────
export const brokersApi = {
  list:       ()         => request('/api/brokers'),
  get:        (id)       => request(`/api/brokers/${id}`),
  review:     (id, data) => request(`/api/brokers/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  reviews:    (id)       => request(`/api/brokers/${id}/reviews`),
};

// ─── Messages ──────────────────────────────────────────────────────────────────
export const messagesApi = {
  conversations: ()              => request('/api/messages/conversations'),
  messages:      (convId)        => request(`/api/messages/conversations/${convId}`),
  send:          (convId, body)  => request(`/api/messages/conversations/${convId}`, { method: 'POST', body: JSON.stringify({ body }) }),
  start:         (loadId)        => request('/api/messages/conversations', { method: 'POST', body: JSON.stringify({ load_id: loadId }) }),
};

// ─── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place:   (data)            => request('/api/bids', { method: 'POST', body: JSON.stringify(data) }),
  respond: (id, data)        => request(`/api/bids/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  myBids:  ()                => request('/api/bids/my'),
  loadBids: (loadId)         => request(`/api/bids/load/${loadId}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  request:  (data)    => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  review:   (id, data)=> request(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  my:       ()        => request('/api/bookings/my'),
  incoming: ()        => request('/api/bookings/incoming'),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  carrier: () => request('/api/analytics/carrier'),
  broker:  () => request('/api/analytics/broker'),
};

// ─── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionsApi = {
  get:    () => request('/api/subscriptions/me'),
  cancel: () => request('/api/subscriptions/me', { method: 'DELETE' }),
};

// ─── Carrier reviews ──────────────────────────────────────────────────────────
export const carrierReviewsApi = {
  post:  (data) => request('/api/carrier-reviews', { method: 'POST', body: JSON.stringify(data) }),
  get:   (carrierId) => request(`/api/carrier-reviews/carrier/${carrierId}`),
  stats: (carrierId) => request(`/api/carrier-reviews/carrier/${carrierId}/stats`),
};

const api = { authApi, loadsApi, brokersApi, messagesApi, bidsApi, bookingsApi, analyticsApi, subscriptionsApi, carrierReviewsApi };
export default api;
