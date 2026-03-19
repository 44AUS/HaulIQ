import React, { useState } from 'react';
import { MapPin, ArrowRight, Bookmark, BookmarkCheck, Zap, TrendingUp, Minus, TrendingDown, Clock, Weight, Truck, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrokerRating from '../shared/BrokerRating';

export default function LoadCard({ load, onSave }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(load.saved);

  const profitColor = {
    green:  'border-brand-500/20 hover:border-brand-500/40',
    yellow: 'border-yellow-500/20 hover:border-yellow-500/40',
    red:    'border-red-500/20 hover:border-red-500/40',
  }[load.profitScore];

  const ProfitIcon = { green: TrendingUp, yellow: Minus, red: TrendingDown }[load.profitScore];
  const profitText = { green: 'text-brand-400', yellow: 'text-yellow-400', red: 'text-red-400' }[load.profitScore];

  const handleSave = (e) => {
    e.stopPropagation();
    setSaved(!saved);
    onSave && onSave(load.id, !saved);
  };

  return (
    <div
      onClick={() => navigate(`/carrier/loads/${load.id}`)}
      className={`glass rounded-xl p-5 border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${profitColor} animate-fade-in`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {load.hot && (
            <span className="badge-red flex items-center gap-1"><Zap size={10} />Hot Load</span>
          )}
          <span className="badge-blue flex items-center gap-1"><Truck size={10} />{load.type}</span>
          <span className="text-dark-300 text-xs">{load.posted}</span>
        </div>
        <button onClick={handleSave} className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-brand-400 bg-brand-500/10' : 'text-dark-300 hover:text-white hover:bg-dark-500'}`}>
          {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-dark-300 text-xs mb-1">
            <MapPin size={10} /> Origin
          </div>
          <p className="text-white font-semibold text-sm truncate">{load.origin}</p>
        </div>
        <div className="flex flex-col items-center">
          <ArrowRight size={16} className="text-dark-400" />
          <span className="text-dark-300 text-xs mt-0.5">{load.miles}mi</span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-1 text-dark-300 text-xs mb-1">
            <MapPin size={10} /> Dest
          </div>
          <p className="text-white font-semibold text-sm truncate">{load.dest}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between mb-4 text-xs text-dark-400">
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Pickup: <span className="text-dark-200">{load.pickup}</span></span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={10} />
          <span>Drop: <span className="text-dark-200">{load.delivery}</span></span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Rate</p>
          <p className="text-white font-bold text-sm">${load.rate.toLocaleString()}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Per Mile</p>
          <p className="text-white font-bold text-sm">${load.ratePerMile}</p>
        </div>
        <div className="bg-dark-700/50 rounded-lg p-2.5 text-center">
          <p className="text-dark-300 text-xs mb-0.5">Net Profit</p>
          <p className={`font-bold text-sm ${profitText}`}>${load.netProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <BrokerRating broker={load.broker} compact />
        <div className="flex items-center gap-1">
          <ProfitIcon size={13} className={profitText} />
          <span className={`text-xs font-semibold ${profitText}`}>
            {{ green: 'High Profit', yellow: 'Marginal', red: 'Loss Risk' }[load.profitScore]}
          </span>
        </div>
      </div>

      {/* Deadhead warning */}
      {load.deadhead > 60 && (
        <div className="mt-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
          <p className="text-yellow-400 text-xs">⚠️ {load.deadhead} mi deadhead — reduces net profit</p>
        </div>
      )}
    </div>
  );
}
