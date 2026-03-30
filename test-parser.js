const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
    try {
        console.log('Starting test...');
        const data = fs.readFileSync('test.pdf'); // I'll need a test pdf or I'll just simulate
        const parser = new PDFParse({ data });
        const result = await parser.getText();
        console.log('Text extracted:', result.text.substring(0, 100));
        await parser.destroy();
    } catch (error) {
        console.error('DETAILED ERROR:', error);
    }
}

test();
