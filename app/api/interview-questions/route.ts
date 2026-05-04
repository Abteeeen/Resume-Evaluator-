import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/services/ai-factory';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { evaluationId } = await req.json();

        if (!evaluationId) {
            return NextResponse.json({ error: 'Missing evaluationId' }, { status: 400 });
        }

        const provider = req.headers.get('x-ai-provider') || 'gemini';
        const clientKey = req.headers.get('x-ai-key');
        const apiKey = clientKey && clientKey !== 'null' && clientKey !== ''
            ? clientKey
            : process.env.GEMINI_API_KEY;
        const modelName = req.headers.get('x-ai-model') || undefined;

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key missing.' }, { status: 401 });
        }

        const aiConfig = { provider: provider as any, apiKey, model: modelName };

        const { data: evaluation } = await supabase
            .from('evaluations')
            .select(`*, resumes (filename, parsed_content), job_descriptions (title, content)`)
            .eq('id', evaluationId)
            .single();

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        const feedback = JSON.parse(evaluation.detailed_feedback || '{}');

        const prompt = `
You are an expert Technical Recruiter and Interview Coach. Based on the resume evaluation below, generate a targeted, intelligent interview question card.

### Role: ${evaluation.job_descriptions?.title}

### Candidate: ${evaluation.resumes?.filename?.replace('.pdf', '')}
- Match Score: ${evaluation.score}%
- Summary: ${evaluation.summary}
- Strengths: ${feedback.pros?.join('; ') || 'N/A'}
- Gaps/Concerns: ${feedback.cons?.join('; ') || 'N/A'}
- Final Verdict: ${feedback.finalVerdict || 'N/A'}

### Resume (First 2000 chars):
${(evaluation.resumes?.parsed_content || '').substring(0, 2000)}

### Task:
Generate a comprehensive interview question card with:
1. 3 TECHNICAL questions that probe their specific claimed skills
2. 2 BEHAVIORAL questions targeting their soft skill gaps or to validate strengths
3. 2 CHALLENGE questions that directly address their identified weaknesses or red flags
4. 1 OPENER — a rapport-building opening question tailored to their background
5. 1 CLOSING — a question that reveals their real motivation/commitment level

Format: Return ONLY valid JSON:
{
  "candidateName": "...",
  "role": "...",
  "overallTip": "1-sentence interviewer tip for this specific candidate",
  "questions": {
    "opener": [
      { "question": "...", "purpose": "...", "goodAnswerLookFor": "..." }
    ],
    "technical": [
      { "question": "...", "purpose": "...", "goodAnswerLookFor": "..." }
    ],
    "behavioral": [
      { "question": "...", "purpose": "...", "goodAnswerLookFor": "..." }
    ],
    "challenge": [
      { "question": "...", "purpose": "...", "goodAnswerLookFor": "..." }
    ],
    "closing": [
      { "question": "...", "purpose": "...", "goodAnswerLookFor": "..." }
    ]
  }
}
`;

        const text = await callAI(prompt, aiConfig);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI did not return valid JSON');

        const card = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, card });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
