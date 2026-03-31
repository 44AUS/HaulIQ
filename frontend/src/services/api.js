const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem('urload_token');
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

  if (res.status === 204) return null;
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup:   (data) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login:    (data) => request('/api/auth/login',  { method: 'POST', body: JSON.stringify(data) }),
  me:       ()     => request('/api/auth/me'),
  update:   (data) => request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  verifyMc: (mc)   => request(`/api/auth/verify-mc/${encodeURIComponent(mc)}`),
};

// ─── Loads ─────────────────────────────────────────────────────────────────────
export const loadsApi = {
  list:       (params = {}) => request('/api/loads?' + new URLSearchParams(params)),
  get:        (id)          => request(`/api/loads/${id}`),
  post:       (data)        => request('/api/loads', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id, data)    => request(`/api/loads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete:     (id)          => request(`/api/loads/${id}`, { method: 'DELETE' }),
  toggleSave: (id)          => request(`/api/loads/${id}/save`, { method: 'POST' }),
  savedList:  ()            => request('/api/loads/saved/me'),
  posted:     ()            => request('/api/loads/posted'),
};

// ─── Brokers ───────────────────────────────────────────────────────────────────
export const brokersApi = {
  list:       ()         => request('/api/brokers'),
  get:        (id)       => request(`/api/brokers/${id}`),
  canReview:  (id)       => request(`/api/brokers/${id}/can-review`),
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
  typing:         (id)                        => request(`/api/messages/conversations/${id}/typing`, { method: 'POST' }),
  typingStatus:   (id)                        => request(`/api/messages/conversations/${id}/typing`),
  presence:       ()                          => request('/api/messages/presence', { method: 'POST' }),
};

// ─── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place:    (data)   => request('/api/bids/', { method: 'POST', body: JSON.stringify(data) }),
  accept:   (id)     => request(`/api/bids/${id}/accept`, { method: 'PATCH' }),
  reject:   (id)     => request(`/api/bids/${id}/reject`, { method: 'PATCH' }),
  counter:  (id, data) => request(`/api/bids/${id}/counter`, { method: 'PATCH', body: JSON.stringify(data) }),
  withdraw: (id)     => request(`/api/bids/${id}`, { method: 'DELETE' }),
  my:       ()       => request('/api/bids/my'),
  myLoads:  ()       => request('/api/bids/my-loads'),
  forLoad:  (loadId) => request(`/api/bids/load/${loadId}`),
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsApi = {
  request:       (data)     => request('/api/bookings/', { method: 'POST', body: JSON.stringify(data) }),
  get:           (id)       => request(`/api/bookings/${id}`),
  pickup:        (id)       => request(`/api/bookings/${id}/pickup`, { method: 'PATCH' }),
  deliver:       (id)       => request(`/api/bookings/${id}/deliver`, { method: 'PATCH' }),
  review:        (id, data) => request(`/api/bookings/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
  my:            ()         => request('/api/bookings/my'),
  pending:       ()         => request('/api/bookings/pending'),
  inProgress:    ()         => request('/api/bookings/in-progress'),
  brokerActive:  ()         => request('/api/bookings/broker-active'),
  forLoad:       (loadId)   => request(`/api/bookings/load/${loadId}`),
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
  post:      (data)     => request('/api/carrier-reviews/', { method: 'POST', body: JSON.stringify(data) }),
  get:       (carrierId) => request(`/api/carrier-reviews/carrier/${carrierId}`),
  stats:     (carrierId) => request(`/api/carrier-reviews/carrier/${carrierId}/stats`),
  canReview: (carrierId) => request(`/api/carrier-reviews/carrier/${carrierId}/can-review`),
};

// ─── Instant Book ─────────────────────────────────────────────────────────────
export const instantBookApi = {
  allowlist:     ()         => request('/api/instant-book/allowlist'),
  add:           (carrierId) => request('/api/instant-book/allowlist', { method: 'POST', body: JSON.stringify({ carrier_id: carrierId }) }),
  remove:        (entryId)  => request(`/api/instant-book/allowlist/${entryId}`, { method: 'DELETE' }),
  bulkUpload:    (rows)     => request('/api/instant-book/allowlist/upload', { method: 'POST', body: JSON.stringify({ rows }) }),
  searchCarriers:(q)        => request(`/api/instant-book/carriers/search?q=${encodeURIComponent(q)}`),
  check:         (loadId)   => request(`/api/instant-book/check/${loadId}`),
};

// ─── Network ──────────────────────────────────────────────────────────────────
export const networkApi = {
  list:        ()                => request('/api/network/'),
  add:         (otherUserId)     => request('/api/network/', { method: 'POST', body: JSON.stringify({ other_user_id: otherUserId }) }),
  remove:      (id)              => request(`/api/network/${id}`, { method: 'DELETE' }),
  check:       (userId)          => request(`/api/network/check/${userId}`),
  requests:    ()                => request('/api/network/requests'),
  respond:     (id, accepted)    => request(`/api/network/${id}/respond`, { method: 'PATCH', body: JSON.stringify({ accepted }) }),
  search:      (q, state)        => request(`/api/network/search?q=${encodeURIComponent(q || '')}${state ? `&state=${encodeURIComponent(state)}` : ''}`),
  suggestions: ()                => request('/api/network/suggestions'),
};

export const waitlistApi = {
  join:     (data) => request('/api/waitlist/', { method: 'POST', body: JSON.stringify(data) }),
  list:     ()     => request('/api/waitlist/'),
  activate: (id)   => request(`/api/waitlist/${id}/activate`, { method: 'POST' }),
  remove:   (id)   => request(`/api/waitlist/${id}`, { method: 'DELETE' }),
};

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  request: (bookingId)       => request(`/api/locations/request/${bookingId}`, { method: 'POST' }),
  share:   (bookingId, data) => request(`/api/locations/share/${bookingId}`,   { method: 'POST', body: JSON.stringify(data) }),
  get:     (bookingId)       => request(`/api/locations/${bookingId}`),
};

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  list:     (loadId)           => request(`/api/loads/${loadId}/documents`),
  upload:   (loadId, data)     => request(`/api/loads/${loadId}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  delete:   (loadId, docId)    => request(`/api/loads/${loadId}/documents/${docId}`, { method: 'DELETE' }),
  messages: (loadId)           => request(`/api/loads/${loadId}/messages`),
  mine:     ()                 => request('/api/documents/my'),
};

// ─── Blocks ───────────────────────────────────────────────────────────────────
export const blocksApi = {
  block:   (userId) => request(`/api/blocks/${userId}`, { method: 'POST' }),
  unblock: (userId) => request(`/api/blocks/${userId}`, { method: 'DELETE' }),
  check:   (userId) => request(`/api/blocks/check/${userId}`),
};

// ─── Freight Payments ──────────────────────────────────────────────────────────
export const freightPaymentsApi = {
  onboard:       ()            => request('/api/freight-payments/onboard', { method: 'POST' }),
  onboardStatus: ()            => request('/api/freight-payments/onboard/status'),
  charge:        (bookingId)   => request(`/api/freight-payments/charge/${bookingId}`, { method: 'POST' }),
  release:       (bookingId)   => request(`/api/freight-payments/release/${bookingId}`, { method: 'POST' }),
  status:        (bookingId)   => request(`/api/freight-payments/${bookingId}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:      ()              => request('/api/admin/stats'),
  users:      (params = {})  => request('/api/admin/users?' + new URLSearchParams(params)),
  suspend:    (id)            => request(`/api/admin/users/${id}/suspend`, { method: 'PATCH' }),
  activate:   (id)            => request(`/api/admin/users/${id}/activate`, { method: 'PATCH' }),
  setPlan:    (id, plan)      => request(`/api/admin/users/${id}/plan?plan=${plan}`, { method: 'PATCH' }),
  loads:      (params = {})  => request('/api/admin/loads?' + new URLSearchParams(params)),
  removeLoad: (id)            => request(`/api/admin/loads/${id}`, { method: 'DELETE' }),
  revenue:    ()              => request('/api/admin/revenue'),
  plans:      ()              => request('/api/admin/plans'),
  updatePlan: (id, params)    => request(`/api/admin/plans/${id}?${new URLSearchParams(params)}`, { method: 'PATCH' }),
};

const api = { authApi, loadsApi, brokersApi, messagesApi, bidsApi, bookingsApi, analyticsApi, subscriptionsApi, carrierReviewsApi, instantBookApi, networkApi, waitlistApi, locationsApi, blocksApi, adminApi, freightPaymentsApi };
export default api;
