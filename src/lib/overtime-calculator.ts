import { isDominicalOFestivoColombia } from './colombian-holidays';

export interface HorarioLaboralStaff {
  diasLaborales?: number[]; // [1, 2, 3, 4, 5] (1=Lunes, 5=Viernes, 6=Sábado, 0=Domingo)
  horaEntradaDefecto?: string; // "08:00"
  horaSalidaDefecto?: string; // "19:00"
  minutosDescansoDefecto?: number; // 60
  jornadaDiariaHoras?: number; // 8
  horasSemanales?: number; // 42 o 44
  valorHoraOrdinaria?: number; // Valor hora en pesos COP
}

export interface InputTurnoStaff {
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // "HH:mm"
  horaSalida: string; // "HH:mm"
  minutosDescanso?: number; // default 60
  horarioLaboral?: HorarioLaboralStaff;
}

export interface ResultadoCalculoHoras {
  horasTotalesEfectivas: number;
  horasOrdinariasDiurnas: number; // 6am - 7pm dentro de jornada (1.0x)
  horasRecargoNocturno: number; // recargo nocturno dentro de jornada (+0.35x)
  horasExtraDiurna: number; // HED (+0.25x / 1.25x) - Inicia a las 7:00 PM hasta las 9:00 PM
  horasExtraNocturna: number; // HEN (+0.75x / 1.75x) - 9:00 PM en adelante
  horasDominicalOrdinaria: number; // RDF dentro de jornada (+0.75x / 1.75x)
  horasExtraDominicalDiurna: number; // HEDDF (+1.00x / 2.00x)
  horasExtraDominicalNocturna: number; // HENDF (+1.50x / 2.50x)
  totalHorasExtras: number; // HED + HEN + HEDDF + HENDF
  esDominicalOFestivo: boolean;
  nombreFestivo?: string;
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
 * Calcula con precisión según la legislación laboral colombiana y los horarios
 * configurados desde Staff. Las horas extra diurnas empiezan a las 7:00 PM (19:00).
 */
export function calculateOvertimeColombia(input: InputTurnoStaff): ResultadoCalculoHoras {
  const {
    fecha,
    horaEntrada,
    horaSalida,
    minutosDescanso = 0,
    horarioLaboral = {},
  } = input;

  // Horario oficial del staff: por defecto entrada 08:00 y salida 19:00 (7:00 PM).
  // A las 7:00 PM inician las horas extra diurnas.
  const horaEntradaOficial = horarioLaboral.horaEntradaDefecto || '08:00';
  const horaSalidaOficial = horarioLaboral.horaSalidaDefecto || '19:00';

  const jornadaMaxHoras = horarioLaboral.jornadaDiariaHoras && horarioLaboral.jornadaDiariaHoras > 0
    ? horarioLaboral.jornadaDiariaHoras
    : 8;

  const valorHora = horarioLaboral.valorHoraOrdinaria || 0;

  let start = parseDateTime(fecha, horaEntrada);
  let end = parseDateTime(fecha, horaSalida);

  // Si la hora de salida es menor o igual a la de entrada, el turno cruzó la medianoche
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  // Calculamos los hitos de salida e inicio programados para el staff
  let scheduledStart = parseDateTime(fecha, horaEntradaOficial);
  let scheduledEnd = parseDateTime(fecha, horaSalidaOficial);
  if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
    scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  // Duración total bruta en minutos
  const diffMs = end.getTime() - start.getTime();
  const totalMinutosBrutos = Math.max(0, Math.round(diffMs / (60 * 1000)));

  // Minutos de descanso efectivos
  const descansoRealMinutos = Math.min(minutosDescanso, totalMinutosBrutos);
  const totalMinutosEfectivos = Math.max(0, totalMinutosBrutos - descansoRealMinutos);

  // Minutos acumuladores por categoría
  let minOrdinariosDiurnos = 0;
  let minRecargoNocturno = 0;
  let minExtraDiurna = 0;
  let minExtraNocturna = 0;
  let minDominicalOrdinaria = 0;
  let minExtraDominicalDiurna = 0;
  let minExtraDominicalNocturna = 0;

  // Calculamos la proporción de descanso por minuto para descontarlo uniformemente
  const factorEfectivo = totalMinutosBrutos > 0 ? totalMinutosEfectivos / totalMinutosBrutos : 0;

  let festivoInicial: { esDominicalOFestivo: boolean; nombreFestivo?: string } = { esDominicalOFestivo: false };

  // Analizamos cada bloque de 1 minuto del turno
  for (let m = 0; m < totalMinutosBrutos; m++) {
    const currentMoment = new Date(start.getTime() + m * 60 * 1000);
    const minuteDateKey = `${currentMoment.getFullYear()}-${String(currentMoment.getMonth() + 1).padStart(2, '0')}-${String(currentMoment.getDate()).padStart(2, '0')}`;
    
    const festivoInfo = isDominicalOFestivoColombia(minuteDateKey);
    if (m === 0) {
      festivoInicial = festivoInfo;
    }

    const hourOfDay = currentMoment.getHours();
    // Diurno: 06:00 a 20:59 (6am - 9pm) | Nocturno: 21:00 a 05:59 (9pm - 6am)
    const esDiurno = hourOfDay >= 6 && hourOfDay < 21;
    const esDominical = festivoInfo.esDominicalOFestivo;

    // Multiplicamos por el factor de trabajo efectivo (descuenta el descanso proporcionalmente)
    const minutoPonderado = 1 * factorEfectivo;

    // Las horas extra diurnas inician a las 7:00 PM (o después de la salida programada del staff)
    const esDespuesDeSalidaProgramada = currentMoment.getTime() >= scheduledEnd.getTime();
    const esAntesDeInicioProgramado = currentMoment.getTime() < scheduledStart.getTime();
    const esExtra = esDespuesDeSalidaProgramada || esAntesDeInicioProgramado;
    const esOrdinaria = !esExtra;

    if (esOrdinaria) {
      if (esDominical) {
        minDominicalOrdinaria += minutoPonderado;
        if (!esDiurno) {
          // Además del recargo dominical, genera recargo nocturno ordinario
          minRecargoNocturno += minutoPonderado;
        }
      } else {
        if (esDiurno) {
          minOrdinariosDiurnos += minutoPonderado;
        } else {
          minRecargoNocturno += minutoPonderado;
        }
      }
    } else {
      // Es hora extra:
      // Si cae entre 19:00 y 20:59 (esDiurno), es Extra Diurna (+25% o +100% en dominical)
      // Si cae entre 21:00 y 05:59 (!esDiurno), es Extra Nocturna (+75% o +150% en dominical)
      if (esDominical) {
        if (esDiurno) {
          minExtraDominicalDiurna += minutoPonderado;
        } else {
          minExtraDominicalNocturna += minutoPonderado;
        }
      } else {
        if (esDiurno) {
          minExtraDiurna += minutoPonderado;
        } else {
          minExtraNocturna += minutoPonderado;
        }
      }
    }
  }

  // Conversión a horas con 2 decimales
  const toHoras = (min: number) => Math.round((min / 60) * 100) / 100;

  const horasTotalesEfectivas = toHoras(totalMinutosEfectivos);
  const horasOrdinariasDiurnas = toHoras(minOrdinariosDiurnos);
  const horasRecargoNocturno = toHoras(minRecargoNocturno);
  const horasExtraDiurna = toHoras(minExtraDiurna);
  const horasExtraNocturna = toHoras(minExtraNocturna);
  const horasDominicalOrdinaria = toHoras(minDominicalOrdinaria);
  const horasExtraDominicalDiurna = toHoras(minExtraDominicalDiurna);
  const horasExtraDominicalNocturna = toHoras(minExtraDominicalNocturna);

  const totalHorasExtras = toHoras(
    minExtraDiurna + minExtraNocturna + minExtraDominicalDiurna + minExtraDominicalNocturna
  );

  // Valor económico estimado si se configuró el valor hora
  let valorEstimadoTotal = 0;
  if (valorHora > 0) {
    valorEstimadoTotal = Math.round(
      horasOrdinariasDiurnas * valorHora * 1.0 +
      horasRecargoNocturno * valorHora * 0.35 +
      horasDominicalOrdinaria * valorHora * 1.75 +
      horasExtraDiurna * valorHora * 1.25 +
      horasExtraNocturna * valorHora * 1.75 +
      horasExtraDominicalDiurna * valorHora * 2.0 +
      horasExtraDominicalNocturna * valorHora * 2.5
    );
  }

  const desgloseTexto: string[] = [];
  if (horasOrdinariasDiurnas > 0) desgloseTexto.push(`${horasOrdinariasDiurnas}h Ordinarias Diurnas`);
  if (horasRecargoNocturno > 0) desgloseTexto.push(`${horasRecargoNocturno}h Recargo Nocturno (+35%)`);
  if (horasDominicalOrdinaria > 0) desgloseTexto.push(`${horasDominicalOrdinaria}h Dominical/Festivo Ord. (+75%)`);
  if (horasExtraDiurna > 0) desgloseTexto.push(`${horasExtraDiurna}h Extra Diurna (HED +25%)`);
  if (horasExtraNocturna > 0) desgloseTexto.push(`${horasExtraNocturna}h Extra Nocturna (HEN +75%)`);
  if (horasExtraDominicalDiurna > 0) desgloseTexto.push(`${horasExtraDominicalDiurna}h Extra Dom/Fest Diurna (HEDDF +100%)`);
  if (horasExtraDominicalNocturna > 0) desgloseTexto.push(`${horasExtraDominicalNocturna}h Extra Dom/Fest Nocturna (HENDF +150%)`);

  return {
    horasTotalesEfectivas,
    horasOrdinariasDiurnas,
    horasRecargoNocturno,
    horasExtraDiurna,
    horasExtraNocturna,
    horasDominicalOrdinaria,
    horasExtraDominicalDiurna,
    horasExtraDominicalNocturna,
    totalHorasExtras,
    esDominicalOFestivo: festivoInicial.esDominicalOFestivo,
    nombreFestivo: festivoInicial.nombreFestivo,
    valorEstimadoTotal: valorHora > 0 ? valorEstimadoTotal : undefined,
    desgloseTexto,
  };
}
