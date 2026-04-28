import React, { useState } from 'react';
import { Copy, CheckCircle, ShieldCheck, CheckSquare, List, Link as LinkIcon, AlertCircle, Briefcase, Calendar, Building2, User, Zap } from 'lucide-react';

export default function ResultView({ data, onReset }) {
  const [copied, setCopied] = useState(false);

  const { 
    final_answer, 
    summary, 
    key_points, 
    actions, 
    sources, 
    confidence, 
    issues,
    document_type,
    important_entities
  } = data?.final_output || {};

  const handleCopy = () => {
    const textToCopy = `FINAL ANSWER:\n${final_answer || ''}\n\nSUMMARY:\n${summary || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (conf = '') => {
    const c = conf.toLowerCase();
    if (c.includes('high')) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (c.includes('low')) return 'text-red-700 bg-red-100 border-red-200';
    return 'text-amber-700 bg-amber-100 border-amber-200';
  };

  const formatSource = (src) => {
    try {
      const parts = src.split(/[/\\]/);
      return parts[parts.length - 1];
    } catch (e) {
      return src;
    }
  };

  if (!final_answer && !summary && (!key_points || key_points.length === 0)) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 bg-white rounded-3xl shadow-sm border border-slate-200 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-100 flex items-center justify-center rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Content Extracted</h3>
        <p className="text-slate-500 mb-6">We couldn't extract any meaningful insights from the provided document.</p>
        <button onClick={onReset} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
          Try Another File
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section with Final Answer */}
      <div className="bg-white rounded-3xl shadow-md shadow-slate-200/50 border border-slate-200 overflow-hidden transition-all hover:shadow-lg">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Final Assessment</h2>
            {document_type && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-widest shadow-sm">
                {document_type}
              </span>
            )}
          </div>
          {confidence && (
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm flex items-center gap-1.5 ${getConfidenceColor(confidence)}`}>
              <ShieldCheck className="w-4 h-4" />
              {confidence}
            </div>
          )}
        </div>
        <div className="p-8 bg-gradient-to-b from-white to-slate-50/50">
          <div className="prose prose-blue max-w-none text-slate-800 whitespace-pre-wrap text-[1.1rem] leading-relaxed font-medium">
            {final_answer || "No final answer provided."}
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 font-bold transition-all shadow-sm active:scale-95"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Summary & Answer"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {summary && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md shadow-slate-200/50 transition-all border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <List className="w-6 h-6 text-indigo-500" />
                Summary
              </h3>
              <p className="text-[0.95rem] text-slate-600 leading-relaxed font-medium">
                {summary}
              </p>
            </div>
          )}

          {key_points && key_points.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md shadow-slate-200/50 transition-all border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                Key Points
              </h3>
              <div className="space-y-4">
                {key_points.map((point, index) => (
                  <div key={index} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/60 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-100" />
                    </div>
                    <span className="text-[0.95rem] text-slate-700 leading-relaxed font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">

          {important_entities && (important_entities.dates?.length > 0 || important_entities.organizations?.length > 0 || important_entities.names?.length > 0) && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md shadow-slate-200/50 transition-all border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-purple-500" />
                Important Info
              </h3>
              <div className="space-y-6">
                {important_entities.dates?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-slate-400"/> Dates
                    </h4>
                    <ul className="text-[0.95rem] text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      {important_entities.dates.map((d, i) => <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>{d}</li>)}
                    </ul>
                  </div>
                )}
                {important_entities.organizations?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase tracking-wider">
                      <Building2 className="w-4 h-4 text-slate-400"/> Organizations
                    </h4>
                    <ul className="text-[0.95rem] text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      {important_entities.organizations.map((o, i) => <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>{o}</li>)}
                    </ul>
                  </div>
                )}
                {important_entities.names?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 uppercase tracking-wider">
                      <User className="w-4 h-4 text-slate-400"/> Names
                    </h4>
                    <ul className="text-[0.95rem] text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      {important_entities.names.map((n, i) => <li key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>{n}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {actions && actions.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md shadow-slate-200/50 transition-all border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-blue-500" />
                Suggested Actions
              </h3>
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <label key={index} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white transition-all cursor-pointer group">
                    <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-1 transition-colors cursor-pointer" />
                    <span className="text-[0.95rem] text-slate-700 group-hover:text-slate-900 font-medium leading-relaxed">{action}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {sources && sources.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm hover:shadow-md shadow-slate-200/50 transition-all border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-blue-500" />
                Sources
              </h3>
              <div className="space-y-3">
                {sources.map((src, index) => (
                  <a key={index} href={`file://${src.source}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group text-sm overflow-hidden" title={src.source}>
                    <span className="px-2 py-1 rounded bg-slate-200 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700 text-xs font-bold uppercase tracking-wider shrink-0">{src.type}</span>
                    <span className="truncate text-slate-700 group-hover:text-blue-700 font-medium">{formatSource(src.source)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {issues && issues.length > 0 && (
            <div className="bg-red-50 rounded-3xl shadow-sm hover:shadow-md transition-all border border-red-100 p-8">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Issues Detected
              </h3>
              <ul className="space-y-3 mt-4">
                {issues.map((issue, index) => (
                  <li key={index} className="flex gap-3 text-sm text-red-700 font-medium bg-white/60 p-3 rounded-xl">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-4">
        <button 
          onClick={onReset}
          className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full md:w-auto"
        >
          Analyze Another File
        </button>
      </div>
    </div>
  );
}
