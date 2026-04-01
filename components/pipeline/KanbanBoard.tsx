'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, User, MoreVertical, FileText, ChevronRight } from 'lucide-react';

export type PipelineStatus = 'New' | 'Shortlisted' | 'Interviewing' | 'Rejected' | 'Hired';

export const PIPELINE_COLUMNS: PipelineStatus[] = ['New', 'Shortlisted', 'Interviewing', 'Rejected', 'Hired'];

interface Candidate {
  id: string; // Evaluation ID
  score: number;
  pipeline_status: PipelineStatus | null;
  resumes: {
    filename: string;
    source: string;
  };
  job_descriptions: {
    title: string;
  };
  created_at: string;
}

interface KanbanBoardProps {
  candidates: Candidate[];
  onCandidateClick: (id: string) => void;
  onStatusChange: (id: string, newStatus: PipelineStatus) => void;
  isLoading: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, onCandidateClick, onStatusChange, isLoading }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, status: PipelineStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onStatusChange(id, status);
    }
    setDraggedId(null);
  };

  const handleStatusChange = (id: string, status: PipelineStatus) => {
    onStatusChange(id, status);
  };

  const moveCandidate = (e: React.MouseEvent, candidateId: string, currentStatus: PipelineStatus, direction: 'forward' | 'backward') => {
    e.stopPropagation();
    const currentIndex = PIPELINE_COLUMNS.indexOf(currentStatus);
    if (direction === 'forward' && currentIndex < PIPELINE_COLUMNS.length - 1) {
      handleStatusChange(candidateId, PIPELINE_COLUMNS[currentIndex + 1]);
    } else if (direction === 'backward' && currentIndex > 0) {
      handleStatusChange(candidateId, PIPELINE_COLUMNS[currentIndex - 1]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-[#4A7B7C]" size={48} />
      </div>
    );
  }

  // Column Colors mapping
  const colColors: Record<PipelineStatus, string> = {
    'New': 'border-[#D4A574] bg-[#F5E6C8]',
    'Shortlisted': 'border-[#4A7B7C] bg-[#4A7B7C]/10',
    'Interviewing': 'border-purple-400 bg-purple-400/10',
    'Rejected': 'border-[#E8B4B8] bg-[#E8B4B8]/20',
    'Hired': 'border-green-500 bg-green-500/10',
  };

  return (
    <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 sm:pb-8 items-start min-h-[60vh] font-mono snap-x snap-mandatory px-2 sm:px-0">
      {PIPELINE_COLUMNS.map(column => {
        const columnCandidates = candidates.filter(c => (c.pipeline_status || 'New') === column)
                                            .sort((a, b) => b.score - a.score);
        
        return (
          <div 
            key={column}
            className={`flex-none w-[85vw] sm:w-auto sm:flex-1 sm:min-w-[280px] sm:max-w-[340px] shadow-sm border-t-4 ${colColors[column]} flex flex-col retro-card p-3 sm:p-4 transition-colors snap-center ${draggedId ? 'border-dashed border-2' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex justify-between items-center mb-4 border-b border-[#D4A574]/30 pb-2">
              <h3 className="font-bold text-[#3E362E] uppercase tracking-widest text-sm flex items-center gap-2">
                {column}
                <span className="bg-[#3E362E]/10 text-[#3E362E] px-2 py-0.5 rounded-none text-xs">
                  {columnCandidates.length}
                </span>
              </h3>
            </div>

            <div className="flex-1 space-y-3 min-h-[150px]">
              {columnCandidates.map(candidate => (
                <div 
                  key={candidate.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, candidate.id)}
                  onClick={() => onCandidateClick(candidate.id)}
                  className="bg-[#F5F5DC] border border-[#D4A574] p-3 cursor-grab hover:shadow-md hover:border-[#4A7B7C] group transition-all relative"
                >
                   <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-[#3E362E] text-sm truncate flex-1 group-hover:text-[#4A7B7C] transition-colors" title={candidate.resumes.filename}>
                        {candidate.resumes.filename.replace('.pdf', '')}
                      </div>
                      <div className={`text-xs font-black ml-2 px-1.5 py-0.5 ${candidate.score > 70 ? 'bg-[#4A7B7C] text-white' : 'bg-[#D4A574]/40 text-[#3E362E]'}`}>
                        {candidate.score}
                      </div>
                   </div>
                   <div className="text-[10px] text-[#3E362E]/60 uppercase tracking-tight flex items-center gap-1">
                     <FileText size={10} /> {candidate.job_descriptions.title}
                   </div>

                   {/* Quick Status Move Buttons (Mobile / Accessibility) */}
                   <div className="flex absolute opacity-100 lg:opacity-0 lg:group-hover:opacity-100 right-2 bottom-2 gap-1 z-10 transition-opacity">
                     {/* Move Backward */}
                     {column !== 'New' && (
                       <div className="bg-[#D4A574]/20 p-1.5 hover:bg-[#D4A574]/50 transition-colors"
                            title="Move to Previous Stage" 
                            onClick={(e) => moveCandidate(e, candidate.id, column, 'backward')}>
                         <ChevronRight size={14} className="text-[#3E362E] rotate-180" />
                       </div>
                     )}
                     {/* Move Forward */}
                     {column !== 'Hired' && (
                       <div className="bg-[#D4A574]/20 p-1.5 hover:bg-[#D4A574]/50 transition-colors"
                            title="Move to Next Stage" 
                            onClick={(e) => moveCandidate(e, candidate.id, column, 'forward')}>
                         <ChevronRight size={14} className="text-[#3E362E]" />
                       </div>
                     )}
                   </div>
                </div>
              ))}
              
              {columnCandidates.length === 0 && !draggedId && (
                <div className="text-center p-4 border-2 border-dashed border-[#D4A574]/30 text-[#3E362E]/40 text-xs mt-2 uppercase">
                  Empty
                </div>
              )}
              {draggedId && columnCandidates.length === 0 && (
                <div className="text-center p-4 border-2 border-dashed border-[#4A7B7C]/50 bg-[#4A7B7C]/5 text-[#4A7B7C] text-xs mt-2 font-bold uppercase">
                  Drop Here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
