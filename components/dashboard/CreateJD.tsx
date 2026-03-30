'use client';

import React, { useState } from 'react';
import { FileText, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreateJDProps {
  onCreated: () => void;
}

export function CreateJD({ onCreated }: CreateJDProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !content) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('job_descriptions')
      .insert({ title, content });

    setSaving(false);
    if (!error) {
      setTitle('');
      setContent('');
      onCreated();
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <FileText size={20} className="text-purple-400" /> New Job Description
      </h3>
      
      <div className="space-y-4 text-sm">
        <input
          type="text"
          placeholder="Job Title (e.g. Senior Frontend Developer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-purple-500 transition-colors"
        />
        
        <textarea
          placeholder="Paste Job Description requirements here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-purple-500 transition-colors"
        />

        <button
          onClick={handleSave}
          disabled={!title || !content || saving}
          className="w-full py-2 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save JD</>}
        </button>
      </div>
    </div>
  );
}
