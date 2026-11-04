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
4. "documentoIdentidad": En el RUT, busca en la CASILLA 6 ("6. Número de identificación").
   - La casilla 5 es el tipo de documento (ej. código "13" para C.C.), ¡NUNCA la unas ni la concatenes con el número de la casilla 6!
   - Extrae ÚNICAMENTE los dígitos numéricos de la casilla 6 (ej. "1010096437" o "1000760142").
   - IGNORA por completo el dígito de verificación (DV) en la casilla 12 o casilla pequeñita al lado.
   - NUNCA incluyas prefijos como "CC", "C.C.", "NIT", guiones ni puntos. Solo números puros.

5. Nombres y Apellidos en el RUT (CASILLAS 31, 32, 33, 34 y 35):
   ¡REVISA MINUCIOSAMENTE CADA UNA DE ESTAS CASILLAS EN EL RUT!:
   - "primerApellido": Extrae el texto exacto de la casilla 31 ("31. Primer apellido"). Si está vacía, devuelve "".
   - "segundoApellido": Extrae el texto exacto de la casilla 32 ("32. Segundo apellido"). Si está vacía, devuelve "".
   - "primerNombre": Extrae el texto exacto de la casilla 33 ("33. Primer nombre"). Si está vacía, devuelve "".
   - "otrosNombres": Extrae el texto exacto de la casilla 34 ("34. Otros nombres"). Si está vacía, devuelve "".
   - "razonSocial": Extrae el texto exacto de la casilla 35 ("35. Razón social") si es persona jurídica / empresa. Si está vacía, devuelve "".
   
   ¡REGLAS CRÍTICAS PARA ARMAR EL NOMBRE COMPLETO!:
   - Para PERSONA NATURAL: El orden oficial DEBE ser: Primer Nombre (casilla 33) + Otros Nombres (casilla 34) + Primer Apellido (casilla 31) + Segundo Apellido (casilla 32).
     * OJO: En el formulario del RUT las casillas están ubicadas en orden visual (31, 32, 33, 34), pero el nombre de la persona debe comenzar con los NOMBRES (33 y 34) y terminar con los APELLIDOS (31 y 32).
     * REVISA TODOS LOS CASOS POSIBLES (IGNORA CUALQUIER CASILLA QUE ESTÉ VACÍA):
       1. Caso 2 nombres y 2 apellidos: 33="WILSON", 34="DANIEL", 31="GAVIRIA", 32="HERNANDEZ"
          -> "primerNombre": "WILSON", "otrosNombres": "DANIEL", "primerApellido": "GAVIRIA", "segundoApellido": "HERNANDEZ"
          -> "nombres": "WILSON DANIEL", "apellidos": "GAVIRIA HERNANDEZ", "nombreCompleto": "WILSON DANIEL GAVIRIA HERNANDEZ"
       2. Caso 1 nombre y 2 apellidos (casilla 34 vacía): 33="HANNA", 34="", 31="BERMUDEZ", 32="MARTINEZ"
          -> "primerNombre": "HANNA", "otrosNombres": "", "primerApellido": "BERMUDEZ", "segundoApellido": "MARTINEZ"
          -> "nombres": "HANNA", "apellidos": "BERMUDEZ MARTINEZ", "nombreCompleto": "HANNA BERMUDEZ MARTINEZ"
       3. Caso 2 nombres y 1 apellido (casilla 32 vacía): 33="JUAN", 34="CARLOS", 31="PEREZ", 32=""
          -> "primerNombre": "JUAN", "otrosNombres": "CARLOS", "primerApellido": "PEREZ", "segundoApellido": ""
          -> "nombres": "JUAN CARLOS", "apellidos": "PEREZ", "nombreCompleto": "JUAN CARLOS PEREZ"
       4. Caso 1 nombre y 1 apellido (casillas 32 y 34 vacías): 33="JUAN", 34="", 31="PEREZ", 32=""
          -> "nombres": "JUAN", "apellidos": "PEREZ", "nombreCompleto": "JUAN PEREZ"
   - Para PERSONA JURÍDICA: Si las casillas 31 a 34 están vacías y la casilla 35 tiene razón social, "nombreCompleto" debe ser la razón social.

6. "ciudad": La ciudad o municipio de residencia o domicilio del contribuyente en el RUT.
¡ADVERTENCIA CRÍTICA SOBRE LA CIUDAD!:
- En el encabezado del RUT o en la casilla 24 ("Dirección Seccional") casi siempre dice "02 MEDELLIN" o "SECCIONAL MEDELLIN". ¡ESA NO ES LA CIUDAD DEL USUARIO! Esa es la oficina regional de la DIAN. NUNCA extraigas la ciudad del encabezado ni de la casilla 24.
- Debes buscar exclusivamente en la sección "UBICACIÓN", específicamente en la CASILLA 40 ("40. Municipio" o "Ciudad / Municipio").
- Lee lo que dice exactamente la CASILLA 40 (por ejemplo si dice LA UNIÓN, BELLO, ITAGÜÍ, ENVIGADO, SABANETA, RIONEGRO, COPACABANA, GIRARDOTA, CALDAS, BOGOTÁ, CALI, BARRANQUILLA, etc.).
- Si la casilla 40 tiene un código DANE y luego el nombre (ej. "05088 BELLO" o "05400 LA UNION"), extrae ÚNICAMENTE el nombre ("Bello", "La Unión").
- NUNCA devuelvas Medellín por defecto si en la Casilla 40 dice otro municipio.

Responde SOLO con un objeto JSON válido con esta estructura exacta, sin texto adicional ni bloques markdown:
{
  "banco": "",
  "tipoCuenta": "",
  "numeroCuenta": "",
  "documentoIdentidad": "",
  "primerNombre": "",
  "otrosNombres": "",
  "primerApellido": "",
  "segundoApellido": "",
  "razonSocial": "",
  "nombres": "",
  "apellidos": "",
  "nombreCompleto": "",
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

      // 1. Sanitize Casillas 31, 32, 33, 34, 35 y ensamblar nombres en orden correcto
      const pNombre = String(extractedData.primerNombre || '').replace(/null|undefined/gi, '').trim().toUpperCase();
      const oNombres = String(extractedData.otrosNombres || '').replace(/null|undefined/gi, '').trim().toUpperCase();
      const pApellido = String(extractedData.primerApellido || '').replace(/null|undefined/gi, '').trim().toUpperCase();
      const sApellido = String(extractedData.segundoApellido || '').replace(/null|undefined/gi, '').trim().toUpperCase();
      const razonSocial = String(extractedData.razonSocial || '').replace(/null|undefined/gi, '').trim().toUpperCase();

      // Ensamblar nombres y apellidos ignorando las casillas vacías
      const nombresList = [pNombre, oNombres].filter(Boolean);
      const apellidosList = [pApellido, sApellido].filter(Boolean);

      const nombresStr = nombresList.join(' ').trim();
      const apellidosStr = apellidosList.join(' ').trim();

      let nombreCompletoFinal = '';
      if (nombresList.length > 0 || apellidosList.length > 0) {
        // Orden oficial colombiano: 33 Primer nombre + 34 Otros nombres + 31 Primer apellido + 32 Segundo apellido
        nombreCompletoFinal = [...nombresList, ...apellidosList].join(' ').trim();
      } else if (razonSocial) {
        nombreCompletoFinal = razonSocial;
      } else if (extractedData.nombreCompleto) {
        nombreCompletoFinal = String(extractedData.nombreCompleto).replace(/null|undefined/gi, '').trim().toUpperCase();
      }

      extractedData.primerNombre = pNombre || null;
      extractedData.otrosNombres = oNombres || null;
      extractedData.primerApellido = pApellido || null;
      extractedData.segundoApellido = sApellido || null;
      extractedData.razonSocial = razonSocial || null;
      extractedData.nombres = nombresStr || null;
      extractedData.apellidos = apellidosStr || null;
      extractedData.nombreCompleto = nombreCompletoFinal;

      // 2. Limpiar documento de identidad (SOLO números puros, sin prefijo CC, C.C., NIT, ni dígito de verificación)
      if (extractedData.documentoIdentidad) {
        let cleanDoc = String(extractedData.documentoIdentidad).split('-')[0].trim();
        while (/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i.test(cleanDoc)) {
          cleanDoc = cleanDoc.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
        }
        cleanDoc = cleanDoc.replace(/[.,\s]/g, '');
        const digitsOnly = cleanDoc.replace(/\D/g, '');
        extractedData.documentoIdentidad = digitsOnly || cleanDoc;
      }

      // 3. Limpiar ciudad / municipio
      if (extractedData.ciudad && typeof extractedData.ciudad === 'string') {
        let city = extractedData.ciudad.replace(/[.,\s]+$/, '').trim();
        // Remove leading postal/DANE code if present (e.g. "05088 BELLO" -> "BELLO" or "05400 LA UNION" -> "LA UNION")
        city = city.replace(/^[\d\s\-]+/, '').trim();
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
