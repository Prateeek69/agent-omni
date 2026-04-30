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
    setActivePanel('new');
  };

  const handleSelectHistory = (item) => {
    setResultData(item);
    setStatus('success');
    setMobileSidebarOpen(false);
    setActivePanel('history');
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
          mobileOpen={mobileSidebarOpen}
          activePanel={activePanel}
          historyItems={historyItems}
          currentJobId={currentJobId}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSelectPanel={setActivePanel}
          onNewAnalysis={handleReset}
          onClearSession={handleClearSession}
          onSelectHistory={handleSelectHistory}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
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
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden border border-slate-100 transition-transform group-hover:scale-105">
                    <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1.5" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xl font-bold tracking-tight text-slate-900">Agent-Omni</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">File Analysis Tool</p>
                  </div>
                </button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                <span className="dot-pulse h-2 w-2 rounded-full bg-emerald-500" />
                Runs Locally
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            {status === 'idle' ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500" ref={uploadSectionRef}>
                <section className="w-full">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl leading-[1.1]">
                        Understand your documents
                      </h1>
                      <p className="max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
                        Upload PDFs, images, or audio. Extract key information, summaries, and useful details everything processed locally.
                      </p>
                    </div>
                    <ModeTabs modes={MODES} activeMode={activeMode} onChange={setActiveMode} />
                  </div>
                </section>

                <UploadForm key={activeMode} mode={activeMode} onSubmit={handleProcess} isUploading={false} />
              </div>
            ) : null}

            {status === 'loading' ? (
              <div className="mx-auto max-w-2xl animate-in zoom-in-95 duration-300">
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
              <div className="mx-auto max-w-2xl animate-in shake duration-500">
                <SurfaceCard title="Analysis Failed" subtitle="The request could not be completed at this time.">
                  <div className="space-y-6">
                    <p className="rounded-2xl border border-rose-100 bg-rose-50/50 px-5 py-5 text-sm font-medium leading-relaxed text-rose-800">
                      {errorMessage}
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex rounded-2xl bg-slate-900 px-8 py-4 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-950/20"
                    >
                      Return to Workspace
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