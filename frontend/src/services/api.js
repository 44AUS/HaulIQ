const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('hauliq_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail)
      ? body.detail.map(e => e.msg || String(e)).join(', ')
      : body.detail;
    throw new Error(detail || `Request failed (${res.status})`);
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
  delete:     (id)          => request(`/api/loads/${id}`, { method: 'DELETE' }),
  toggleSave: (id)          => request(`/api/loads/${id}/save`, { method: 'POST' }),
  savedList:  ()            => request('/api/loads/saved/me'),
  posted:     ()            => request('/api/loads/posted'),
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
  conversations:  ()                          => request('/api/messages/conversations'),
  conversation:   (id)                        => request(`/api/messages/conversations/${id}`),
  send:           (loadId, brokerId, body)    => request('/api/messages/send', { method: 'POST', body: JSON.stringify({ load_id: loadId || undefined, broker_id: brokerId, body }) }),
  direct:         (otherUserId, body = null)  => request('/api/messages/direct', { method: 'POST', body: JSON.stringify({ other_user_id: otherUserId, body }) }),
  deleteConvo:    (id)                        => request(`/api/messages/conversations/${id}`, { method: 'DELETE' }),
  unreadCount:    ()                          => request('/api/messages/unread-count'),
};

// ─── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place:    (data)   => request('/api/bids/', { method: 'POST', body: JSON.stringify(data) }),
  accept:   (id)     => request(`/api/bids/${id}/accept`, { method: 'PATCH' }),
  reject:   (id)     => request(`/api/bids/${id}/reject`, { method: 'PATCH' }),
  counter:  (id, data) => request(`/api/bids/${id}/counter`, { method: 'PATCH', body: JSON.stringify(data) }),
  withdraw: (id)     => request(`/api/bids/${id}`, { method: 'DELETE' }),
  my:       ()       => request('/api/bids/my'),
  forLoad:  (loadId) => request(`/api/bids/load/${loadId}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  request:       (data)     => request('/api/bookings/', { method: 'POST', body: JSON.stringify(data) }),
  review:        (id, data) => request(`/api/bookings/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
  my:            ()         => request('/api/bookings/my'),
  pending:       ()         => request('/api/bookings/pending'),
  inProgress:    ()         => request('/api/bookings/in-progress'),
  brokerActive:  ()         => request('/api/bookings/broker-active'),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  history:  () => request('/api/analytics/history'),
  summary:  () => request('/api/analytics/summary'),
  insights: () => request('/api/analytics/insights'),
  lanes:    () => request('/api/analytics/lanes'),
  markRead: (id) => request(`/api/analytics/insights/${id}/read`, { method: 'PATCH' }),
  refresh:  () => request('/api/analytics/insights/refresh', { method: 'POST' }),
  broker:   () => request('/api/analytics/broker'),
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

// ─── Instant Book ─────────────────────────────────────────────────────────────
export const instantBookApi = {
  allowlist:     ()         => request('/api/instant-book/allowlist'),
  add:           (carrierId) => request('/api/instant-book/allowlist', { method: 'POST', body: JSON.stringify({ carrier_id: carrierId }) }),
  remove:        (entryId)  => request(`/api/instant-book/allowlist/${entryId}`, { method: 'DELETE' }),
  bulkUpload:    (rows)     => request('/api/instant-book/allowlist/upload', { method: 'POST', body: JSON.stringify({ rows }) }),
  searchCarriers:(q)        => request(`/api/instant-book/carriers/search?q=${encodeURIComponent(q)}`),
};

// ─── Network ──────────────────────────────────────────────────────────────────
export const networkApi = {
  list:     ()                  => request('/api/network/'),
  add:      (carrierId)         => request('/api/network/', { method: 'POST', body: JSON.stringify({ carrier_id: carrierId }) }),
  remove:   (id)                => request(`/api/network/${id}`, { method: 'DELETE' }),
  check:    (carrierId)         => request(`/api/network/check/${carrierId}`),
  requests: ()                  => request('/api/network/requests'),
  respond:  (id, accepted)      => request(`/api/network/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ accepted }) }),
};

const api = { authApi, loadsApi, brokersApi, messagesApi, bidsApi, bookingsApi, analyticsApi, subscriptionsApi, carrierReviewsApi, instantBookApi, networkApi };
export default api;
