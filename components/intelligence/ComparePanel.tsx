'use client';

import React, { useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Trophy, Loader2, Users, X, ChevronRight } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  score: number;
}

interface ComparisonResult {
  rankings: Array<{
    rank: number;
    candidateIndex: number;
    name: string;
    whyFirst: string;
    radarScores: {
      technicalMatch: number;
      experienceDepth: number;
      domainKnowledge: number;
      communication: number;
      overallRisk: number;
    };
  }>;
  topPick: string;
  topPickReasoning: string;
  vsVerdict: string;
  whoToInterviewFirst: string;
  keyDifferentiator: string;
}

interface ComparePanelProps {
  evaluations: Array<{ id: string; resumes: { filename: string }; score: number }>;
}

const COLORS = ['#4A7B7C', '#D4A574', '#E8B4B8', '#8B7355'];

export const ComparePanel: React.FC<ComparePanelProps> = ({ evaluations }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCandidate = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const runComparison = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || '',
        },
        body: JSON.stringify({ evaluationIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.comparison);
      setCandidates(data.candidates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build radar data from comparison result
  const radarData = result
    ? ['technicalMatch', 'experienceDepth', 'domainKnowledge', 'communication', 'overallRisk'].map(key => {
        const point: Record<string, any> = {
          subject: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
        };
        result.rankings.forEach((r, i) => {
          point[r.name] = r.radarScores[key as keyof typeof r.radarScores];
        });
        return point;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Candidate Selector */}
      <div>
        <p className="text-xs font-bold font-mono text-[#3E362E]/60 uppercase tracking-widest mb-3">
          Select 2–4 Candidates to Battle
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {evaluations.map(ev => {
            const name = ev.resumes?.filename?.replace('.pdf', '') || 'Unknown';
            const isSelected = selected.includes(ev.id);
            const isDisabled = !isSelected && selected.length >= 4;
            return (
              <button
                key={ev.id}
                onClick={() => toggleCandidate(ev.id)}
                disabled={isDisabled}
                className={`text-left p-3 border-2 transition-all text-xs font-mono relative ${
                  isSelected
                    ? 'border-[#4A7B7C] bg-[#4A7B7C]/10 text-[#3E362E]'
                    : isDisabled
                    ? 'border-[#D4A574]/30 text-[#3E362E]/30 cursor-not-allowed'
                    : 'border-[#D4A574] hover:border-[#4A7B7C] text-[#3E362E]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#4A7B7C] text-white text-[8px] flex items-center justify-center font-black">
                    {selected.indexOf(ev.id) + 1}
                  </span>
                )}
                <div className="font-bold truncate pr-4">{name}</div>
                <div className="text-[#4A7B7C] font-black mt-0.5">{ev.score}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {selected.length >= 2 && !result && (
        <button onClick={runComparison} disabled={loading} className="retro-button w-full">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Running Battle Analysis...</> : <><Users size={16} /> Compare {selected.length} Candidates</>}
        </button>
      )}

      {error && <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 p-2">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Top Pick Banner */}
          <div className="bg-[#4A7B7C] text-[#F5E6C8] p-4 border-2 border-[#3E362E] flex items-start gap-3">
            <Trophy size={24} className="text-[#D4A574] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#F5E6C8]/70">Top Pick</p>
              <p className="font-black text-lg font-serif">{result.topPick}</p>
              <p className="text-xs mt-1 text-[#F5E6C8]/80 leading-relaxed">{result.topPickReasoning}</p>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="retro-card">
            <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-[#3E362E]/60 mb-4">Skill Radar Battle</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#D4A574" opacity={0.4} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#3E362E', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#D4A574', fontSize: 9 }} tickCount={4} />
                {result.rankings.map((r, i) => (
                  <Radar
                    key={r.name}
                    name={r.name}
                    dataKey={r.name}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip contentStyle={{ backgroundColor: '#F5F5DC', border: '2px solid #D4A574', borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            {result.rankings.map((r) => (
              <div key={r.name} className="flex items-start gap-3 bg-[#F5E6C8] border border-[#D4A574] p-3">
                <div className="w-8 h-8 border-2 border-[#3E362E] bg-[#D4A574] text-[#3E362E] flex items-center justify-center font-black text-sm shrink-0">
                  {r.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#3E362E] truncate">{r.name}</p>
                  <p className="text-xs text-[#3E362E]/70 mt-0.5 leading-relaxed font-mono">{r.whyFirst}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Key Insight */}
          <div className="border-l-4 border-[#D4A574] pl-4 space-y-2">
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C]">VS Verdict</p>
            <p className="text-sm font-serif italic text-[#3E362E]/80">"{result.vsVerdict}"</p>
            <p className="text-[10px] font-mono text-[#3E362E]/60">Key Differentiator: {result.keyDifferentiator}</p>
          </div>

          <button onClick={() => { setResult(null); setSelected([]); }} className="text-xs font-mono text-[#3E362E]/50 hover:text-[#3E362E] flex items-center gap-1 transition-colors">
            <X size={12} /> Reset comparison
          </button>
        </div>
      )}
    </div>
  );
};
