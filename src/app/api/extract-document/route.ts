import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { certFile, rutFile } = await req.json();

    if (!certFile && !rutFile) {
      return NextResponse.json({ error: 'Faltan documentos' }, { status: 400 });
    }

    const mediaList: any[] = [];
    const getMimeType = (fileObj: any) => {
      if (fileObj.fileType && fileObj.fileType.includes('/')) return fileObj.fileType;
      const match = fileObj.dataUrl?.match(/^data:([^;]+);/);
      if (match && match[1]) return match[1];
      if (fileObj.dataUrl?.startsWith('data:application/pdf')) return 'application/pdf';
      if (fileObj.dataUrl?.startsWith('data:image/')) return fileObj.dataUrl.split(';')[0].replace('data:', '');
      return 'application/pdf';
    };

    if (certFile && certFile.dataUrl) {
      mediaList.push({ media: { url: certFile.dataUrl, contentType: getMimeType(certFile) } });
    }
    if (rutFile && rutFile.dataUrl) {
      mediaList.push({ media: { url: rutFile.dataUrl, contentType: getMimeType(rutFile) } });
    }

    const promptText = `Eres un experto de alta precisión en extraer datos de documentos legales y certificaciones bancarias en Colombia. Revisa cuidadosamente los documentos adjuntos (RUT y/o Certificación Bancaria) y extrae estrictamente lo siguiente:

1. CERTIFICACIÓN BANCARIA (Bancos de Colombia):
   - "banco": Nombre comercial limpio del banco.
     * REGLA ESPECIAL NEQUI: Si el documento tiene el logo de Nequi, dice "Nequi", "Línea Nequi", "Depósito de bajo monto", "Trámite simplificado", o el número es un número celular de 10 dígitos (inicia con 3: ej. 300, 310, 312, 320, etc.), el banco DEBE ser exactamente "Nequi". ¡NO LO PONGAS COMO BANCOLOMBIA!
     * REGLA ESPECIAL BANCOLOMBIA: Si es de Bancolombia (generalmente cuenta de 11 dígitos numéricos, ej. 123-456789-01 o 031-123456-78) y NO es Nequi, el banco debe ser "Bancolombia".
     * REGLA ESPECIAL DAVIPLATA: Si dice Daviplata o es cuenta Davivienda con número celular de 10 dígitos, el banco es "Daviplata".
     * OTROS BANCOS: "Davivienda", "Banco de Bogotá", "Nu", "Lulo Bank", "BBVA", "Banco de Occidente", "Banco Popular", "Banco AV Villas", "Scotiabank Colpatria", "Banco Falabella".
   - "tipoCuenta": 
     * En Colombia casi todas las cuentas de colaboradores son "Ahorros" o "Corriente".
     * Si es Nequi o Daviplata o dice "depósito de bajo monto", "trámite simplificado" o "línea de ahorros", devuelve SIEMPRE "Ahorros".
     * Si no se especifica explícitamente "Corriente", devuelve SIEMPRE "Ahorros".
   - "numeroCuenta": 
     * Extrae ÚNICAMENTE los dígitos numéricos sin guiones, puntos, letras ni espacios.
     * Si es Nequi o Daviplata, es el número de celular de 10 dígitos (ej. "3101234567").
     * Si es Bancolombia, suele tener 11 dígitos (ej. "03112345678").
     * Si dice "Número de producto" o "Cuenta de ahorros No.", extrae solo los números.

2. DOCUMENTO DE IDENTIDAD EN EL RUT:
   - Busca en la CASILLA 6 ("6. Número de identificación").
   - La casilla 5 es el tipo de documento (ej. código "13" para C.C.), ¡NUNCA la unas con la casilla 6!
   - Extrae ÚNICAMENTE los dígitos numéricos de la casilla 6 (ej. "1010096437").
   - IGNORA por completo el dígito de verificación (DV) en la casilla 12.
   - NUNCA incluyas prefijos como "CC", "C.C.", "NIT", guiones ni puntos. Solo números puros.

3. NOMBRES Y APELLIDOS EN EL RUT (CASILLAS 31, 32, 33, 34 y 35):
   - "primerApellido": Texto de la casilla 31 ("31. Primer apellido") o "".
   - "segundoApellido": Texto de la casilla 32 ("32. Segundo apellido") o "".
   - "primerNombre": Texto de la casilla 33 ("33. Primer nombre") o "".
   - "otrosNombres": Texto de la casilla 34 ("34. Otros nombres") o "".
   - "razonSocial": Texto de la casilla 35 ("35. Razón social") si es empresa o "".
   - Orden oficial persona natural: Primer Nombre + Otros Nombres + Primer Apellido + Segundo Apellido.

4. CIUDAD / MUNICIPIO EN EL RUT:
   - Busca en la sección "UBICACIÓN", en la CASILLA 40 ("40. Municipio").
   - ¡NUNCA extraigas la ciudad de la casilla 24 ni del encabezado que dice "02 MEDELLIN"!
   - Si la casilla 40 dice "05088 BELLO" o "05400 LA UNION", extrae el nombre ("Bello", "La Unión").
   - Si no encuentras la casilla 40, extrae el municipio del domicilio fiscal.

Responde SOLO con un objeto JSON válido con esta estructura exacta, sin markdown:
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

      const nombresList = [pNombre, oNombres].filter(Boolean);
      const apellidosList = [pApellido, sApellido].filter(Boolean);

      const nombresStr = nombresList.join(' ').trim();
      const apellidosStr = apellidosList.join(' ').trim();

      let nombreCompletoFinal = '';
      if (nombresList.length > 0 || apellidosList.length > 0) {
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

      // 2. Limpiar documento de identidad
      if (extractedData.documentoIdentidad) {
        let cleanDoc = String(extractedData.documentoIdentidad).split('-')[0].trim();
        while (/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i.test(cleanDoc)) {
          cleanDoc = cleanDoc.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
        }
        cleanDoc = cleanDoc.replace(/[.,\s]/g, '');
        const digitsOnly = cleanDoc.replace(/\D/g, '');
        extractedData.documentoIdentidad = digitsOnly || cleanDoc;
      }

      // 3. Limpiar y sanitizar datos bancarios (Bancolombia, Nequi, etc.)
      let rawBank = String(extractedData.banco || '').trim();
      let rawTipo = String(extractedData.tipoCuenta || '').trim();
      let rawNum = String(extractedData.numeroCuenta || '').replace(/\D/g, '').trim();

      // Normalizar número de cuenta
      extractedData.numeroCuenta = rawNum;

      // Reglas de banco y tipo
      const bankLower = rawBank.toLowerCase();
      const isMobileNumber = rawNum.length === 10 && rawNum.startsWith('3');

      if (bankLower.includes('nequi') || (isMobileNumber && bankLower.includes('bancolombia'))) {
        extractedData.banco = 'Nequi';
        extractedData.tipoCuenta = 'Ahorros';
      } else if (bankLower.includes('daviplata') || (isMobileNumber && bankLower.includes('davivienda'))) {
        extractedData.banco = 'Daviplata';
        extractedData.tipoCuenta = 'Ahorros';
      } else if (bankLower.includes('bancolombia')) {
        extractedData.banco = 'Bancolombia';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (bankLower.includes('davivienda')) {
        extractedData.banco = 'Davivienda';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (/bogot[aá]/i.test(bankLower)) {
        extractedData.banco = 'Banco de Bogotá';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (bankLower.includes('nu') || bankLower.includes('nubank')) {
        extractedData.banco = 'Nu';
        extractedData.tipoCuenta = 'Ahorros';
      } else if (bankLower.includes('lulo')) {
        extractedData.banco = 'Lulo Bank';
        extractedData.tipoCuenta = 'Ahorros';
      } else if (bankLower.includes('bbva')) {
        extractedData.banco = 'BBVA';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (bankLower.includes('occidente')) {
        extractedData.banco = 'Banco de Occidente';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (bankLower.includes('popular')) {
        extractedData.banco = 'Banco Popular';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (/av\s*villas/i.test(bankLower)) {
        extractedData.banco = 'Banco AV Villas';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (bankLower.includes('falabella')) {
        extractedData.banco = 'Banco Falabella';
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (rawBank) {
        extractedData.banco = rawBank;
        extractedData.tipoCuenta = /corriente/i.test(rawTipo) ? 'Corriente' : 'Ahorros';
      } else if (isMobileNumber) {
        // Si no detectó banco pero es celular de 10 dígitos empezando en 3
        extractedData.banco = 'Nequi';
        extractedData.tipoCuenta = 'Ahorros';
      }

      // Si falta tipo de cuenta pero hay banco y número, poner Ahorros por defecto
      if (!extractedData.tipoCuenta && (extractedData.banco || extractedData.numeroCuenta)) {
        extractedData.tipoCuenta = 'Ahorros';
      }

      // 4. Limpiar ciudad / municipio
      if (extractedData.ciudad && typeof extractedData.ciudad === 'string') {
        let city = extractedData.ciudad.replace(/[.,\s]+$/, '').trim();
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
