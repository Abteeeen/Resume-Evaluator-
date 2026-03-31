import { NextRequest, NextResponse } from 'next/server';
import { parseResumeFile } from '@/lib/services/parser';
import { evaluateResume } from '@/lib/services/evaluator';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('resume') as File | null;
        const resumeUrl = formData.get('resumeUrl') as string | null;
        const jdId = formData.get('jdId') as string;
        const source = formData.get('source') as string || (resumeUrl ? 'url' : 'local');

        if ((!file && !resumeUrl) || !jdId) {
            return NextResponse.json({ error: 'Missing resume file/URL or jdId' }, { status: 400 });
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

        // 2. Extract Buffer & Parse Resume
        let resumeText = '';
        let filename = '';
        let fileType = '';
        let fileSize = 0;
        let fileBuffer: Buffer | null = null;

        if (resumeUrl) {
            filename = resumeUrl;
            fileType = 'url';
            try {
                const cheerio = await import('cheerio');
                const response = await fetch(resumeUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);
                const html = await response.text();
                const $ = cheerio.load(html);
                resumeText = $('body').text().replace(/\s+/g, ' ').trim();
                fileSize = html.length;
                if (!resumeText) throw new Error('No readable text found on the page');
            } catch (error: any) {
                console.error('URL Fetch Error:', error);
                return NextResponse.json({ error: `Could not parse URL: ${error.message}` }, { status: 400 });
            }
        } else if (file) {
            filename = file.name;
            fileType = file.type;
            fileSize = file.size;
            fileBuffer = Buffer.from(await file.arrayBuffer());
            resumeText = await parseResumeFile(fileBuffer);
        }

        // Sanitize resumeText: Remove NULL characters and other problematic control chars
        // Postgres TEXT/JSONB columns do not allow the NULL character (\u0000)
        resumeText = resumeText.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // 3. Save Resume to DB & Local Storage
        let fileUrl = resumeUrl || null;

        if (file && !resumeUrl && fileBuffer) {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const fileExt = filename.split('.').pop();
            const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            
            try {
                // Ensure directory exists
                await fs.mkdir(uploadDir, { recursive: true });
                // Save file locally
                await fs.writeFile(path.join(uploadDir, uniqueName), fileBuffer);
                fileUrl = `/uploads/${uniqueName}`;
            } catch (err) {
                console.error('Local Save Error:', err);
                // Fallback to null if save fails
            }
        }

        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                filename: filename,
                file_url: fileUrl,
                parsed_content: resumeText,
                source: source,
                metadata: { type: fileType, size: fileSize }
            })
            .select()
            .single();

        if (resumeError) {
            console.error('Resume Save Error:', resumeError);
            return NextResponse.json({ error: 'Failed to save resume', details: resumeError }, { status: 500 });
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

        // 6. Update Resume with extracted salaries if found
        if (evaluation.currentSalary || evaluation.expectedSalary) {
             await supabase.from('resumes').update({
                current_salary: evaluation.currentSalary,
                expected_salary: evaluation.expectedSalary
            }).eq('id', resume.id);
        }

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
