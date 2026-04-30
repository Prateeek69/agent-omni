import React from 'react';
import {
  History,
  PlusSquare,
  Trash2,
  Clock3,
} from 'lucide-react';

const navigationItems = [
  { id: 'new', label: 'New Analysis', icon: PlusSquare },
  { id: 'clear', label: 'Clear Data', icon: Trash2 },
];

function formatHistoryDate(value) {
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function Sidebar({
  mobileOpen,
  activePanel,
  historyItems,
  currentJobId,
  onCloseMobile,
  onSelectPanel,
  onNewAnalysis,
  onClearSession,
  onSelectHistory,
}) {
  const handleNavClick = (itemId) => {
    if (itemId === 'new') {
      onNewAnalysis();
      onCloseMobile();
    } else if (itemId === 'clear') {
      onClearSession();
      onCloseMobile();
    }
    
    onSelectPanel(itemId);
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-slate-200/70 bg-white/85 backdrop-blur-xl transition-[width] duration-300 ease-in-out lg:static lg:z-0 overflow-hidden w-[320px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-20 items-center border-b border-slate-100 px-6 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-0 transition-opacity duration-200">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              <p className="truncate text-base font-bold text-slate-900 leading-tight">Agent-Omni</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate transition-opacity duration-200">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Recent Activity</h4>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{historyItems.length}</span>
            </div>

            {historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                 <Clock3 className="mx-auto h-5 w-5 text-slate-300 mb-2" />
                 <p className="text-xs font-medium text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyItems.map((item) => {
                  const isSelected = currentJobId && item.final_output?.job_id === currentJobId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHistory(item)}
                      className={`w-full group rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                            {item.final_output?.primary_filename || 'Untitled'}
                          </p>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                            item.final_output?.confidence === 'high'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.final_output?.confidence === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}>
                            {item.final_output?.confidence || 'OK'}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-[10px] text-slate-500 font-medium">
                          {item.final_output?.summary || 'Processing details...'}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          <Clock3 className="h-3 w-3" />
                          {formatHistoryDate(item.createdAt)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}