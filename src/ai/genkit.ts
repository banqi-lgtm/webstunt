import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: apiKey ? [googleAI({ apiKey })] : [googleAI()],
  model: 'googleai/gemini-flash-latest',
});
