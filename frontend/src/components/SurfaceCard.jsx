import React from 'react';

export default function SurfaceCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  contentClassName = '',
}) {
  return (
    <section className={`rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div>
              {title ? <h3 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h3> : null}
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={`px-6 py-6 sm:px-7 ${contentClassName}`}>{children}</div>
    </section>
  );
}