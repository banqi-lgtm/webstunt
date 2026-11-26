'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Clock, Calendar, Sparkles, Sun, Moon, CheckCircle2, 
  Trash2, Edit3, AlertTriangle, Loader2, ShieldCheck, 
  User, Check, DollarSign, X, History, FileText, ChevronRight,
  ChevronLeft, CalendarDays, Coffee, Eye
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  calculateOvertimeColombia, 
  HorarioLaboralStaff, 
  ResultadoCalculoHoras,
  formatHora12,
  getInfoPeriodoHora
} from '@/lib/overtime-calculator';
import { isDominicalOFestivoColombia } from '@/lib/colombian-holidays';

export interface TurnoPersonalRecord {
  id: string;
  staffUid: string;
  staffNombre: string;
  staffIdentificacion: string;
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // HH:mm
  horaSalida: string; // HH:mm
  minutosDescanso: number;
  horasDescanso?: number;
  horasFaltantes?: number;
  centroCosto?: string;
  observaciones?: string;
  horasTotalesEfectivas: number;
  horasOrdinariasDiurnas: number;
  horasRecargoNocturno: number;
  horasExtraDiurna: number;
  horasExtraNocturna: number;
  horasDominicalOrdinaria: number;
  horasExtraDominicalDiurna: number;
  horasExtraDominicalNocturna: number;
  horasFestivoOrdinaria?: number;
  horasExtraFestivoDiurna?: number;
  horasExtraFestivoNocturna?: number;
  totalHorasOrdinarias?: number;
  totalHorasExtras: number;
  totalHorasDominicalesYFestivas?: number;
  esDomingo?: boolean;
  esFestivo?: boolean;
  esDominicalOFestivo: boolean;
  nombreFestivo?: string;
  valorEstimadoTotal?: number;
  creadoEl: string;
  origen?: string;
}

interface PersonalLogeoStaffProps {
  userUid?: string;
  userName?: string;
  userDocument?: string;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Devuelve la fecha formateada en español completo:
 * ej. "Jueves, 19 de Noviembre de 2026"
 */
function formatFechaCompleta(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${diasSemana[dateObj.getDay()]}, ${d} de ${MESES_ES[m - 1]} de ${y}`;
}

export function PersonalLogeoStaff({ userUid, userName, userDocument }: PersonalLogeoStaffProps) {
  const { toast } = useToast();
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  // Active identity
  const [currentUid, setCurrentUid] = useState<string>(userUid || auth.currentUser?.uid || '');
  const [fixedNombre, setFixedNombre] = useState<string>(userName || '');
  const [fixedIdentificacion, setFixedIdentificacion] = useState<string>(userDocument || '');
  const [userRol, setUserRol] = useState<string>('staff');
  const [horarioParametrizado, setHorarioParametrizado] = useState<HorarioLaboralStaff | undefined>(undefined);

  // Form states
  const [formFecha, setFormFecha] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formHoraEntrada, setFormHoraEntrada] = useState<string>('08:00');
  const [formHoraSalida, setFormHoraSalida] = useState<string>('16:00');
  const [formMinutosDescanso, setFormMinutosDescanso] = useState<number>(60);
  const [formObservaciones, setFormObservaciones] = useState<string>('');

  // Interactive Visual Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calMonth, setCalMonth] = useState<number>(() => {
    const today = new Date();
    return today.getMonth();
  });
  const [calYear, setCalYear] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear();
  });

  // Editing & Detail states
  const [editingTurno, setEditingTurno] = useState<TurnoPersonalRecord | null>(null);
  const [detalleTurno, setDetalleTurno] = useState<TurnoPersonalRecord | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // History & Filters
  const [myTurnos, setMyTurnos] = useState<TurnoPersonalRecord[]>([]);
  const [loadingTurnos, setLoadingTurnos] = useState<boolean>(true);
  const [selectedMes, setSelectedMes] = useState<string>('todos');

  // Load user profile & parameters
  useEffect(() => {
    const uid = userUid || auth.currentUser?.uid;
    if (!uid) return;
    setCurrentUid(uid);

    const loadProfile = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', uid));
        if (uDoc.exists()) {
          const data = uDoc.data();
          const cleanDoc = (data.numeroIdentificacion || '').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
          const fullName = data.nombreCompleto || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.nombre || userName || 'Colaborador';
          
          setFixedNombre(fullName);
          if (cleanDoc) setFixedIdentificacion(cleanDoc);
          if (data.rol) setUserRol(data.rol);
          if (data.horarioLaboral) {
            setHorarioParametrizado(data.horarioLaboral);
            if (data.horarioLaboral.horaEntradaDefecto) setFormHoraEntrada(data.horarioLaboral.horaEntradaDefecto);
            if (data.horarioLaboral.horaSalidaDefecto) setFormHoraSalida(data.horarioLaboral.horaSalidaDefecto);
            if (typeof data.horarioLaboral.minutosDescansoDefecto === 'number') {
              setFormMinutosDescanso(data.horarioLaboral.minutosDescansoDefecto);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando perfil en logeo', err);
      }
    };

    loadProfile();
  }, [userUid, userName, userDocument]);

  // Load personal turnos
  const loadMyTurnos = async () => {
    const uid = currentUid || userUid || auth.currentUser?.uid;
    if (!uid) return;
    setLoadingTurnos(true);
    try {
      const q = query(collection(db, 'staffTurnos'), where('staffUid', '==', uid));
      const snap = await getDocs(q);
      const list: TurnoPersonalRecord[] = [];
      snap.forEach(d => {
        const t = d.data();
        list.push({
          id: d.id,
          staffUid: t.staffUid || uid,
          staffNombre: t.staffNombre || fixedNombre,
          staffIdentificacion: t.staffIdentificacion || fixedIdentificacion,
          fecha: t.fecha || '',
          horaEntrada: t.horaEntrada || '',
          horaSalida: t.horaSalida || '',
          minutosDescanso: t.minutosDescanso || 0,
          centroCosto: t.centroCosto || 'PERSONAL',
          observaciones: t.observaciones || '',
          horasTotalesEfectivas: t.horasTotalesEfectivas || 0,
          horasOrdinariasDiurnas: t.horasOrdinariasDiurnas || 0,
          horasRecargoNocturno: t.horasRecargoNocturno || 0,
          horasExtraDiurna: t.horasExtraDiurna || 0,
          horasExtraNocturna: t.horasExtraNocturna || 0,
          horasDominicalOrdinaria: t.horasDominicalOrdinaria || 0,
          horasExtraDominicalDiurna: t.horasExtraDominicalDiurna || 0,
          horasExtraDominicalNocturna: t.horasExtraDominicalNocturna || 0,
          horasFestivoOrdinaria: t.horasFestivoOrdinaria || 0,
          horasExtraFestivoDiurna: t.horasExtraFestivoDiurna || 0,
          horasExtraFestivoNocturna: t.horasExtraFestivoNocturna || 0,
          totalHorasOrdinarias: t.totalHorasOrdinarias || t.horasOrdinariasDiurnas || 0,
          totalHorasExtras: t.totalHorasExtras || 0,
          totalHorasDominicalesYFestivas: t.totalHorasDominicalesYFestivas || 0,
          horasDescanso: t.horasDescanso || (t.minutosDescanso ? t.minutosDescanso / 60 : 0),
          horasFaltantes: t.horasFaltantes || 0,
          esDomingo: Boolean(t.esDomingo),
          esFestivo: Boolean(t.esFestivo),
          esDominicalOFestivo: Boolean(t.esDominicalOFestivo),
          nombreFestivo: t.nombreFestivo || undefined,
          valorEstimadoTotal: t.valorEstimadoTotal || undefined,
          creadoEl: t.creadoEl || '',
          origen: t.origen || 'LOGEO_PERSONAL',
        });
      });
      list.sort((a, b) => b.fecha.localeCompare(a.fecha));
      setMyTurnos(list);
    } catch (err) {
      console.error('Error cargando historial de turnos personales', err);
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    if (currentUid) {
      loadMyTurnos();
    }
  }, [currentUid]);

  // Sunday or Colombian Holiday verification
  const infoDia = useMemo(() => {
    return isDominicalOFestivoColombia(formFecha);
  }, [formFecha]);

  // Real-time Overtime Calculation Preview
  const liveCalculation: ResultadoCalculoHoras = useMemo(() => {
    return calculateOvertimeColombia({
      fecha: formFecha,
      horaEntrada: formHoraEntrada,
      horaSalida: formHoraSalida,
      minutosDescanso: Number(formMinutosDescanso) || 0,
      horarioLaboral: horarioParametrizado
    });
  }, [formFecha, formHoraEntrada, formHoraSalida, formMinutosDescanso, horarioParametrizado]);

  // Quick Date Selectors
  const setDateToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setFormFecha(today);
  };

  const setDateYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setFormFecha(yest.toISOString().substring(0, 10));
  };

  // Open native picker if available or open visual calendar
  const handleOpenCalendar = () => {
    if (nativeDateInputRef.current && typeof (nativeDateInputRef.current as any).showPicker === 'function') {
      try {
        (nativeDateInputRef.current as any).showPicker();
        return;
      } catch (e) {
        // Fallback to visual modal
      }
    }
    // Update cal view to current selected date
    if (formFecha) {
      const parts = formFecha.split('-').map(Number);
      if (parts.length === 3) {
        setCalYear(parts[0]);
        setCalMonth(parts[1] - 1);
      }
    }
    setShowCalendarModal(true);
  };

  // Visual Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth, 1);
    const lastDayOfMonth = new Date(calYear, calMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Day of week: 0=Sun, 1=Mon, ..., 6=Sat -> adjust to Mon=0, Sun=6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isSunday: boolean;
      isHoliday: boolean;
      holidayName?: string;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Empty padding cells before 1st day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        dateStr: '',
        dayNum: 0,
        isCurrentMonth: false,
        isSunday: false,
        isHoliday: false,
        isSelected: false,
        isToday: false,
      });
    }

    const todayStr = new Date().toISOString().substring(0, 10);

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${calYear}-${mStr}-${dStr}`;
      
      const holidayInfo = isDominicalOFestivoColombia(dateStr);

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isSunday: holidayInfo.esDomingo,
        isHoliday: holidayInfo.esFestivo,
        holidayName: holidayInfo.nombreFestivo,
        isSelected: dateStr === formFecha,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [calYear, calMonth, formFecha]);

  const handleSelectCalendarDay = (dateStr: string) => {
    if (!dateStr) return;
    setFormFecha(dateStr);
    setShowCalendarModal(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  // Submit / Register Turno
  const handleSubmitTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUid) {
      toast({ title: 'Error', description: 'No se detectó usuario activo.', variant: 'destructive' });
      return;
    }
    if (!formFecha || !formHoraEntrada || !formHoraSalida) {
      toast({ title: 'Campos incompletos', description: 'Por favor ingresa fecha, hora de entrada y salida.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        staffUid: currentUid,
        staffNombre: fixedNombre || 'Staff',
        staffIdentificacion: fixedIdentificacion || 'N/A',
        fecha: formFecha,
        horaEntrada: formHoraEntrada,
        horaSalida: formHoraSalida,
        minutosDescanso: Number(formMinutosDescanso) || 0,
        centroCosto: 'PERSONAL',
        observaciones: formObservaciones.trim(),
        horasTotalesEfectivas: liveCalculation.horasTotalesEfectivas,
        horasBrutasEstancia: liveCalculation.horasBrutasEstancia,
        horasDescanso: liveCalculation.horasDescanso,
        horasFaltantes: liveCalculation.horasFaltantes,
        horasOrdinariasDiurnas: liveCalculation.horasOrdinariasDiurnas,
        horasRecargoNocturno: liveCalculation.horasRecargoNocturno,
        horasExtraDiurna: liveCalculation.horasExtraDiurna,
        horasExtraNocturna: liveCalculation.horasExtraNocturna,
        horasDominicalOrdinaria: liveCalculation.horasDominicalOrdinaria,
        horasExtraDominicalDiurna: liveCalculation.horasExtraDominicalDiurna,
        horasExtraDominicalNocturna: liveCalculation.horasExtraDominicalNocturna,
        horasFestivoOrdinaria: liveCalculation.horasFestivoOrdinaria,
        horasExtraFestivoDiurna: liveCalculation.horasExtraFestivoDiurna,
        horasExtraFestivoNocturna: liveCalculation.horasExtraFestivoNocturna,
        totalHorasOrdinarias: liveCalculation.totalHorasOrdinarias,
        totalHorasExtras: liveCalculation.totalHorasExtras,
        totalHorasDominicalesYFestivas: liveCalculation.totalHorasDominicalesYFestivas,
        esDomingo: liveCalculation.esDomingo,
        esFestivo: liveCalculation.esFestivo,
        esDominicalOFestivo: liveCalculation.esDominicalOFestivo,
        nombreFestivo: liveCalculation.nombreFestivo || null,
        valorEstimadoTotal: liveCalculation.valorEstimadoTotal || 0,
        actualizadoEl: new Date().toISOString(),
        origen: 'LOGEO_PERSONAL'
      };

      let savedRecord: TurnoPersonalRecord;
      if (editingTurno) {
        await updateDoc(doc(db, 'staffTurnos', editingTurno.id), payload);
        savedRecord = {
          id: editingTurno.id,
          ...payload,
          creadoEl: editingTurno.creadoEl,
          nombreFestivo: payload.nombreFestivo || undefined,
        };
        toast({ title: 'Turno actualizado', description: 'Tus horas han sido actualizadas con éxito.' });
        setEditingTurno(null);
      } else {
        const docRef = await addDoc(collection(db, 'staffTurnos'), {
          ...payload,
          creadoEl: new Date().toISOString()
        });
        savedRecord = {
          id: docRef.id,
          ...payload,
          creadoEl: new Date().toISOString(),
          nombreFestivo: payload.nombreFestivo || undefined,
        };
        toast({ title: '¡Turno Registrado!', description: 'Tu turno se guardó y calculó correctamente.' });
      }

      // Abre automáticamente el modal de detalles con el desglose del turno guardado
      setDetalleTurno(savedRecord);

      // Reset observations
      setFormObservaciones('');
      await loadMyTurnos();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al registrar turno', description: 'Ocurrió un problema al guardar en la base de datos.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing a logged shift
  const handleEditTurno = (t: TurnoPersonalRecord) => {
    setEditingTurno(t);
    setFormFecha(t.fecha);
    setFormHoraEntrada(t.horaEntrada);
    setFormHoraSalida(t.horaSalida);
    setFormMinutosDescanso(t.minutosDescanso);
    setFormObservaciones(t.observaciones || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTurno(null);
    setFormFecha(new Date().toISOString().substring(0, 10));
    setFormObservaciones('');
  };

  // Delete a logged shift
  const handleDeleteTurno = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de turno personal?')) return;
    try {
      await deleteDoc(doc(db, 'staffTurnos', id));
      toast({ title: 'Turno eliminado', description: 'El registro ha sido eliminado.' });
      setMyTurnos(prev => prev.filter(t => t.id !== id));
      if (editingTurno?.id === id) handleCancelEdit();
    } catch (err) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  // Available months in user's history
  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    myTurnos.forEach(t => {
      if (t.fecha && t.fecha.length >= 7) {
        set.add(t.fecha.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [myTurnos]);

  // Filtered personal shifts
  const filteredMyTurnos = useMemo(() => {
    return myTurnos.filter(t => {
      if (selectedMes !== 'todos' && !t.fecha.startsWith(selectedMes)) {
        return false;
      }
      return true;
    });
  }, [myTurnos, selectedMes]);

  // Personal Monthly KPIs
  const kpisPersonales = useMemo(() => {
    let totalHoras = 0;
    let totalOrdinarias = 0;
    let totalExtras = 0;
    let totalDiurnas = 0;
    let totalNocturnas = 0;
    let totalDomFest = 0;
    let totalFaltantes = 0;
    let valorEstimado = 0;

    filteredMyTurnos.forEach(t => {
      totalHoras += t.horasTotalesEfectivas || 0;
      totalOrdinarias += t.horasOrdinariasDiurnas || 0;
      totalExtras += t.totalHorasExtras || 0;
      totalDiurnas += t.horasExtraDiurna || 0;
      totalNocturnas += t.horasExtraNocturna || 0;
      totalDomFest += (t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0) + (t.horasFestivoOrdinaria || 0) + (t.horasExtraFestivoDiurna || 0) + (t.horasExtraFestivoNocturna || 0);
      totalFaltantes += t.horasFaltantes || 0;
      valorEstimado += t.valorEstimadoTotal || 0;
    });

    return {
      totalTurnos: filteredMyTurnos.length,
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalOrdinarias: Math.round(totalOrdinarias * 100) / 100,
      totalExtras: Math.round(totalExtras * 100) / 100,
      totalDiurnas: Math.round(totalDiurnas * 100) / 100,
      totalNocturnas: Math.round(totalNocturnas * 100) / 100,
      totalDomFest: Math.round(totalDomFest * 100) / 100,
      totalFaltantes: Math.round(totalFaltantes * 100) / 100,
      valorEstimado: Math.round(valorEstimado),
    };
  }, [filteredMyTurnos]);

  return (
    <div className="w-full space-y-5 pb-16 px-1 sm:px-0">
      
      {/* Hidden native date input for browsers supporting showPicker() */}
      <input
        ref={nativeDateInputRef}
        type="date"
        value={formFecha}
        onChange={(e) => setFormFecha(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 sm:p-3.5 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-red-950/40 shrink-0">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-orbitron tracking-wide">
                LOGEO DE TURNOS
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 uppercase font-mono tracking-wider">
                Personal
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 sm:line-clamp-none max-w-xl">
              Registra tu jornada laboral de forma rápida. El cálculo de horas extras y recargos nocturnos, dominicales y festivos se ejecuta en tiempo real según la ley colombiana.
            </p>
          </div>
        </div>

        {/* User Identity Pill (Read-only / Fixed) */}
        <div className="shrink-0 bg-black/70 border border-zinc-800/90 rounded-xl p-3 flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-white shrink-0">
            <User className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-left min-w-0 flex-1 sm:flex-initial">
            <div className="text-xs font-black text-white truncate max-w-[200px]">
              {fixedNombre || 'Colaborador Staff'}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 truncate">
              <span>CC: {fixedIdentificacion || 'Identificación'}</span>
              <span className="text-zinc-600">•</span>
              <span className="uppercase text-amber-400 font-semibold text-[10px]">{userRol}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* LEFT COLUMN: REGISTRATION FORM */}
        <div className="lg:col-span-5 bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-4 sm:p-6 shadow-xl relative">
          
          <div className="flex items-center justify-between mb-4 border-b border-[#1C1C28] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-orbitron">
                {editingTurno ? 'Modificar Turno Personal' : 'Registrar Mi Turno'}
              </h2>
            </div>
            {editingTurno && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 transition"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitTurno} className="space-y-4">
            
            {/* Fixed Identity Alert */}
            <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 shrink-0">Titular:</span>
                <span className="text-white font-bold truncate">{fixedNombre}</span>
              </div>
              <span className="font-mono text-emerald-400/80 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
                Fijo / Personal
              </span>
            </div>

            {/* SELECCIÓN DE DÍA CON CALENDARIO VISUAL INTERACTIVO */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  <span>Día del Turno</span>
                  <span className="text-red-500">*</span>
                </label>
                
                {/* Accesos rápidos */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={setDateToday}
                    className={`px-2 py-0.5 rounded font-mono transition ${
                      formFecha === new Date().toISOString().substring(0, 10)
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={setDateYesterday}
                    className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono transition"
                  >
                    Ayer
                  </button>
                </div>
              </div>

              {/* TARJETA INTERACTIVA DE FECHA: Al pulsar abre el calendario para que no quede mal el día */}
              <div
                onClick={handleOpenCalendar}
                className="w-full p-3 sm:p-3.5 bg-black/60 hover:bg-zinc-900 border border-[#1C1C28] hover:border-red-600 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-sm active:scale-[0.99]"
                title="Pulsar para cambiar fecha en el calendario"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-xs sm:text-sm capitalize truncate">
                      {formatFechaCompleta(formFecha)}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 truncate flex items-center gap-1.5">
                      <span className="text-zinc-500">{formFecha}</span>
                      <span>•</span>
                      {infoDia.esFestivo ? (
                        <span className="text-amber-400 font-semibold truncate">🇨🇴 Festivo: {infoDia.nombreFestivo}</span>
                      ) : infoDia.esDomingo ? (
                        <span className="text-amber-400 font-semibold">☀️ Domingo</span>
                      ) : (
                        <span className="text-zinc-400">Día Hábil Ordinario</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-500/30 group-hover:bg-red-600 group-hover:text-white transition ml-2">
                  <span>Calendario</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Sunday / Holiday Detection Tag */}
              {infoDia.esFestivo && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>🇨🇴 Festivo Oficial:</strong> {infoDia.nombreFestivo} (Recargo Dominical/Festivo aplicable)</span>
                </div>
              )}
              {infoDia.esDomingo && !infoDia.esFestivo && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>☀️ Domingo:</strong> Día dominical oficial (+75% ordinario / recargos dominicales)</span>
                </div>
              )}
            </div>

            {/* HORAS ENTRADA Y SALIDA: Optimizado para móvil y diferenciador 12 AM vs 12 PM */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hora Entrada</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={formHoraEntrada}
                    onChange={(e) => setFormHoraEntrada(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-sm font-bold text-white outline-none font-mono text-center transition"
                  />
                </div>
                {/* Diferenciador 12 AM vs 12 PM */}
                <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-mono font-bold flex items-center gap-1 ${
                      formHoraEntrada === '12:00' 
                        ? 'text-amber-400' 
                        : formHoraEntrada === '00:00' 
                        ? 'text-purple-400' 
                        : 'text-zinc-300'
                    }`}>
                      {formHoraEntrada === '12:00' && '☀️ 12:00 PM (Mediodía)'}
                      {formHoraEntrada === '00:00' && '🌙 12:00 AM (Medianoche)'}
                      {formHoraEntrada !== '12:00' && formHoraEntrada !== '00:00' && formatHora12(formHoraEntrada)}
                    </span>
                  </div>
                  {formHoraEntrada === '12:00' && (
                    <button
                      type="button"
                      onClick={() => setFormHoraEntrada('00:00')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 text-left underline font-medium"
                    >
                      ¿Era de noche? Cambiar a 12 AM (00:00)
                    </button>
                  )}
                  {formHoraEntrada === '00:00' && (
                    <button
                      type="button"
                      onClick={() => setFormHoraEntrada('12:00')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 text-left underline font-medium"
                    >
                      ¿Era de día? Cambiar a 12 PM (12:00)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Hora Salida</span>
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={formHoraSalida}
                    onChange={(e) => setFormHoraSalida(e.target.value)}
                    className="w-full px-3 py-2.5 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-sm font-bold text-white outline-none font-mono text-center transition"
                  />
                </div>
                {/* Diferenciador 12 AM vs 12 PM */}
                <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-mono font-bold flex items-center gap-1 ${
                      formHoraSalida === '12:00' 
                        ? 'text-amber-400' 
                        : formHoraSalida === '00:00' 
                        ? 'text-purple-400' 
                        : 'text-zinc-300'
                    }`}>
                      {formHoraSalida === '12:00' && '☀️ 12:00 PM (Mediodía)'}
                      {formHoraSalida === '00:00' && '🌙 12:00 AM (Medianoche)'}
                      {formHoraSalida !== '12:00' && formHoraSalida !== '00:00' && formatHora12(formHoraSalida)}
                    </span>
                  </div>
                  {formHoraSalida === '12:00' && (
                    <button
                      type="button"
                      onClick={() => setFormHoraSalida('00:00')}
                      className="text-[10px] text-purple-400 hover:text-purple-300 text-left underline font-medium"
                    >
                      ¿Era de noche? Cambiar a 12 AM (00:00)
                    </button>
                  )}
                  {formHoraSalida === '00:00' && (
                    <button
                      type="button"
                      onClick={() => setFormHoraSalida('12:00')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 text-left underline font-medium"
                    >
                      ¿Era de día? Cambiar a 12 PM (12:00)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso inteligente si el turno supera 14 horas para evitar confusión 12 AM vs 12 PM */}
            {liveCalculation.horasBrutasEstancia >= 14 && (
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs space-y-1 text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Verificación de Horario ({liveCalculation.horasBrutasEstancia}h de estancia):</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Estás registrando de <strong className="text-white">{formatHora12(formHoraEntrada)}</strong> a <strong className="text-white">{formatHora12(formHoraSalida)}</strong>.
                  <br />
                  • <strong>12:00 PM</strong> = Mediodía (almuerzo / día).
                  <br />
                  • <strong>12:00 AM (00:00)</strong> = Medianoche (noche / madrugada).
                </p>
              </div>
            )}

            {/* DESCANSO (MINUTOS) CON BOTONES RÁPIDOS PARA MÓVIL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Descanso / Almuerzo</span>
                </label>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {formMinutosDescanso} min
                </span>
              </div>

              {/* Touch Pills para móvil */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Sin desc.', value: 0 },
                  { label: '30 min', value: 30 },
                  { label: '60 min', value: 60 },
                  { label: '90 min', value: 90 },
                ].map((pill) => (
                  <button
                    key={pill.value}
                    type="button"
                    onClick={() => setFormMinutosDescanso(pill.value)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition text-center ${
                      formMinutosDescanso === pill.value
                        ? 'bg-red-600 border-red-500 text-white font-bold shadow-md shadow-red-950/50'
                        : 'bg-black/40 border-[#1C1C28] text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* OBSERVACIONES (OPCIONAL) CON BOTONES RÁPIDOS */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Observaciones / Novedad (Opcional)
              </label>
              
              {/* Sugerencias rápidas para móvil */}
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {['Montaje de pista', 'Logística y pits', 'Control de acceso', 'Juzgamiento'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setFormObservaciones(prev => prev ? `${prev}, ${tag}` : tag);
                    }}
                    className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-0.5 rounded-full border border-zinc-800 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder="Ej. Apoyo en montaje de pista, acreditaciones, logística..."
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none resize-none transition"
              />
            </div>

            {/* ACTION BUTTON (GRANDE Y FÁCIL DE TOCAR EN MÓVIL) */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider font-orbitron flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Guardando Turno...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{editingTurno ? 'Actualizar Mi Turno' : 'Registrar Mi Turno'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: PERSONAL HISTORY & METRICS */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* PERSONAL KPIS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-3">
              <span className="text-zinc-500 text-[10px] font-bold uppercase block">Total Horas</span>
              <span className="text-xl font-black text-white font-mono">{kpisPersonales.totalHoras}h</span>
              <span className="text-[10px] text-zinc-500 block">{kpisPersonales.totalTurnos} turnos</span>
            </div>

            <div className="bg-[#0E0E14] border border-amber-500/20 rounded-xl p-3">
              <span className="text-amber-400 text-[10px] font-bold uppercase block">Horas Extras</span>
              <span className="text-xl font-black text-amber-300 font-mono">{kpisPersonales.totalExtras}h</span>
              <span className="text-[10px] text-zinc-500 block">HED: {kpisPersonales.totalDiurnas}h</span>
            </div>

            <div className="bg-[#0E0E14] border border-purple-500/20 rounded-xl p-3">
              <span className="text-purple-400 text-[10px] font-bold uppercase block">Nocturnas</span>
              <span className="text-xl font-black text-purple-300 font-mono">{kpisPersonales.totalNocturnas}h</span>
              <span className="text-[10px] text-zinc-500 block">HEN acumuladas</span>
            </div>

            <div className="bg-[#0E0E14] border border-rose-500/20 rounded-xl p-3">
              <span className="text-rose-400 text-[10px] font-bold uppercase block">Dom / Festivas</span>
              <span className="text-xl font-black text-rose-300 font-mono">{kpisPersonales.totalDomFest}h</span>
              <span className="text-[10px] text-zinc-500 block">Recargo domingo</span>
            </div>
          </div>

          {/* TABLE / MOBILE CARDS CARD */}
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl shadow-xl overflow-hidden">
            
            <div className="p-4 border-b border-[#1C1C28] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-orbitron">
                  Mis Turnos Registrados
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                  {filteredMyTurnos.length}
                </span>
              </div>

              {/* Month Selector */}
              {mesesDisponibles.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Mes:</span>
                  <select
                    value={selectedMes}
                    onChange={(e) => setSelectedMes(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300 outline-none cursor-pointer font-mono"
                  >
                    <option value="todos">Todos los meses</option>
                    {mesesDisponibles.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loadingTurnos ? (
              <div className="p-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando tu historial de turnos...
              </div>
            ) : filteredMyTurnos.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                No tienes turnos registrados aún. Usa el formulario para registrar tu primera jornada.
              </div>
            ) : (
              <>
                {/* 1. VISTA MÓVIL (TARJETAS INDIVIDUALES - CERO SCROLL HORIZONTAL) */}
                <div className="block sm:hidden divide-y divide-[#1C1C28]">
                  {filteredMyTurnos.map((t) => (
                    <div key={`mob-${t.id}`} className="p-3.5 space-y-2 hover:bg-zinc-900/30 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-black text-white text-sm">{t.fecha}</span>
                          {t.esDominicalOFestivo && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/30 font-bold">
                              {t.nombreFestivo || 'Dominical'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetalleTurno(t)}
                            className="px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 hover:text-emerald-200 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-bold"
                            title="Ver detalles del turno"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalles</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditTurno(t)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTurno(t.id)}
                            className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-red-200"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-white font-semibold">{formatHora12(t.horaEntrada, false)} - {formatHora12(t.horaSalida, false)}</span>
                          {(t.horaEntrada === '12:00' || t.horaSalida === '12:00' || t.horaEntrada === '00:00' || t.horaSalida === '00:00') && (
                            <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {t.horaEntrada === '12:00' && 'Entr: 12 PM Mediodía'}
                              {t.horaEntrada === '00:00' && 'Entr: 12 AM Medianoche'}
                              {t.horaSalida === '12:00' && 'Sal: 12 PM Mediodía'}
                              {t.horaSalida === '00:00' && 'Sal: 12 AM Medianoche'}
                            </span>
                          )}
                          {t.minutosDescanso > 0 && (
                            <span className="text-[10px] text-zinc-600">({t.minutosDescanso}m desc.)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {t.horasTotalesEfectivas}h
                          </span>
                          {t.totalHorasExtras > 0 && (
                            <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              +{t.totalHorasExtras}h Extra
                            </span>
                          )}
                        </div>
                      </div>

                      {t.observaciones && (
                        <div className="text-[11px] text-zinc-400 bg-black/40 p-2 rounded-lg border border-zinc-900">
                          {t.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 2. VISTA ESCRITORIO (TABLA TRADICIONAL) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-black/60 text-zinc-400 uppercase font-semibold text-[10px] border-b border-[#1C1C28]">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-3 py-3">Horario</th>
                        <th className="px-3 py-3 text-center">Efectivas</th>
                        <th className="px-3 py-3 text-center">Extras</th>
                        <th className="px-3 py-3">Novedad</th>
                        <th className="px-3 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C28]">
                      {filteredMyTurnos.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-900/40 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-white text-xs">{t.fecha}</div>
                            {t.esDominicalOFestivo && (
                              <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/30">
                                {t.nombreFestivo || 'Dominical'}
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px]">
                            <div className="text-white font-semibold">{formatHora12(t.horaEntrada, false)} - {formatHora12(t.horaSalida, false)}</div>
                            {(t.horaEntrada === '12:00' || t.horaSalida === '12:00' || t.horaEntrada === '00:00' || t.horaSalida === '00:00') && (
                              <div className="text-[10px] text-amber-400 font-semibold">
                                {t.horaEntrada === '12:00' && 'Entrada: 12 PM (Mediodía)'}
                                {t.horaEntrada === '00:00' && 'Entrada: 12 AM (Medianoche)'}
                                {t.horaSalida === '12:00' && 'Salida: 12 PM (Mediodía)'}
                                {t.horaSalida === '00:00' && 'Salida: 12 AM (Medianoche)'}
                              </div>
                            )}
                            {t.minutosDescanso > 0 && (
                              <div className="text-[10px] text-zinc-500">Desc: {t.minutosDescanso}m</div>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className="font-mono font-bold text-white text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {t.horasTotalesEfectivas}h
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            {t.totalHorasExtras > 0 ? (
                              <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                                +{t.totalHorasExtras}h
                              </span>
                            ) : (
                              <span className="text-zinc-600 font-mono text-xs">-</span>
                            )}
                          </td>

                          <td className="px-3 py-3 max-w-[140px] truncate text-[11px] text-zinc-400">
                            {t.observaciones || <span className="text-zinc-600 italic">Sin novedad</span>}
                          </td>

                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetalleTurno(t)}
                                className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 hover:text-emerald-200 border border-emerald-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                                title="Ver detalles y cálculo de horas"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detalles</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditTurno(t)}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                                title="Modificar turno"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTurno(t.id)}
                                className="p-1 rounded bg-red-950/50 hover:bg-red-900/80 text-red-400 hover:text-red-200 transition"
                                title="Eliminar turno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* MODAL DEL CALENDARIO VISUAL INTERACTIVO */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111118] border border-zinc-800 rounded-2xl w-full max-w-sm p-4 sm:p-5 shadow-2xl relative">
            
            {/* Header del Calendario */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-sm font-black text-white font-orbitron uppercase">
                  {MESES_ES[calMonth]} {calYear}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 text-center py-2.5 text-[11px] font-bold text-zinc-400 font-mono">
              {DIAS_SEMANA_CORTOS.map((d, idx) => (
                <div key={d} className={idx === 6 ? 'text-amber-400 font-black' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cd, index) => {
                if (!cd.isCurrentMonth) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                return (
                  <button
                    key={cd.dateStr}
                    type="button"
                    onClick={() => handleSelectCalendarDay(cd.dateStr)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-mono font-bold transition relative ${
                      cd.isSelected
                        ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 scale-105'
                        : cd.isHoliday
                        ? 'bg-amber-950/50 hover:bg-amber-900/80 text-amber-300 border border-amber-600/40'
                        : cd.isSunday
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-400'
                        : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200'
                    } ${cd.isToday && !cd.isSelected ? 'ring-2 ring-red-500' : ''}`}
                    title={cd.holidayName ? `🇨🇴 Festivo: ${cd.holidayName}` : cd.isSunday ? 'Domingo' : cd.dateStr}
                  >
                    <span>{cd.dayNum}</span>
                    {cd.isHoliday && (
                      <span className="w-1 h-1 rounded-full bg-amber-400 -mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Festivo / Domingo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Seleccionado</span>
              </div>
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="mt-3 w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL TURNO (DESGLOSE COMPLETO DE CÁLCULO DE HORAS) */}
      {detalleTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4">
            
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-[#1C1C28] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-orbitron">
                    Detalles del Turno
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                    Guardado
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 capitalize font-medium">
                  📅 {formatFechaCompleta(detalleTurno.fecha)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetalleTurno(null)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                title="Cerrar detalles"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Titular e Información General */}
            <div className="bg-black/50 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Titular Staff:</span>
                <span className="text-white font-bold">{detalleTurno.staffNombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Identificación:</span>
                <span className="text-zinc-300 font-mono">CC: {detalleTurno.staffIdentificacion}</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2">
                <span className="text-zinc-400">Jornada Registrada:</span>
                <span className="text-white font-mono font-bold text-right">
                  {formatHora12(detalleTurno.horaEntrada)} a {formatHora12(detalleTurno.horaSalida)}
                  {detalleTurno.minutosDescanso > 0 && (
                    <span className="text-zinc-500 font-normal ml-1">({detalleTurno.minutosDescanso}m desc.)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tipo de Día:</span>
                {detalleTurno.esDominicalOFestivo ? (
                  <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
                    ★ {detalleTurno.nombreFestivo || 'Día Domingo'} (Recargo Festivo)
                  </span>
                ) : (
                  <span className="text-zinc-300">Día Hábil Ordinario</span>
                )}
              </div>
            </div>

            {/* DESGLOSE Y CÁLCULO DE HORAS (EXACTAMENTE LA TARJETA SOLICITADA) */}
            <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Cálculo de Horas
                </span>
                <span className="text-xs font-mono font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {detalleTurno.horasTotalesEfectivas}h Totales
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Ord. Diurna */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-[#1C1C28]">
                  <span className="text-[10px] text-zinc-400 block truncate">Ord. Diurna (Base 7h)</span>
                  <span className="text-sm font-bold text-white font-mono">{detalleTurno.horasOrdinariasDiurnas}h</span>
                </div>

                {/* Recargo Noct. */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-400 block truncate">Recargo Noct. (+35%)</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">{detalleTurno.horasRecargoNocturno}h</span>
                </div>

                {/* Extra Diurna */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block truncate">Extra Diurna (HED)</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">{detalleTurno.horasExtraDiurna}h</span>
                </div>

                {/* Extra Noct. */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 block truncate">Extra Noct. (HEN)</span>
                  <span className="text-sm font-bold text-purple-300 font-mono">{detalleTurno.horasExtraNocturna}h</span>
                </div>

                {/* Dominicales */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 block truncate">Dominicales (+75%/+100%)</span>
                  <span className="text-sm font-bold text-rose-300 font-mono">
                    {((detalleTurno.horasDominicalOrdinaria || 0) + (detalleTurno.horasExtraDominicalDiurna || 0) + (detalleTurno.horasExtraDominicalNocturna || 0))}h
                  </span>
                </div>

                {/* Festivas */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-orange-500/20">
                  <span className="text-[10px] text-orange-400 block truncate">Festivas (+75%/+100%)</span>
                  <span className="text-sm font-bold text-orange-300 font-mono">
                    {((detalleTurno.horasFestivoOrdinaria || 0) + (detalleTurno.horasExtraFestivoDiurna || 0) + (detalleTurno.horasExtraFestivoNocturna || 0))}h
                  </span>
                </div>

                {/* Descanso Descontado */}
                <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-zinc-700/30">
                  <span className="text-[10px] text-zinc-400 block truncate">Descanso / Almuerzo</span>
                  <span className="text-sm font-bold text-zinc-300 font-mono">{detalleTurno.minutosDescanso} min</span>
                </div>

                {/* Total Horas Extras */}
                <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block font-bold truncate">Total Horas Extras</span>
                  <span className="text-sm font-black text-emerald-300 font-mono">{detalleTurno.totalHorasExtras}h</span>
                </div>
              </div>

              {/* Banner de Horas Faltantes si no cumplió la jornada de 7h */}
              {typeof detalleTurno.horasFaltantes === 'number' && detalleTurno.horasFaltantes > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Horas Faltantes de Jornada:</strong> Faltaron <strong>{detalleTurno.horasFaltantes}h</strong> para completar la jornada legal de 7 horas diarias.</span>
                </div>
              )}

              {typeof detalleTurno.valorEstimadoTotal === 'number' && detalleTurno.valorEstimadoTotal > 0 && (
                <div className="pt-2 text-right text-xs text-emerald-400 font-semibold border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Valor estimado de nómina:</span>
                  <span className="font-mono text-white text-sm font-bold">
                    ${detalleTurno.valorEstimadoTotal.toLocaleString()} COP
                  </span>
                </div>
              )}
            </div>

            {/* Observaciones (si las hay) */}
            {detalleTurno.observaciones && (
              <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Novedad / Observaciones:
                </span>
                <p className="text-zinc-300 italic">{detalleTurno.observaciones}</p>
              </div>
            )}

            {/* Botón Cerrar */}
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetalleTurno(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
