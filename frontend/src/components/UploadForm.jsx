import React, { useEffect, useMemo, useState } from 'react';
import { FileAudio2, FileImage, FileText, Sparkles, Type, UploadCloud, X } from 'lucide-react';
import SurfaceCard from './SurfaceCard';

const modeConfig = {
  pdf: {
    title: 'Upload a PDF document',
    description: 'Extract text, clean formatting, and generate a structured summary with key actions.',
    accept: '.pdf',
    icon: FileText,
    fileLabel: 'PDF file',
    placeholder: 'Optional context: tell the AI what matters most in this document.',
    buttonLabel: 'Analyze PDF',
  },
  image: {
    title: 'Upload an image',
    description: 'Run OCR on images, clean the text, and describe the most important information.',
    accept: 'image/*',
    icon: FileImage,
    fileLabel: 'Image file',
    placeholder: 'Optional context: mention what you want extracted from this image.',
    buttonLabel: 'Analyze Image',
  },
  audio: {
    title: 'Upload an audio clip',
    description: 'Transcribe supported audio, clean the transcript, and summarize the important points.',
    accept: '.mp3,.wav,.m4a',
    icon: FileAudio2,
    fileLabel: 'Audio file',
    placeholder: 'Optional context: mention the purpose of this recording or what to focus on.',
    buttonLabel: 'Analyze Audio',
  },
  text: {
    title: 'Paste text directly',
    description: 'Send raw text through the same cleaning and reasoning pipeline without uploading a file.',
    accept: '',
    icon: Type,
    fileLabel: 'Text input',
    placeholder: 'Paste your text here...',
    buttonLabel: 'Analyze Text',
  },
};

export default function UploadForm({ mode, onSubmit, isUploading }) {
  const config = useMemo(() => modeConfig[mode] || modeConfig.pdf, [mode]);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [context, setContext] = useState('');

  useEffect(() => {
    setFile(null);
    setText('');
    setContext('');
  }, [mode]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payloadText = mode === 'text'
      ? text.trim()
      : [context.trim(), text.trim()].filter(Boolean).join('\n\n');

    if (!file && !payloadText) {
      return;
    }

    onSubmit({
      file,
      text: payloadText,
      mode,
    });
  };

  const Icon = config.icon;
  const canSubmit = mode === 'text' ? Boolean(text.trim()) : Boolean(file || context.trim() || text.trim());

  return (
    <SurfaceCard
      title={config.title}
      subtitle={config.description}
      icon={Icon}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode !== 'text' ? (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">{config.fileLabel}</label>
            {!file ? (
              <label className="group flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_58%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.95))] px-6 py-10 text-center transition-all hover:border-blue-300 hover:shadow-[0_12px_30px_rgba(59,130,246,0.12)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] group-hover:scale-105 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="mt-5 space-y-2">
                  <p className="text-base font-semibold text-slate-900">Drop a file here or click to browse</p>
                  <p className="text-sm text-slate-500">Supported input: {config.accept === 'image/*' ? 'PNG, JPG, JPEG' : config.accept.replaceAll(',', ', ')}</p>
                </div>
                <input type="file" accept={config.accept} className="hidden" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-[24px] border border-blue-200 bg-blue-50/70 px-5 py-4 shadow-[0_10px_24px_rgba(59,130,246,0.10)]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="ml-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className={mode === 'text' ? 'lg:col-span-2' : ''}>
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              {mode === 'text' ? 'Input text' : 'Focus instructions'}
            </label>
            <textarea
              value={mode === 'text' ? text : context}
              onChange={(event) => (mode === 'text' ? setText(event.target.value) : setContext(event.target.value))}
              placeholder={config.placeholder}
              className={`w-full rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100 ${mode === 'text' ? 'min-h-[200px]' : 'min-h-[150px]'}`}
            />
          </div>

          {mode !== 'text' ? (
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">Additional notes</label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Optional: add context, expected output, or constraints."
                className="min-h-[150px] w-full rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Multimodal pipeline: upload, clean, reason, summarize.
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isUploading}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? 'Processing...' : config.buttonLabel}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}