'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';

interface RedFlag {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  recommendation: string;
}

interface RedFlagAudit {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  flags: RedFlag[];
  greenFlags: string[];
  interviewFocus: string;
  hiringRecommendation: 'PROCEED' | 'PROCEED WITH CAUTION' | 'DEEP PROBE NEEDED' | 'DECLINE';
}

interface RedFlagPanelProps {
  evaluationId: string;
  candidateName: string;
}

const SEVERITY_STYLES = {
  LOW: 'border-[#D4A574] bg-[#D4A574]/10 text-[#8B7355]',
  MEDIUM: 'border-orange-400 bg-orange-50 text-orange-700',
  HIGH: 'border-red-500 bg-red-50 text-red-700',
};

const RECOMMENDATION_STYLES = {
  'PROCEED': 'bg-green-500 text-white',
  'PROCEED WITH CAUTION': 'bg-[#D4A574] text-[#3E362E]',
  'DEEP PROBE NEEDED': 'bg-orange-500 text-white',
  'DECLINE': 'bg-red-600 text-white',
};

export const RedFlagPanel: React.FC<RedFlagPanelProps> = ({ evaluationId, candidateName }) => {
  const [audit, setAudit] = useState<RedFlagAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAudit = async () => {
    setLoading(true);
    setError('');
    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      const res = await fetch('/api/red-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || '',
        },
        body: JSON.stringify({ evaluationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAudit(data.audit);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!audit) {
    return (
      <div className="space-y-3">
        <button onClick={runAudit} disabled={loading} className="retro-button w-full bg-[#3E362E] border-[#3E362E]">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Analyzing Risk Signals...</>
            : <><ShieldAlert size={16} /> Run Risk Audit</>
          }
        </button>
        {error && <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 p-2">{error}</p>}
      </div>
    );
  }

  const riskColor = audit.overallRisk === 'HIGH' ? '#ef4444' : audit.overallRisk === 'MEDIUM' ? '#f97316' : '#4A7B7C';

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Risk Score Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#D4A574" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={riskColor} strokeWidth="3"
              strokeDasharray={`${audit.riskScore} ${100 - audit.riskScore}`}
              strokeLinecap="butt"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-black text-sm font-mono" style={{ color: riskColor }}>
            {audit.riskScore}
          </span>
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3E362E]/60">Risk Score</p>
          <p className="font-black text-lg font-serif" style={{ color: riskColor }}>{audit.overallRisk} RISK</p>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${RECOMMENDATION_STYLES[audit.hiringRecommendation]}`}>
            {audit.hiringRecommendation}
          </span>
        </div>
      </div>

      {/* Green Flags */}
      {audit.greenFlags?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C]">Green Flags</p>
          {audit.greenFlags.map((g, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#3E362E]/80">
              <CheckCircle2 size={12} className="text-[#4A7B7C] shrink-0 mt-0.5" />
              {g}
            </div>
          ))}
        </div>
      )}

      {/* Red Flags */}
      {audit.flags?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-red-600">Red Flags ({audit.flags.length})</p>
          {audit.flags.map((f, i) => (
            <div key={i} className={`border-l-4 p-3 space-y-1 ${SEVERITY_STYLES[f.severity]}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest">{f.category}</span>
                <span className="text-[10px] font-mono ml-auto">{f.severity}</span>
              </div>
              <p className="text-xs leading-relaxed">{f.description}</p>
              <p className="text-[10px] font-mono opacity-70">💬 {f.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Interview Focus */}
      <div className="bg-[#F5E6C8] border border-[#D4A574] p-3">
        <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C] mb-1">Interview Focus</p>
        <p className="text-xs text-[#3E362E]/80 leading-relaxed font-mono">{audit.interviewFocus}</p>
      </div>

      <button onClick={() => setAudit(null)} className="text-xs font-mono text-[#3E362E]/40 hover:text-[#3E362E] transition-colors">
        ↺ Re-run Audit
      </button>
    </div>
  );
};
