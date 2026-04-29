import React, { useRef, useState } from 'react';
import { Upload, X, Zap } from 'lucide-react';
import SurfaceCard from './SurfaceCard';

export default function UploadForm({ mode, onSubmit, isUploading }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleReset = () => {
    setFile(null);
    setText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) return;
    if (mode !== 'text' && !file) return;
    onSubmit({ file, text, mode });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'text' ? (
        <SurfaceCard title="Input Text" subtitle="Enter or paste text to analyze.">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type content here..."
            className="h-48 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm outline-none transition focus:border-blue-400 lg:h-64"
          />
        </SurfaceCard>
      ) : (
        <SurfaceCard title="Upload File" subtitle="Drag and drop a file, or click to browse.">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`flex min-h-[180px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed transition-all lg:min-h-[220px] ${
              isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50/40'
            } ${file ? 'cursor-default' : 'cursor-pointer hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={mode === 'pdf' ? '.pdf' : mode === 'image' ? 'image/*' : 'audio/*'}
            />

            {!file ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No file selected</p>
                  <p className="mt-1 text-xs text-slate-500">Up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="flex w-full max-w-sm flex-col gap-4 p-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isUploading || (mode === 'text' ? !text.trim() : !file)}
          className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-4 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? 'Processing...' : 'Analyze'}
          <Zap className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}