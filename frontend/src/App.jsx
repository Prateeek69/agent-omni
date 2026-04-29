import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileAudio2, FileImage, FileText, Menu, Sparkles, Type } from 'lucide-react';
import UploadForm from './components/UploadForm';
import Loader from './components/Loader';
import ResultView from './components/ResultView';
import Sidebar from './components/Sidebar';
import ModeTabs from './components/ModeTabs';
import SurfaceCard from './components/SurfaceCard';
import { uploadData, analyzeData } from './api';

const HISTORY_STORAGE_KEY = 'agent-omni-history-v1';
const PROCESS_STEPS = ['Uploading...', 'Extracting...', 'Cleaning...', 'Running AI...', 'Finalizing...'];

const MODES = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'image', label: 'Image', icon: FileImage },
  { id: 'audio', label: 'Audio', icon: FileAudio2 },
  { id: 'text', label: 'Text', icon: Type },
];

function readStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function modeLabel(modeId) {
  return MODES.find((mode) => mode.id === modeId)?.label.toLowerCase() || 'analysis';
}

function App() {
  const uploadSectionRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeMode, setActiveMode] = useState('pdf');
  const [historyItems, setHistoryItems] = useState(() => readStoredHistory());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('history');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingStartedAt, setLoadingStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loadingMode, setLoadingMode] = useState('analysis');

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
  }, [historyItems]);

  useEffect(() => {
    if (status !== 'loading' || !loadingStartedAt) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - loadingStartedAt);
    }, 120);

    return () => window.clearInterval(interval);
  }, [status, loadingStartedAt]);

  const currentJobId = resultData?.final_output?.job_id || '';

  const handleProcess = async ({ file, text, mode }) => {
    const startedAt = Date.now();
    let progressInterval = null;

    try {
      setStatus('loading');
      setErrorMessage('');
      setLoadingStep(0);
      setLoadingStartedAt(startedAt);
      setElapsedMs(0);
      setLoadingMode(modeLabel(mode));

      const uploadRes = await uploadData({ file, text });
      const jobId = uploadRes.job_id;

      if (!jobId) {
        throw new Error('Did not receive a valid job ID from the server.');
      }

      setLoadingStep(1);
      progressInterval = window.setInterval(() => {
        setLoadingStep((previous) => Math.min(previous + 1, PROCESS_STEPS.length - 2));
      }, 1150);

      const analyzeRes = await analyzeData(jobId);
      window.clearInterval(progressInterval);
      progressInterval = null;
      setLoadingStep(PROCESS_STEPS.length - 1);

      if (!analyzeRes?.final_output) {
        throw new Error('Received malformed result from server.');
      }

      const finalOutput = {
        ...analyzeRes.final_output,
        primary_filename: analyzeRes.final_output.primary_filename || uploadRes.file_name || (mode === 'text' ? 'Pasted Text' : 'Uploaded File'),
        primary_input_type: analyzeRes.final_output.primary_input_type || mode,
      };

      const record = {
        id: `${jobId}-${startedAt}`,
        createdAt: new Date().toISOString(),
        mode,
        final_output: finalOutput,
      };

      setResultData(record);
      setHistoryItems((previous) => {
        const next = [record, ...previous.filter((item) => item.final_output?.job_id !== jobId)];
        return next.slice(0, 12);
      });
      setStatus('success');
      setActivePanel('history');
    } catch (error) {
      if (progressInterval) {
        window.clearInterval(progressInterval);
      }

      console.error('Processing error:', error);
      let message = 'An unexpected error occurred.';
      let details = '';

      if (error.response) {
        message = error.response.data?.error || error.response.data?.detail || `Server error (${error.response.status})`;
        details = typeof error.response.data === 'object'
          ? JSON.stringify(error.response.data, null, 2)
          : String(error.response.data);
      } else if (error.request) {
        message = 'The server did not respond. Check if the backend is running and reachable.';
        details = 'The request was sent, but no response was returned to the browser.';
      } else {
        message = error.message;
      }

      setErrorMessage(`${message}${details ? ` - ${details}` : ''}`);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResultData(null);
    setErrorMessage('');
    setLoadingStartedAt(null);
    setElapsedMs(0);
  };

  const handleUploadFiles = () => {
    handleReset();
    setMobileSidebarOpen(false);
    window.requestAnimationFrame(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSelectHistory = (item) => {
    setResultData(item);
    setStatus('success');
    setMobileSidebarOpen(false);
  };

  const handleExportJson = () => {
    if (!resultData) {
      return;
    }

    const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${resultData.final_output?.primary_filename || 'agent-omni-analysis'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClearSession = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistoryItems([]);
    handleReset();
    setMobileSidebarOpen(false);
  };

  const heroMode = useMemo(() => MODES.find((mode) => mode.id === activeMode), [activeMode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.45),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(224,231,255,0.45),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#f3f6fb_100%)] text-slate-900 selection:bg-blue-100 selection:text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          activePanel={activePanel}
          historyItems={historyItems}
          currentJobId={currentJobId}
          onToggleCollapse={() => setSidebarCollapsed((previous) => !previous)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSelectPanel={setActivePanel}
          onNewAnalysis={handleReset}
          onUploadFiles={handleUploadFiles}
          onExportJson={handleExportJson}
          onClearSession={handleClearSession}
          onSelectHistory={handleSelectHistory}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[linear-gradient(90deg,_rgba(255,255,255,0.94),_rgba(239,246,255,0.86),_rgba(238,242,255,0.92))] backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <button type="button" onClick={handleReset} className="group inline-flex items-center gap-3 text-left">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 text-white shadow-[0_14px_28px_rgba(37,99,235,0.32)] transition-transform group-hover:scale-105">
                    <div className="absolute inset-[1px] rounded-[15px] border border-white/15" />
                    <span className="relative text-xl font-black tracking-tight">O</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-900">Agent-Omni</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Multimodal Intelligence</p>
                  </div>
                </button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="dot-pulse h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Local-first AI
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {status === 'idle' ? (
              <div className="space-y-8" ref={uploadSectionRef}>
                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                      <Sparkles className="h-4 w-4" />
                      Production-style multimodal workflow
                    </div>
                    <div className="space-y-4">
                      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                        Upload a document, image, audio clip, or plain text and get a polished AI analysis.
                      </h1>
                      <p className="max-w-2xl text-lg leading-8 text-slate-600">
                        The local pipeline extracts content, cleans noisy text, ranks the strongest information, and returns a presentation-ready summary with actions and raw traceability.
                      </p>
                    </div>
                    <ModeTabs modes={MODES} activeMode={activeMode} onChange={setActiveMode} />
                  </div>

                  <SurfaceCard
                    title={`${heroMode?.label || 'PDF'} mode`}
                    subtitle="Each input type goes through the same cleaned analysis pipeline, while keeping the UI tailored to the format you are working with."
                    icon={heroMode?.icon}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">What happens</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Upload, extract, clean, reason, and present the output with confidence-aware fallbacks.</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">Why it feels real</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">History, raw extracted text, export, staged loading, and modular UI components mirror a production desktop tool.</p>
                      </div>
                    </div>
                  </SurfaceCard>
                </section>

                <UploadForm key={activeMode} mode={activeMode} onSubmit={handleProcess} isUploading={false} />
              </div>
            ) : null}

            {status === 'loading' ? (
              <div className="mx-auto max-w-3xl">
                <SurfaceCard>
                  <Loader
                    steps={PROCESS_STEPS}
                    activeStep={loadingStep}
                    elapsedMs={elapsedMs}
                    modeLabel={loadingMode}
                  />
                </SurfaceCard>
              </div>
            ) : null}

            {status === 'error' ? (
              <div className="mx-auto max-w-2xl">
                <SurfaceCard title="Analysis Failed" subtitle="The request could not be completed with the current backend response.">
                  <div className="space-y-5">
                    <p className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-800">
                      {errorMessage}
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Try another analysis
                    </button>
                  </div>
                </SurfaceCard>
              </div>
            ) : null}

            {status === 'success' && resultData ? (
              <ResultView data={resultData} onReset={handleReset} />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;