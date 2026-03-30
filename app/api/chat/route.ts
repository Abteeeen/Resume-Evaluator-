import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAI, AIConfig } from '@/lib/services/ai-factory';

// Simple in-memory store for conversation per resumeId (reset when server restarts)
const conversationStore: Record<string, { role: string; content: string }[]> = {};

export async function POST(req: NextRequest) {
  try {
    const { resumeId, message } = await req.json();
    if (!resumeId || !message) {
      return NextResponse.json({ error: 'resumeId and message required' }, { status: 400 });
    }

    // 0. Extract AI Config from headers
    const provider = req.headers.get('x-ai-provider') || 'gemini';
    const clientKey = req.headers.get('x-ai-key');
    const apiKey = clientKey && clientKey !== 'null' && clientKey !== '' 
        ? clientKey 
        : process.env.GEMINI_API_KEY;
    const modelName = req.headers.get('x-ai-model') || undefined;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key missing. Please configure it in Settings or .env.' }, { status: 401 });
    }

    const aiConfig: AIConfig = { provider: provider as any, apiKey, model: modelName };

    // 1. Retrieve resume text
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('parsed_content')
      .eq('id', resumeId)
      .single();
    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // 2. Initialise conversation history
    const history = conversationStore[resumeId] ?? [];
    // Append user message
    history.push({ role: 'user', content: message });

    // 3. Build prompt for LLM – include resume text and conversation history
    const prompt = `
    You are an AI Assistant helping a recruiter evaluate a candidate based on their resume.
    
    ### Resume Text:
    ${resume.parsed_content}

    ### Conversation History:
    ${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

    Assistant, answer the latest user question based on the resume. Be concise and professional.
    `;

    // 4. Call the AI Factory
    const assistantMessage = await callAI(prompt, aiConfig);

    // 5. Append assistant reply to store
    history.push({ role: 'assistant', content: assistantMessage });
    conversationStore[resumeId] = history;

    return NextResponse.json({ reply: assistantMessage });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
