import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { certFile, rutFile } = await req.json();

    if (!certFile && !rutFile) {
      return NextResponse.json({ error: 'Faltan documentos' }, { status: 400 });
    }

    const mediaList: any[] = [];
    if (certFile && certFile.dataUrl) {
      mediaList.push({ media: { url: certFile.dataUrl, contentType: certFile.fileType } });
    }
    if (rutFile && rutFile.dataUrl) {
      mediaList.push({ media: { url: rutFile.dataUrl, contentType: rutFile.fileType } });
    }

    const promptText = `Extract the banking information and personal identification from the provided document(s). It may be a bank certification, a Colombian RUT (Registro Único Tributario), or both.
Your goal is to extract the following 5 fields:
- "banco": The name of the bank (e.g. Bancolombia, Nequi, Davivienda, etc.). Look in the bank certification. If it is Nequi, just write "Nequi".
- "tipoCuenta": The type of account (e.g. "Ahorros" or "Corriente", or "Nequi", "Daviplata"). If it's Nequi, write "Nequi" or "Ahorros".
- "numeroCuenta": The bank account number or cell phone number. If it is a Nequi certificate, look for "Número de Depósito Nequi", "Número de producto", or the phone number.
- "documentoIdentidad": The ID number of the person. If you see a RUT, extract the "NIT" (Número de Identificación Tributaria). IMPORTANTE: In a RUT, the NIT is inside a main box, and the DV (Dígito de Verificación) is in a separate TINY box next to it. YOU MUST IGNORE THE TINY BOX! Do not include the DV. For example, if the main box says "998877665" and the tiny box says "4", your output MUST BE EXACTLY "998877665". Read the actual document! If you see a Cédula, extract the ID number.
- "ciudad": The city associated with the person. In a Colombian RUT, this is ALWAYS in Box 40 ("Ciudad/Municipio"). You MUST read the exact text written in Box 40 (e.g., "Medellín", "Bogotá, D.C.", "Cali"). NEVER guess or default to an example. If you cannot read Box 40, leave it empty. Do NOT include trailing periods or dots at the end of the city name.

Respond ONLY with a valid JSON object matching this structure. Do not include markdown formatting like \`\`\`json.
{
  "banco": "",
  "tipoCuenta": "",
  "numeroCuenta": "",
  "documentoIdentidad": "",
  "ciudad": ""
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
    
    let extractedData: any = {};
    try {
      extractedData = JSON.parse(cleanJson);
      // Strip any dash and verification digit that AI might have included
      if (extractedData.documentoIdentidad && typeof extractedData.documentoIdentidad === 'string') {
        extractedData.documentoIdentidad = extractedData.documentoIdentidad.split('-')[0].trim();
      }
      if (extractedData.ciudad && typeof extractedData.ciudad === 'string') {
        extractedData.ciudad = extractedData.ciudad.replace(/[.,\s]+$/, '').trim();
      }
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
