import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileAudio2,
  FileImage,
  FileText,
  ShieldCheck,
  Sparkles,
  Target,
  Type,
  WandSparkles,
  Zap,
} from 'lucide-react';
import SurfaceCard from './SurfaceCard';

const inputIcons = {
  pdf: FileText,
  image: FileImage,
  audio: FileAudio2,
  text: Type,
};

const pointIcons = [Zap, Sparkles, Target, CheckCircle2, WandSparkles];

function toTitleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function confidenceClasses(confidence = '') {
  const normalized = confidence.toLowerCase();
  if (normalized === 'high') return 'border-emerald-200 bg-emerald-100 text-emerald-700';
  if (normalized === 'medium') return 'border-amber-200 bg-amber-100 text-amber-700';
  return 'border-rose-200 bg-rose-100 text-rose-700';
}

function summarizeWords(value = '') {
  return (value.match(/\b\w+\b/g) || []).length;
}

function formatKeyPoint(point, index) {
  const cleaned = point.replace(/\s+/g, ' ').trim();
  const splitByColon = cleaned.split(/:\s+(.+)/).filter(Boolean);

  if (splitByColon.length >= 2) {
    return {
      title: splitByColon[0],
      description: splitByColon[1],
      icon: pointIcons[index % pointIcons.length],
    };
  }

  const words = cleaned.split(' ');
  return {
    title: words.slice(0, Math.min(6, words.length)).join(' '),
    description: words.slice(Math.min(6, words.length)).join(' ') || cleaned,
    icon: pointIcons[index % pointIcons.length],
  };
}

function describeAction(action) {
  const lower = action.toLowerCase();

  if (lower.includes('ats')) {
    return 'Estimate how well the document will perform in automated screening systems.';
  }
  if (lower.includes('cover letter')) {
    return 'Turn this analysis into a tailored companion document for applications.';
  }
  if (lower.includes('wording')) {
    return 'Refine tone, clarity, and impact so the language sounds stronger and more polished.';
  }
  if (lower.includes('resume bullets')) {
    return 'Convert the strongest evidence into concise achievement bullets for future reuse.';
  }
  if (lower.includes('highlight academic achievements')) {
    return 'Surface the best scores, ranks, and outcomes so they are easier to present elsewhere.';
  }
  if (lower.includes('marks or scores')) {
    return 'Organize scores into a quick, interview-friendly snapshot.';
  }
  if (lower.includes('deadlines')) {
    return 'Pull out dates, timelines, and scheduling pressure points from the document.';
  }
  if (lower.includes('action items')) {
    return 'Convert the content into a short follow-up checklist.';
  }

  return 'Use this next step to deepen or repurpose the current analysis.';
}

export default function ResultView({ data, onReset }) {
  const [copied, setCopied] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const {
    summary = '',
    key_points: keyPoints = [],
    actions = [],
    confidence = 'low',
    issues = [],
    raw_extracted_text: rawExtractedText = '',
    primary_filename: primaryFilename = 'Pasted Text',
    primary_input_type: primaryInputType = 'text',
    processing_time_seconds: processingTimeSeconds = 0,
    word_count: backendWordCount = 0,
    document_type: documentType = 'general pdf',
  } = data?.final_output || {};

  const InputIcon = inputIcons[primaryInputType] || FileText;
  const cleanedSummary = summary.trim();
  const derivedWordCount = backendWordCount || summarizeWords(rawExtractedText || cleanedSummary);
  const noisySummary = useMemo(() => {
    if (!cleanedSummary) return true;
    const alphaChars = (cleanedSummary.match(/[A-Za-z]/g) || []).length;
    return /scanned with|print|exit/i.test(cleanedSummary) || alphaChars / Math.max(cleanedSummary.length, 1) < 0.55;
  }, [cleanedSummary]);

  const shouldUseFallbackSummary = !cleanedSummary || (confidence === 'low' && noisySummary);
  const displaySummary = shouldUseFallbackSummary
    ? 'Structured summary unavailable. Displaying extracted key information.'
    : cleanedSummary;

  const keyPointCards = keyPoints.map((point, index) => formatKeyPoint(point, index));
  const hasUsefulContent = displaySummary || keyPointCards.length > 0 || actions.length > 0;

  const handleCopy = async () => {
    const payload = [
      `Summary: ${displaySummary}`,
      keyPoints.length ? `Key Points:\n- ${keyPoints.join('\n- ')}` : '',
      actions.length ? `Actions:\n- ${actions.join('\n- ')}` : '',
    ].filter(Boolean).join('\n\n');

    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!hasUsefulContent) {
    return (
      <SurfaceCard title="No Content Extracted" subtitle="We could not recover enough reliable text from the current input.">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <p className="text-sm text-slate-500">Try a clearer file, a higher-resolution image, or add more context before rerunning the analysis.</p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Analyze Another File
          </button>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-8">
      <SurfaceCard
        title="Analysis Summary"
        subtitle="A cleaned, human-readable view of the most important information extracted from your input."
        icon={Sparkles}
        action={
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${confidenceClasses(confidence)}`}>
            <ShieldCheck className="h-4 w-4" />
            {confidence || 'low'} confidence
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                <InputIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{primaryFilename}</p>
                <p className="mt-1 text-xs text-slate-500">{toTitleCase(documentType)} · {toTitleCase(primaryInputType)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">Processed in {Number(processingTimeSeconds || 0).toFixed(1)}s</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-sm">{derivedWordCount} words extracted</span>
            </div>
          </div>

          <div className={`rounded-[26px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${shouldUseFallbackSummary ? 'border-amber-200 bg-amber-50/90' : 'border-slate-200 bg-white'}`}>
            <p className={`text-[1.05rem] leading-8 ${shouldUseFallbackSummary ? 'text-amber-900' : 'text-slate-800'}`}>
              {displaySummary}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {issues.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {issues.slice(0, 2).map((issue) => (
                  <span key={issue} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
                    {issue}
                  </span>
                ))}
              </div>
            ) : <div />}

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy Summary'}
            </button>
          </div>

          {rawExtractedText ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setShowRawText((previous) => !previous)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">Raw Extracted Text</p>
                  <p className="mt-1 text-xs text-slate-500">Inspect the cleaned extraction that powered the summary.</p>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${showRawText ? 'rotate-180' : ''}`} />
              </button>
              {showRawText ? (
                <div className="border-t border-slate-200 px-5 py-4">
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100 shadow-inner">
                    {rawExtractedText}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard
          title="Key Points"
          subtitle="Short, scan-friendly takeaways extracted from the document."
          icon={CheckCircle2}
        >
          <div className="space-y-4">
            {keyPointCards.length > 0 ? keyPointCards.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={`${point.title}-${index}`}
                  className="group rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.95))] p-4 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{point.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{point.description}</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-500">Key points were not available for this analysis.</p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Suggested Actions"
          subtitle="Recommended next steps based on the detected document type."
          icon={WandSparkles}
        >
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action}
                className="group rounded-[24px] border border-slate-200 bg-white p-4 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_35px_rgba(59,130,246,0.10)]"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{action}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{describeAction(action)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="flex justify-center pb-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_26px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Analyze Another File
        </button>
      </div>
    </div>
  );
}