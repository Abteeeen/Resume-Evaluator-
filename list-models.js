const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('Fetching models...');
        // Note: listModels might not be available in all versions of the SDK or might need a different import
        // But let's try the common way
        const models = await genAI.listModels();
        for (const model of models) {
            console.log(`- ${model.name} (supports: ${model.supportedGenerationMethods.join(', ')})`);
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
