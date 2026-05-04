import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/services/ai-factory';

export async function POST(req: NextRequest) {
    try {
        const { jdContent, jdTitle } = await req.json();

        if (!jdContent) {
            return NextResponse.json({ error: 'Missing JD content' }, { status: 400 });
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

        const prompt = `
You are a Talent Acquisition Strategist and DEI consultant. Critically analyze this Job Description for quality, inclusivity, and effectiveness.

### JD Title: ${jdTitle || 'Untitled Role'}
### JD Content:
${jdContent}

### Analyze across these dimensions:
1. Clarity & Specificity: Are requirements clear and unambiguous?
2. Skill List Realism: Are all listed skills truly necessary? Are any contradictory?
3. Gendered Language: Any masculine/feminine-coded words that could deter candidates?
4. Seniority Mismatch: Does the required experience match the likely compensation level?
5. Must-Have vs Nice-to-Have: Are they clearly separated or mixed together?
6. Inclusivity Score: Does the JD welcome diverse backgrounds or unintentionally exclude?
7. Completeness: Missing info (salary range, growth path, team size, remote policy)?
8. Buzzword Overload: Vague corporate-speak that adds no value?

Return ONLY valid JSON:
{
  "overallScore": <number 0-100>,
  "grade": "A" | "B" | "C" | "D" | "F",
  "summary": "2-3 sentence overview of JD quality",
  "issues": [
    {
      "category": "Gendered Language" | "Skill Inflation" | "Missing Info" | "Seniority Mismatch" | "Buzzword Overload" | "Unrealistic Requirements" | "Clarity Issue",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "excerpt": "Exact quote from JD",
      "suggestion": "How to improve this specific issue"
    }
  ],
  "strengths": ["What the JD does well"],
  "rewriteSuggestions": [
    {
      "original": "Exact phrase from JD",
      "improved": "Better version"
    }
  ],
  "salaryEstimate": "Rough market salary range based on the skills required",
  "talentPoolImpact": "How restrictive is this JD? Will it attract or deter good candidates?",
  "topRecommendation": "The single most important change to make"
}
`;

        const text = await callAI(prompt, aiConfig);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI did not return valid JSON');

        const analysis = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
