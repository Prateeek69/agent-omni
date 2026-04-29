import React from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function Loader({ steps = [], activeStep = 0, elapsedMs = 0, modeLabel = 'analysis' }) {
  const elapsedSeconds = Math.max(0, elapsedMs / 1000).toFixed(1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_35%,_rgba(96,165,250,0.45),_rgba(15,23,42,0.92))] shadow-[0_22px_55px_rgba(15,23,42,0.22)]">
          <div className="absolute inset-0 rounded-full border border-white/15" />
          <div className="absolute inset-2 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
          <Sparkles className="h-9 w-9 text-white animate-pulse" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Processing {modeLabel}</h3>
        <p className="mt-2 text-sm text-slate-500">Analyzing your file locally.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          {elapsedSeconds}s elapsed
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isComplete = index < activeStep;
          const isActive = index === activeStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50'
                  : isActive
                    ? 'border-blue-200 bg-blue-50 shadow-[0_10px_24px_rgba(59,130,246,0.12)]'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isComplete ? 'bg-emerald-100 text-emerald-700' : isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-bold">{index + 1}</span>}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step}</p>
                <p className="text-xs text-slate-500">
                  {isComplete ? 'Completed' : isActive ? 'In progress' : 'Queued'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}