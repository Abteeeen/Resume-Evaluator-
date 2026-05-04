'use client';

import React, { useState } from 'react';
import { Loader2, MessageSquare, BookOpen, Zap, Shield, ChevronDown, ChevronUp, Printer } from 'lucide-react';

interface Question {
  question: string;
  purpose: string;
  goodAnswerLookFor: string;
}

interface InterviewCard {
  candidateName: string;
  role: string;
  overallTip: string;
  questions: {
    opener: Question[];
    technical: Question[];
    behavioral: Question[];
    challenge: Question[];
    closing: Question[];
  };
}

interface InterviewCardProps {
  evaluationId: string;
  candidateName: string;
}

const SECTION_CONFIG = [
  { key: 'opener', label: 'Opener', icon: MessageSquare, color: '#D4A574' },
  { key: 'technical', label: 'Technical', icon: Zap, color: '#4A7B7C' },
  { key: 'behavioral', label: 'Behavioral', icon: BookOpen, color: '#8B7355' },
  { key: 'challenge', label: 'Challenge / Red Flag Probe', icon: Shield, color: '#E8B4B8' },
  { key: 'closing', label: 'Closing', icon: MessageSquare, color: '#3E362E' },
];

export const InterviewCardComponent: React.FC<InterviewCardProps> = ({ evaluationId, candidateName }) => {
  const [card, setCard] = useState<InterviewCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    opener: true, technical: true, behavioral: true, challenge: true, closing: true
  });

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      const res = await fetch('/api/interview-questions', {
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
      setCard(data.card);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!card) {
    return (
      <div className="space-y-3">
        <button
          onClick={generate}
          disabled={loading}
          className="retro-button w-full"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Crafting Questions...</>
            : <><MessageSquare size={16} /> Generate Interview Card</>
          }
        </button>
        {error && <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 p-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black font-serif text-[#3E362E] text-lg">{card.candidateName || candidateName}</h3>
          <p className="text-xs font-mono text-[#4A7B7C] uppercase tracking-widest">{card.role}</p>
        </div>
        <button onClick={handlePrint} className="p-2 border border-[#D4A574] hover:bg-[#D4A574]/20 transition-colors text-[#3E362E]">
          <Printer size={16} />
        </button>
      </div>

      {/* Tip Banner */}
      <div className="bg-[#D4A574]/20 border-l-4 border-[#D4A574] px-4 py-3">
        <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#4A7B7C] mb-1">Interviewer Tip</p>
        <p className="text-xs font-serif italic text-[#3E362E]/80">{card.overallTip}</p>
      </div>

      {/* Question Sections */}
      {SECTION_CONFIG.map(({ key, label, icon: Icon, color }) => {
        const questions = card.questions[key as keyof typeof card.questions] || [];
        const isOpen = openSections[key];
        return (
          <div key={key} className="border border-[#D4A574] overflow-hidden">
            <button
              onClick={() => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F5E6C8] hover:bg-[#D4A574]/20 transition-colors"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color }} />
                <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#3E362E]">{label}</span>
                <span className="text-[10px] text-[#3E362E]/50">({questions.length})</span>
              </div>
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
              <div className="divide-y divide-[#D4A574]/30">
                {questions.map((q, i) => (
                  <div key={i} className="p-4 bg-[#FAFAFA] space-y-2">
                    <p className="font-bold text-sm text-[#3E362E] leading-relaxed">
                      <span className="text-[#D4A574] font-mono">Q{i + 1}.</span> {q.question}
                    </p>
                    <div className="pl-4 space-y-1">
                      <p className="text-[10px] font-mono text-[#4A7B7C] uppercase tracking-wider">Purpose</p>
                      <p className="text-xs text-[#3E362E]/70">{q.purpose}</p>
                    </div>
                    <div className="pl-4 space-y-1">
                      <p className="text-[10px] font-mono text-[#4A7B7C] uppercase tracking-wider">Look For</p>
                      <p className="text-xs text-[#3E362E]/70 italic">{q.goodAnswerLookFor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => setCard(null)} className="text-xs font-mono text-[#3E362E]/40 hover:text-[#3E362E] transition-colors">
        ↺ Regenerate
      </button>
    </div>
  );
};
