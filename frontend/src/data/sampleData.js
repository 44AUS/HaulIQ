// ─── BROKERS ────────────────────────────────────────────────────────────────
export const BROKERS = [
  { id: 'b1',  name: 'FastFreight Brokerage', rating: 4.7, reviews: 58,  paySpeed: 'Net-21',    badge: 'trusted',  warns: 0, avgRate: 3.10, logo: null },
  { id: 'br1', name: 'Echo Global Logistics', rating: 4.8, reviews: 312, paySpeed: 'Net-21',    badge: 'trusted',  warns: 0, avgRate: 3.20, logo: null },
  { id: 'br2', name: 'Coyote Logistics',      rating: 4.5, reviews: 891, paySpeed: 'Net-30',    badge: 'verified', warns: 0, avgRate: 2.95, logo: null },
  { id: 'br3', name: 'XPO Logistics',         rating: 4.6, reviews: 540, paySpeed: 'Net-14',    badge: 'trusted',  warns: 0, avgRate: 3.10, logo: null },
  { id: 'br4', name: 'MoLo Solutions',        rating: 4.9, reviews: 178, paySpeed: 'Quick-Pay', badge: 'elite',    warns: 0, avgRate: 3.40, logo: null },
  { id: 'br5', name: 'Freight Broker LLC',    rating: 2.1, reviews: 44,  paySpeed: 'Net-45',    badge: 'warning',  warns: 3, avgRate: 2.10, logo: null },
  { id: 'br6', name: 'BlueSky Transport',     rating: 3.2, reviews: 89,  paySpeed: 'Net-30',    badge: null,       warns: 1, avgRate: 2.60, logo: null },
  { id: 'br7', name: 'Arrive Logistics',      rating: 4.7, reviews: 423, paySpeed: 'Net-21',    badge: 'verified', warns: 0, avgRate: 3.15, logo: null },
  { id: 'br8', name: 'GlobalTranz',           rating: 4.3, reviews: 267, paySpeed: 'Net-21',    badge: 'verified', warns: 0, avgRate: 2.90, logo: null },
];

// ─── LOADS ───────────────────────────────────────────────────────────────────
export const LOADS = [
  {
    id: 'L001', broker: BROKERS[3], type: 'Dry Van', weight: '42,000 lbs',
    origin: 'Chicago, IL', dest: 'Atlanta, GA', miles: 716,
    deadhead: 18, rate: 2850, ratePerMile: 3.98,
    pickup: '2026-03-20', delivery: '2026-03-21',
    fuel: 520, netProfit: 1890, profitScore: 'green',
    commodity: 'Consumer Electronics', dims: '48x102', posted: '2 min ago', hot: true, saved: false,
    instantBook: true, bookNow: true, status: 'available',
  },
  {
    id: 'L002', broker: BROKERS[0], type: 'Reefer', weight: '38,500 lbs',
    origin: 'Dallas, TX', dest: 'Phoenix, AZ', miles: 1015,
    deadhead: 45, rate: 3400, ratePerMile: 3.35,
    pickup: '2026-03-21', delivery: '2026-03-22',
    fuel: 740, netProfit: 1890, profitScore: 'green',
    commodity: 'Fresh Produce', dims: '48x102', posted: '15 min ago', hot: true, saved: false,
    instantBook: false, bookNow: true, status: 'available',
  },
  {
    id: 'L003', broker: BROKERS[1], type: 'Flatbed', weight: '44,000 lbs',
    origin: 'Nashville, TN', dest: 'Charlotte, NC', miles: 408,
    deadhead: 92, rate: 1200, ratePerMile: 2.94,
    pickup: '2026-03-20', delivery: '2026-03-20',
    fuel: 295, netProfit: 520, profitScore: 'yellow',
    commodity: 'Steel Coils', dims: '48x102', posted: '1 hr ago', hot: false, saved: true,
    instantBook: false, bookNow: true, status: 'available',
  },
  {
    id: 'L004', broker: BROKERS[4], type: 'Dry Van', weight: '35,000 lbs',
    origin: 'Los Angeles, CA', dest: 'Las Vegas, NV', miles: 272,
    deadhead: 120, rate: 620, ratePerMile: 2.28,
    pickup: '2026-03-22', delivery: '2026-03-22',
    fuel: 198, netProfit: -85, profitScore: 'red',
    commodity: 'General Freight', dims: '48x102', posted: '3 hr ago', hot: false, saved: false,
    instantBook: false, bookNow: false, status: 'available',
  },
  {
    id: 'L005', broker: BROKERS[6], type: 'Dry Van', weight: '41,000 lbs',
    origin: 'Miami, FL', dest: 'New York, NY', miles: 1280,
    deadhead: 22, rate: 4200, ratePerMile: 3.28,
    pickup: '2026-03-21', delivery: '2026-03-23',
    fuel: 928, netProfit: 2340, profitScore: 'green',
    commodity: 'Apparel', dims: '48x102', posted: '5 min ago', hot: true, saved: false,
    instantBook: true, bookNow: true, status: 'available',
  },
  {
    id: 'L006', broker: BROKERS[2], type: 'Reefer', weight: '36,000 lbs',
    origin: 'Seattle, WA', dest: 'Portland, OR', miles: 180,
    deadhead: 60, rate: 580, ratePerMile: 3.22,
    pickup: '2026-03-20', delivery: '2026-03-20',
    fuel: 130, netProfit: 340, profitScore: 'yellow',
    commodity: 'Dairy', dims: '48x102', posted: '2 hr ago', hot: false, saved: false,
    instantBook: false, bookNow: true, status: 'available',
  },
  {
    id: 'L007', broker: BROKERS[7], type: 'Flatbed', weight: '43,000 lbs',
    origin: 'Houston, TX', dest: 'Memphis, TN', miles: 568,
    deadhead: 30, rate: 1980, ratePerMile: 3.49,
    pickup: '2026-03-22', delivery: '2026-03-22',
    fuel: 410, netProfit: 1120, profitScore: 'green',
    commodity: 'Lumber', dims: '53x102', posted: '30 min ago', hot: false, saved: false,
    instantBook: false, bookNow: true, status: 'available',
  },
  {
    id: 'L008', broker: BROKERS[5], type: 'Dry Van', weight: '28,000 lbs',
    origin: 'Denver, CO', dest: 'Kansas City, MO', miles: 601,
    deadhead: 75, rate: 1100, ratePerMile: 1.83,
    pickup: '2026-03-21', delivery: '2026-03-22',
    fuel: 435, netProfit: 210, profitScore: 'red',
    commodity: 'Auto Parts', dims: '48x102', posted: '4 hr ago', hot: false, saved: false,
    instantBook: false, bookNow: false, status: 'available',
  },
];

// ─── LOADS IN PROGRESS ────────────────────────────────────────────────────────
export const CARRIER_ACTIVE_LOADS = [
  {
    id: 'CA001', broker: BROKERS[3], type: 'Dry Van', weight: '42,000 lbs',
    origin: 'Chicago, IL', dest: 'Atlanta, GA', miles: 716,
    rate: 2850, ratePerMile: 3.98, netProfit: 1890,
    pickup: '2026-03-20', delivery: '2026-03-21',
    commodity: 'Consumer Electronics', status: 'in_transit',
    bookedAt: '2026-03-19T08:00:00Z', pickedUpAt: '2026-03-20T07:45:00Z',
    carrierNote: 'Load picked up, heading south on I-65',
  },
  {
    id: 'CA002', broker: BROKERS[0], type: 'Reefer', weight: '38,500 lbs',
    origin: 'Dallas, TX', dest: 'Phoenix, AZ', miles: 1015,
    rate: 3400, ratePerMile: 3.35, netProfit: 1890,
    pickup: '2026-03-21', delivery: '2026-03-22',
    commodity: 'Fresh Produce', status: 'booked',
    bookedAt: '2026-03-19T10:00:00Z', pickedUpAt: null,
    carrierNote: '',
  },
  {
    id: 'CA003', broker: BROKERS[6], type: 'Flatbed', weight: '44,000 lbs',
    origin: 'Houston, TX', dest: 'Memphis, TN', miles: 568,
    rate: 1980, ratePerMile: 3.49, netProfit: 1120,
    pickup: '2026-03-22', delivery: '2026-03-22',
    commodity: 'Lumber', status: 'quoted',
    bookedAt: null, pickedUpAt: null,
    carrierNote: '',
  },
];

export const BROKER_ACTIVE_LOADS = [
  {
    id: 'BA001', carrierId: 'c1', carrierName: 'Mike Rodriguez', carrierMc: 'MC-123456',
    type: 'Dry Van', weight: '42,000 lbs',
    origin: 'Chicago, IL', dest: 'Atlanta, GA', miles: 716,
    rate: 2850, ratePerMile: 3.98,
    pickup: '2026-03-20', delivery: '2026-03-21',
    commodity: 'Consumer Electronics', status: 'in_transit',
    bookedAt: '2026-03-19T08:00:00Z', pickedUpAt: '2026-03-20T07:45:00Z',
  },
  {
    id: 'BA002', carrierId: 'u3', carrierName: 'James Wilson', carrierMc: 'MC-234567',
    type: 'Reefer', weight: '38,500 lbs',
    origin: 'Dallas, TX', dest: 'Phoenix, AZ', miles: 1015,
    rate: 3400, ratePerMile: 3.35,
    pickup: '2026-03-21', delivery: '2026-03-22',
    commodity: 'Fresh Produce', status: 'booked',
    bookedAt: '2026-03-19T10:00:00Z', pickedUpAt: null,
  },
  {
    id: 'BA003', carrierId: null, carrierName: null, carrierMc: null,
    type: 'Flatbed', weight: '41,000 lbs',
    origin: 'Miami, FL', dest: 'New York, NY', miles: 1280,
    rate: 4200, ratePerMile: 3.28,
    pickup: '2026-03-21', delivery: '2026-03-23',
    commodity: 'Apparel', status: 'available',
    bookedAt: null, pickedUpAt: null,
  },
  {
    id: 'BA004', carrierId: 'c1', carrierName: 'Mike Rodriguez', carrierMc: 'MC-123456',
    type: 'Dry Van', weight: '35,000 lbs',
    origin: 'Nashville, TN', dest: 'Charlotte, NC', miles: 408,
    rate: 1200, ratePerMile: 2.94,
    pickup: '2026-03-19', delivery: '2026-03-19',
    commodity: 'Steel Coils', status: 'delivered',
    bookedAt: '2026-03-18T09:00:00Z', pickedUpAt: '2026-03-19T06:00:00Z',
  },
];

// ─── PLANS ────────────────────────────────────────────────────────────────────
export const CARRIER_PLANS = [
  {
    id: 'carrier_basic', name: 'Basic', price: 0, period: 'forever',
    description: 'Get started with essential load board access',
    color: 'dark',
    features: [
      '20 load views per day',
      'Basic profit calculator',
      'Standard filters',
      'Email support',
    ],
    limits: { loadsPerDay: 20, profitCalc: true, brokerRatings: false, earningsBrain: false, hotLoads: false, notifications: false, analytics: false },
  },
  {
    id: 'carrier_pro', name: 'Pro', price: 49, period: 'month',
    description: 'Unlimited access with smart insights',
    color: 'brand', popular: true,
    features: [
      'Unlimited load views',
      'Full profit calculator',
      'Broker ratings & reviews',
      'Basic Earnings Brain insights',
      'Hot load notifications',
      'Load history (90 days)',
      'Priority support',
    ],
    limits: { loadsPerDay: -1, profitCalc: true, brokerRatings: true, earningsBrain: 'basic', hotLoads: true, notifications: true, analytics: false },
  },
  {
    id: 'carrier_elite', name: 'Elite', price: 99, period: 'month',
    description: 'The full Driver Earnings Brain experience',
    color: 'purple',
    features: [
      'Everything in Pro',
      'Full Driver Earnings Brain (AI)',
      'Priority "Best Loads" ranking',
      'Early access to high-profit loads',
      'Advanced analytics dashboard',
      'Anonymous lane insights',
      'Weekly profit reports',
      'Dedicated account manager',
    ],
    limits: { loadsPerDay: -1, profitCalc: true, brokerRatings: true, earningsBrain: 'full', hotLoads: true, notifications: true, analytics: true },
  },
];

export const BROKER_PLANS = [
  {
    id: 'broker_basic', name: 'Basic', price: 0, period: 'forever',
    description: 'Post loads and get discovered',
    color: 'dark',
    features: ['10 active load postings', 'Standard visibility', 'Basic dashboard', 'Email support'],
    limits: { postings: 10, visibility: 'standard', carrierAnalytics: false, priority: false },
  },
  {
    id: 'broker_pro', name: 'Pro', price: 79, period: 'month',
    description: 'More reach, better conversions',
    color: 'brand', popular: true,
    features: ['50 active load postings', 'Enhanced visibility ranking', 'Carrier engagement analytics', 'Performance dashboard', 'Priority support'],
    limits: { postings: 50, visibility: 'enhanced', carrierAnalytics: true, priority: false },
  },
  {
    id: 'broker_elite', name: 'Elite', price: 149, period: 'month',
    description: 'Dominate the board',
    color: 'purple',
    features: ['Unlimited postings', 'Priority placement', 'Advanced conversion analytics', 'Premium carrier exposure', 'Dedicated account rep', 'API access'],
    limits: { postings: -1, visibility: 'priority', carrierAnalytics: true, priority: true },
  },
];

// ─── EARNINGS BRAIN INSIGHTS ──────────────────────────────────────────────────
export const BRAIN_INSIGHTS = [
  { id: 'i1', type: 'lane', icon: '🏆', title: 'Your Best Lane', body: 'Chicago → Atlanta earns you avg $2,340 net. You\'ve run this 8x with 94% profitability.', action: 'Find loads on this lane', tag: 'high-profit' },
  { id: 'i2', type: 'broker', icon: '⚠️', title: 'Avoid This Broker', body: 'Freight Broker LLC has a 2.1 rating. 3 drivers reported slow/missing payments this month.', action: 'See all warnings', tag: 'warning' },
  { id: 'i3', type: 'timing', icon: '⏰', title: 'Wait for Better Rates', body: 'LA→Vegas rates spike 28% on Thursday afternoons. Current rate: $2.28/mi — market avg: $2.95/mi.', action: 'Set rate alert', tag: 'timing' },
  { id: 'i4', type: 'pattern', icon: '📈', title: 'Reefer Pays More', body: 'Your reefer loads average $3.28/mi vs $2.74/mi for dry van. Consider prioritizing reefer.', action: 'Filter reefer loads', tag: 'insight' },
  { id: 'i5', type: 'deadhead', icon: '🛣️', title: 'Cut Deadhead Miles', body: 'Your avg deadhead is 67 miles. Top earners run <30. Save ~$890/month by tightening pickup radius.', action: 'Optimize deadhead', tag: 'savings' },
];

// ─── DRIVER ANALYTICS (mock) ──────────────────────────────────────────────────
export const WEEKLY_EARNINGS = [
  { week: 'Jan W1', gross: 4200, net: 2800, miles: 1420 },
  { week: 'Jan W2', gross: 5100, net: 3400, miles: 1680 },
  { week: 'Jan W3', gross: 3800, net: 2400, miles: 1280 },
  { week: 'Jan W4', gross: 6200, net: 4100, miles: 2100 },
  { week: 'Feb W1', gross: 4800, net: 3200, miles: 1560 },
  { week: 'Feb W2', gross: 5600, net: 3700, miles: 1820 },
  { week: 'Feb W3', gross: 4200, net: 2750, miles: 1380 },
  { week: 'Feb W4', gross: 7100, net: 4800, miles: 2350 },
  { week: 'Mar W1', gross: 5200, net: 3450, miles: 1640 },
  { week: 'Mar W2', gross: 6800, net: 4600, miles: 2180 },
];

export const LANE_PERFORMANCE = [
  { lane: 'CHI→ATL', runs: 8, avgNet: 2340, profitability: 94 },
  { lane: 'DAL→PHX', runs: 5, avgNet: 1890, profitability: 88 },
  { lane: 'MIA→NYC', runs: 3, avgNet: 2340, profitability: 92 },
  { lane: 'HOU→MEM', runs: 6, avgNet: 1120, profitability: 76 },
  { lane: 'DEN→KCI', runs: 4, avgNet: 210,  profitability: 42 },
];

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────
export const ADMIN_STATS = {
  mrr: 48200,
  mrrGrowth: 12.4,
  activeSubscribers: 1284,
  subGrowth: 8.7,
  totalLoads: 9841,
  totalUsers: 2108,
  carrierDist: [
    { plan: 'Basic', count: 680, pct: 53 },
    { plan: 'Pro',   count: 420, pct: 33 },
    { plan: 'Elite', count: 184, pct: 14 },
  ],
  brokerDist: [
    { plan: 'Basic', count: 420, pct: 52 },
    { plan: 'Pro',   count: 248, pct: 31 },
    { plan: 'Elite', count: 136, pct: 17 },
  ],
  revenueByMonth: [
    { month: 'Oct', mrr: 31200 },
    { month: 'Nov', mrr: 35400 },
    { month: 'Dec', mrr: 38900 },
    { month: 'Jan', mrr: 41200 },
    { month: 'Feb', mrr: 44800 },
    { month: 'Mar', mrr: 48200 },
  ],
};

export const MOCK_USERS_LIST = [
  { id: 'u1', name: 'Mike Rodriguez', email: 'carrier@demo.com', role: 'carrier', plan: 'pro', status: 'active', joined: '2024-01-15', revenue: 49 },
  { id: 'u2', name: 'Sarah Chen',     email: 'broker@demo.com',  role: 'broker',  plan: 'elite', status: 'active', joined: '2024-02-20', revenue: 149 },
  { id: 'u3', name: 'James Wilson',   email: 'jwilson@mail.com', role: 'carrier', plan: 'elite', status: 'active', joined: '2024-01-08', revenue: 99 },
  { id: 'u4', name: 'Maria Garcia',   email: 'mgarcia@mail.com', role: 'carrier', plan: 'basic', status: 'active', joined: '2024-03-01', revenue: 0 },
  { id: 'u5', name: 'Tom Bradley',    email: 'tbrad@freight.com', role: 'broker', plan: 'pro',  status: 'suspended', joined: '2024-02-10', revenue: 79 },
  { id: 'u6', name: 'Lisa Park',      email: 'lpark@mail.com',   role: 'carrier', plan: 'pro',  status: 'active', joined: '2024-01-28', revenue: 49 },
  { id: 'u7', name: 'Kevin Hart',     email: 'khart@freight.com', role: 'broker', plan: 'basic', status: 'active', joined: '2024-03-10', revenue: 0 },
  { id: 'u8', name: 'Diana Ross',     email: 'dross@mail.com',   role: 'carrier', plan: 'elite', status: 'active', joined: '2024-02-05', revenue: 99 },
];

// ─── MOCK CARRIER LIST (for broker search) ───────────────────────────────────
export const MOCK_CARRIERS = [
  { id: 'c1',  name: 'Mike Rodriguez', email: 'carrier@demo.com', company: 'Rodriguez Trucking',  mc: 'MC-123456', dot: 'DOT-789012', plan: 'pro',   loadsCompleted: 94,  rating: 4.9 },
  { id: 'u3',  name: 'James Wilson',   email: 'jwilson@mail.com', company: 'Wilson Transport',    mc: 'MC-234567', dot: 'DOT-890123', plan: 'elite',  loadsCompleted: 187, rating: 4.7 },
  { id: 'u4',  name: 'Maria Garcia',   email: 'mgarcia@mail.com', company: 'Garcia Logistics',    mc: 'MC-345678', dot: 'DOT-901234', plan: 'basic',  loadsCompleted: 12,  rating: 4.5 },
  { id: 'u6',  name: 'Lisa Park',      email: 'lpark@mail.com',   company: 'Park Freight',        mc: 'MC-456789', dot: 'DOT-012345', plan: 'pro',   loadsCompleted: 63,  rating: 4.8 },
  { id: 'u8',  name: 'Diana Ross',     email: 'dross@mail.com',   company: 'Ross Carriers',       mc: 'MC-567890', dot: 'DOT-123456', plan: 'elite',  loadsCompleted: 211, rating: 4.6 },
  { id: 'u9',  name: 'Carlos Mendez',  email: 'cmendez@road.com', company: 'Mendez Hauling',      mc: 'MC-678901', dot: 'DOT-234567', plan: 'pro',   loadsCompleted: 48,  rating: 4.7 },
  { id: 'u10', name: 'Tracy Brown',    email: 'tbrown@road.com',  company: 'Brown Expedited',     mc: 'MC-789012', dot: 'DOT-345678', plan: 'pro',   loadsCompleted: 77,  rating: 4.4 },
  { id: 'u11', name: 'Derek Nguyen',   email: 'dnguyen@haul.com', company: 'Nguyen Trucking LLC', mc: 'MC-890123', dot: 'DOT-456789', plan: 'elite',  loadsCompleted: 155, rating: 5.0 },
];

// ─── SAMPLE INSTANT BOOK ALLOWLIST ───────────────────────────────────────────
export const SAMPLE_ALLOWLIST = [
  { id: 'al1', brokerId: 'b1', carrierId: 'c1',  carrierEmail: 'carrier@demo.com', carrierName: 'Mike Rodriguez', carrierMc: 'MC-123456', source: 'search', addedAt: '2026-03-10T09:00:00Z' },
  { id: 'al2', brokerId: 'b1', carrierId: 'u3',  carrierEmail: 'jwilson@mail.com', carrierName: 'James Wilson',   carrierMc: 'MC-234567', source: 'search', addedAt: '2026-03-12T14:00:00Z' },
  { id: 'al3', brokerId: 'b1', carrierId: null,  carrierEmail: 'partner@fleet.com', carrierName: 'Apex Freight LLC', carrierMc: 'MC-999001', source: 'upload', addedAt: '2026-03-15T10:00:00Z' },
];

// ─── SAMPLE CONVERSATIONS ─────────────────────────────────────────────────────
export const CONVERSATIONS = [
  {
    id: 'conv1',
    loadId: 'L001',
    carrierId: 'c1',
    brokerId: 'br4_user',
    brokerName: 'MoLo Solutions',
    loadRoute: 'Chicago, IL → Atlanta, GA',
    updatedAt: '2026-03-19T10:30:00Z',
    messages: [
      { id: 'm1', senderId: 'br4_user', senderName: 'MoLo Solutions', body: 'Hi! Are you available for this load on the 20th?', createdAt: '2026-03-19T10:00:00Z', isRead: true },
      { id: 'm2', senderId: 'c1', senderName: 'Mike Rodriguez', body: 'Yes, I can do it. Is there any flex on the rate?', createdAt: '2026-03-19T10:15:00Z', isRead: true },
      { id: 'm3', senderId: 'br4_user', senderName: 'MoLo Solutions', body: 'We can go up to $2,950 if you can confirm today.', createdAt: '2026-03-19T10:30:00Z', isRead: false },
    ],
  },
];

// ─── SAMPLE BIDS ──────────────────────────────────────────────────────────────
export const SAMPLE_BIDS = [
  { id: 'bid1', loadId: 'L003', carrierId: 'c1', amount: 1350, note: 'I can pickup first thing in the morning', status: 'pending', createdAt: '2026-03-19T09:00:00Z' },
];

// ─── SAMPLE BOOKINGS ──────────────────────────────────────────────────────────
export const SAMPLE_BOOKINGS = [
  { id: 'bk1', loadId: 'L002', carrierId: 'c1', status: 'pending', note: 'Ready to roll, fully loaded trailer available', createdAt: '2026-03-19T08:00:00Z' },
];

// ─── SAMPLE BROKER REVIEWS ────────────────────────────────────────────────────
export const SAMPLE_BROKER_REVIEWS = {
  br4: [
    { id: 'br4r1', brokerId: 'br4', carrierId: 'c1', carrierName: 'Mike R.', rating: 5, communication: 5, accuracy: 5, paymentDays: 7, wouldWorkAgain: true, comment: 'MoLo is the gold standard. Paid in 7 days, load was exactly as described. Will always take their loads.', isAnonymous: false, createdAt: '2026-03-01T10:00:00Z' },
    { id: 'br4r2', brokerId: 'br4', carrierId: 'u3', carrierName: 'James W.', rating: 5, communication: 5, accuracy: 4, paymentDays: 8, wouldWorkAgain: true, comment: 'Great broker. Quick-pay is real — money was in my account in 8 days. Highly recommend.', isAnonymous: false, createdAt: '2026-02-20T14:00:00Z' },
    { id: 'br4r3', brokerId: 'br4', carrierId: null, carrierName: 'Anonymous', rating: 4, communication: 4, accuracy: 5, paymentDays: 10, wouldWorkAgain: true, comment: 'Very professional. Minor communication issue on pickup time but resolved quickly.', isAnonymous: true, createdAt: '2026-02-10T09:00:00Z' },
  ],
  br5: [
    { id: 'br5r1', brokerId: 'br5', carrierId: 'u6', carrierName: 'Lisa P.', rating: 1, communication: 1, accuracy: 2, paymentDays: 62, wouldWorkAgain: false, comment: 'AVOID. Said Net-45 but did not pay for 62 days. Had to threaten collections. Load weight was wrong by 4,000 lbs.', isAnonymous: false, createdAt: '2026-02-15T11:00:00Z' },
    { id: 'br5r2', brokerId: 'br5', carrierId: null, carrierName: 'Anonymous', rating: 2, communication: 2, accuracy: 1, paymentDays: 55, wouldWorkAgain: false, comment: 'Slow pay. Load dimensions were off. They will argue about everything.', isAnonymous: true, createdAt: '2026-01-30T08:00:00Z' },
    { id: 'br5r3', brokerId: 'br5', carrierId: 'u8', carrierName: 'Diana R.', rating: 2, communication: 1, accuracy: 2, paymentDays: 48, wouldWorkAgain: false, comment: 'Took 48 days to get paid. Unresponsive for 2 weeks. Not worth the headache.', isAnonymous: false, createdAt: '2026-01-10T15:00:00Z' },
  ],
  br1: [
    { id: 'br1r1', brokerId: 'br1', carrierId: 'c1', carrierName: 'Mike R.', rating: 5, communication: 5, accuracy: 5, paymentDays: 21, wouldWorkAgain: true, comment: 'Echo always has solid loads. Net-21 is accurate to the day. Great communication.', isAnonymous: false, createdAt: '2026-03-05T10:00:00Z' },
    { id: 'br1r2', brokerId: 'br1', carrierId: 'u3', carrierName: 'James W.', rating: 4, communication: 4, accuracy: 4, paymentDays: 23, wouldWorkAgain: true, comment: 'Good rates, paid on time. Load info was accurate. Solid operation.', isAnonymous: false, createdAt: '2026-02-25T12:00:00Z' },
  ],
};

// ─── SAMPLE CARRIER REVIEWS ───────────────────────────────────────────────────
export const SAMPLE_CARRIER_REVIEWS = {
  c1: [
    { id: 'cr1', carrierId: 'c1', brokerId: 'b1', brokerName: 'FastFreight Brokerage', rating: 5, communication: 5, onTimePickup: 5, onTimeDelivery: 5, loadCare: 5, wouldWorkAgain: true, comment: 'Mike is an outstanding carrier. On time every single time, load arrived in perfect condition, communicates proactively. Our top preferred carrier.', isAnonymous: false, createdAt: '2026-03-10T10:00:00Z' },
    { id: 'cr2', carrierId: 'c1', brokerId: 'br4_user', brokerName: 'MoLo Solutions', rating: 5, communication: 4, onTimePickup: 5, onTimeDelivery: 5, loadCare: 5, wouldWorkAgain: true, comment: 'Excellent driver. Picked up early, delivered on time, zero damage. Will always book Mike first.', isAnonymous: false, createdAt: '2026-02-28T09:00:00Z' },
    { id: 'cr3', carrierId: 'c1', brokerId: 'br1_user', brokerName: 'Echo Global', rating: 4, communication: 5, onTimePickup: 4, onTimeDelivery: 5, loadCare: 5, wouldWorkAgain: true, comment: 'Great carrier overall. Pickup was slightly late but communicated ahead of time. Delivery was perfect.', isAnonymous: false, createdAt: '2026-02-10T14:00:00Z' },
  ],
};
