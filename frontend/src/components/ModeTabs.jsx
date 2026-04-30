import React from 'react';

export default function ModeTabs({ modes, activeMode, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4 lg:grid lg:grid-cols-4">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 text-base font-bold transition-all ${
              isActive
                ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Icon className="h-5 w-5" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}