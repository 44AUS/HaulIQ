import { useState, useMemo } from 'react';
import IonIcon from '../../components/IonIcon';

const cardStyle = { backgroundColor: 'var(--ion-card-background)', border: '1px solid var(--ion-border-color)', borderRadius: 8 };
const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--ion-input-background, rgba(0,0,0,0.04))', border: '1px solid var(--ion-border-color)', borderRadius: 6, color: 'var(--ion-text-color)', fontSize: '0.875rem', padding: '9px 12px', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.72rem', color: 'var(--ion-color-medium)', fontWeight: 600, display: 'block', marginBottom: 4 };

export default function ProfitCalculator() {
  const [form, setForm] = useState({
    rate: '', loadedMiles: '', deadheadMiles: '',
    fuelPrice: '3.85', mpg: '7.2',
    driverPay: '', tolls: '', misc: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const calc = useMemo(() => {
    const rate        = parseFloat(form.rate) || 0;
    const loadedMiles = parseFloat(form.loadedMiles) || 0;
    const deadMiles   = parseFloat(form.deadheadMiles) || 0;
    const fuelPrice   = parseFloat(form.fuelPrice) || 3.85;
    const mpg         = parseFloat(form.mpg) || 7.2;
    const driverPay   = parseFloat(form.driverPay) || 0;
    const tolls       = parseFloat(form.tolls) || 0;
    const misc        = parseFloat(form.misc) || 0;

    const totalMiles    = loadedMiles + deadMiles;
    const fuelCost      = (totalMiles / mpg) * fuelPrice;
    const totalExpenses = fuelCost + driverPay + tolls + misc;
    const netProfit     = rate - totalExpenses;
    const ratePerMile   = loadedMiles > 0 ? (rate / loadedMiles).toFixed(2) : 0;
    const netPerMile    = loadedMiles > 0 ? (netProfit / loadedMiles).toFixed(2) : 0;
    const margin        = rate > 0 ? ((netProfit / rate) * 100).toFixed(0) : 0;

    let score = 'red';
    if (netProfit > 1500 || (netPerMile > 2.5 && netProfit > 500)) score = 'green';
    else if (netProfit > 400) score = 'yellow';

    return { fuelCost: Math.round(fuelCost), totalExpenses: Math.round(totalExpenses), netProfit: Math.round(netProfit), ratePerMile, netPerMile, margin, score };
  }, [form]);

  const SCORE = {
    green:  { label: 'High Profit', icon: 'trending-up-outline',   color: '#2e7d32', bg: 'rgba(46,125,50,0.08)',   border: '#2e7d32', tip: 'This load is worth taking.' },
    yellow: { label: 'Marginal',    icon: 'remove-outline',        color: '#ed6c02', bg: 'rgba(245,127,23,0.08)',  border: '#ed6c02', tip: 'Barely profitable — negotiate if possible.' },
    red:    { label: 'Loss / Low',  icon: 'trending-down-outline', color: '#d32f2f', bg: 'rgba(198,40,40,0.08)',   border: '#d32f2f', tip: 'Avoid this load.' },
  }[calc.score];

  const fields = [
    { label: 'Rate Offered',     id: 'rate',          prefix: '$', placeholder: '2500' },
    { label: 'Loaded Miles',     id: 'loadedMiles',               placeholder: '450' },
    { label: 'Deadhead Miles',   id: 'deadheadMiles',             placeholder: '60',   hint: 'empty miles' },
    { label: 'Fuel Price',       id: 'fuelPrice',     prefix: '$', placeholder: '3.85', hint: 'per gallon' },
    { label: 'MPG',              id: 'mpg',                       placeholder: '7.2',  hint: 'your truck' },
    { label: 'Driver Pay',       id: 'driverPay',     prefix: '$', placeholder: '0',   hint: 'if applicable' },
    { label: 'Tolls',            id: 'tolls',         prefix: '$', placeholder: '0' },
    { label: 'Misc / Other',     id: 'misc',          prefix: '$', placeholder: '0' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IonIcon name="calculator-outline" style={{ color: 'var(--ion-color-primary)', fontSize: 26 }} />
          <h2 style={{ margin: 0, fontWeight: 700, color: 'var(--ion-text-color)' }}>Profit Calculator</h2>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>
          Calculate your real net profit before accepting any load
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
        {/* Inputs */}
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Load Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(({ label, id, prefix, placeholder, hint }) => (
              <div key={id}>
                <label style={labelStyle}>{hint ? `${label} (${hint})` : label}</label>
                {prefix ? (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ion-color-medium)', pointerEvents: 'none' }}>{prefix}</span>
                    <input style={{ ...inputStyle, paddingLeft: 22 }} type="number" value={form[id]} onChange={e => set(id, e.target.value)} placeholder={placeholder} />
                  </div>
                ) : (
                  <input style={inputStyle} type="number" value={form[id]} onChange={e => set(id, e.target.value)} placeholder={placeholder} />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setForm({ rate: '', loadedMiles: '', deadheadMiles: '', fuelPrice: '3.85', mpg: '7.2', driverPay: '', tolls: '', misc: '' })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 16, padding: '8px', background: 'none', border: '1px solid var(--ion-border-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--ion-text-color)' }}
          >
            <IonIcon name="refresh-outline" style={{ fontSize: 14 }} /> Reset
          </button>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score card */}
          <div style={{ ...cardStyle, padding: 16, backgroundColor: SCORE.bg, border: `1px solid ${SCORE.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IonIcon name={SCORE.icon} style={{ fontSize: 28, color: SCORE.color }} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: SCORE.color, display: 'block' }}>Profit Rating</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: SCORE.color, display: 'block' }}>{SCORE.label}</span>
                <span style={{ fontSize: '0.72rem', color: SCORE.color, opacity: 0.8 }}>{SCORE.tip}</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ ...cardStyle, padding: 16 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Breakdown</p>
            {[
              { label: 'Gross Rate',      value: form.rate ? `$${parseFloat(form.rate).toLocaleString()}` : '—',                     color: 'var(--ion-text-color)' },
              { label: 'Fuel Cost',       value: form.rate ? `-$${calc.fuelCost.toLocaleString()}` : '—',                            color: '#d32f2f' },
              { label: 'Other Expenses',  value: form.rate ? `-$${(calc.totalExpenses - calc.fuelCost).toLocaleString()}` : '—',    color: '#d32f2f' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--ion-border-color)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--ion-color-medium)' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16 }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ion-text-color)' }}>Net Profit</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: SCORE.color }}>
                {form.rate ? (calc.netProfit >= 0 ? '+' : '') + '$' + calc.netProfit.toLocaleString() : '—'}
              </span>
            </div>
          </div>

          {/* Per-mile stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Rate/Mile', value: form.rate ? `$${calc.ratePerMile}` : '—' },
              { label: 'Net/Mile',  value: form.rate ? `$${calc.netPerMile}`  : '—' },
              { label: 'Margin',    value: form.rate ? `${calc.margin}%`      : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ ...cardStyle, padding: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block' }}>{label}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ion-text-color)', display: 'block', marginTop: 4 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          {calc.score === 'red' && form.rate && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(198,40,40,0.05)', border: `1px solid ${SCORE.border}`, borderRadius: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                <strong>Tip:</strong> Try negotiating the rate up, reducing deadhead miles, or waiting for a better load on this lane.
              </span>
            </div>
          )}
          {calc.score === 'yellow' && form.rate && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(245,127,23,0.05)', border: `1px solid ${SCORE.border}`, borderRadius: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#ed6c02' }}>
                <strong>Tip:</strong> Marginal load. Consider if you have a better option, or use this to reposition for a high-profit lane.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
