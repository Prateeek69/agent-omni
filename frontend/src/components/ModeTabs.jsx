import React from 'react';

export default function ModeTabs({ modes, activeMode, onChange }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}