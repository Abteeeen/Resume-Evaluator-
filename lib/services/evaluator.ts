import { GoogleGenerativeAI } from '@google/generative-ai';

interface EvaluationResult {
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
    finalVerdict: string;
}

export async function evaluateResume(resumeText: string, jdText: string): Promise<EvaluationResult> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are a Senior Technical Recruiter. Your task is to evaluate a candidate's resume against a specific Job Description (JD).
    
    ### Guidelines:
    1. Be objective and critical. 
    2. Focus on core technical skills, years of experience, and project complexity.
    3. Provide the results ONLY in the following JSON format:
    {
      "score": <number 0-100>,
      "summary": "<1-2 sentences overview>",
      "pros": ["skill/experience 1", "skill/experience 2"],
      "cons": ["gap 1", "missing requirement 2"],
      "finalVerdict": "<detailed reasoning and recommendation>"
    }

    ### Job Description:
    ${jdText}

    ### Resume Content:
    ${resumeText}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('AI RAW RESPONSE:', text);
        
        // Clean JSON from potential markdown markers or extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain valid JSON');
        }
        
        const cleanedText = jsonMatch[0];
        return JSON.parse(cleanedText) as EvaluationResult;
    } catch (error: any) {
        console.error('Error evaluating resume:', error.message);
        throw new Error(`AI evaluation failed: ${error.message}`);
    }
}
