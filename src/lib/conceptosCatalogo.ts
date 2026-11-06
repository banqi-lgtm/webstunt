export interface ConceptoItem {
  codigo: string;
  descripcion: string;
  keywords: string[];
}

export const CONCEPTOS_CATALOGO: ConceptoItem[] = [
  { codigo: '73200501', descripcion: 'Arrendamiento Alquiler pista', keywords: ['pista', 'alquiler', 'arriendo'] },
  { codigo: '73200502', descripcion: 'Arrendamiento Equipos', keywords: ['equipos', 'alquiler', 'maquinaria'] },
  { codigo: '73200503', descripcion: 'Arrendamiento Planta eléctrica', keywords: ['planta', 'electrica', 'generador', 'luz'] },
  { codigo: '73200504', descripcion: 'Arrendamiento Vehículos', keywords: ['vehiculos', 'carros', 'motos', 'camionetas'] },
  { codigo: '73309501', descripcion: 'ARL Staf', keywords: ['arl', 'staf', 'seguro', 'riesgos'] },
  { codigo: '73309502', descripcion: 'Cobertura total SS - Staf', keywords: ['cobertura', 'seguridad social', 'ss', 'salud', 'pension'] },
  { codigo: '73351001', descripcion: 'Jurados', keywords: ['jurados', 'juez', 'jueces', 'calificacion'] },
  { codigo: '73351002', descripcion: 'Staff Técnico', keywords: ['staff', 'staf', 'tecnico', 'logistica', 'operativo'] },
  { codigo: '73351005', descripcion: 'Show de Stunt', keywords: ['show', 'stunt', 'espectaculo', 'exhibicion'] },
  { codigo: '73355001', descripcion: 'Transporte Motocicletas', keywords: ['transporte', 'motocicletas', 'motos', 'flete'] },
  { codigo: '73355002', descripcion: 'Transporte Mobiliario', keywords: ['transporte', 'mobiliario', 'muebles', 'sillas', 'mesas'] },
  { codigo: '73355004', descripcion: 'Cargue y Descargue', keywords: ['cargue', 'descargue', 'coteros', 'bodega'] },
  { codigo: '73509501', descripcion: 'Montaje de Pista', keywords: ['montaje', 'pista', 'armado', 'vallas'] },
  { codigo: '73552001', descripcion: 'Transporte Personal Logistico', keywords: ['transporte', 'personal', 'logistico', 'logistica', 'traslado'] },
  { codigo: '73200505', descripcion: 'Arrendamiento Amplificador', keywords: ['amplificador', 'sonido', 'audio', 'bafles', 'parlantes'] },
  { codigo: '73200507', descripcion: 'Arrendamiento Alquiler de mobiliario', keywords: ['mobiliario', 'alquiler', 'sillas', 'mesas', 'carpas'] },
  { codigo: '73200508', descripcion: 'Arrendamiento Alquiler ambulancia', keywords: ['ambulancia', 'salud', 'medico', 'paramedicos'] },
  { codigo: '73351006', descripcion: 'Servicio Empaque de Kits', keywords: ['empaque', 'kits', 'armado', 'bolsas'] },
  { codigo: '73355005', descripcion: 'Logistica y Transporte', keywords: ['logistica', 'transporte', 'operacion', 'traslados'] },
  { codigo: '73355006', descripcion: 'Domicilios', keywords: ['domicilios', 'envios', 'mensajeria', 'reparto'] },
  { codigo: '73355010', descripcion: 'Transporte Urbano', keywords: ['transporte', 'urbano', 'taxi', 'movilidad'] },
  { codigo: '73356001', descripcion: 'Material POP', keywords: ['pop', 'publicidad', 'merchandising', 'pendones'] },
  { codigo: '73356002', descripcion: 'Material Publicitario Impreso', keywords: ['publicitario', 'impreso', 'afiches', 'volantes', 'banners'] },
  { codigo: '73356003', descripcion: 'Uso de Imagen Piloto', keywords: ['uso de imagen', 'imagen', 'piloto', 'derechos'] },
  { codigo: '73356004', descripcion: 'Diseño y desarrollo pagina web', keywords: ['pagina web', 'web', 'diseno', 'desarrollo', 'landing', 'internet', 'sitio web', 'diseño'] },
  { codigo: '73359501', descripcion: 'Mensajeria', keywords: ['mensajeria', 'mensajero', 'diligencias'] },
  { codigo: '73359502', descripcion: 'Servicio de Catering para Eventos', keywords: ['catering', 'alimentacion', 'comida', 'refrigerios'] },
  { codigo: '73359503', descripcion: 'Tatuajes', keywords: ['tatuajes', 'tatuador', 'tattoo'] },
  { codigo: '73359510', descripcion: 'Material Audiovisual', keywords: ['audiovisual', 'video', 'fotos', 'fotografia', 'camaras', 'grabacion'] },
  { codigo: '73359515', descripcion: 'Scouting-Acompañamiento', keywords: ['scouting', 'acompañamiento', 'guia', 'locaciones'] },
  { codigo: '73359520', descripcion: 'Servicio de Bodegaje', keywords: ['bodegaje', 'bodega', 'almacenamiento'] },
  { codigo: '73959504', descripcion: 'Dotación Pilotos', keywords: ['dotacion', 'pilotos', 'uniformes', 'camisetas', 'gorras'] },
  { codigo: '73351004', descripcion: 'Presentador', keywords: ['presentador', 'animador', 'locutor', 'tarima'] },
  { codigo: '73351007', descripcion: 'servicio de piloto profesional e instrucción deportiva', keywords: ['piloto', 'profesional', 'instruccion', 'deportiva', 'entrenamiento'] },
  { codigo: '73356005', descripcion: 'Creación de contenido digital y gestión de redes sociales', keywords: ['contenido', 'digital', 'redes sociales', 'instagram', 'tiktok', 'facebook'] },
];

export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterConceptosCatalogo(query: string, maxResults: number = 3): ConceptoItem[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQ = normalizeText(query);
  const words = cleanQ.split(/\s+/).filter(Boolean);

  const scored: { item: ConceptoItem; score: number }[] = [];

  for (const item of CONCEPTOS_CATALOGO) {
    const itemNormDesc = normalizeText(item.descripcion);
    const itemCode = item.codigo;
    const itemKeywords = (item.keywords || []).map(normalizeText);

    let score = 0;

    // Si coincide con el código directamente
    if (itemCode.includes(cleanQ)) {
      score += 100;
    }

    // Coincidencia exacta de inicio en la descripción
    if (itemNormDesc.startsWith(cleanQ)) {
      score += 80;
    } else if (itemNormDesc.includes(cleanQ)) {
      score += 50;
    } else {
      // Verificar si todas las palabras buscadas están en la descripción o palabras clave
      const allWordsMatch = words.every(w => 
        itemNormDesc.includes(w) || itemKeywords.some(k => k.includes(w))
      );
      if (allWordsMatch) {
        score += 30;
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Ordenar por relevancia descendente y limitar a maxResults (3 por defecto)
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map(s => s.item);
}

export function getConceptoItem(text: string): ConceptoItem | undefined {
  if (!text) return undefined;
  const clean = normalizeText(text);

  // Buscar por código exacto o si inicia con el código
  const byCode = CONCEPTOS_CATALOGO.find(c => text.startsWith(c.codigo) || clean.includes(c.codigo));
  if (byCode) return byCode;

  // Buscar por descripción exacta o muy cercana
  const byDesc = CONCEPTOS_CATALOGO.find(c => {
    const normDesc = normalizeText(c.descripcion);
    return clean === normDesc || clean.includes(normDesc) || normDesc.includes(clean);
  });
  return byDesc;
}

export function formatConceptoForSave(item: ConceptoItem): string {
  return `${item.codigo} - ${item.descripcion}`;
}
