import React, { useState } from 'react';

export default function SeveritySlider({ onSelect, disabled = false }) {
  const [selected, setSelected] = useState(null);

  const getLabel = (val) => {
    if (val === 0) return '0 - None';
    if (val <= 3) return `${val} - Mild`;
    if (val <= 6) return `${val} - Moderate`;
    if (val <= 8) return `${val} - Severe`;
    return `${val} - Extreme`;
  };

  const getColorClass = (val) => {
    if (val <= 3) return 'hover:bg-emerald-50 hover:border-emerald-400 text-emerald-800';
    if (val <= 6) return 'hover:bg-amber-50 hover:border-amber-400 text-amber-800';
    return 'hover:bg-rose-50 hover:border-rose-400 text-rose-800';
  };

  const handleChoose = (val) => {
    setSelected(val);
    if (onSelect) {
      onSelect(`My symptom severity is ${val} out of 10 (${getLabel(val).split(' - ')[1]})`);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-2 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
        <span>Rate Severity (0 to 10):</span>
        <span className="text-slate-400 font-normal">0 = No discomfort, 10 = Worst imaginable</span>
      </div>
      <div className="grid grid-cols-11 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleChoose(num)}
            className={`py-2 text-center rounded-lg text-xs font-bold border transition-all ${
              selected === num
                ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                : `bg-white border-slate-200 ${getColorClass(num)}`
            } focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50`}
            title={getLabel(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}
