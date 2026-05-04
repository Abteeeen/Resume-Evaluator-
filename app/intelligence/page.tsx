'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loader2, ArrowLeft, Brain, Upload, Users, MessageSquare,
  ShieldAlert, Star, BarChart3, X, FileText, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { BatchUploader } from '@/components/intelligence/BatchUploader';
import { ComparePanel } from '@/components/intelligence/ComparePanel';
import { InterviewCardComponent } from '@/components/intelligence/InterviewCard';
import { RedFlagPanel } from '@/components/intelligence/RedFlagPanel';
import { JDOptimizer } from '@/components/intelligence/JDOptimizer';

type Mode = 'batch' | 'compare' | 'interview' | 'redflags' | 'jdoptimizer';

const MODES = [
  { id: 'batch' as Mode, label: 'Batch Evaluator', icon: Upload, desc: 'Evaluate 20 resumes at once' },
  { id: 'compare' as Mode, label: 'Head-to-Head Compare', icon: Users, desc: 'Battle 2–4 candidates' },
  { id: 'interview' as Mode, label: 'Interview Cards', icon: MessageSquare, desc: 'AI-tailored questions' },
  { id: 'redflags' as Mode, label: 'Risk Audit', icon: ShieldAlert, desc: 'Red flag detection' },
  { id: 'jdoptimizer' as Mode, label: 'JD Optimizer', icon: Star, desc: 'Grade your job description' },
];

interface BatchResult {
  filename: string;
  status: 'success' | 'error';
  score?: number;
  summary?: string;
  pros?: string[];
  cons?: string[];
  evaluationId?: string;
  currentSalary?: string;
  expectedSalary?: string;
  error?: string;
}

export default function IntelligencePage() {
  const [mode, setMode] = useState<Mode>('batch');
  const [jds, setJds] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedJdId, setSelectedJdId] = useState('');
  const [loading, setLoading] = useState(true);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState('');
  const [selectedEvalName, setSelectedEvalName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: jdsData } = await supabase
      .from('job_descriptions').select('*').order('created_at', { ascending: false });
    const { data: evalsData } = await supabase
      .from('evaluations')
      .select('*, resumes (filename, source), job_descriptions (title)')
      .order('created_at', { ascending: false });

    if (jdsData) { setJds(jdsData); if (jdsData.length > 0) setSelectedJdId(jdsData[0].id); }
    if (evalsData) setEvaluations(evalsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleBatchComplete = (results: BatchResult[]) => {
    setBatchResults(results);
    fetchData(); // Refresh evaluations list
  };

  const filteredEvals = evaluations.filter(e =>
    !selectedJdId || e.jd_id === selectedJdId
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4A7B7C]" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/20 text-[#3E362E] hover:bg-[#D4A574]/40 transition-colors border-l-4 border-[#D4A574] text-xs font-bold uppercase tracking-widest font-mono">
            <ArrowLeft size={14} className="text-[#D4A574]" /> Dashboard
          </Link>
          <Link href="/pipeline" className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 text-[#3E362E] hover:bg-[#D4A574]/30 transition-colors border-l-4 border-[#D4A574]/50 text-xs font-bold uppercase tracking-widest font-mono">
            Pipeline
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A574]/20 text-[#3E362E] border-l-4 border-[#D4A574] text-xs font-bold uppercase tracking-widest mb-3 font-mono">
              <Brain size={12} className="text-[#D4A574]" /> Intelligence Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#3E362E] font-serif border-b-2 border-[#D4A574] pb-3 inline-block">
              AI Command Center
            </h1>
            <p className="text-[#3E362E]/60 font-mono text-sm mt-2 max-w-xl border-l-2 pl-3 border-[#D4A574]">
              Batch evaluate, compare candidates head-to-head, generate interview cards, detect red flags, and audit your job descriptions.
            </p>
          </div>

          {/* Global JD Filter */}
          <div className="shrink-0">
            <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/60 block mb-1">Active Role</label>
            <select
              value={selectedJdId}
              onChange={e => setSelectedJdId(e.target.value)}
              className="bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-2 px-3 font-mono text-sm text-[#3E362E] outline-none focus:border-[#4A7B7C] transition-colors min-w-[200px]"
            >
              <option value="">All Roles</option>
              {jds.map(jd => <option key={jd.id} value={jd.id}>{jd.title}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Candidates', value: evaluations.length },
          { label: 'Active Roles', value: jds.length },
          { label: 'Avg Match Score', value: `${Math.round(evaluations.reduce((a, e) => a + e.score, 0) / (evaluations.length || 1))}%` },
          { label: 'Top Score', value: evaluations.length ? `${Math.max(...evaluations.map(e => e.score))}%` : '—' },
        ].map((s, i) => (
          <div key={i} className="retro-card py-3 px-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#3E362E]/50">{s.label}</p>
            <p className="text-2xl font-black text-[#3E362E] mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar — Mode Selector */}
        <aside className="lg:col-span-1">
          <div className="retro-card space-y-2 sticky top-6">
            <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/50 mb-3">Intelligence Modules</p>
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full text-left px-3 py-3 border-2 transition-all ${
                  mode === m.id
                    ? 'border-[#4A7B7C] bg-[#4A7B7C]/10 text-[#3E362E]'
                    : 'border-[#D4A574]/50 hover:border-[#D4A574] text-[#3E362E]/70 hover:text-[#3E362E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <m.icon size={14} className={mode === m.id ? 'text-[#4A7B7C]' : 'text-[#D4A574]'} />
                  <span className="text-xs font-bold font-mono uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="text-[10px] font-mono text-[#3E362E]/50 mt-0.5 pl-5">{m.desc}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-3 space-y-6">

          {/* BATCH EVALUATOR */}
          {mode === 'batch' && (
            <div className="space-y-6">
              <div className="retro-card">
                <h2 className="font-black font-serif text-xl text-[#3E362E] mb-1">Batch Evaluator</h2>
                <p className="text-xs font-mono text-[#3E362E]/60 mb-5">Upload multiple PDF resumes — all evaluated in parallel and ranked automatically.</p>
                <BatchUploader jdId={selectedJdId} onComplete={handleBatchComplete} />
              </div>

              {/* Batch Results */}
              {batchResults.length > 0 && (
                <div className="retro-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold font-serif text-[#3E362E]">Ranked Results</h3>
                    <button onClick={() => setBatchResults([])} className="text-[#3E362E]/40 hover:text-[#3E362E]"><X size={16} /></button>
                  </div>
                  <div className="space-y-2">
                    {batchResults.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 border transition-all ${r.status === 'error' ? 'border-red-300 bg-red-50' : 'border-[#D4A574] bg-[#F5E6C8] hover:border-[#4A7B7C]'}`}>
                        <div className="w-7 h-7 border-2 border-[#3E362E] flex items-center justify-center font-black text-xs font-mono shrink-0 bg-[#D4A574]">
                          {r.status === 'error' ? '!' : i + 1}
                        </div>
                        <FileText size={14} className="text-[#4A7B7C] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3E362E] truncate">{r.filename}</p>
                          {r.status === 'error'
                            ? <p className="text-xs text-red-600 font-mono">{r.error}</p>
                            : <p className="text-xs text-[#3E362E]/60 font-mono truncate">{r.summary}</p>
                          }
                        </div>
                        {r.score !== undefined && (
                          <div className={`px-2 py-1 font-black text-sm font-mono shrink-0 ${r.score > 70 ? 'bg-[#4A7B7C] text-white' : 'bg-[#D4A574]/40 text-[#3E362E]'}`}>
                            {r.score}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Candidates Table */}
              {filteredEvals.length > 0 && batchResults.length === 0 && (
                <div className="retro-card space-y-3">
                  <h3 className="font-bold font-serif text-[#3E362E]">All Evaluated Candidates</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b-2 border-[#D4A574] text-[#3E362E]/60 uppercase tracking-widest">
                          <th className="pb-2 text-left">#</th>
                          <th className="pb-2 text-left">Candidate</th>
                          <th className="pb-2 text-left">Role</th>
                          <th className="pb-2 text-left">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4A574]/30">
                        {filteredEvals.sort((a, b) => b.score - a.score).map((e, i) => (
                          <tr key={e.id} className="hover:bg-[#D4A574]/10 transition-colors">
                            <td className="py-2 pr-3 font-black text-[#D4A574]">{i + 1}</td>
                            <td className="py-2 pr-4 font-bold text-[#3E362E] max-w-[180px] truncate">{e.resumes?.filename?.replace('.pdf', '')}</td>
                            <td className="py-2 pr-4 text-[#3E362E]/60 max-w-[150px] truncate">{e.job_descriptions?.title}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 font-black ${e.score > 70 ? 'bg-[#4A7B7C] text-white' : 'bg-[#D4A574]/40 text-[#3E362E]'}`}>
                                {e.score}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMPARE */}
          {mode === 'compare' && (
            <div className="retro-card">
              <h2 className="font-black font-serif text-xl text-[#3E362E] mb-1">Head-to-Head Comparator</h2>
              <p className="text-xs font-mono text-[#3E362E]/60 mb-5">AI-powered battle between 2–4 candidates with radar chart scoring.</p>
              {filteredEvals.length < 2
                ? <p className="text-sm font-mono text-[#3E362E]/50 text-center py-8">Need at least 2 evaluated candidates. Upload resumes first.</p>
                : <ComparePanel evaluations={filteredEvals} />
              }
            </div>
          )}

          {/* INTERVIEW CARDS */}
          {mode === 'interview' && (
            <div className="retro-card">
              <h2 className="font-black font-serif text-xl text-[#3E362E] mb-1">Interview Card Generator</h2>
              <p className="text-xs font-mono text-[#3E362E]/60 mb-5">Select a candidate to generate a tailored, role-specific interview question card.</p>

              {/* Candidate Picker */}
              {!selectedEvalId ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/50 mb-3">Pick a Candidate</p>
                  {filteredEvals.length === 0
                    ? <p className="text-sm font-mono text-[#3E362E]/50 text-center py-8">No candidates evaluated yet.</p>
                    : filteredEvals.sort((a, b) => b.score - a.score).map(e => (
                      <button
                        key={e.id}
                        onClick={() => { setSelectedEvalId(e.id); setSelectedEvalName(e.resumes?.filename?.replace('.pdf', '') || ''); }}
                        className="w-full flex items-center gap-3 p-3 border border-[#D4A574] hover:border-[#4A7B7C] hover:bg-[#4A7B7C]/5 transition-all text-left"
                      >
                        <FileText size={14} className="text-[#4A7B7C] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3E362E] truncate">{e.resumes?.filename?.replace('.pdf', '')}</p>
                          <p className="text-[10px] font-mono text-[#3E362E]/50">{e.job_descriptions?.title}</p>
                        </div>
                        <span className={`px-2 py-0.5 font-black text-xs font-mono ${e.score > 70 ? 'bg-[#4A7B7C] text-white' : 'bg-[#D4A574]/40 text-[#3E362E]'}`}>{e.score}%</span>
                        <ChevronRight size={14} className="text-[#D4A574] shrink-0" />
                      </button>
                    ))
                  }
                </div>
              ) : (
                <div>
                  <button onClick={() => { setSelectedEvalId(''); setSelectedEvalName(''); }} className="flex items-center gap-1 text-xs font-mono text-[#3E362E]/50 hover:text-[#3E362E] mb-4 transition-colors">
                    <ArrowLeft size={12} /> Back to list
                  </button>
                  <InterviewCardComponent evaluationId={selectedEvalId} candidateName={selectedEvalName} />
                </div>
              )}
            </div>
          )}

          {/* RED FLAGS */}
          {mode === 'redflags' && (
            <div className="retro-card">
              <h2 className="font-black font-serif text-xl text-[#3E362E] mb-1">Risk Audit</h2>
              <p className="text-xs font-mono text-[#3E362E]/60 mb-5">AI scans for job hopping, skill inflation, timeline gaps, and more.</p>

              {!selectedEvalId ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#3E362E]/50 mb-3">Pick a Candidate to Audit</p>
                  {filteredEvals.length === 0
                    ? <p className="text-sm font-mono text-[#3E362E]/50 text-center py-8">No candidates evaluated yet.</p>
                    : filteredEvals.sort((a, b) => b.score - a.score).map(e => (
                      <button
                        key={e.id}
                        onClick={() => { setSelectedEvalId(e.id); setSelectedEvalName(e.resumes?.filename?.replace('.pdf', '') || ''); }}
                        className="w-full flex items-center gap-3 p-3 border border-[#D4A574] hover:border-[#4A7B7C] hover:bg-[#4A7B7C]/5 transition-all text-left"
                      >
                        <ShieldAlert size={14} className="text-[#D4A574] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3E362E] truncate">{e.resumes?.filename?.replace('.pdf', '')}</p>
                          <p className="text-[10px] font-mono text-[#3E362E]/50">{e.job_descriptions?.title}</p>
                        </div>
                        <span className={`px-2 py-0.5 font-black text-xs font-mono ${e.score > 70 ? 'bg-[#4A7B7C] text-white' : 'bg-[#D4A574]/40 text-[#3E362E]'}`}>{e.score}%</span>
                        <ChevronRight size={14} className="text-[#D4A574] shrink-0" />
                      </button>
                    ))
                  }
                </div>
              ) : (
                <div>
                  <button onClick={() => { setSelectedEvalId(''); setSelectedEvalName(''); }} className="flex items-center gap-1 text-xs font-mono text-[#3E362E]/50 hover:text-[#3E362E] mb-4 transition-colors">
                    <ArrowLeft size={12} /> Back to list
                  </button>
                  <RedFlagPanel evaluationId={selectedEvalId} candidateName={selectedEvalName} />
                </div>
              )}
            </div>
          )}

          {/* JD OPTIMIZER */}
          {mode === 'jdoptimizer' && (
            <div className="retro-card">
              <h2 className="font-black font-serif text-xl text-[#3E362E] mb-1">JD Optimizer</h2>
              <p className="text-xs font-mono text-[#3E362E]/60 mb-5">AI grades your job description — finds gendered language, skill inflation, salary mismatches, and more.</p>
              {jds.length === 0
                ? <p className="text-sm font-mono text-[#3E362E]/50 text-center py-8">No job descriptions created yet. Add one from the Dashboard.</p>
                : <JDOptimizer jds={jds} />
              }
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
