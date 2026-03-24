import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  InputAdornment, Stack
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function ProfitCalculator() {
  const [form, setForm] = useState({
    rate: '',
    loadedMiles: '',
    deadheadMiles: '',
    fuelPrice: '3.85',
    mpg: '7.2',
    driverPay: '',
    tolls: '',
    misc: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calc = useMemo(() => {
    const rate = parseFloat(form.rate) || 0;
    const loadedMiles = parseFloat(form.loadedMiles) || 0;
    const deadMiles = parseFloat(form.deadheadMiles) || 0;
    const fuelPrice = parseFloat(form.fuelPrice) || 3.85;
    const mpg = parseFloat(form.mpg) || 7.2;
    const driverPay = parseFloat(form.driverPay) || 0;
    const tolls = parseFloat(form.tolls) || 0;
    const misc = parseFloat(form.misc) || 0;

    const totalMiles = loadedMiles + deadMiles;
    const fuelCost = (totalMiles / mpg) * fuelPrice;
    const totalExpenses = fuelCost + driverPay + tolls + misc;
    const netProfit = rate - totalExpenses;
    const ratePerMile = loadedMiles > 0 ? (rate / loadedMiles).toFixed(2) : 0;
    const netPerMile = loadedMiles > 0 ? (netProfit / loadedMiles).toFixed(2) : 0;
    const margin = rate > 0 ? ((netProfit / rate) * 100).toFixed(0) : 0;

    let score = 'red';
    if (netProfit > 1500 || (netPerMile > 2.5 && netProfit > 500)) score = 'green';
    else if (netProfit > 400) score = 'yellow';

    return { fuelCost: Math.round(fuelCost), totalExpenses: Math.round(totalExpenses), netProfit: Math.round(netProfit), ratePerMile, netPerMile, margin, score };
  }, [form]);

  const scoreConfig = {
    green: {
      label: 'High Profit',
      Icon: TrendingUpIcon,
      color: 'success.main',
      bgcolor: 'rgba(46,125,50,0.08)',
      borderColor: 'success.main',
      tip: 'This load is worth taking.',
    },
    yellow: {
      label: 'Marginal',
      Icon: RemoveIcon,
      color: 'warning.main',
      bgcolor: 'rgba(245,127,23,0.08)',
      borderColor: 'warning.main',
      tip: 'Barely profitable — negotiate if possible.',
    },
    red: {
      label: 'Loss / Low',
      Icon: TrendingDownIcon,
      color: 'error.main',
      bgcolor: 'rgba(198,40,40,0.08)',
      borderColor: 'error.main',
      tip: 'Avoid this load.',
    },
  }[calc.score];

  const fields = [
    { label: 'Rate Offered', id: 'rate', prefix: '$', placeholder: '2500' },
    { label: 'Loaded Miles', id: 'loadedMiles', placeholder: '450' },
    { label: 'Deadhead Miles', id: 'deadheadMiles', placeholder: '60', hint: 'empty miles' },
    { label: 'Fuel Price', id: 'fuelPrice', prefix: '$', placeholder: '3.85', step: '0.01', hint: 'per gallon' },
    { label: 'MPG', id: 'mpg', placeholder: '7.2', step: '0.1', hint: 'your truck' },
    { label: 'Driver Pay', id: 'driverPay', prefix: '$', placeholder: '0', hint: 'if applicable' },
    { label: 'Tolls', id: 'tolls', prefix: '$', placeholder: '0' },
    { label: 'Misc / Other', id: 'misc', prefix: '$', placeholder: '0' },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CalculateIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography variant="h5" fontWeight={700}>Profit Calculator</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Calculate your real net profit before accepting any load
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Inputs */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Load Details</Typography>
              <Grid container spacing={2}>
                {fields.map(({ label, id, prefix, placeholder, step, hint }) => (
                  <Grid item xs={6} key={id}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label={hint ? `${label} (${hint})` : label}
                      placeholder={placeholder}
                      value={form[id]}
                      onChange={e => set(id, e.target.value)}
                      inputProps={{ step: step || '1' }}
                      InputProps={prefix ? {
                        startAdornment: (
                          <InputAdornment position="start">{prefix}</InputAdornment>
                        ),
                      } : undefined}
                    />
                  </Grid>
                ))}
              </Grid>
              <Button
                onClick={() => setForm({ rate: '', loadedMiles: '', deadheadMiles: '', fuelPrice: '3.85', mpg: '7.2', driverPay: '', tolls: '', misc: '' })}
                variant="outlined"
                startIcon={<RefreshIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} lg={6}>
          <Stack spacing={2}>
            {/* Score card */}
            <Card sx={{
              border: '1px solid',
              borderColor: scoreConfig.borderColor,
              bgcolor: scoreConfig.bgcolor,
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <scoreConfig.Icon sx={{ fontSize: 28, color: scoreConfig.color }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: scoreConfig.color, opacity: 0.8 }}>
                      Profit Rating
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: scoreConfig.color }}>
                      {scoreConfig.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: scoreConfig.color, opacity: 0.7 }}>
                      {scoreConfig.tip}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Breakdown</Typography>
                <Stack spacing={0}>
                  {[
                    { label: 'Gross Rate', value: form.rate ? `$${parseFloat(form.rate).toLocaleString()}` : '—', color: 'text.primary' },
                    { label: 'Fuel Cost', value: form.rate ? `-$${calc.fuelCost.toLocaleString()}` : '—', color: 'error.main' },
                    { label: 'Other Expenses', value: form.rate ? `-$${(calc.totalExpenses - calc.fuelCost).toLocaleString()}` : '—', color: 'error.main' },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ color }}>{value}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                    <Typography variant="body1" fontWeight={700}>Net Profit</Typography>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{ color: calc.score === 'green' ? 'success.main' : calc.score === 'yellow' ? 'warning.main' : 'error.main' }}
                    >
                      {form.rate ? (calc.netProfit >= 0 ? '+' : '') + '$' + calc.netProfit.toLocaleString() : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Per-mile stats */}
            <Grid container spacing={2}>
              {[
                { label: 'Rate/Mile', value: form.rate ? `$${calc.ratePerMile}` : '—' },
                { label: 'Net/Mile', value: form.rate ? `$${calc.netPerMile}` : '—' },
                { label: 'Margin', value: form.rate ? `${calc.margin}%` : '—' },
              ].map(({ label, value }) => (
                <Grid item xs={4} key={label}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Tips */}
            {calc.score === 'red' && form.rate && (
              <Card sx={{ bgcolor: 'rgba(198,40,40,0.05)', border: '1px solid', borderColor: 'error.main' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="error.main">
                    <strong>Tip:</strong> Try negotiating the rate up, reducing deadhead miles, or waiting for a better load on this lane.
                  </Typography>
                </CardContent>
              </Card>
            )}
            {calc.score === 'yellow' && form.rate && (
              <Card sx={{ bgcolor: 'rgba(245,127,23,0.05)', border: '1px solid', borderColor: 'warning.main' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="warning.main">
                    <strong>Tip:</strong> Marginal load. Consider if you have a better option, or use this to reposition for a high-profit lane.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
