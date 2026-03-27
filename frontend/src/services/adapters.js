// ─── Field-name adapters: API response → frontend shape ───────────────────────
// The backend uses snake_case and different field names from the frontend mock data.
// These functions bridge the gap so existing components keep working.

const LOAD_TYPE_LABEL = {
  dry_van: 'Dry Van',
  reefer:  'Reefer',
  flatbed: 'Flatbed',
};

const PAY_SPEED_LABEL = {
  quick_pay: 'Quick-Pay',
  net_14:    'Net-14',
  net_21:    'Net-21',
  net_30:    'Net-30',
  net_45:    'Net-45',
  net_60:    'Net-60',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function adaptBroker(b) {
  if (!b) return null;
  return {
    id:              String(b.id),
    user_id:         b.user_id ? String(b.user_id) : null,
    name:            b.name,
    rating:          b.avg_rating,
    reviews:         b.reviews_count,
    paySpeed:        PAY_SPEED_LABEL[b.pay_speed] || b.pay_speed || 'Net-30',
    badge:           b.badge || null,
    warns:           b.warning_count || 0,
    avgRate:         b.avg_rate_per_mile || 0,
    paySpeedVerified: b.pay_speed_verified || false,
    avgPaymentDays:  b.avg_payment_days || null,
    mc:              b.mc_number || null,
    phone:           b.phone    || null,
    logo:            b.logo || null,
  };
}

export function adaptLoad(l) {
  if (!l) return null;
  return {
    id:           String(l.id),
    broker:       adaptBroker(l.broker),
    type:         LOAD_TYPE_LABEL[l.load_type] || l.load_type,
    weight:       l.weight_lbs ? `${Number(l.weight_lbs).toLocaleString()} lbs` : null,
    origin:       l.origin,
    dest:         l.destination,
    miles:        l.miles,
    deadhead:     l.deadhead_miles || 0,
    rate:         l.rate,
    ratePerMile:  l.rate_per_mile  || 0,
    fuel:         l.fuel_cost_est  || 0,
    dieselPrice:  l.diesel_price_used || null,
    netProfit:    l.net_profit_est || 0,
    profitScore:  l.profit_score   || 'yellow',
    commodity:    l.commodity      || '',
    dims:         l.dimensions     || '48x102',
    pickup:       l.pickup_date    || l.pickup,
    delivery:     l.delivery_date  || l.delivery,
    hot:          l.is_hot         || false,
    saved:        l.is_saved       || false,
    posted:       timeAgo(l.posted_at),
    status:       l.status         || 'available',
    instantBook:  l.instant_book   || false,
    bookNow:      l.book_now !== false,
    notes:        l.notes          || '',
    viewCount:    l.view_count     || 0,
    pickupAddress:   l.pickup_address   || null,
    deliveryAddress: l.delivery_address || null,
    pickupLat:       l.pickup_lat       ?? null,
    pickupLng:       l.pickup_lng       ?? null,
    deliveryLat:     l.delivery_lat     ?? null,
    deliveryLng:     l.delivery_lng     ?? null,
    _raw:            l, // keep original for when we need the UUID
  };
}

export function adaptLoadList(resp) {
  // resp can be { loads: [], total, page, ... } or a plain array
  if (Array.isArray(resp)) return resp.map(adaptLoad);
  return (resp.loads || []).map(adaptLoad);
}

export function adaptHistory(h) {
  return {
    id:       String(h.id),
    date:     h.pickup_date  || (h.accepted_at ? h.accepted_at.split('T')[0] : ''),
    origin:   h.origin,
    dest:     h.destination,
    rate:     h.gross_revenue,
    net:      h.net_profit,
    miles:    h.miles,
    broker:   h.broker_name  || '',
    score:    h.net_profit > 1000 ? 'green' : h.net_profit > 0 ? 'yellow' : 'red',
  };
}

export function adaptReview(r) {
  return {
    id:            String(r.id),
    brokerId:      r.broker_id ? String(r.broker_id) : null,
    carrierId:     r.carrier_id ? String(r.carrier_id) : null,
    carrierName:   r.carrier_name  || (r.is_anonymous ? 'Anonymous Driver' : 'Driver'),
    brokerName:    r.broker_name   || (r.is_anonymous ? 'Anonymous Broker' : 'Broker'),
    rating:        r.rating,
    communication: r.communication || null,
    accuracy:      r.accuracy      || null,
    paymentDays:   r.payment_days  || null,
    wouldWorkAgain: r.would_work_again ?? null,
    comment:       r.comment       || '',
    isAnonymous:   r.is_anonymous  || false,
    createdAt:     r.created_at,
  };
}
