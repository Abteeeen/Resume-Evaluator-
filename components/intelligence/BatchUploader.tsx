'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';

interface BatchResult {
  filename: string;
  status: 'success' | 'error';
  score?: number;
  summary?: string;
  pros?: string[];
  cons?: string[];
  finalVerdict?: string;
  evaluationId?: string;
  currentSalary?: string;
  expectedSalary?: string;
  error?: string;
}

interface BatchUploaderProps {
  jdId: string;
  onComplete: (results: BatchResult[]) => void;
}

export const BatchUploader: React.FC<BatchUploaderProps> = ({ jdId, onComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!files.length || !jdId) return;
    setIsProcessing(true);
    setProgress(10);
    setStatusText(`Uploading ${files.length} resume${files.length > 1 ? 's' : ''}...`);

    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      const formData = new FormData();
      formData.append('jdId', jdId);
      files.forEach(f => formData.append('resumes', f));

      setProgress(30);
      setStatusText(`Running AI evaluation in parallel...`);

      const res = await fetch('/api/batch-evaluate', {
        method: 'POST',
        headers: {
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || '',
        },
        body: formData,
      });

      setProgress(90);
      setStatusText('Ranking results...');

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProgress(100);
      setStatusText(`Done! ${data.completed} of ${data.total} evaluated.`);
      setTimeout(() => {
        onComplete(data.results);
        setFiles([]);
        setIsProcessing(false);
        setProgress(0);
        setStatusText('');
      }, 800);

    } catch (err: any) {
      setStatusText(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#4A7B7C] bg-[#4A7B7C]/10'
            : 'border-[#D4A574] hover:border-[#4A7B7C] hover:bg-[#F5E6C8]/50'
        } ${isProcessing ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Upload className="mx-auto mb-3 text-[#D4A574]" size={32} />
        <p className="font-bold text-[#3E362E] font-mono text-sm uppercase tracking-widest">
          Drop Multiple PDFs Here
        </p>
        <p className="text-xs text-[#3E362E]/60 mt-1 font-mono">
          or click to browse — all evaluated in parallel
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#F5E6C8] border border-[#D4A574] px-3 py-2">
              <FileText size={14} className="text-[#4A7B7C] shrink-0" />
              <span className="flex-1 text-xs font-mono text-[#3E362E] truncate">{f.name}</span>
              <span className="text-[10px] text-[#3E362E]/50 font-mono">{(f.size / 1024).toFixed(0)}kb</span>
              {!isProcessing && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-[#3E362E]/40 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-[#D4A574]/30 h-2 border border-[#D4A574]">
            <div
              className="h-full bg-[#4A7B7C] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-[#3E362E]/70 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-[#4A7B7C]" />
            {statusText}
          </p>
        </div>
      )}

      {/* Submit */}
      {files.length > 0 && !isProcessing && (
        <button
          onClick={handleSubmit}
          disabled={!jdId}
          className="retro-button w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trophy size={16} />
          Evaluate {files.length} Resume{files.length > 1 ? 's' : ''} — Rank Them All
        </button>
      )}

      {!jdId && (
        <p className="text-xs text-center text-[#E8B4B8] font-mono font-bold uppercase tracking-widest">
          ⚠ Select a target role first
        </p>
      )}
    </div>
  );
};
