import { isDominicalOFestivoColombia } from './colombian-holidays';

export interface HorarioLaboralStaff {
  diasLaborales?: number[]; // [1, 2, 3, 4, 5, 6] (1=Lunes, ..., 6=Sábado, 0=Domingo descanso)
  horaEntradaDefecto?: string; // "08:00"
  horaSalidaDefecto?: string; // "16:00" (7h trabajo + 1h descanso)
  minutosDescansoDefecto?: number; // 60
  jornadaDiariaHoras?: number; // 7 (Estándar legal actual 42h semanales / 6 días)
  horasSemanales?: number; // 42
  valorHoraOrdinaria?: number; // Valor hora en pesos COP
}

export interface InputTurnoStaff {
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // "HH:mm"
  horaSalida: string; // "HH:mm"
  minutosDescanso?: number; // default 0 o minutos indicados
  horarioLaboral?: HorarioLaboralStaff;
}

export interface ResultadoCalculoHoras {
  horasTotalesEfectivas: number; // Tiempo trabajado real descontando descanso
  horasBrutasEstancia: number; // Tiempo total de presencia (salida - entrada)
  horasDescanso: number; // Minutos de descanso convertidos a horas
  horasFaltantes: number; // Horas que faltaron para cumplir la jornada ordinaria de 7h
  
  // Ordinarias en días hábiles (Lunes a Sábado no festivos)
  horasOrdinariasDiurnas: number; // 06:00 a 21:00 dentro de las 7h (1.0x)
  horasRecargoNocturno: number; // 21:00 a 06:00 dentro de las 7h (+0.35x)
  
  // Extras en días hábiles
  horasExtraDiurna: number; // HED (+0.25x / 1.25x) - Superan 7h de día (06:00 a 21:00)
  horasExtraNocturna: number; // HEN (+0.75x / 1.75x) - Superan 7h de noche (21:00 a 06:00)
  
  // Domingos
  horasDominicalOrdinaria: number; // Primeras 7h en domingo (+0.75x / 1.75x)
  horasExtraDominicalDiurna: number; // Domingo superando 7h diurna (+1.00x / 2.00x)
  horasExtraDominicalNocturna: number; // Domingo superando 7h nocturna (+1.50x / 2.50x)
  
  // Festivos oficiales Colombia
  horasFestivoOrdinaria: number; // Primeras 7h en festivo (+0.75x / 1.75x)
  horasExtraFestivoDiurna: number; // Festivo superando 7h diurna (+1.00x / 2.00x)
  horasExtraFestivoNocturna: number; // Festivo superando 7h nocturna (+1.50x / 2.50x)
  
  // Totales consolidados
  totalHorasOrdinarias: number; // Ordinarias diurnas + dominicales ordinarias + festivas ordinarias
  totalHorasExtras: number; // HED + HEN + Extras Dominicales + Extras Festivas
  totalHorasDominicalesYFestivas: number; // Toda hora en domingo o festivo
  
  esDomingo: boolean;
  esFestivo: boolean;
  esDominicalOFestivo: boolean;
  nombreFestivo?: string;
  esDescanso: boolean; // Día sin turno trabajado
  
  valorEstimadoTotal?: number;
  desgloseTexto: string[];
}

/**
 * Convierte cadena "YYYY-MM-DD" y "HH:mm" en un objeto Date en hora local.
 */
function parseDateTime(fechaStr: string, horaStr: string): Date {
  const [y, m, d] = fechaStr.split('-').map(Number);
  const [h, min] = (horaStr || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h || 0, min || 0, 0, 0);
}

/**
 * Redondea a 2 decimales para evitar artefactos de punto flotante en minutos.
 */
function toHoras(minutos: number): number {
  return Math.round((minutos / 60) * 100) / 100;
}

/**
 * Calcula con precisión legal colombiana las horas laborales basadas en la
 * JORNADA ORDINARIA DE 7 HORAS DIARIAS (Ley 2101 / 42 horas semanales).
 * 
 * Reglas:
 * 1. Jornada ordinaria máxima diaria: 7 horas efectivas (420 min).
 * 2. Cada minuto de trabajo efectivo por encima de 420 min es HORA EXTRA.
 * 3. Descanso: Se descuenta limpiamente del tiempo bruto sin fraccionar minutos.
 * 4. Días domingos: Considerados descanso legal. Si se trabajan, reciben recargo dominical (+75%) en ordinarias y 100%/150% en extras.
 * 5. Días festivos oficiales de Colombia: Identificados automáticamente con recargo festivo (+75%) en ordinarias y 100%/150% en extras.
 * 6. Horas faltantes: Si en día hábil laborado cumple menos de 7h, se calcula la diferencia.
 */
export function calculateOvertimeColombia(input: InputTurnoStaff): ResultadoCalculoHoras {
  const {
    fecha,
    horaEntrada,
    horaSalida,
    minutosDescanso = 0,
    horarioLaboral = {},
  } = input;

  // Jornada diaria ordinaria: 7 horas por defecto (420 min)
  const jornadaMaxHoras = horarioLaboral.jornadaDiariaHoras && horarioLaboral.jornadaDiariaHoras > 0
    ? horarioLaboral.jornadaDiariaHoras
    : 7;
  const jornadaMaxMinutos = jornadaMaxHoras * 60;

  const valorHora = horarioLaboral.valorHoraOrdinaria || 0;

  let start = parseDateTime(fecha, horaEntrada);
  let end = parseDateTime(fecha, horaSalida);

  // Si la salida es menor o igual a la entrada, el turno cruzó la medianoche (+24h)
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  // 1. Minutos brutos de presencia
  const diffMs = end.getTime() - start.getTime();
  const totalMinutosBrutos = Math.max(0, Math.round(diffMs / 60000));

  // 2. Descuento limpio de descanso
  const descansoRealMinutos = Math.min(Math.max(0, Number(minutosDescanso) || 0), totalMinutosBrutos);
  const totalMinutosEfectivos = Math.max(0, totalMinutosBrutos - descansoRealMinutos);

  // Información del día de inicio
  const festivoInfoInicial = isDominicalOFestivoColombia(fecha);
  const dateObjInicial = new Date(start);
  const esDomingoInicial = dateObjInicial.getDay() === 0;
  const esFestivoInicial = Boolean(festivoInfoInicial.esDominicalOFestivo && !esDomingoInicial);

  // Si no hay tiempo trabajado, es un descanso
  if (totalMinutosEfectivos === 0) {
    return {
      horasTotalesEfectivas: 0,
      horasBrutasEstancia: 0,
      horasDescanso: toHoras(descansoRealMinutos),
      horasFaltantes: 0,
      horasOrdinariasDiurnas: 0,
      horasRecargoNocturno: 0,
      horasExtraDiurna: 0,
      horasExtraNocturna: 0,
      horasDominicalOrdinaria: 0,
      horasExtraDominicalDiurna: 0,
      horasExtraDominicalNocturna: 0,
      horasFestivoOrdinaria: 0,
      horasExtraFestivoDiurna: 0,
      horasExtraFestivoNocturna: 0,
      totalHorasOrdinarias: 0,
      totalHorasExtras: 0,
      totalHorasDominicalesYFestivas: 0,
      esDomingo: esDomingoInicial,
      esFestivo: esFestivoInicial,
      esDominicalOFestivo: festivoInfoInicial.esDominicalOFestivo,
      nombreFestivo: festivoInfoInicial.nombreFestivo,
      esDescanso: true,
      valorEstimadoTotal: 0,
      desgloseTexto: [esDomingoInicial ? 'Descanso Dominical' : esFestivoInicial ? `Descanso Festivo (${festivoInfoInicial.nombreFestivo || 'Festivo'})` : 'Día de Descanso'],
    };
  }

  // Acumuladores en minutos
  let minOrdinariosDiurnos = 0;
  let minRecargoNocturno = 0;
  let minExtraDiurna = 0;
  let minExtraNocturna = 0;
  let minDominicalOrdinaria = 0;
  let minExtraDominicalDiurna = 0;
  let minExtraDominicalNocturna = 0;
  let minFestivoOrdinaria = 0;
  let minExtraFestivoDiurna = 0;
  let minExtraFestivoNocturna = 0;

  // Analizamos cada minuto efectivo trabajado secuencialmente.
  // El descanso se asume tomado durante la mitad del turno; por ende,
  // evaluamos los minutos efectivos mapeados a lo largo de la jornada.
  let minutosEfectivosAcumulados = 0;

  for (let m = 0; m < totalMinutosBrutos; m++) {
    // Si ya completamos todos los minutos efectivos posibles (el resto fue descanso)
    if (minutosEfectivosAcumulados >= totalMinutosEfectivos) {
      break;
    }

    const currentMoment = new Date(start.getTime() + m * 60 * 1000);
    const minuteDateKey = `${currentMoment.getFullYear()}-${String(currentMoment.getMonth() + 1).padStart(2, '0')}-${String(currentMoment.getDate()).padStart(2, '0')}`;
    const diaInfo = isDominicalOFestivoColombia(minuteDateKey);
    const dayOfWeek = currentMoment.getDay();
    const esDomingoMinuto = dayOfWeek === 0;
    const esFestivoMinuto = Boolean(diaInfo.esDominicalOFestivo && !esDomingoMinuto);

    const hourOfDay = currentMoment.getHours();
    // Diurno: 06:00 a 20:59 (6:00 AM a 9:00 PM)
    // Nocturno: 21:00 a 05:59 (9:00 PM a 6:00 AM)
    const esDiurno = hourOfDay >= 6 && hourOfDay < 21;

    // ¿Es minuto ordinario o minuto extra?
    // Las primeras 7 horas (420 min) de trabajo efectivo son ORDINARIAS.
    // Del minuto 421 en adelante son EXTRAS.
    const esMinutoOrdinario = minutosEfectivosAcumulados < jornadaMaxMinutos;

    if (esMinutoOrdinario) {
      if (esDomingoMinuto) {
        minDominicalOrdinaria++;
        if (!esDiurno) {
          minRecargoNocturno++; // Recargo nocturno adicional en domingo ordinario
        }
      } else if (esFestivoMinuto) {
        minFestivoOrdinaria++;
        if (!esDiurno) {
          minRecargoNocturno++; // Recargo nocturno adicional en festivo ordinario
        }
      } else {
        if (esDiurno) {
          minOrdinariosDiurnos++;
        } else {
          minRecargoNocturno++;
        }
      }
    } else {
      // Es hora extra (superó las 7 horas diarias efectivas)
      if (esDomingoMinuto) {
        if (esDiurno) {
          minExtraDominicalDiurna++;
        } else {
          minExtraDominicalNocturna++;
        }
      } else if (esFestivoMinuto) {
        if (esDiurno) {
          minExtraFestivoDiurna++;
        } else {
          minExtraFestivoNocturna++;
        }
      } else {
        if (esDiurno) {
          minExtraDiurna++;
        } else {
          minExtraNocturna++;
        }
      }
    }

    minutosEfectivosAcumulados++;
  }

  // Horas faltantes si en día hábil no completó las 7 horas ordinarias
  let minFaltantes = 0;
  if (!esDomingoInicial && !esFestivoInicial && totalMinutosEfectivos < jornadaMaxMinutos) {
    minFaltantes = jornadaMaxMinutos - totalMinutosEfectivos;
  }

  // Conversión a horas
  const horasTotalesEfectivas = toHoras(totalMinutosEfectivos);
  const horasBrutasEstancia = toHoras(totalMinutosBrutos);
  const horasDescanso = toHoras(descansoRealMinutos);
  const horasFaltantes = toHoras(minFaltantes);

  const horasOrdinariasDiurnas = toHoras(minOrdinariosDiurnos);
  const horasRecargoNocturno = toHoras(minRecargoNocturno);
  const horasExtraDiurna = toHoras(minExtraDiurna);
  const horasExtraNocturna = toHoras(minExtraNocturna);
  const horasDominicalOrdinaria = toHoras(minDominicalOrdinaria);
  const horasExtraDominicalDiurna = toHoras(minExtraDominicalDiurna);
  const horasExtraDominicalNocturna = toHoras(minExtraDominicalNocturna);
  const horasFestivoOrdinaria = toHoras(minFestivoOrdinaria);
  const horasExtraFestivoDiurna = toHoras(minExtraFestivoDiurna);
  const horasExtraFestivoNocturna = toHoras(minExtraFestivoNocturna);

  const totalHorasOrdinarias = toHoras(
    minOrdinariosDiurnos + minDominicalOrdinaria + minFestivoOrdinaria
  );

  const totalHorasExtras = toHoras(
    minExtraDiurna + minExtraNocturna + 
    minExtraDominicalDiurna + minExtraDominicalNocturna +
    minExtraFestivoDiurna + minExtraFestivoNocturna
  );

  const totalHorasDominicalesYFestivas = toHoras(
    minDominicalOrdinaria + minExtraDominicalDiurna + minExtraDominicalNocturna +
    minFestivoOrdinaria + minExtraFestivoDiurna + minExtraFestivoNocturna
  );

  // Valor económico estimado en COP
  let valorEstimadoTotal = 0;
  if (valorHora > 0) {
    valorEstimadoTotal = Math.round(
      horasOrdinariasDiurnas * valorHora * 1.0 +
      horasRecargoNocturno * valorHora * 0.35 +
      horasExtraDiurna * valorHora * 1.25 +
      horasExtraNocturna * valorHora * 1.75 +
      horasDominicalOrdinaria * valorHora * 1.75 +
      horasExtraDominicalDiurna * valorHora * 2.0 +
      horasExtraDominicalNocturna * valorHora * 2.5 +
      horasFestivoOrdinaria * valorHora * 1.75 +
      horasExtraFestivoDiurna * valorHora * 2.0 +
      horasExtraFestivoNocturna * valorHora * 2.5
    );
  }

  // Desglose descriptivo
  const desgloseTexto: string[] = [];
  if (horasOrdinariasDiurnas > 0) desgloseTexto.push(`${horasOrdinariasDiurnas}h Ordinarias Diurnas`);
  if (horasRecargoNocturno > 0) desgloseTexto.push(`${horasRecargoNocturno}h Recargo Nocturno (+35%)`);
  if (horasExtraDiurna > 0) desgloseTexto.push(`${horasExtraDiurna}h Extra Diurna (HED +25%)`);
  if (horasExtraNocturna > 0) desgloseTexto.push(`${horasExtraNocturna}h Extra Nocturna (HEN +75%)`);
  if (horasDominicalOrdinaria > 0) desgloseTexto.push(`${horasDominicalOrdinaria}h Dominical Ordinaria (+75%)`);
  if (horasExtraDominicalDiurna > 0) desgloseTexto.push(`${horasExtraDominicalDiurna}h Extra Dominical Diurna (+100%)`);
  if (horasExtraDominicalNocturna > 0) desgloseTexto.push(`${horasExtraDominicalNocturna}h Extra Dominical Nocturna (+150%)`);
  if (horasFestivoOrdinaria > 0) desgloseTexto.push(`${horasFestivoOrdinaria}h Festivo Ordinaria (+75%)`);
  if (horasExtraFestivoDiurna > 0) desgloseTexto.push(`${horasExtraFestivoDiurna}h Extra Festivo Diurna (+100%)`);
  if (horasExtraFestivoNocturna > 0) desgloseTexto.push(`${horasExtraFestivoNocturna}h Extra Festivo Nocturna (+150%)`);
  if (horasFaltantes > 0) desgloseTexto.push(`⚠️ ${horasFaltantes}h Faltantes de Jornada`);

  return {
    horasTotalesEfectivas,
    horasBrutasEstancia,
    horasDescanso,
    horasFaltantes,
    horasOrdinariasDiurnas,
    horasRecargoNocturno,
    horasExtraDiurna,
    horasExtraNocturna,
    horasDominicalOrdinaria,
    horasExtraDominicalDiurna,
    horasExtraDominicalNocturna,
    horasFestivoOrdinaria,
    horasExtraFestivoDiurna,
    horasExtraFestivoNocturna,
    totalHorasOrdinarias,
    totalHorasExtras,
    totalHorasDominicalesYFestivas,
    esDomingo: esDomingoInicial,
    esFestivo: esFestivoInicial,
    esDominicalOFestivo: festivoInfoInicial.esDominicalOFestivo,
    nombreFestivo: festivoInfoInicial.nombreFestivo,
    esDescanso: false,
    valorEstimadoTotal: valorHora > 0 ? valorEstimadoTotal : undefined,
    desgloseTexto,
  };
}
