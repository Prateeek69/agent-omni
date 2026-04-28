import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import Loader from './components/Loader';
import ResultView from './components/ResultView';
import { uploadData, analyzeData } from './api';

function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleProcess = async (file, text) => {
    try {
      setStatus('loading');
      setErrorMessage('');
      setLoadingMessage('Uploading document and initiating job...');

      // 1. Upload
      const uploadRes = await uploadData(file, text);
      const jobId = uploadRes.job_id;

      if (!jobId) {
        throw new Error("Did not receive a valid job ID from the server.");
      }

      setLoadingMessage('Analysis in progress. This may take a moment...');

      // 2. Analyze
      const analyzeRes = await analyzeData(jobId);
      
      if (!analyzeRes || !analyzeRes.final_output) {
        throw new Error("Received malformed result from server.");
      }

      setResultData(analyzeRes);
      setStatus('success');
    } catch (err) {
      console.error("Processing error:", err);
      let msg = "An unexpected error occurred.";
      let details = "";

      if (err.response) {
        // Server responded with non-2xx
        msg = err.response.data?.error || err.response.data?.detail || `Server error (${err.response.status})`;
        details = typeof err.response.data === 'object' ? JSON.stringify(err.response.data, null, 2) : String(err.response.data);
      } else if (err.request) {
        // Request made but no response
        msg = "The server did not respond. Check if the backend is running and CORS is allowed.";
        details = "The request was sent but timed out or was blocked by the browser (CORS).";
      } else {
        msg = err.message;
      }

      setErrorMessage(`${msg}${details ? ' - ' + details : ''}`);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResultData(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 fixed top-0 w-full z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none tracking-tighter">O</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
              Agent-Omni
            </h1>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
            Local-first AI
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto pt-28 pb-12 px-6">
        {status === 'idle' && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-800 sm:text-4xl">Multimodal Analysis</h2>
              <p className="mt-4 text-lg text-slate-500">
                Upload your files or enter your context below to let the AI orchestrate a full reasoning pipeline.
              </p>
            </div>
            <UploadForm onSubmit={handleProcess} isUploading={false} />
          </div>
        )}

        {status === 'loading' && (
          <div className="mt-16 bg-white max-w-xl mx-auto rounded-2xl shadow-sm border border-slate-200 p-8">
            <Loader message={loadingMessage} />
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-xl mx-auto text-center py-10 px-6 bg-white rounded-2xl border border-red-200 shadow-sm">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Analysis Failed</h3>
            <p className="text-sm text-slate-500 mb-6">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go back and try again
            </button>
          </div>
        )}

        {status === 'success' && resultData && (
          <ResultView data={resultData} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
