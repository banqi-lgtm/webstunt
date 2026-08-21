import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { descripcion, valor } = await req.json();

    if (!descripcion || !valor) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const promptText = `
Eres un contador público colombiano experto en retención en la fuente (año 2024).
Se te proporciona el concepto/descripción del servicio: "${descripcion}" y el valor facturado: ${valor} COP.

Analiza la descripción y determina el "MOTIVO" (Categoría según la tabla de retención en la fuente de Colombia) y el "PORCENTAJE" de retención que aplica, asumiendo que es para una persona natural, a menos que el concepto indique lo contrario.

Ejemplos comunes (Reglas):
- "Logística", "Mantenimiento", "Transporte", "Aseo", "Servicios": "Servicios Generales" (usa SIEMPRE 4% a menos que sea explícitamente otro caso).
- "Asesoría", "Consultoría", "Abogado", "Honorarios": "Honorarios y Comisiones" (usa 10% o 11%).
- "Compra de equipos", "Insumos": "Compras" (usa 2.5%).
- "Arrendamiento", "Alquiler": "Arrendamientos" (usa 3.5%).
- Transporte explícito: "Transporte" (usa 1%).
- Si la descripción no se entiende, clasifícala como "Servicios Generales" al 4%.

IMPORTANTE: El "MOTIVO" DEBE ser EXACTAMENTE una de las siguientes opciones (respeta mayúsculas y minúsculas):
"Servicios Generales", "Honorarios y Comisiones", "Compras", "Arrendamientos", "Transporte", "Ninguna"

Responde SOLO con un objeto JSON válido con la siguiente estructura exacta, sin texto adicional ni bloques markdown:
{
  "motivo": "Servicios Generales",
  "porcentaje": 4
}
`;

    const response = await ai.generate({
      messages: [
        {
          role: 'user',
          content: [
            { text: promptText }
          ]
        }
      ],
      output: { format: 'json' }
    });

    const textOutput = response.text;
    
    // Clean potential markdown blocks
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
    console.warn('AI Retencion falling back to rule-based parser:', error?.message);
    
    // Heuristic fallback based on Colombian DIAN withholding rules
    const { descripcion } = await req.json().catch(() => ({ descripcion: '' }));
    const text = (descripcion || '').toLowerCase();
    
    let motivo = 'Servicios Generales';
    let porcentaje = 4;

    if (text.includes('honorario') || text.includes('asesor') || text.includes('consultor') || text.includes('abogado') || text.includes('contador') || text.includes('diseñ')) {
      motivo = 'Honorarios y Comisiones';
      porcentaje = 10;
    } else if (text.includes('compra') || text.includes('insumo') || text.includes('material') || text.includes('equipo')) {
      motivo = 'Compras';
      porcentaje = 2.5;
    } else if (text.includes('arrend') || text.includes('alquiler')) {
      motivo = 'Arrendamientos';
      porcentaje = 3.5;
    } else if (text.includes('transporte') || text.includes('flete') || text.includes('acarreo')) {
      motivo = 'Transporte';
      porcentaje = 1;
    } else if (text.includes('logistica') || text.includes('staff') || text.includes('apoyo') || text.includes('mantenimiento') || text.includes('operativ')) {
      motivo = 'Servicios Generales';
      porcentaje = 4;
    }

    return NextResponse.json({ motivo, porcentaje });
  }
}
