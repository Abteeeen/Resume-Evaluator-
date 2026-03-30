import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ResumeChatProps {
  resumeId: string;
}

export default function ResumeChat({ resumeId }: ResumeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(false); // set to true after reading config
    
    try {
      setLoading(true);
      const config = JSON.parse(localStorage.getItem('ai-config') || '{}');
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-ai-provider': config.provider || 'gemini',
          'x-ai-key': config.apiKey || '',
          'x-ai-model': config.model || ''
        },
        body: JSON.stringify({ resumeId, message: userMsg.content }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const assistantMsg = { role: 'assistant' as const, content: data.reply || 'No response' };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = { role: 'assistant' as const, content: 'Error contacting AI.' };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mt-6 border-t border-[#D4A574] pt-4">
      <h4 className="text-sm font-bold text-[#3E362E] uppercase tracking-widest mb-2">
        Chat with Resume
      </h4>
      <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg p-2 max-w-xs ${msg.role === 'user' ? 'bg-[#D4A574]/30 text-[#3E362E]' : 'bg-[#F5E6C8] text-[#3E362E]'} `}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <textarea
          className="flex-1 p-2 border border-[#D4A574] rounded-none bg-[#F5E6C8] text-[#3E362E] resize-none"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about the candidate..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="p-2 bg-[#D4A574]/30 hover:bg-[#D4A574]/50 rounded-none text-[#3E362E]"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
