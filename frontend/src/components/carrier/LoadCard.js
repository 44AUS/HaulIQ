import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, Avatar,
} from '@mui/material';
import { loadsApi } from '../../services/api';
import IonIcon from '../IonIcon';


const SCORE_COLOR   = { green: 'success', yellow: 'warning', red: 'error' };
const SCORE_LABEL   = { green: 'High Profit', yellow: 'Marginal', red: 'Loss Risk' };
const SCORE_BORDER  = {
  green:  'rgba(46,125,50,0.2)',
  yellow: 'rgba(237,108,2,0.2)',
  red:    'rgba(211,47,47,0.2)',
};
const SCORE_ICONS   = { green: TrendingUpIcon, yellow: RemoveIcon, red: TrendingDownIcon };

export default function LoadCard({ load, onSave }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(load.saved);

  const handleSave = (e) => {
    e.stopPropagation();
    setSaved(s => !s);
    loadsApi.toggleSave(load._raw.id).catch(() => setSaved(s => !s));
    onSave && onSave(load.id, !saved);
  };

  const ProfitIcon = SCORE_ICONS[load.profitScore] || RemoveIcon;
  const broker = load.broker;
  const brokerInitials = broker?.name
    ? broker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <Card
      variant="outlined"
      onClick={() => navigate(`/carrier/loads/${load.id}`, { state: { from: 'Load Board' } })}
      sx={{
        borderRadius: 2,
        cursor: 'pointer',
        borderColor: SCORE_BORDER[load.profitScore],
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        position: 'relative',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>

        {/* Header row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', flex: 1 }}>
            {load.hot && (
              <Chip icon={<IonIcon name="flash-outline" sx={{ fontSize: '12px !important' }} />} label="Hot" size="small" color="error"
                sx={{ fontWeight: 700, fontSize: '0.68rem', height: 21 }} />
            )}
            {load.instantBook && (
              <Chip icon={<IonIcon name="flash-outline" sx={{ fontSize: '12px !important' }} />} label="Instant Book" size="small" color="primary"
                sx={{ fontWeight: 700, fontSize: '0.68rem', height: 21 }} />
            )}
            <Chip
              icon={<IonIcon name="car-sport-outline" sx={{ fontSize: '12px !important' }} />}
              label={load.type}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 21 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>{load.posted}</Typography>
            <Tooltip title={saved ? 'Remove bookmark' : 'Save load'}>
              <IconButton size="small" onClick={handleSave}
                sx={{ color: saved ? 'primary.main' : 'text.disabled', p: 0.5 }}>
                {saved ? <IonIcon name="bookmark" sx={{ fontSize: 16 }} /> : <IonIcon name="bookmark-outline" sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Route */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.58rem', display: 'block' }}>
              Origin
            </Typography>
            <Typography variant="body2" fontWeight={700} noWrap>{load.origin}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <IonIcon name="arrow-forward-outline" sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>{load.miles} mi</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <Typography variant="caption" color="text.disabled" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.58rem', display: 'block' }}>
              Destination
            </Typography>
            <Typography variant="body2" fontWeight={700} noWrap>{load.dest}</Typography>
          </Box>
        </Box>

        {/* Dates */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.75 }}>
          <Typography variant="caption" color="text.secondary">
            Pickup: <Box component="span" fontWeight={600}>{load.pickup}</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drop: <Box component="span" fontWeight={600}>{load.delivery}</Box>
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
          {[
            { label: 'Rate', value: `$${load.rate?.toLocaleString()}` },
            { label: '$/mi', value: `$${load.ratePerMile}` },
            { label: 'Net Profit', value: `$${load.netProfit?.toLocaleString()}`, scoreColor: SCORE_COLOR[load.profitScore] },
          ].map(({ label, value, scoreColor }) => (
            <Box key={label} sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.25, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
              <Typography variant="body2" fontWeight={700} color={scoreColor ? `${scoreColor}.main` : 'text.primary'}
                sx={{ fontSize: '0.8rem' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Deadhead warning */}
        {load.deadhead > 60 && (
          <Box sx={{ mb: 1.5, bgcolor: 'warning.main', borderRadius: 1, px: 1.5, py: 0.75, opacity: 0.9,
            border: '1px solid', borderColor: 'warning.light' }}>
            <Typography variant="caption" color="warning.contrastText" fontWeight={600}>
              ⚠ {load.deadhead} mi deadhead — reduces net profit
            </Typography>
          </Box>
        )}

        {/* Footer: broker + profit score */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          {broker ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', fontWeight: 700,
                bgcolor: 'primary.main', flexShrink: 0 }}>
                {brokerInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ lineHeight: 1.2 }}>
                  {broker.name}
                </Typography>
                {broker.rating > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <IonIcon name="star" sx={{ fontSize: 10, color: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                      {broker.rating?.toFixed(1)} ({broker.reviews})
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : <Box />}
          <Chip
            icon={<ProfitIcon sx={{ fontSize: '12px !important' }} />}
            label={SCORE_LABEL[load.profitScore]}
            size="small"
            color={SCORE_COLOR[load.profitScore]}
            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 21, flexShrink: 0 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
