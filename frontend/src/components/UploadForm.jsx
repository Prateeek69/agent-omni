import React, { useState } from 'react';
import { UploadCloud, File, X, Sparkles } from 'lucide-react';

export default function UploadForm({ onSubmit, isUploading }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file && !text.trim()) return;
    onSubmit(file, text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-100">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Start Analysis
        </h2>
        <p className="text-slate-500 text-sm mt-1">Upload a file or paste text to begin.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Document or Media</label>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">PDF, Image, or Audio</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <File className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Text Input Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Text Context (Optional)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste any additional text instructions here..."
            className="w-full h-32 p-3 text-sm text-slate-700 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-shadow"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={(!file && !text.trim()) || isUploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 text-sm"
          >
            {isUploading ? (
              <>Initiating...</>
            ) : (
              <>Analyze Request</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
