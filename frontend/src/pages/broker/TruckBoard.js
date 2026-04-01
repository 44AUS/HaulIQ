import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, Chip,
  Skeleton, InputAdornment,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { truckPostsApi } from '../../services/api';

const EQUIPMENT_OPTIONS = [
  { value: '',           label: 'All Types' },
  { value: 'dry_van',    label: 'Dry Van',    color: 'default' },
  { value: 'flatbed',    label: 'Flatbed',    color: 'warning' },
  { value: 'reefer',     label: 'Reefer',     color: 'info' },
  { value: 'step_deck',  label: 'Step Deck',  color: 'secondary' },
  { value: 'lowboy',     label: 'Lowboy',     color: 'error' },
  { value: 'power_only', label: 'Power Only', color: 'success' },
];

function equipmentLabel(value) {
  return EQUIPMENT_OPTIONS.find(o => o.value === value)?.label || value;
}

function equipmentColor(value) {
  return EQUIPMENT_OPTIONS.find(o => o.value === value)?.color || 'default';
}

function TruckCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ flex: '1 1 320px', minWidth: 0, borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={100} height={24} />
        </Box>
        <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.75 }} />
        <Skeleton variant="text" width="50%" height={16} sx={{ mb: 0.75 }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" width="100%" height={34} />
      </CardContent>
    </Card>
  );
}

export default function TruckBoard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const debounceRef = useRef(null);

  const fetchPosts = useCallback((eqType, loc) => {
    setLoading(true);
    const params = {};
    if (eqType) params.equipment_type = eqType;
    if (loc && loc.trim()) params.location = loc.trim();
    truckPostsApi.list(params)
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPosts(equipmentFilter, locationSearch);
  }, [equipmentFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPosts(equipmentFilter, val);
    }, 400);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Available Trucks</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Browse carrier capacity and reach out directly.
        </Typography>
      </Box>

      {/* Filter bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3 }}>
        {/* Equipment type filter buttons */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {EQUIPMENT_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              color={equipmentFilter === opt.value ? (opt.color || 'primary') : 'default'}
              variant={equipmentFilter === opt.value ? 'filled' : 'outlined'}
              onClick={() => setEquipmentFilter(opt.value)}
              sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
            />
          ))}
        </Box>

        {/* Location search */}
        <TextField
          placeholder="Search by location…"
          size="small"
          value={locationSearch}
          onChange={handleLocationChange}
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <TruckCardSkeleton key={i} />)}
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <LocalShippingIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} color="text.secondary">No trucks available</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            {equipmentFilter || locationSearch ? 'Try adjusting your filters.' : 'Carriers have not posted any trucks yet.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {posts.map(post => (
            <Card
              key={post.id}
              variant="outlined"
              sx={{
                flex: '1 1 320px',
                minWidth: 0,
                borderRadius: 2,
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: 3 },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Top row: equipment chip + carrier name */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={equipmentLabel(post.equipment_type)}
                    color={equipmentColor(post.equipment_type)}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                    {post.carrier_name || 'Carrier'}
                    {post.carrier_company ? ` · ${post.carrier_company}` : ''}
                  </Typography>
                </Box>

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600}>{post.current_location}</Typography>
                </Box>

                {/* Dates */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <CalendarTodayIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {post.available_from} — {post.available_to}
                  </Typography>
                </Box>

                {/* Rate */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                  <AttachMoneyIcon sx={{ fontSize: 16, color: post.rate_expectation ? 'success.main' : 'text.disabled' }} />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={post.rate_expectation ? 'success.main' : 'text.disabled'}
                  >
                    {post.rate_expectation ? `$${post.rate_expectation.toFixed(2)}/mile` : 'Negotiable'}
                  </Typography>
                </Box>

                {/* Preferred lanes */}
                {(post.preferred_origin || post.preferred_destination) && (
                  <Box sx={{ mb: 0.75 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Preferred Lane
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[post.preferred_origin, post.preferred_destination].filter(Boolean).join(' → ')}
                    </Typography>
                  </Box>
                )}

                {/* Specs */}
                {(post.trailer_length || post.weight_capacity) && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 0.75 }}>
                    {post.trailer_length && (
                      <Typography variant="caption" color="text.secondary">{post.trailer_length} ft</Typography>
                    )}
                    {post.weight_capacity && (
                      <Typography variant="caption" color="text.secondary">{post.weight_capacity.toLocaleString()} lbs</Typography>
                    )}
                  </Box>
                )}

                {/* Notes preview */}
                {post.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontStyle: 'italic' }}>
                    {post.notes.length > 90 ? post.notes.slice(0, 90) + '…' : post.notes}
                  </Typography>
                )}

                {/* Contact button */}
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<ChatBubbleOutlineIcon />}
                  onClick={() => navigate('/broker/messages')}
                  sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                >
                  Contact Carrier
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
