'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Save, Key, Cpu, ShieldCheck } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
    if (config.provider) setProvider(config.provider);
    if (config.apiKey) setApiKey(config.apiKey);
    if (config.model) setModel(config.model);
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai-config', JSON.stringify({ provider, apiKey, model }));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-card max-w-md w-full p-8 relative animate-in zoom-in duration-300 border-purple-500/30">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <header className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Portal Settings</h2>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Configure your keys</p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Cpu size={12} /> AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['gemini', 'grok', 'openai', 'other'].map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`py-2 text-sm font-bold rounded-lg border transition-all uppercase tracking-tight ${
                    provider === p 
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400' 
                      : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 flex items-center gap-2">
              <Key size={12} /> API Key
            </label>
            <input
              type="password"
              placeholder="Paste your API key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#1A1A1A] border-2 border-white/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-[#252525] transition-all font-mono text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 flex items-center gap-2">
              <ShieldCheck size={12} /> Specific Model (Optional)
            </label>
            <input
              type="text"
              placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'grok-2-1212'}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#1A1A1A] border-2 border-white/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:bg-[#252525] transition-all text-sm text-white placeholder:text-zinc-600"
            />
            <p className="text-[10px] text-zinc-500 pl-1">Leave blank to use provider defaults.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={!apiKey}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saved ? 'Settings Saved!' : <><Save size={18} /> Update Portal</>}
          </button>
        </div>
      </div>
    </div>
  );
}
