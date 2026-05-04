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
            .select(`*, resumes (filename, parsed_content), job_descriptions (title)`)
            .eq('id', evaluationId)
            .single();

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        const prompt = `
You are an expert in HR risk management and resume fraud detection. Analyze the following resume and evaluation for red flags, inconsistencies, and risk indicators.

### Candidate: ${evaluation.resumes?.filename?.replace('.pdf', '')}
### Role Applied For: ${evaluation.job_descriptions?.title}
### Match Score: ${evaluation.score}%
### AI Summary: ${evaluation.summary}

### Resume Content:
${(evaluation.resumes?.parsed_content || '').substring(0, 3000)}

### Analyze for these risk categories:
1. Job Hopping: Multiple short tenures (< 12 months)
2. Unexplained Gaps: Periods of unexplained unemployment
3. Skill Inflation: Claimed expertise without evidence
4. Achievement Vagueness: Generic statements, no quantified results  
5. Title Inflation: Roles that seem inflated vs actual responsibilities described
6. Salary Red Flags: Expectations far above market, or significantly below (undercutting)
7. Timeline Inconsistency: Overlapping dates, impossible experience claims
8. Over-qualification: Significantly overqualified for the role

Return ONLY valid JSON:
{
  "overallRisk": "LOW" | "MEDIUM" | "HIGH",
  "riskScore": <number 0-100, 100 = highest risk>,
  "flags": [
    {
      "category": "Job Hopping" | "Skill Inflation" | "Achievement Vagueness" | "Unexplained Gap" | "Title Inflation" | "Salary Red Flag" | "Timeline Inconsistency" | "Over-qualification",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "description": "Specific observation from the resume",
      "recommendation": "What to probe in interview"
    }
  ],
  "greenFlags": [
    "Positive signal 1",
    "Positive signal 2"
  ],
  "interviewFocus": "What to specifically drill into given these risks",
  "hiringRecommendation": "PROCEED" | "PROCEED WITH CAUTION" | "DEEP PROBE NEEDED" | "DECLINE"
}
`;

        const text = await callAI(prompt, aiConfig);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI did not return valid JSON');

        const audit = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, audit, candidateName: evaluation.resumes?.filename?.replace('.pdf', '') });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
