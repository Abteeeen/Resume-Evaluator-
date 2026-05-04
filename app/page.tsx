'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Users, Activity, Loader2, Star, Calendar, X, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UploadResume } from '@/components/dashboard/UploadResume';
import { CreateJD } from '@/components/dashboard/CreateJD';
import { Settings } from '@/components/settings/Settings';
import { Settings as SettingsIcon } from 'lucide-react';
import ResumeChat from '@/components/dashboard/ResumeChat';

export default function Dashboard() {
  const [jds, setJds] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateJd, setShowCreateJd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [showResume, setShowResume] = useState(false);
  const [showAllEvaluations, setShowAllEvaluations] = useState(false);

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
        resumes (filename, source, parsed_content, file_url, current_salary, expected_salary),
        job_descriptions (title)
      `)
      .order('created_at', { ascending: false });

    if (jdsData) {
      setJds(jdsData);
      if (jdsData.length > 0) {
        // Reset selectedJdId if it's currently empty or if the selected JD was deleted
        if (!selectedJdId || !jdsData.some(jd => jd.id === selectedJdId)) {
          setSelectedJdId(jdsData[0].id);
        }
      } else {
        setSelectedJdId('');
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
          <div className={`flex gap-6 max-h-[90vh] transition-all duration-500 ease-in-out ${showResume ? 'max-w-7xl w-full' : 'max-w-2xl w-full'}`}>
            
            {/* Resume Viewer (Left Side) - Improved Legacy Reconstruction */}
            {showResume && (
              <div className="retro-card flex-1 min-w-[50%] h-[90vh] overflow-hidden p-0 relative animate-in slide-in-from-left duration-500 bg-[#F5E6C8]">
                 <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <div className="bg-[#D4A574] text-[#3E362E] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest border border-[#3E362E]/20">
                      {selectedEval.resumes.file_url ? 'Original Document' : 'AI Reconstruction'}
                    </div>
                 </div>
                 
                 {selectedEval.resumes.file_url ? (
                    <iframe 
                      src={selectedEval.resumes.file_url} 
                      className="w-full h-full border-none"
                      title="Resume Preview"
                    />
                 ) : (
                    <div className="p-12 h-full overflow-y-auto font-serif text-[#3E362E] bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]">
                      <div className="pt-8 border-b-4 border-[#D4A574] pb-6 mb-8">
                        <h3 className="text-4xl font-extrabold tracking-tight uppercase leading-none">{selectedEval.resumes.filename.replace('.pdf', '')}</h3>
                        <div className="mt-4 text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#4A7B7C] bg-[#4A7B7C]/10 px-3 py-1 inline-block">Digitized Archive Record</div>
                      </div>

                      <div className="space-y-6 text-sm leading-relaxed font-mono opacity-90">
                        {selectedEval.resumes.parsed_content
                          // Fix hard-wrapped lines from PDF (join single newlines with a space)
                          .replace(/([^\n])\n([^\n])/g, '$1 $2')
                          .split('\n')
                          .filter((p: string) => p.trim().length > 0)
                          .map((paragraph: string, idx: number) => {
                            // Identify headers: All caps short lines or common section names
                            const isHeader = /^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS|LANGUAGES|WORK|STRENGTHS|ACHIEVEMENTS)/i.test(paragraph.trim()) && paragraph.length < 40;
                            
                            if (isHeader) {
                              return (
                                <h4 key={idx} className="text-lg font-bold text-[#4A7B7C] border-b-2 border-[#D4A574]/30 mt-8 mb-2 pb-1 uppercase tracking-widest">
                                  {paragraph}
                                </h4>
                              );
                            }
                            
                            return (
                              <p key={idx} className="mb-4 text-justify">
                                {paragraph}
                              </p>
                            );
                          })
                        }
                      </div>

                      <div className="mt-16 pt-8 border-t border-[#D4A574]/40 text-[10px] font-mono text-center opacity-40 uppercase tracking-[0.5em]">
                        --- END OF RECOVERED FILE ---
                      </div>
                    </div>
                 )}
              </div>
            )}

            {/* Evaluation Side (Right Side) */}
            <div className={`retro-card relative animate-in zoom-in duration-300 bg-[#F5F5DC] overflow-y-auto p-8 flex-1 ${showResume ? '' : 'max-w-2xl'}`}>
              <button 
                onClick={() => setSelectedEval(null)}
                className="absolute top-4 right-4 p-2 hover:bg-[#D4A574]/30 rounded-none transition-colors text-[#3E362E] z-10"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            
              <div className="space-y-6">
                <div className="flex justify-between items-end gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setShowResume(!showResume)}
                      className={`p-3 border-2 transition-all shrink-0 ${showResume ? 'bg-[#4A7B7C] text-white border-[#4A7B7C]' : 'bg-[#D4A574]/10 border-[#D4A574] text-[#3E362E] hover:bg-[#D4A574]/20'}`}
                      title={showResume ? "Close Original View" : "Show Original Resume"}
                    >
                      <FileText size={24} />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-[#3E362E] font-serif">{selectedEval.resumes.filename}</h2>
                      <p className="text-[#3E362E]/60 font-mono">{selectedEval.job_descriptions.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-extrabold text-[#4A7B7C]">{selectedEval.score}%</div>
                    <p className="text-[10px] font-bold text-[#3E362E]/60 uppercase tracking-widest">Match Score</p>
                  </div>
                </div>

                <div className="p-4 bg-[#D4A574]/10 rounded-none border border-[#D4A574] text-[#3E362E] leading-relaxed italic font-serif">
                  "{selectedEval.summary}"
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#4A7B7C] uppercase tracking-widest">Strengths</h4>
                    <ul className="space-y-2">
                      {getDetailedFeedback(selectedEval).pros?.map((pro: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-[#3E362E]/80">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#4A7B7C] shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#E8B4B8] uppercase tracking-widest">Gaps / Concerns</h4>
                    <ul className="space-y-2">
                      {getDetailedFeedback(selectedEval).cons?.map((con: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2 text-[#3E362E]/80">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E8B4B8] shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {(selectedEval.resumes.current_salary || selectedEval.resumes.expected_salary) && (
                  <div className="p-4 bg-[#4A7B7C]/10 border-l-4 border-[#4A7B7C] space-y-2">
                    <h4 className="text-[10px] font-bold text-[#4A7B7C] uppercase tracking-[0.2em] mb-2">Salary Insights (Extracted)</h4>
                    <div className="flex gap-8">
                      {selectedEval.resumes.current_salary && (
                        <div>
                          <p className="text-[10px] text-[#3E362E]/60 uppercase font-mono">Current</p>
                          <p className="font-bold text-[#3E362E]">{selectedEval.resumes.current_salary}</p>
                        </div>
                      )}
                      {selectedEval.resumes.expected_salary && (
                        <div>
                          <p className="text-[10px] text-[#3E362E]/60 uppercase font-mono">Expected</p>
                          <p className="font-bold text-[#4A7B7C]">{selectedEval.resumes.expected_salary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-[#D4A574]">
                  <h4 className="text-sm font-bold text-[#3E362E] uppercase tracking-widest">Final Verdict</h4>
                  <p className="text-sm text-[#3E362E]/80 leading-relaxed font-mono">
                    {getDetailedFeedback(selectedEval).finalVerdict}
                  </p>
                  {/* Resume Chat Component */}
                  <ResumeChat resumeId={selectedEval.resume_id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative">
        <div className="relative z-10 w-full mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4A574]/20 text-[#3E362E] border-l-4 border-[#D4A574] text-xs font-bold uppercase tracking-widest mb-4 font-serif">
            <Star size={12} className="text-[#D4A574]" /> Vintage Analog Edition
          </div>
          <h1 className="text-5xl md:text-7xl space-y-2 font-black tracking-tight mb-4 text-[#3E362E] leading-[1.1] font-serif border-b-2 border-[#D4A574] pb-4 inline-block">
            AI Resume Evaluator
          </h1>
          <p className="text-[#3E362E]/70 font-semibold max-w-xl leading-relaxed font-mono text-sm max-w-[600px] border-l-2 pl-4 border-[#D4A574]">
            Smart candidate assessment powered by dynamic AI models. Upload PDFs or paste professional URLs to instantly generate scored insights.
          </p>
        </div>
        <div className="flex gap-4 relative z-10 w-full md:w-auto flex-wrap">
          <a
            href="/pipeline"
            className="p-4 retro-card retro-card-hover font-bold text-[#4A7B7C] flex-shrink-0 flex items-center justify-center gap-2"
          >
            <Users size={20} /> Mini-ATS
          </a>
          <a
            href="/intelligence"
            className="p-4 retro-card retro-card-hover font-bold text-[#3E362E] flex-shrink-0 flex items-center justify-center gap-2"
          >
            <Brain size={20} /> Intelligence Hub
          </a>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-4 retro-card retro-card-hover text-[#3E362E] flex-shrink-0 flex items-center justify-center"
          >
            <SettingsIcon size={20} />
          </button>
          <button 
            onClick={() => setShowCreateJd(!showCreateJd)}
            className="retro-button flex-1 md:flex-none"
          >
            <Plus size={20} className={showCreateJd ? "rotate-45 transition-transform" : "transition-transform"} /> 
            {showCreateJd ? 'Cancel' : 'Create New JD'}
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
              { label: 'Total Resumes', value: evaluations.length, icon: Users, color: 'text-[#4A7B7C]' },
              { label: 'Avg Match', value: `${Math.round(evaluations.reduce((acc, cur) => acc + cur.score, 0) / (evaluations.length || 1))}%`, icon: Star, color: 'text-[#D4A574]' },
              { label: 'Active Roles', value: jds.length, icon: FileText, color: 'text-[#3E362E]' },
            ].map((stat, i) => (
              <div key={i} className="retro-card retro-card-hover flex items-center gap-4 group cursor-default">
                <div className={`p-4 bg-[#F5E6C8] border border-[#D4A574] text-[#3E362E]`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-[#3E362E]/60 font-medium font-mono">{stat.label}</p>
                  <p className="text-3xl font-extrabold tracking-tight mt-1 text-[#3E362E]">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluations Table */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 font-serif border-b-2 border-[#D4A574] pb-2 inline-flex">
                Recent Evaluations <Activity size={18} className="text-[#4A7B7C]" />
              </h2>
              
              {/* Filter Toggle */}
              <button 
                onClick={() => setShowAllEvaluations(!showAllEvaluations)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border-2 transition-all flex items-center gap-2 group ${showAllEvaluations ? 'bg-[#4A7B7C] border-[#4A7B7C] text-white' : 'bg-transparent border-[#D4A574] text-[#3E362E] hover:bg-[#D4A574]/10'}`}
              >
                <Star size={12} className={showAllEvaluations ? 'text-white' : 'text-[#D4A574]'} />
                {showAllEvaluations ? 'Archive: All Records' : 'Archive: Role Filtered'}
              </button>
            </div>
            <div className="retro-card overflow-hidden !px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-sm">
                  <thead className="bg-[#D4A574]/20 border-b-2 border-[#D4A574]">
                    <tr>
                      <th className="px-6 py-4 font-bold text-[#3E362E]">Candidate / Role</th>
                      <th className="px-6 py-4 font-bold text-[#3E362E]">Match Score</th>
                      <th className="px-6 py-4 font-bold text-[#3E362E]">Source</th>
                      <th className="px-6 py-4 font-bold text-[#3E362E]">Date</th>
                      <th className="px-6 py-4 font-bold text-[#3E362E]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4A574]/30">
                    {evaluations
                      .filter(evalItem => showAllEvaluations || evalItem.jd_id === selectedJdId)
                      .sort((a, b) => b.score - a.score)
                      .map((evalItem, index) => (
                      <tr 
                        key={evalItem.id} 
                        onClick={() => setSelectedEval(evalItem)}
                        className="hover:bg-[#D4A574]/10 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEval(evalItem);
                                setShowResume(true);
                              }}
                              className="p-2 bg-[#D4A574]/10 hover:bg-[#D4A574]/30 border border-[#D4A574] text-[#3E362E] transition-all transform hover:scale-110 active:scale-95"
                              title="Original Resume View"
                            >
                              <FileText size={16} />
                            </button>
                            <div className="flex-1">
                              <div className="font-bold text-[#3E362E] group-hover:text-[#4A7B7C] transition-colors flex items-center gap-2">
                                {index === 0 && <span title="1st Place (Gold)" className="text-xl">🥇</span>}
                                {index === 1 && <span title="2nd Place (Silver)" className="text-xl">🥈</span>}
                                {index === 2 && <span title="3rd Place (Bronze)" className="text-xl">🥉</span>}
                                {evalItem.resumes.filename}
                              </div>
                              <div className="text-xs text-[#3E362E]/60 mt-1">{evalItem.job_descriptions.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-[#E8B4B8]/50 h-3 rounded-none overflow-hidden border border-[#D4A574]">
                              <div 
                                className={`h-full ${evalItem.score > 70 ? 'bg-[#4A7B7C]' : 'bg-[#D4A574]'}`} 
                                style={{ width: `${evalItem.score}%` }} 
                              />
                            </div>
                            <span className="font-bold text-[#3E362E]">{evalItem.score}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-[#D4A574]/20 border border-[#D4A574] text-[#3E362E] text-[10px] font-black uppercase tracking-widest">
                            {evalItem.resumes.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#3E362E]/70 font-semibold text-xs">
                          {new Date(evalItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Delete this evaluation?')) {
                                await supabase.from('evaluations').delete().eq('id', evalItem.id);
                                fetchData();
                              }
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#D4A574]/30 transition-all text-[#3E362E]"
                            title="Delete Evaluation"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {evaluations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-[#3E362E] font-medium opacity-60">
                          No evaluations yet. Insert a tape (upload a resume) to begin.
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
            <h2 className="text-xl font-bold mb-6 font-serif border-b-2 border-[#D4A574] pb-2 inline-flex">Action Center</h2>
            <div className="retro-card space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3E362E] uppercase tracking-widest pl-1 font-mono">Target Role</label>
                <select 
                  className="w-full bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-3 px-4 outline-none focus:border-[#4A7B7C] transition-colors font-mono text-[#3E362E] font-bold"
                  value={selectedJdId}
                  onChange={(e) => setSelectedJdId(e.target.value)}
                >
                  <option value="" className="text-[#3E362E]/50">-- Select a role --</option>
                  {jds.map(jd => (
                    <option key={jd.id} value={jd.id}>{jd.title}</option>
                  ))}
                </select>
              </div>

              <UploadResume jdId={selectedJdId} onSuccess={fetchData} />
            </div>
          </section>

          {/* Recent JDs List */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold mb-6 font-serif border-b-2 border-[#D4A574] pb-2 inline-flex">Cassette Archive (Roles)</h2>
            <div className="space-y-4">
              {jds.map((jd) => (
                <div key={jd.id} className={`retro-card retro-card-hover group cursor-pointer transition-all relative ${selectedJdId === jd.id ? 'bg-[#D4A574]/20 border-[#4A7B7C]' : ''}`}>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('Delete this JD?')) {
                        await supabase.from('job_descriptions').delete().eq('id', jd.id);
                        fetchData();
                      }
                    }}
                    className="absolute top-4 right-4 p-2 text-[#3E362E]/40 hover:text-red-500 hover:bg-red-100 rounded-sm opacity-0 group-hover:opacity-100 transition-all font-mono"
                    title="Delete Role"
                  >  <X size={14} />
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
