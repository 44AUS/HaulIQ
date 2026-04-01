import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, Chip,
  Alert, Skeleton
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import { analyticsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TAG_COLOR_MAP = {
  'high-profit': 'success',
  'warning':     'error',
  'timing':      'warning',
  'insight':     'info',
  'savings':     'success',
};

function InsightCard({ insight, locked, onRead }) {
  return (
    <Card
      onClick={() => !locked && onRead && onRead(insight.id)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.7 : 1,
        transition: 'all 0.2s',
        ...(!locked && {
          '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        }),
      }}
    >
      {locked && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 1,
          borderRadius: 'inherit',
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <LockIcon sx={{ color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Pro or Elite required
            </Typography>
            <Button
              component={Link}
              to="/carrier/dashboard"
              variant="text"
              size="small"
            >
              Upgrade plan
            </Button>
          </Box>
        </Box>
      )}
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Typography variant="h5" sx={{ flexShrink: 0, lineHeight: 1 }}>
            {insight.icon || '💡'}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" fontWeight={600}>{insight.title}</Typography>
              <Chip
                label={insight.tag}
                size="small"
                color={TAG_COLOR_MAP[insight.tag] || 'info'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {insight.body}
            </Typography>
            {insight.action_label && (
              <Button
                variant="text"
                size="small"
                endIcon={<ChevronRightIcon />}
                sx={{ mt: 1, px: 0, fontSize: '0.75rem' }}
              >
                {insight.action_label}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function EarningsBrain() {
  const { user } = useAuth();
  const isPro = user?.plan === 'pro' || user?.plan === 'elite';
  const isElite = user?.plan === 'elite';

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = () => {
    setLoading(true);
    analyticsApi.insights()
      .then(data => { setInsights(Array.isArray(data) ? data : []); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInsights(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    analyticsApi.refresh()
      .then(() => fetchInsights())
      .catch(() => fetchInsights())
      .finally(() => setRefreshing(false));
  };

  const handleMarkRead = (insightId) => {
    analyticsApi.markRead(insightId).catch(() => {});
  };

  const visibleInsights = isPro ? insights : insights.slice(0, 1);
  const lockedInsights  = isPro ? [] : insights.slice(1);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PsychologyIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h5" fontWeight={700}>Driver Earnings Brain</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            AI-powered insights that learn your patterns and maximize your earnings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />}
          >
            Refresh
          </Button>
          <Chip
            label={isElite ? 'Elite — Full Access' : isPro ? 'Pro — Basic Insights' : 'Basic — Limited'}
            size="small"
            color={isElite ? 'info' : isPro ? 'success' : 'warning'}
          />
        </Box>
      </Box>

      {/* Summary stats */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Insights Generated', value: insights.length || '—', sub: 'Available now' },
          { label: 'Estimated Savings', value: '$—', sub: 'From avoided bad loads' },
          { label: 'Brokers Flagged', value: '—', sub: 'Based on your history' },
          { label: 'Best Lane Found', value: '—', sub: 'Run more loads to unlock' },
        ].map(({ label, value, sub }) => (
          <Box key={label} sx={{ flex: '1 1 180px', minWidth: 0 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {label}
                </Typography>
                <Typography variant="h4" fontWeight={800}>{value}</Typography>
                <Typography variant="caption" color="text.disabled">{sub}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Insights grid */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>This Week's Insights</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ flex: '1 1 320px', minWidth: 0 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="80%" height={18} sx={{ mb: 0.75 }} />
                    <Skeleton variant="text" width="50%" height={18} />
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : insights.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <PsychologyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="body1" color="text.secondary">
                No insights yet. Complete more loads to generate personalized insights.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {visibleInsights.map(i => (
              <Box key={i.id} sx={{ flex: '1 1 320px', minWidth: 0 }}>
                <InsightCard insight={i} locked={false} onRead={handleMarkRead} />
              </Box>
            ))}
            {lockedInsights.map(i => (
              <Box key={i.id} sx={{ flex: '1 1 320px', minWidth: 0 }}>
                <InsightCard insight={i} locked={true} onRead={null} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Upgrade CTA if not elite */}
      {!isElite && (
        <Card sx={{ border: '1px solid', borderColor: 'secondary.main', bgcolor: 'rgba(230,81,0,0.04)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Unlock the Full Driver Earnings Brain
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get predictive lane intelligence, broker blacklists, and weekly AI profit reports with Elite.
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/carrier/dashboard"
                variant="contained"
                color="secondary"
                sx={{ flexShrink: 0 }}
              >
                Upgrade to Elite
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
