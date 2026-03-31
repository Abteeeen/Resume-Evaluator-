'use client';

import React, { useState } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Link } from 'lucide-react';

interface UploadResumeProps {
  jdId: string;
  onSuccess: (data: any) => void;
}

export function UploadResume({ jdId, onSuccess }: UploadResumeProps) {
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!jdId) return;
    if (uploadType === 'file' && !file) return;
    if (uploadType === 'link' && !url) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('jdId', jdId);
    
    if (uploadType === 'file' && file) {
      formData.append('resume', file);
    } else if (uploadType === 'link' && url) {
      formData.append('resumeUrl', url);
    }

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
      if (!res.ok) {
        const errorMsg = data.details?.message || data.error || 'Upload failed';
        throw new Error(errorMsg);
      }
      
      onSuccess(data);
      setFile(null);
      setUrl('');
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isUploadDisabled = (uploadType === 'file' && !file) || (uploadType === 'link' && !url) || uploading || !jdId;

  return (
    <div className="retro-card space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold font-serif text-[#3E362E]">Upload Resume</h3>
        <div className="flex bg-[#F5E6C8] border-2 border-[#D4A574] rounded-sm p-1 font-mono text-xs">
          <button
            onClick={() => setUploadType('file')}
            className={`px-3 py-1 rounded-sm transition-all focus:outline-none ${uploadType === 'file' ? 'bg-[#D4A574] text-[#3E362E] font-bold shadow-sm' : 'text-[#3E362E]/60 hover:text-[#3E362E]'}`}
          >
            PDF
          </button>
          <button
            onClick={() => setUploadType('link')}
            className={`px-3 py-1 rounded-sm transition-all focus:outline-none ${uploadType === 'link' ? 'bg-[#D4A574] text-[#3E362E] font-bold shadow-sm' : 'text-[#3E362E]/60 hover:text-[#3E362E]'}`}
          >
            URL
          </button>
        </div>
      </div>
      
      {uploadType === 'file' ? (
        !file ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-[#D4A574] hover:border-[#3E362E] bg-[#F5E6C8] rounded-sm p-6 text-center transition-all">
              <Upload className="mx-auto h-8 w-8 mb-2 text-[#D4A574]" />
              <p className="text-sm text-[#3E362E]/60">Click or drag PDF resume here</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 bg-[#F5E6C8] border-2 border-[#4A7B7C] rounded-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#4A7B7C]" size={20} />
              <div>
                <p className="font-bold text-[#4A7B7C] font-mono">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-[#3E362E]/50 hover:text-[#E8B4B8] text-xs mt-1 underline">Remove</button>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Link className="absolute left-3 top-3 text-[#D4A574]" size={18} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className="w-full bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-3 pl-10 pr-4 outline-none focus:border-[#4A7B7C] transition-colors font-mono text-[#3E362E] placeholder-[#3E362E]/40 font-bold"
            />
          </div>
          <p className="text-xs text-[#3E362E]/60 font-mono italic">
            Paste a public LinkedIn profile URL or any professional portfolio link.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#E8B4B8]/20 text-[#A83232] text-xs rounded-sm border border-[#E8B4B8] flex items-center gap-2 font-mono">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        disabled={isUploadDisabled}
        onClick={handleUpload}
        className="w-full py-4 text-sm retro-button disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin" size={18} /> Analyzing Tape...
          </>
        ) : (
          'Evaluate Candidate'
        )}
      </button>
    </div>
  );
}
