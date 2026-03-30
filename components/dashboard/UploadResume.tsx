'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadResumeProps {
  jdId: string;
  onSuccess: (data: any) => void;
}

export function UploadResume({ jdId, onSuccess }: UploadResumeProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file || !jdId) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jdId', jdId);

    try {
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || '',
        },
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      onSuccess(data);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-bold">Upload Resume</h3>
      
      {!file ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            <p className="text-sm text-zinc-400">Click or drag PDF resume here</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
          />
        </label>
      ) : (
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={20} />
            <span className="text-sm font-medium">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        disabled={!file || uploading || !jdId}
        onClick={handleUpload}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Evaluating...
          </>
        ) : (
          'Analyze Resume'
        )}
      </button>
    </div>
  );
}
