import { extractText } from 'unpdf';

export async function parseResumeFile(fileBuffer: Buffer): Promise<string> {
    try {
        const data = new Uint8Array(fileBuffer);
        const { text } = await extractText(data, { mergePages: true });
        return text;
    } catch (error: any) {
        console.error('PDF PARSE ERROR:', error.message);
        throw new Error(`Failed to parse PDF resume: ${error.message}`);
    }
}
