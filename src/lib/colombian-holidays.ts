/**
 * Utilidad de días festivos oficiales en Colombia (Ley Emiliani 51 de 1983 y festivos basados en Pascua).
 */

// Algoritmo de Butcher / Meeus para calcular el Domingo de Pascua
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// Trasladar al siguiente lunes (Ley Emiliani)
function toNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Domingo, 1 = Lunes, ...
  if (day === 1) return d; // Ya es lunes
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface FestivoColombia {
  fecha: string; // YYYY-MM-DD
  nombre: string;
}

/**
 * Obtiene la lista completa de festivos de Colombia para un año específico.
 */
export function getColombianHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  // 1. Festivos fijos (no se trasladan)
  const fijos: [number, number, string][] = [
    [0, 1, 'Año Nuevo'],
    [4, 1, 'Día del Trabajo'],
    [6, 20, 'Día de la Independencia'],
    [7, 7, 'Batalla de Boyacá'],
    [11, 8, 'Inmaculada Concepción'],
    [11, 25, 'Navidad'],
  ];

  for (const [month, day, nombre] of fijos) {
    const d = new Date(year, month, day);
    holidays.set(formatDateKey(d), nombre);
  }

  // 2. Festivos con Ley Emiliani (se trasladan al lunes siguiente)
  const emilianiFijos: [number, number, string][] = [
    [0, 6, 'Día de los Reyes Magos'],
    [2, 19, 'Día de San José'],
    [5, 29, 'San Pedro y San Pablo'],
    [7, 15, 'Asunción de la Virgen'],
    [9, 12, 'Día de la Raza'],
    [10, 1, 'Todos los Santos'],
    [10, 11, 'Independencia de Cartagena'],
  ];

  for (const [month, day, nombre] of emilianiFijos) {
    const d = new Date(year, month, day);
    const moved = toNextMonday(d);
    holidays.set(formatDateKey(moved), nombre);
  }

  // 3. Festivos relativos al Domingo de Pascua
  const easter = getEasterSunday(year);

  // Jueves Santo (-3 días) y Viernes Santo (-2 días) - no se trasladan
  const juevesSanto = addDays(easter, -3);
  const viernesSanto = addDays(easter, -2);
  holidays.set(formatDateKey(juevesSanto), 'Jueves Santo');
  holidays.set(formatDateKey(viernesSanto), 'Viernes Santo');

  // Ascensión del Señor (+43 días tras Pascua, trasladado al lunes)
  const ascension = toNextMonday(addDays(easter, 40));
  holidays.set(formatDateKey(ascension), 'Ascensión del Señor');

  // Corpus Christi (+64 días tras Pascua, trasladado al lunes)
  const corpus = toNextMonday(addDays(easter, 61));
  holidays.set(formatDateKey(corpus), 'Corpus Christi');

  // Sagrado Corazón de Jesús (+71 días tras Pascua, trasladado al lunes)
  const sagradoCorazon = toNextMonday(addDays(easter, 68));
  holidays.set(formatDateKey(sagradoCorazon), 'Sagrado Corazón de Jesús');

  return holidays;
}

/**
 * Valida si una fecha específica (YYYY-MM-DD o Date) es domingo o día festivo en Colombia.
 */
export function isDominicalOFestivoColombia(dateInput: string | Date): {
  esDominicalOFestivo: boolean;
  esDomingo: boolean;
  esFestivo: boolean;
  nombreFestivo?: string;
} {
  let dateObj: Date;
  let key: string;

  if (typeof dateInput === 'string') {
    const [y, m, d] = dateInput.split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
    key = dateInput;
  } else {
    dateObj = dateInput;
    key = formatDateKey(dateObj);
  }

  const esDomingo = dateObj.getDay() === 0;
  const holidays = getColombianHolidays(dateObj.getFullYear());
  const nombreFestivo = holidays.get(key);
  const esFestivo = Boolean(nombreFestivo);

  return {
    esDominicalOFestivo: esDomingo || esFestivo,
    esDomingo,
    esFestivo,
    nombreFestivo,
  };
}
