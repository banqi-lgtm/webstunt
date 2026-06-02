import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { certFile, rutFile } = await req.json();

    if (!certFile) {
      return NextResponse.json({ error: 'Falta la certificación bancaria' }, { status: 400 });
    }

    const mediaList: any[] = [];
    if (certFile.dataUrl) {
      mediaList.push({ media: { url: certFile.dataUrl, contentType: certFile.fileType } });
    }
    if (rutFile && rutFile.dataUrl) {
      mediaList.push({ media: { url: rutFile.dataUrl, contentType: rutFile.fileType } });
    }

    const promptText = `Extract the banking information and personal identification from these two documents. One is a bank certification, and the other is a Colombian RUT (Registro Único Tributario) or Cédula.
Your goal is to extract the following 4 fields:
- "banco": The name of the bank (e.g. Bancolombia, Nequi, Davivienda, etc.). Look in the bank certification. If it is Nequi, just write "Nequi".
- "tipoCuenta": The type of account (e.g. "Ahorros" or "Corriente", or "Nequi", "Daviplata"). If it's Nequi, write "Nequi" or "Ahorros".
- "numeroCuenta": The bank account number or cell phone number. If it is a Nequi certificate, look for "Número de Depósito Nequi", "Número de producto", or the phone number.
- "documentoIdentidad": The ID number of the person. If you see a RUT, extract the "NIT" (Número de Identificación Tributaria). The NIT is usually a long number (e.g., 1020304050-1), you can extract it with or without the dash and verification digit. Look for the box that says "NIT" or "Número de Identificación Tributaria" on the RUT. If you see a Cédula, extract the ID number.

Respond ONLY with a valid JSON object matching this structure. Do not include markdown formatting like \`\`\`json.
{
  "banco": "",
  "tipoCuenta": "",
  "numeroCuenta": "",
  "documentoIdentidad": ""
}`;

    const response = await ai.generate({
      messages: [
        {
          role: 'user',
          content: [
            { text: promptText },
            ...mediaList
          ]
        }
      ],
      output: { format: 'json' }
    });

    const textOutput = response.text;
    
    // Clean potential markdown blocks or extra text
    let cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }
    
    let extractedData = {};
    try {
      extractedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse JSON from AI:', cleanJson);
      return NextResponse.json({ error: 'Failed to parse AI output', raw: cleanJson }, { status: 500 });
    }

    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
