'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Users, Activity, Loader2, Star, Calendar, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UploadResume } from '@/components/dashboard/UploadResume';
import { CreateJD } from '@/components/dashboard/CreateJD';
import { Settings } from '@/components/settings/Settings';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Dashboard() {
  const [jds, setJds] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateJd, setShowCreateJd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: jdsData } = await supabase
      .from('job_descriptions')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: evalsData } = await supabase
      .from('evaluations')
      .select(`
        *,
        resumes (filename, source),
        job_descriptions (title)
      `)
      .order('created_at', { ascending: false });

    if (jdsData) {
      setJds(jdsData);
      if (jdsData.length > 0 && !selectedJdId) {
        setSelectedJdId(jdsData[0].id);
      }
    }
    if (evalsData) setEvaluations(evalsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDetailedFeedback = (evalItem: any) => {
    try {
      return JSON.parse(evalItem.detailed_feedback || '{}');
    } catch {
      return {};
    }
  };

  if (loading && jds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Settings Modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      
      {/* Detail Modal */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedEval(null)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Plus className="rotate-45" size={24} />
            </button>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-gradient">{selectedEval.resumes.filename}</h2>
                  <p className="text-zinc-500">{selectedEval.job_descriptions.title}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-purple-400">{selectedEval.score}%</div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Match Score</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-zinc-300 leading-relaxed italic">
                "{selectedEval.summary}"
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest">Strengths</h4>
                  <ul className="space-y-2">
                    {getDetailedFeedback(selectedEval).pros?.map((pro: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 text-zinc-400">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest">Gaps / Concerns</h4>
                  <ul className="space-y-2">
                    {getDetailedFeedback(selectedEval).cons?.map((con: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2 text-zinc-400">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Final Verdict</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {getDetailedFeedback(selectedEval).finalVerdict}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-gradient mb-2">
            AI Resume Evaluator
          </h1>
          <p className="text-zinc-400 text-lg">
            Smart candidate assessment powered by Gemini 1.5 Pro.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-4 glass-card hover:bg-white/10 transition-colors text-zinc-400 hover:text-purple-400"
          >
            <SettingsIcon size={20} />
          </button>
          <button 
            onClick={() => setShowCreateJd(!showCreateJd)}
            className="glass-button flex items-center gap-2"
          >
            <Plus size={18} /> {showCreateJd ? 'Cancel' : 'New JD'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Create JD Section */}
          {showCreateJd && (
            <CreateJD onCreated={() => { setShowCreateJd(false); fetchData(); }} />
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Resumes', value: evaluations.length, icon: Users, color: 'text-blue-400' },
              { label: 'Avg Match', value: `${Math.round(evaluations.reduce((acc, cur) => acc + cur.score, 0) / (evaluations.length || 1))}%`, icon: Star, color: 'text-purple-400' },
              { label: 'Active Roles', value: jds.length, icon: FileText, color: 'text-green-400' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 flex items-center gap-4 group hover:scale-[1.02] transition-all">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-zinc-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluations Table */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Recent Evaluations <Activity size={18} className="text-purple-400" />
            </h2>
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-medium text-zinc-400">Candidate / Role</th>
                      <th className="px-6 py-4 font-medium text-zinc-400">Match Score</th>
                      <th className="px-6 py-4 font-medium text-zinc-400">Source</th>
                      <th className="px-6 py-4 font-medium text-zinc-400">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {evaluations.map((evalItem) => (
                      <tr 
                        key={evalItem.id} 
                        onClick={() => setSelectedEval(evalItem)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold group-hover:text-purple-400 transition-colors">
                            {evalItem.resumes.filename}
                          </div>
                          <div className="text-xs text-zinc-500">{evalItem.job_descriptions.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-white/5 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${evalItem.score > 70 ? 'bg-green-500' : 'bg-purple-500'}`} 
                                style={{ width: `${evalItem.score}%` }} 
                              />
                            </div>
                            <span className="font-mono text-sm font-bold">{evalItem.score}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                            {evalItem.resumes.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-sm">
                          {new Date(evalItem.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {evaluations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                          No evaluations yet. Select a JD and upload a resume to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* JD Selector & Upload Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold px-2">Action Center</h2>
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Target Role</label>
                <select 
                  value={selectedJdId} 
                  onChange={(e) => setSelectedJdId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                >
                  {jds.map(jd => (
                    <option key={jd.id} value={jd.id} className="bg-[#111]">{jd.title}</option>
                  ))}
                  {jds.length === 0 && <option className="bg-[#111]">No JDs found</option>}
                </select>
              </div>

              <UploadResume jdId={selectedJdId} onSuccess={fetchData} />
            </div>
          </section>

          {/* Recent JDs List */}
          <section className="space-y-6">
            <h2 className="text-xl font-semibold px-2">Available Roles</h2>
            <div className="space-y-4">
              {jds.map((jd) => (
                <div key={jd.id} className={`glass-card p-4 group cursor-pointer border-transparent hover:border-white/20 transition-all relative ${selectedJdId === jd.id ? 'border-purple-500/50 bg-purple-500/5' : ''}`}>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Delete this JD?')) {
                        await supabase.from('job_descriptions').delete().eq('id', jd.id);
                        fetchData();
                      }
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all text-zinc-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-2 h-2 rounded-full ${jd.is_active ? 'bg-green-500' : 'bg-zinc-600'}`} />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">v{jd.version || 1}.0</span>
                  </div>
                  <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{jd.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold">
                    <Calendar size={12} /> {new Date(jd.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
