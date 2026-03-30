import { NextRequest, NextResponse } from 'next/server';
import { parseResumeFile } from '@/lib/services/parser';
import { evaluateResume } from '@/lib/services/evaluator';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File;
        const jdId = formData.get('jdId') as string;
        const source = formData.get('source') as string || 'local';

        if (!file || !jdId) {
            return NextResponse.json({ error: 'Missing resume or jdId' }, { status: 400 });
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

        const aiConfig = { provider: provider as any, apiKey, model: modelName };

        // 1. Fetch JD
        const { data: jd, error: jdError } = await supabase
            .from('job_descriptions')
            .select('*')
            .eq('id', jdId)
            .single();

        if (jdError || !jd) {
            return NextResponse.json({ error: 'Job Description not found' }, { status: 404 });
        }

        // 2. Parse Resume
        const buffer = Buffer.from(await file.arrayBuffer());
        const resumeText = await parseResumeFile(buffer);

        // 3. Save Resume to DB
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                filename: file.name,
                parsed_content: resumeText,
                source: source,
                metadata: { type: file.type, size: file.size }
            })
            .select()
            .single();

        if (resumeError) {
            console.error('Resume Save Error:', resumeError);
            return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
        }

        // 4. Evaluate with AI
        const evaluation = await evaluateResume(resumeText, jd.content, aiConfig);

        // 5. Save Evaluation Result
        const { data: evalData, error: evalError } = await supabase
            .from('evaluations')
            .insert({
                resume_id: resume.id,
                jd_id: jd.id,
                score: evaluation.score,
                summary: evaluation.summary,
                detailed_feedback: JSON.stringify({
                    pros: evaluation.pros,
                    cons: evaluation.cons,
                    finalVerdict: evaluation.finalVerdict
                }),
                status: 'completed'
            })
            .select()
            .single();

        if (evalError) {
            console.error('Evaluation Save Error:', evalError);
            return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            resumeId: resume.id,
            evaluationId: evalData.id,
            result: evaluation
        });

    } catch (error: any) {
        console.error('API Error:', error.message);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            details: error.stack
        }, { status: 500 });
    }
}
