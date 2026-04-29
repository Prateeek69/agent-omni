import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  PanelLeft,
  PlusSquare,
  Settings,
  Trash2,
  Upload,
  Clock3,
} from 'lucide-react';

const navigationItems = [
  { id: 'new', label: 'New Analysis', icon: PlusSquare },
  { id: 'history', label: 'History', icon: History },
  { id: 'upload', label: 'Upload Files', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'export', label: 'Export JSON', icon: Download },
  { id: 'clear', label: 'Clear Session', icon: Trash2 },
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
  collapsed,
  mobileOpen,
  activePanel,
  historyItems,
  currentJobId,
  onToggleCollapse,
  onCloseMobile,
  onSelectPanel,
  onNewAnalysis,
  onUploadFiles,
  onExportJson,
  onClearSession,
  onSelectHistory,
}) {
  const handleNavClick = (itemId) => {
    if (itemId === 'new') {
      onNewAnalysis();
      onCloseMobile();
      return;
    }
    if (itemId === 'upload') {
      onUploadFiles();
      onCloseMobile();
      return;
    }
    if (itemId === 'export') {
      onExportJson();
      onCloseMobile();
      return;
    }
    if (itemId === 'clear') {
      onClearSession();
      onCloseMobile();
      return;
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
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-slate-200/70 bg-white/85 backdrop-blur-xl transition-all duration-300 lg:static lg:z-0 ${
          collapsed ? 'w-[92px]' : 'w-[300px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className={`flex items-center gap-3 transition-all ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_10px_25px_rgba(37,99,235,0.35)]">
              <PanelLeft className="h-5 w-5" />
            </div>
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace</p>
                <p className="text-base font-semibold text-slate-900">Agent-Omni</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 lg:inline-flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${collapsed ? 'justify-center lg:px-0' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          {!collapsed && activePanel === 'history' ? (
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recent Analyses</h4>
                <span className="text-xs text-slate-400">{historyItems.length}</span>
              </div>

              {historyItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Your recent analyses will appear here.
                </div>
              ) : (
                historyItems.map((item) => {
                  const isSelected = currentJobId && item.final_output?.job_id === currentJobId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectHistory(item)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-blue-200 bg-blue-50 shadow-[0_10px_28px_rgba(59,130,246,0.12)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.final_output?.primary_filename || 'Untitled analysis'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {item.final_output?.summary || 'No summary stored yet.'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          item.final_output?.confidence === 'high'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.final_output?.confidence === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}>
                          {item.final_output?.confidence || 'saved'}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatHistoryDate(item.createdAt)}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}

          {!collapsed && activePanel === 'settings' ? (
            <div className="mt-8 space-y-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">System Preferences</h4>
                <p className="mt-1 text-xs text-slate-500">Local toggles for the current workstation.</p>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span>Direct PDF extraction</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Enabled</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span>History storage</span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">LocalStorage</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}