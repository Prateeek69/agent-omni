import React from 'react';

export default function ModeTabs({ modes, activeMode, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${
              isActive
                ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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