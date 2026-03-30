'use client';

import React, { useState } from 'react';
import { FileText, Save, Loader2, Plus } from 'lucide-react';
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
    <div className="retro-card space-y-6">
      <div className="flex justify-between items-center mb-2 border-b-2 border-[#D4A574] pb-2">
        <h2 className="text-xl font-bold text-[#3E362E] font-serif">Create New Role</h2>
      </div>
      
      <div className="space-y-4 text-sm font-mono">
        <input
          type="text"
          placeholder="Role Title (e.g., Senior Developer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-3 px-4 outline-none focus:border-[#4A7B7C] transition-colors font-bold text-[#3E362E] placeholder-[#3E362E]/40"
        />
        
        <textarea
          placeholder="Paste full job description here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-[#F5E6C8] border-2 border-[#D4A574] rounded-none py-3 px-4 h-32 outline-none focus:border-[#4A7B7C] transition-colors font-medium text-[#3E362E] placeholder-[#3E362E]/40 resize-y"
        />

        <button
          disabled={!title || !content || saving}
          onClick={handleSave}
          className="retro-button w-full sm:w-auto"
        >
          {saving ? (
            <><Loader2 className="animate-spin" size={18} /> Saving...</>
          ) : (
            <><Plus size={18} /> Save Job Description</>
          )}
        </button>
      </div>
    </div>
  );
}
