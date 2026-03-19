import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Minus, TrendingDown, RefreshCw } from 'lucide-react';

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
    green:  { label: 'High Profit',  Icon: TrendingUp,   cls: 'bg-brand-500/10 border-brand-500/30 text-brand-400', bg: 'brand' },
    yellow: { label: 'Marginal',     Icon: Minus,         cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', bg: 'yellow' },
    red:    { label: 'Loss / Low',   Icon: TrendingDown,  cls: 'bg-red-500/10 border-red-500/30 text-red-400', bg: 'red' },
  }[calc.score];

  const Field = ({ label, id, placeholder, prefix, step = '1', hint }) => (
    <div>
      <label className="block text-dark-100 text-sm font-medium mb-1.5">{label} {hint && <span className="text-dark-400 text-xs">({hint})</span>}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 text-sm">{prefix}</span>}
        <input
          type="number" step={step} placeholder={placeholder}
          value={form[id]} onChange={e => set(id, e.target.value)}
          className={`input ${prefix ? 'pl-7' : ''}`}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator size={22} className="text-brand-400" /> Profit Calculator
        </h1>
        <p className="text-dark-300 text-sm mt-1">Calculate your real net profit before accepting any load</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="glass rounded-xl p-6 border border-dark-400/40 space-y-5">
          <h2 className="text-white font-semibold">Load Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rate Offered" id="rate" prefix="$" placeholder="2500" />
            <Field label="Loaded Miles" id="loadedMiles" placeholder="450" />
            <Field label="Deadhead Miles" id="deadheadMiles" placeholder="60" hint="empty miles" />
            <Field label="Fuel Price" id="fuelPrice" prefix="$" placeholder="3.85" step="0.01" hint="per gallon" />
            <Field label="MPG" id="mpg" placeholder="7.2" step="0.1" hint="your truck" />
            <Field label="Driver Pay" id="driverPay" prefix="$" placeholder="0" hint="if applicable" />
            <Field label="Tolls" id="tolls" prefix="$" placeholder="0" />
            <Field label="Misc / Other" id="misc" prefix="$" placeholder="0" />
          </div>
          <button onClick={() => setForm({ rate: '', loadedMiles: '', deadheadMiles: '', fuelPrice: '3.85', mpg: '7.2', driverPay: '', tolls: '', misc: '' })}
            className="btn-ghost flex items-center gap-1.5 text-sm w-full justify-center">
            <RefreshCw size={14} /> Reset
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Score card */}
          <div className={`rounded-xl p-6 border ${scoreConfig.cls} flex items-center gap-4`}>
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <scoreConfig.Icon size={28} />
            </div>
            <div>
              <p className="text-xs font-medium opacity-70">Profit Rating</p>
              <p className="text-2xl font-black mt-0.5">{scoreConfig.label}</p>
              <p className="text-xs opacity-60 mt-0.5">
                {calc.score === 'green' ? 'This load is worth taking.' : calc.score === 'yellow' ? 'Barely profitable — negotiate if possible.' : 'Avoid this load.'}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="glass rounded-xl p-6 border border-dark-400/40 space-y-4">
            <h2 className="text-white font-semibold">Breakdown</h2>
            {[
              { label: 'Gross Rate', value: form.rate ? `$${parseFloat(form.rate).toLocaleString()}` : '—', cls: 'text-white' },
              { label: 'Fuel Cost', value: form.rate ? `-$${calc.fuelCost.toLocaleString()}` : '—', cls: 'text-red-400' },
              { label: 'Other Expenses', value: form.rate ? `-$${(calc.totalExpenses - calc.fuelCost).toLocaleString()}` : '—', cls: 'text-red-400' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex justify-between py-2 border-b border-dark-400/20">
                <span className="text-dark-300 text-sm">{label}</span>
                <span className={`font-semibold text-sm ${cls}`}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <span className="text-white font-bold">Net Profit</span>
              <span className={`text-2xl font-black ${calc.score === 'green' ? 'text-brand-400' : calc.score === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                {form.rate ? (calc.netProfit >= 0 ? '+' : '') + '$' + calc.netProfit.toLocaleString() : '—'}
              </span>
            </div>
          </div>

          {/* Per-mile stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rate/Mile', value: form.rate ? `$${calc.ratePerMile}` : '—' },
              { label: 'Net/Mile', value: form.rate ? `$${calc.netPerMile}` : '—' },
              { label: 'Margin', value: form.rate ? `${calc.margin}%` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-lg p-3 text-center border border-dark-400/30">
                <p className="text-dark-300 text-xs">{label}</p>
                <p className="text-white font-bold text-lg mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Tips */}
          {calc.score === 'red' && form.rate && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-xs text-red-300/80 leading-relaxed">
              💡 <strong>Tip:</strong> Try negotiating the rate up, reducing deadhead miles, or waiting for a better load on this lane.
            </div>
          )}
          {calc.score === 'yellow' && form.rate && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-300/80 leading-relaxed">
              💡 <strong>Tip:</strong> Marginal load. Consider if you have a better option, or use this to reposition for a high-profit lane.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
