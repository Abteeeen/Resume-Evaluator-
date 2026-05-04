'use client';

import React, { useState } from 'react';
import { Loader2, Star, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface JDIssue {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  excerpt: string;
  suggestion: string;
}

interface JDAnalysis {
  overallScore: number;
  grade: string;
  summary: string;
  issues: JDIssue[];
  strengths: string[];
  rewriteSuggestions: Array<{ original: string; improved: string }>;
  salaryEstimate: string;
  talentPoolImpact: string;
  topRecommendation: string;
}

interface JDOptimizerProps {
  jds: Array<{ id: string; title: string; content: string }>;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#4A7B7C', B: '#8B7355', C: '#D4A574', D: '#f97316', F: '#ef4444'
};

const SEV_STYLES = {
  LOW: 'border-[#D4A574] bg-[#D4A574]/10 text-[#8B7355]',
  MEDIUM: 'border-orange-400 bg-orange-50 text-orange-700',
  HIGH: 'border-red-500 bg-red-50 text-red-700',
};

export const JDOptimizer: React.FC<JDOptimizerProps> = ({ jds }) => {
  const [selectedJd, setSelectedJd] = useState(jds[0]?.id || '');
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    const jd = jds.find(j => j.id === selectedJd);
    if (!jd) return;
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      const res = await fetch('/api/jd-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || '',
        },
        body: JSON.stringify({ jdContent: jd.content, jdTitle: jd.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = analysis ? GRADE_COLORS[analysis.grade] || '#3E362E' : '#3E362E';

  return (
    <div className="space-y-5">
      {/* JD Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold font-mono uppercase tracking-widest text-[#3E362E]/60">Select JD to Audit</label>
        <select
          value={selectedJd}
          onChange={e => { setSelectedJd(e.target.value); setAnalysis(null); }}
          className="w-full bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-2 px-3 font-mono text-sm text-[#3E362E] outline-none focus:border-[#4A7B7C] transition-colors"
        >
          {jds.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
        </select>
      </div>

      <button onClick={analyze} disabled={loading || !selectedJd} className="retro-button w-full">
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Analyzing JD Quality...</>
          : <><Star size={16} /> Audit This JD</>
        }
      </button>

      {error && <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 p-2">{error}</p>}

      {analysis && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Score Header */}
          <div className="flex items-center gap-4 p-4 bg-[#F5E6C8] border-2 border-[#D4A574]">
            <div className="w-16 h-16 border-4 flex items-center justify-center font-black text-3xl font-serif" style={{ borderColor: gradeColor, color: gradeColor }}>
              {analysis.grade}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#3E362E]/60">JD Quality Score</p>
              <p className="font-black text-2xl font-mono" style={{ color: gradeColor }}>{analysis.overallScore}/100</p>
              <p className="text-xs text-[#3E362E]/60 mt-0.5">{analysis.summary}</p>
            </div>
          </div>

          {/* Top Recommendation */}
          <div className="bg-[#4A7B7C]/10 border-l-4 border-[#4A7B7C] px-4 py-3">
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C] mb-1">🎯 Top Recommendation</p>
            <p className="text-sm font-serif text-[#3E362E]">{analysis.topRecommendation}</p>
          </div>

          {/* Salary Estimate */}
          <div className="flex items-center gap-3 bg-[#D4A574]/10 border border-[#D4A574] p-3">
            <Star size={14} className="text-[#D4A574] shrink-0" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#3E362E]/60">Market Salary Estimate</p>
              <p className="text-sm font-bold font-mono text-[#3E362E]">{analysis.salaryEstimate}</p>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C]">Strengths</p>
              {analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[#3E362E]/80">
                  <CheckCircle2 size={12} className="text-[#4A7B7C] shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          )}

          {/* Issues */}
          {analysis.issues?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-red-600">Issues Found ({analysis.issues.length})</p>
              {analysis.issues.map((issue, i) => (
                <div key={i} className={`border-l-4 p-3 space-y-1.5 ${SEV_STYLES[issue.severity]}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{issue.category}</span>
                    <span className="text-[10px] font-mono ml-auto">{issue.severity}</span>
                  </div>
                  <p className="text-xs italic">"{issue.excerpt}"</p>
                  <p className="text-xs opacity-80">→ {issue.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rewrites */}
          {analysis.rewriteSuggestions?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/60">Suggested Rewrites</p>
              {analysis.rewriteSuggestions.map((r, i) => (
                <div key={i} className="border border-[#D4A574] overflow-hidden text-xs font-mono">
                  <div className="px-3 py-2 bg-red-50 text-red-700 line-through">{r.original}</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-800">
                    <ArrowRight size={12} className="shrink-0" />
                    {r.improved}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Talent Pool Impact */}
          <div className="border border-[#D4A574] p-3 bg-[#F5E6C8]">
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/60 mb-1">Talent Pool Impact</p>
            <p className="text-xs text-[#3E362E]/80 leading-relaxed">{analysis.talentPoolImpact}</p>
          </div>

          <button onClick={() => setAnalysis(null)} className="text-xs font-mono text-[#3E362E]/40 hover:text-[#3E362E] transition-colors">
            ↺ Re-analyze
          </button>
        </div>
      )}
    </div>
  );
};
