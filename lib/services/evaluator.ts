import { AIConfig, callAI } from './ai-factory';

interface EvaluationResult {
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
    finalVerdict: string;
    currentSalary?: string;
    expectedSalary?: string;
}

export async function evaluateResume(
    resumeText: string, 
    jdText: string,
    config: AIConfig
): Promise<EvaluationResult> {
    const prompt = `
    You are a Senior Technical Recruiter. Your task is to evaluate a candidate's resume against a specific Job Description (JD).
    
    ### Guidelines:
    1. Be objective and critical. 
    2. Focus on core technical skills, years of experience, and project complexity.
    3. Look for salary information (Current salary and Expected salary) if it's anywhere in the text (often at the beginning or end of application notes).
    4. Provide the results ONLY in a valid JSON format:
    {
      "score": <number 0-100>,
      "summary": "<1-2 sentences overview>",
      "pros": ["skill/experience 1", "skill/experience 2"],
      "cons": ["gap 1", "missing requirement 2"],
      "finalVerdict": "<detailed reasoning and recommendation>",
      "currentSalary": "<extracted value or null>",
      "expectedSalary": "<extracted value or null>"
    }

    ### Job Description:
    ${jdText}

    ### Resume Content:
    ${resumeText}
    `;

    try {
        const text = await callAI(prompt, config);
        console.log('AI RAW RESPONSE:', text);
        
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
