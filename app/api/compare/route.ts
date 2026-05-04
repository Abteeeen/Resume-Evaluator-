import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/services/ai-factory';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { evaluationIds, jdId } = await req.json();

        if (!evaluationIds || evaluationIds.length < 2) {
            return NextResponse.json({ error: 'Select at least 2 candidates to compare' }, { status: 400 });
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

        // Fetch evaluations with resumes and JD
        const { data: evaluations } = await supabase
            .from('evaluations')
            .select(`*, resumes (filename, parsed_content), job_descriptions (title, content)`)
            .in('id', evaluationIds);

        if (!evaluations || evaluations.length < 2) {
            return NextResponse.json({ error: 'Could not find evaluations' }, { status: 404 });
        }

        const jdContent = evaluations[0].job_descriptions?.content || '';
        const jdTitle = evaluations[0].job_descriptions?.title || '';

        // Build comparison prompt
        const candidatesSummary = evaluations.map((e: any, idx: number) => {
            const feedback = JSON.parse(e.detailed_feedback || '{}');
            return `
CANDIDATE ${idx + 1}: ${e.resumes?.filename?.replace('.pdf', '')}
- Overall Match Score: ${e.score}%
- Summary: ${e.summary}
- Key Strengths: ${feedback.pros?.join(', ') || 'N/A'}
- Gaps: ${feedback.cons?.join(', ') || 'N/A'}
- Final Verdict: ${feedback.finalVerdict || 'N/A'}
---`;
        }).join('\n');

        const prompt = `
You are a Senior Talent Acquisition Director. You must compare these ${evaluations.length} candidates for the role of "${jdTitle}" and produce a detailed comparative analysis.

### Job Description:
${jdContent}

### Candidates:
${candidatesSummary}

### Your Task:
Compare all candidates across these 5 dimensions (score 0-100 for each):
1. Technical Match - hard skills, tools, tech stack alignment
2. Experience Depth - years, seniority, project scale
3. Domain Knowledge - industry and role-specific expertise
4. Communication - how they present achievements and complexity
5. Overall Risk - stability, career trajectory, red flags (invert: 100 = low risk)

Then rank all candidates from best to worst fit.

Return ONLY valid JSON in this format:
{
  "rankings": [
    {
      "rank": 1,
      "candidateIndex": 0,
      "name": "...",
      "whyFirst": "...",
      "radarScores": {
        "technicalMatch": 0,
        "experienceDepth": 0,
        "domainKnowledge": 0,
        "communication": 0,
        "overallRisk": 0
      }
    }
  ],
  "topPick": "Name of the best candidate",
  "topPickReasoning": "2-3 sentences on why they win",
  "vsVerdict": "1 sentence head-to-head comparison of top 2",
  "whoToInterviewFirst": "Name",
  "keyDifferentiator": "The single biggest factor that separates the top candidates"
}
`;

        const text = await callAI(prompt, aiConfig);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI did not return valid JSON');

        const comparison = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, comparison, candidates: evaluations.map((e: any) => ({
            id: e.id,
            name: e.resumes?.filename?.replace('.pdf', ''),
            score: e.score
        }))});

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
