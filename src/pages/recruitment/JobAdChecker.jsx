import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanSearch, AlertTriangle, CheckCircle2, Sparkles, Copy, RotateCcw, Info } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Input';
import { Skeleton } from '../../components/shared/LoadingSpinner';
import { checkJobAdBias, isGroqConfigured } from '../../lib/groq';
import { cn } from '../../lib/utils';

const SAMPLE_BIASED_JD = `We're looking for a young and energetic Marketing Executive to join our growing team in Lagos. The ideal candidate is a true rockstar and social media ninja who is a digital native, always plugged into the latest trends.

This role is perfect for a recent graduate looking to make their mark. He/she must be a native English speaker with a strong command of English, both written and spoken, and should demonstrate strong culture fit with our work hard, play hard environment.

Responsibilities:
- Plan and execute social media campaigns across all platforms
- Man the front desk during community events and product launches
- Report directly to the Chairman of the marketing committee

Requirements:
- Bachelor's degree in Marketing, Communications or a related field
- Must be under 30 years old
- Excellent communication and organizational skills
- Comfortable working in a fast-paced startup environment`;

const CATEGORY_STYLES = {
  Ageist: 'bg-warning-50 border-warning-400 text-warning-700',
  Gendered: 'bg-accent-50 border-accent-400 text-accent-700',
  Cultural: 'bg-primary-50 border-primary-400 text-primary-700',
  Exclusionary: 'bg-danger-50 border-danger-400 text-danger-700',
};

const SCORE_VARIANT = { Low: 'success', Medium: 'warning', High: 'danger' };

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function JobAdChecker() {
  const [jdText, setJdText] = useState(SAMPLE_BIASED_JD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleScan = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await checkJobAdBias(jdText);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJdText(SAMPLE_BIASED_JD);
    setResult(null);
  };

  const handleCopy = async () => {
    if (!result?.rewritten_jd) return;
    try {
      await navigator.clipboard.writeText(result.rewritten_jd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const handleApplyRewrite = () => {
    if (!result?.rewritten_jd) return;
    setJdText(result.rewritten_jd);
    setResult(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: input */}
        <Card className="space-y-4">
          <CardHeader title="Job Description" subtitle="Paste a job ad to scan for biased or exclusionary language" />
          <Textarea
            rows={16}
            value={jdText}
            onChange={(e) => { setJdText(e.target.value); setResult(null); }}
            className="font-mono text-xs"
            placeholder="Paste the job description here..."
          />
          <div className="flex gap-3">
            <Button onClick={handleScan} loading={loading} disabled={!jdText.trim()} className="flex-1">
              <ScanSearch size={16} /> {loading ? 'Scanning...' : 'Scan for Bias'}
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw size={16} /> Reset Sample
            </Button>
          </div>
          {!isGroqConfigured && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Info size={14} className="shrink-0" />
              Demo mode: using an offline pattern-matching scanner. Add <code className="font-mono">VITE_GROQ_API_KEY</code> for live LLaMA 3.3 70B analysis.
            </div>
          )}
        </Card>

        {/* Right: analysis */}
        <Card>
          <CardHeader
            title="Bias Analysis"
            subtitle="Flagged phrases highlighted directly in the text"
            action={
              result && (
                <Badge variant={SCORE_VARIANT[result.bias_score]} className="text-sm px-3 py-1.5">
                  {result.bias_score} Bias Risk
                </Badge>
              )
            }
          />

          {loading ? (
            <div className="space-y-3">
              {isGroqConfigured && (
                <p className="text-center text-xs text-slate-400 animate-pulse pb-1">
                  Calling Groq LLaMA 3.3 70B — this can take up to 15-20 seconds...
                </p>
              )}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 max-h-72 overflow-y-auto scrollbar-thin">
                <HighlightedText text={jdText} phrases={result.biased_phrases} />
              </div>

              {result.biased_phrases.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 rounded-lg p-3">
                  <CheckCircle2 size={16} className="shrink-0" /> No biased language detected — this job ad looks inclusive.
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-700">
                    {result.biased_phrases.length} flagged phrase{result.biased_phrases.length === 1 ? '' : 's'}
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                    {result.biased_phrases.map((p, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm bg-slate-50 rounded-lg p-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border shrink-0', CATEGORY_STYLES[p.category])}>
                          {p.category}
                        </span>
                        <div className="min-w-0">
                          <p className="text-slate-700">"<span className="font-medium">{p.phrase}</span>"</p>
                          <p className="text-slate-500 text-xs mt-0.5">Suggestion: {p.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <AlertTriangle size={36} className="mb-3" />
              <p className="text-sm">Run a scan to see bias flags and a neutral rewrite of this job description.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Rewritten JD */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="border-2 border-success-200 bg-gradient-to-br from-success-50 via-white to-primary-50">
            <CardHeader
              title="Suggested Neutral Rewrite"
              subtitle="Bias-free version of this job description"
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button size="sm" onClick={handleApplyRewrite}>
                    <Sparkles size={14} /> Use This Version
                  </Button>
                </div>
              }
            />
            <div className="bg-white rounded-lg border border-slate-100 p-4 max-h-72 overflow-y-auto scrollbar-thin">
              <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{result.rewritten_jd}</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function HighlightedText({ text, phrases }) {
  if (!phrases?.length) {
    return <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{text}</p>;
  }

  const sorted = [...phrases].sort((a, b) => b.phrase.length - a.phrase.length);
  const pattern = new RegExp(`(${sorted.map((p) => escapeRegExp(p.phrase)).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">
      {parts.map((part, i) => {
        const match = phrases.find((p) => p.phrase.toLowerCase() === part.toLowerCase());
        if (!match) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            className={cn(
              'relative group inline-block px-1 rounded border-b-2 font-medium cursor-help',
              CATEGORY_STYLES[match.category]
            )}
          >
            {part}
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-800 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
              <strong>{match.category}:</strong> try "{match.suggestion}"
            </span>
          </span>
        );
      })}
    </p>
  );
}
