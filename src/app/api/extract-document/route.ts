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

    const promptText = `Eres un experto en extraer datos de documentos legales y bancarios en Colombia. Revisa cuidadosamente los documentos adjuntos (RUT y/o Certificación Bancaria) y extrae estrictamente lo siguiente:

1. "banco": El nombre del banco en la certificación bancaria (ej. Bancolombia, Nequi, Davivienda, Banco de Bogotá, Nu, Lulo, Daviplata).
2. "tipoCuenta": El tipo de cuenta bancaria (ej. Ahorros, Corriente, Nequi, Daviplata).
3. "numeroCuenta": El número de la cuenta bancaria. Si es Nequi o Daviplata, suele ser un número de celular. Si dice "Número de producto", extrae los dígitos. Solo números.
4. "documentoIdentidad": En el RUT, es el NIT (casilla 5). IMPORTANTE: Extrae SOLO el número principal, IGNORA el dígito de verificación (DV) que está en la casilla pequeñita al lado. Si es cédula, el número de cédula. Solo números.
5. "ciudad": La ciudad o municipio de residencia o domicilio del contribuyente en el RUT.
¡ADVERTENCIA CRÍTICA SOBRE LA CIUDAD!:
- En el encabezado del RUT o en la casilla 24 ("Dirección Seccional") casi siempre dice "02 MEDELLIN" o "SECCIONAL MEDELLIN". ¡ESA NO ES LA CIUDAD DEL USUARIO! Esa es la oficina regional de la DIAN. NUNCA extraigas la ciudad del encabezado ni de la casilla 24.
- Debes buscar exclusivamente en la sección "UBICACIÓN", específicamente en la CASILLA 40 ("40. Municipio" o "Ciudad / Municipio").
- Lee lo que dice exactamente la CASILLA 40 (por ejemplo si dice BELLO, ITAGÜÍ, ENVIGADO, SABANETA, RIONEGRO, COPACABANA, GIRARDOTA, CALDAS, BOGOTÁ, CALI, BARRANQUILLA, etc.).
- Si la casilla 40 tiene un código DANE y luego el nombre (ej. "05088 BELLO" o "088 BELLO"), extrae ÚNICAMENTE el nombre ("Bello").
- NUNCA devuelvas Medellín por defecto si en la Casilla 40 dice otro municipio.

Responde SOLO con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques markdown:
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
        let city = extractedData.ciudad.replace(/[.,\s]+$/, '').trim();
        // Remove leading postal/DANE code if present (e.g. "05088 BELLO" -> "BELLO" or "088 - BELLO" -> "BELLO")
        city = city.replace(/^[\d\s\-]+/, '').trim();
        // Capitalize properly if needed
        extractedData.ciudad = city;
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
