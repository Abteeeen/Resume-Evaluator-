'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, Star, X, Brain } from 'lucide-react';
import Link from 'next/link';
import { KanbanBoard, PipelineStatus } from '@/components/pipeline/KanbanBoard';
import { SkillHeatmap } from '@/components/pipeline/SkillHeatmap';

export default function PipelinePage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [jds, setJds] = useState<any[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Job Descriptions for the filter dropdown
    const { data: jdsData } = await supabase
      .from('job_descriptions')
      .select('id, title')
      .order('created_at', { ascending: false });
    
    if (jdsData) setJds(jdsData);

    const { data: evalsData } = await supabase
      .from('evaluations')
      .select(`
        *,
        resumes (filename, source, parsed_content),
        job_descriptions (title)
      `)
      .order('created_at', { ascending: false });

    if (evalsData) setEvaluations(evalsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, newStatus: PipelineStatus) => {
    // Optimistic UI update
    setEvaluations(prev => prev.map(e => e.id === id ? { ...e, pipeline_status: newStatus } : e));
    
    // Save to DB
    await supabase
      .from('evaluations')
      .update({ pipeline_status: newStatus })
      .eq('id', id);
  };

  const getDetailedFeedback = (evalItem: any) => {
    try {
      return JSON.parse(evalItem.detailed_feedback || '{}');
    } catch {
      return { pros: [], cons: [], finalVerdict: '' };
    }
  };

  if (loading && evaluations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="animate-spin text-[#D4A574]" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 bg-noise">
      
      {/* Detail Modal for Heatmap & Overview */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="retro-card max-w-3xl w-full bg-[#F5F5DC] p-4 sm:p-8 relative animate-in zoom-in duration-300 my-auto sm:my-8 overflow-y-auto max-h-screen sm:max-h-[90vh]">
            <button 
              onClick={() => setSelectedEval(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 hover:bg-[#D4A574]/30 text-[#3E362E] transition-colors z-10 bg-[#F5F5DC]"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4 mb-6">
               <div className="pr-10 sm:pr-0">
                  <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#3E362E] leading-tight">{selectedEval.resumes.filename.replace('.pdf', '')}</h2>
                  <p className="text-[#3E362E]/60 font-mono text-xs sm:text-sm mt-1 uppercase tracking-widest">{selectedEval.job_descriptions.title}</p>
               </div>
               <div className="w-full sm:w-auto text-left sm:text-right border-2 border-[#D4A574] px-4 py-2 bg-[#F5E6C8] flex sm:block justify-between items-center">
                 <p className="text-[10px] sm:text-[10px] font-bold text-[#3E362E]/60 uppercase tracking-widest leading-none mb-0 sm:mb-1">Match Score</p>
                 <div className="text-3xl sm:text-4xl font-extrabold text-[#4A7B7C] leading-none">{selectedEval.score}%</div>
               </div>
            </div>

            <div className="mb-6">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 
                ${selectedEval.pipeline_status === 'Hired' ? 'border-green-500 text-green-700 bg-green-100' :
                  selectedEval.pipeline_status === 'Rejected' ? 'border-[#E8B4B8] text-[#E8B4B8] bg-[#E8B4B8]/20' :
                  selectedEval.pipeline_status === 'Interviewing' ? 'border-purple-400 text-purple-700 bg-purple-100' :
                  selectedEval.pipeline_status === 'Shortlisted' ? 'border-[#4A7B7C] text-[#4A7B7C] bg-[#4A7B7C]/10' :
                  'border-[#D4A574] text-[#D4A574] bg-[#D4A574]/10'
                }`}>
                Current Stage: {selectedEval.pipeline_status || 'New'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
               <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest border-b border-[#D4A574] pb-1 text-[#3E362E]">Executive Summary</h3>
                  <p className="text-sm font-serif italic text-[#3E362E]/80 leading-relaxed">
                    "{selectedEval.summary}"
                  </p>
                  
                  <div className="space-y-2 pt-4">
                    <h4 className="text-[10px] font-bold text-[#4A7B7C] uppercase tracking-widest">Key Strengths</h4>
                    <ul className="text-xs space-y-1 font-mono text-[#3E362E]/80 list-disc pl-4">
                      {getDetailedFeedback(selectedEval).pros?.slice(0, 3).map((pro: string, i: number) => <li key={i}>{pro}</li>)}
                    </ul>
                  </div>
               </div>
               <div>
                 {/* Skill Heatmap Integration */}
                 <SkillHeatmap 
                    score={selectedEval.score} 
                    pros={getDetailedFeedback(selectedEval).pros || []} 
                    cons={getDetailedFeedback(selectedEval).cons || []} 
                 />
               </div>
            </div>

            <div className="w-full flex justify-end">
               <button 
                 onClick={() => setSelectedEval(null)}
                 className="retro-button bg-[#4A7B7C] text-white border-[#4A7B7C] hover:bg-[#4A7B7C]/80"
               >
                 Close Dossier
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col mb-10 relative">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/20 text-[#3E362E] hover:bg-[#D4A574]/40 transition-colors border-l-4 border-[#D4A574] text-xs font-bold uppercase tracking-widest font-serif">
            <ArrowLeft size={16} className="text-[#D4A574]" /> Back to Evaluator
          </Link>
          <Link href="/intelligence" className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 text-[#3E362E] hover:bg-[#D4A574]/30 transition-colors border-l-4 border-[#D4A574]/50 text-xs font-bold uppercase tracking-widest font-serif">
            <Brain size={16} className="text-[#D4A574]" /> Intelligence Hub
          </Link>
        </div>
        <div className="relative z-10 w-full mb-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-[#3E362E] leading-none font-serif border-b-2 border-[#D4A574] pb-4 block w-full max-w-4xl">
            Candidate ATS Workflow
          </h1>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <p className="text-[#3E362E]/70 font-semibold leading-relaxed font-mono text-sm max-w-[600px] border-l-2 pl-4 border-[#D4A574]">
              Drag and drop candidates through your recruitment pipeline. Click any candidate card to view their interactive skill heatmap and detailed assessment.
            </p>
            
            {/* Filter Dropdown */}
            <div className="w-full lg:w-auto min-w-[280px] bg-[#F5E6C8] border-2 border-[#D4A574] p-3 flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3E362E] whitespace-nowrap">Role Filter:</span>
              <select 
                className="bg-transparent w-full text-sm font-bold font-mono text-[#4A7B7C] outline-none cursor-pointer"
                value={selectedJdId}
                onChange={(e) => setSelectedJdId(e.target.value)}
              >
                <option value="all">All Roles (Combined)</option>
                {jds.map(jd => (
                  <option key={jd.id} value={jd.id}>{jd.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>
      
      {/* Kanban Board */}
      <section className="w-full">
        <KanbanBoard 
          candidates={selectedJdId === 'all' ? evaluations : evaluations.filter(e => e.jd_id === selectedJdId)}
          onCandidateClick={(id) => setSelectedEval(evaluations.find(e => e.id === id))}
          onStatusChange={handleStatusChange}
          isLoading={loading}
        />
      </section>

    </main>
  );
}
