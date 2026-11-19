'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Calendar, Sparkles, Sun, Moon, CheckCircle2, 
  Trash2, Edit3, AlertTriangle, Loader2, ShieldCheck, 
  User, Check, DollarSign, X, History, FileText, ChevronRight
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  calculateOvertimeColombia, 
  HorarioLaboralStaff, 
  ResultadoCalculoHoras 
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
  totalHorasExtras: number;
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

export function PersonalLogeoStaff({ userUid, userName, userDocument }: PersonalLogeoStaffProps) {
  const { toast } = useToast();

  // Active identity
  const [currentUid, setCurrentUid] = useState<string>(userUid || auth.currentUser?.uid || '');
  const [fixedNombre, setFixedNombre] = useState<string>(userName || '');
  const [fixedIdentificacion, setFixedIdentificacion] = useState<string>(userDocument || '');
  const [userRol, setUserRol] = useState<string>('staff');
  const [horarioParametrizado, setHorarioParametrizado] = useState<HorarioLaboralStaff | undefined>(undefined);

  // Form states
  const [formFecha, setFormFecha] = useState<string>(new Date().toISOString().substring(0, 10));
  const [formHoraEntrada, setFormHoraEntrada] = useState<string>('08:00');
  const [formHoraSalida, setFormHoraSalida] = useState<string>('17:00');
  const [formMinutosDescanso, setFormMinutosDescanso] = useState<number>(60);
  const [formObservaciones, setFormObservaciones] = useState<string>('');

  // Editing state
  const [editingTurno, setEditingTurno] = useState<TurnoPersonalRecord | null>(null);
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
            if (data.horarioLaboral.horaEntradaHabitual) setFormHoraEntrada(data.horarioLaboral.horaEntradaHabitual);
            if (data.horarioLaboral.horaSalidaHabitual) setFormHoraSalida(data.horarioLaboral.horaSalidaHabitual);
            if (typeof data.horarioLaboral.minutosDescansoHabitual === 'number') setFormMinutosDescanso(data.horarioLaboral.minutosDescansoHabitual);
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
          totalHorasExtras: t.totalHorasExtras || 0,
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
        horasOrdinariasDiurnas: liveCalculation.horasOrdinariasDiurnas,
        horasRecargoNocturno: liveCalculation.horasRecargoNocturno,
        horasExtraDiurna: liveCalculation.horasExtraDiurna,
        horasExtraNocturna: liveCalculation.horasExtraNocturna,
        horasDominicalOrdinaria: liveCalculation.horasDominicalOrdinaria,
        horasExtraDominicalDiurna: liveCalculation.horasExtraDominicalDiurna,
        horasExtraDominicalNocturna: liveCalculation.horasExtraDominicalNocturna,
        totalHorasExtras: liveCalculation.totalHorasExtras,
        esDominicalOFestivo: liveCalculation.esDominicalOFestivo,
        nombreFestivo: liveCalculation.nombreFestivo || null,
        valorEstimadoTotal: liveCalculation.valorEstimadoTotal || 0,
        actualizadoEl: new Date().toISOString(),
        origen: 'LOGEO_PERSONAL'
      };

      if (editingTurno) {
        await updateDoc(doc(db, 'staffTurnos', editingTurno.id), payload);
        toast({ title: 'Turno actualizado', description: 'Tus horas han sido actualizadas con éxito.' });
        setEditingTurno(null);
      } else {
        await addDoc(collection(db, 'staffTurnos'), {
          ...payload,
          creadoEl: new Date().toISOString()
        });
        toast({ title: '¡Turno Registrado!', description: 'Tu turno se guardó y calculó correctamente.' });
      }

      // Reset fields
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
    let totalExtras = 0;
    let totalDiurnas = 0;
    let totalNocturnas = 0;
    let totalDomFest = 0;
    let valorEstimado = 0;

    filteredMyTurnos.forEach(t => {
      totalHoras += t.horasTotalesEfectivas || 0;
      totalExtras += t.totalHorasExtras || 0;
      totalDiurnas += t.horasExtraDiurna || 0;
      totalNocturnas += t.horasExtraNocturna || 0;
      totalDomFest += (t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0);
      valorEstimado += t.valorEstimadoTotal || 0;
    });

    return {
      totalTurnos: filteredMyTurnos.length,
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalExtras: Math.round(totalExtras * 100) / 100,
      totalDiurnas: Math.round(totalDiurnas * 100) / 100,
      totalNocturnas: Math.round(totalNocturnas * 100) / 100,
      totalDomFest: Math.round(totalDomFest * 100) / 100,
      valorEstimado: Math.round(valorEstimado),
    };
  }, [filteredMyTurnos]);

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-red-950/40">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-orbitron tracking-wide">
                LOGEO DE TURNOS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 uppercase font-mono tracking-wider">
                Personal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Registra tu hora de entrada y salida laboral. El cálculo de horas extras ordinarias, nocturnas, dominicales y festivas se procesa automáticamente en tiempo real bajo la ley colombiana.
            </p>
          </div>
        </div>

        {/* User Identity Pill (Read-only / Fixed) */}
        <div className="shrink-0 bg-black/60 border border-zinc-800 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center font-bold text-white text-sm">
            <User className="w-5 h-5 text-zinc-300" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black text-white truncate max-w-[200px]">
              {fixedNombre || 'Colaborador Staff'}
            </div>
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
              <span>CC: {fixedIdentificacion || 'Identificación'}</span>
              <span className="text-zinc-600">•</span>
              <span className="uppercase text-amber-400 font-semibold text-[10px]">{userRol}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: REGISTRATION FORM */}
        <div className="lg:col-span-5 bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-5 sm:p-6 shadow-xl relative">
          
          <div className="flex items-center justify-between mb-4 border-b border-[#1C1C28] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-orbitron">
                {editingTurno ? 'Modificar Turno Personal' : 'Registrar Mi Turno'}
              </h2>
            </div>
            {editingTurno && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitTurno} className="space-y-4">
            
            {/* Fixed Identity Alert */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-400">Titular de registro:</span>
                <span className="text-white font-bold truncate">{fixedNombre}</span>
              </div>
              <span className="font-mono text-zinc-500 text-[11px] shrink-0">Bloqueado a tu perfil</span>
            </div>

            {/* Fecha del Turno */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                Fecha del Turno <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono"
                />
              </div>

              {/* Sunday / Holiday Detection Tag */}
              <div className="mt-2">
                {infoDia.esFestivo ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>🇨🇴 Festivo Oficial:</strong> {infoDia.nombreFestivo} (Recargo Dominical/Festivo aplicable)</span>
                  </div>
                ) : infoDia.esDomingo ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>☀️ Domingo:</strong> Día dominical oficial (+75% ordinario / recargos dominicales)</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 pl-1">
                    Día hábil regular de jornada laboral.
                  </div>
                )}
              </div>
            </div>

            {/* Hora Entrada, Hora Salida, Descanso */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Entrada <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formHoraEntrada}
                  onChange={(e) => setFormHoraEntrada(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Salida <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formHoraSalida}
                  onChange={(e) => setFormHoraSalida(e.target.value)}
                  className="w-full px-2.5 py-2 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                  Descanso (Min)
                </label>
                <input
                  type="number"
                  min={0}
                  step={15}
                  value={formMinutosDescanso}
                  onChange={(e) => setFormMinutosDescanso(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono text-center"
                />
              </div>
            </div>

            {/* LIVE CALCULATION PREVIEW CARD (MATCHES USER SCREENSHOT) */}
            <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                  Cálculo de Horas en Tiempo Real
                </span>
                <span className="text-xs font-mono font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {liveCalculation.horasTotalesEfectivas}h Totales
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Ord. Diurna */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-[#1C1C28]">
                  <span className="text-[10px] text-zinc-400 block truncate">Ord. Diurna</span>
                  <span className="text-sm font-bold text-white font-mono">{liveCalculation.horasOrdinariasDiurnas}h</span>
                </div>

                {/* Recargo Noct. */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-400 block truncate">Recargo Noct. (+35%)</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">{liveCalculation.horasRecargoNocturno}h</span>
                </div>

                {/* Extra Diurna */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-amber-500/20">
                  <span className="text-[10px] text-amber-400 block truncate">Extra Diurna (HED)</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">{liveCalculation.horasExtraDiurna}h</span>
                </div>

                {/* Extra Noct. */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-purple-500/20">
                  <span className="text-[10px] text-purple-400 block truncate">Extra Noct. (HEN)</span>
                  <span className="text-sm font-bold text-purple-300 font-mono">{liveCalculation.horasExtraNocturna}h</span>
                </div>

                {/* Dom/Fest Ord. */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 block truncate">Dom/Fest Ord. (+75%)</span>
                  <span className="text-sm font-bold text-rose-300 font-mono">{liveCalculation.horasDominicalOrdinaria}h</span>
                </div>

                {/* Extra Dom. Diurna */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-red-500/20">
                  <span className="text-[10px] text-red-400 block truncate">Extra Dom. Diurna</span>
                  <span className="text-sm font-bold text-red-300 font-mono">{liveCalculation.horasExtraDominicalDiurna}h</span>
                </div>

                {/* Extra Dom. Noct. */}
                <div className="bg-[#0E0E14] p-2 rounded-lg border border-fuchsia-500/20">
                  <span className="text-[10px] text-fuchsia-400 block truncate">Extra Dom. Noct.</span>
                  <span className="text-sm font-bold text-fuchsia-300 font-mono">{liveCalculation.horasExtraDominicalNocturna}h</span>
                </div>

                {/* Total Horas Extras */}
                <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block font-bold truncate">Total Horas Extras</span>
                  <span className="text-sm font-black text-emerald-300 font-mono">{liveCalculation.totalHorasExtras}h</span>
                </div>
              </div>

              {typeof liveCalculation.valorEstimadoTotal === 'number' && liveCalculation.valorEstimadoTotal > 0 && (
                <div className="pt-1 text-right text-xs text-emerald-400 font-semibold border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Valor estimado de nómina:</span>
                  <span className="font-mono text-white text-sm font-bold">
                    ${liveCalculation.valorEstimadoTotal.toLocaleString()} COP
                  </span>
                </div>
              )}
            </div>

            {/* Observaciones (Opcional) */}
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                Observaciones / Novedad (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Apoyo en montaje de pista, acreditaciones, logística..."
                value={formObservaciones}
                onChange={(e) => setFormObservaciones(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none resize-none"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider font-orbitron flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando Turno...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
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

          {/* TABLE CARD */}
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

            <div className="overflow-x-auto">
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
                        {/* Fecha */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-white text-xs">{t.fecha}</div>
                          {t.esDominicalOFestivo && (
                            <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-600/30">
                              {t.nombreFestivo || 'Dominical'}
                            </span>
                          )}
                        </td>

                        {/* Horario */}
                        <td className="px-3 py-3 whitespace-nowrap font-mono text-[11px]">
                          <div>{t.horaEntrada} - {t.horaSalida}</div>
                          {t.minutosDescanso > 0 && (
                            <div className="text-[10px] text-zinc-500">Desc: {t.minutosDescanso}m</div>
                          )}
                        </td>

                        {/* Efectivas */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-white text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {t.horasTotalesEfectivas}h
                          </span>
                        </td>

                        {/* Extras */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {t.totalHorasExtras > 0 ? (
                            <span className="font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                              +{t.totalHorasExtras}h
                            </span>
                          ) : (
                            <span className="text-zinc-600 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* Observaciones */}
                        <td className="px-3 py-3 max-w-[140px] truncate text-[11px] text-zinc-400">
                          {t.observaciones || <span className="text-zinc-600 italic">Sin novedad</span>}
                        </td>

                        {/* Acciones */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
