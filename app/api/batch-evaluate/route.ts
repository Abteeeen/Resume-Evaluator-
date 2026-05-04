import { NextRequest, NextResponse } from 'next/server';
import { parseResumeFile } from '@/lib/services/parser';
import { evaluateResume } from '@/lib/services/evaluator';
import { supabase } from '@/lib/supabase';

export const maxDuration = 120; // 2 minutes for batch

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const jdId = formData.get('jdId') as string;
        const files = formData.getAll('resumes') as File[];

        if (!files.length || !jdId) {
            return NextResponse.json({ error: 'Missing resumes or jdId' }, { status: 400 });
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

        // Fetch JD once
        const { data: jd } = await supabase
            .from('job_descriptions')
            .select('*')
            .eq('id', jdId)
            .single();

        if (!jd) {
            return NextResponse.json({ error: 'JD not found' }, { status: 404 });
        }

        // Process all files in parallel
        const results = await Promise.allSettled(
            files.map(async (file) => {
                try {
                    const fileBuffer = Buffer.from(await file.arrayBuffer());
                    let resumeText = await parseResumeFile(fileBuffer);
                    resumeText = resumeText
                        .replace(/\u0000/g, '')
                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

                    // Save resume
                    const { data: resume } = await supabase
                        .from('resumes')
                        .insert({
                            filename: file.name,
                            file_url: null,
                            parsed_content: resumeText,
                            source: 'batch',
                            metadata: { type: file.type, size: file.size, batch: true }
                        })
                        .select()
                        .single();

                    if (!resume) throw new Error('Failed to save resume');

                    // Evaluate
                    const evaluation = await evaluateResume(resumeText, jd.content, aiConfig);

                    // Save evaluation
                    const { data: evalData } = await supabase
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

                    if (evaluation.currentSalary || evaluation.expectedSalary) {
                        await supabase.from('resumes').update({
                            current_salary: evaluation.currentSalary,
                            expected_salary: evaluation.expectedSalary
                        }).eq('id', resume.id);
                    }

                    return {
                        filename: file.name,
                        resumeId: resume.id,
                        evaluationId: evalData?.id,
                        score: evaluation.score,
                        summary: evaluation.summary,
                        pros: evaluation.pros,
                        cons: evaluation.cons,
                        finalVerdict: evaluation.finalVerdict,
                        currentSalary: evaluation.currentSalary,
                        expectedSalary: evaluation.expectedSalary,
                        status: 'success'
                    };
                } catch (err: any) {
                    return {
                        filename: file.name,
                        status: 'error',
                        error: err.message
                    };
                }
            })
        );

        const processed = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: 'Unknown error' });
        const successful = processed.filter(r => r.status === 'success');
        successful.sort((a: any, b: any) => b.score - a.score);

        return NextResponse.json({
            success: true,
            total: files.length,
            completed: successful.length,
            failed: processed.filter(r => r.status === 'error').length,
            results: processed.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
