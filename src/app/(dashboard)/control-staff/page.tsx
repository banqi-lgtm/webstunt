'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Search, Clock, Calendar, Plus, Edit3, Trash2, Download, AlertTriangle, 
  CheckCircle2, Settings, X, Loader2, Building2, Sun, Moon,
  DollarSign, ArrowLeft, Users, Filter, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  calculateOvertimeColombia, 
  HorarioLaboralStaff, 
  ResultadoCalculoHoras 
} from '@/lib/overtime-calculator';
import { isDominicalOFestivoColombia } from '@/lib/colombian-holidays';

export interface StaffMember {
  id: string;
  uid: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  numeroIdentificacion: string;
  rol: string;
  horarioLaboral?: HorarioLaboralStaff;
}

export interface TurnoStaffRecord {
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
  actualizadoEl?: string;
}

export default function ControlStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  // Data lists
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [turnosList, setTurnosList] = useState<TurnoStaffRecord[]>([]);
  const [centrosCostoList, setCentrosCostoList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [turnoSearch, setTurnoSearch] = useState('');
  const [filterStaffUid, setFilterStaffUid] = useState('todos');
  const [filterMes, setFilterMes] = useState('todos');
  const [filterSoloExtras, setFilterSoloExtras] = useState(false);
  const [filterCCO, setFilterCCO] = useState('todos');

  // Modals
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<TurnoStaffRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states: Registro de Turno
  const [formStaffUid, setFormStaffUid] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().substring(0, 10));
  const [formHoraEntrada, setFormHoraEntrada] = useState('08:00');
  const [formHoraSalida, setFormHoraSalida] = useState('17:00');
  const [formMinutosDescanso, setFormMinutosDescanso] = useState(60);
  const [formCentroCosto, setFormCentroCosto] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');

  // Check auth & permissions (requiere control-staff, admin o superAdmin)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        const interfaces = data?.interfaces || [];
        
        const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '');
        
        if (isSuperAdmin || interfaces.includes('admin') || interfaces.includes('control-staff')) {
          setHasAccess(true);
          await loadAllData();
        } else {
          setHasAccess(false);
          router.push('/profile');
        }
      } catch (e) {
        console.error(e);
        router.push('/profile');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Staff
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedStaff: StaffMember[] = [];
      
      usersSnap.forEach(docSnap => {
        const userData = docSnap.data();
        if (['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(userData.email) && !userData.nombres) return;
        
        if (userData.rol === 'staff') {
          fetchedStaff.push({
            id: `f2r_${docSnap.id}`,
            uid: docSnap.id,
            nombres: userData.nombres || 'Desconocido',
            apellidos: userData.apellidos || '',
            email: userData.email || 'N/A',
            telefono: userData.telefono || 'N/A',
            numeroIdentificacion: userData.numeroIdentificacion || 'N/A',
            rol: userData.rol,
            horarioLaboral: userData.horarioLaboral || undefined,
          });
        }
      });
      
      fetchedStaff.sort((a, b) => a.nombres.localeCompare(b.nombres));
      setStaffList(fetchedStaff);

      // 2. Cargar Centros de Costo
      try {
        const ccoSnap = await getDocs(collection(db, 'centrosCosto'));
        const ccos: string[] = [];
        ccoSnap.forEach(d => {
          const name = (d.data().nombre || d.id || '').trim().toUpperCase();
          if (name && !name.includes('ARRENDAMIENTO') && !name.includes('ARCHIVO PLANO')) {
            ccos.push(name);
          }
        });
        ccos.sort();
        setCentrosCostoList(ccos);
      } catch (ccoErr) {
        console.warn('Error al cargar CCOs para turnos', ccoErr);
      }

      // 3. Cargar Turnos de Staff
      try {
        const turnosSnap = await getDocs(collection(db, 'staffTurnos'));
        const turnos: TurnoStaffRecord[] = [];
        turnosSnap.forEach(d => {
          const t = d.data();
          turnos.push({
            id: d.id,
            staffUid: t.staffUid || '',
            staffNombre: t.staffNombre || 'Staff',
            staffIdentificacion: t.staffIdentificacion || '',
            fecha: t.fecha || '',
            horaEntrada: t.horaEntrada || '',
            horaSalida: t.horaSalida || '',
            minutosDescanso: t.minutosDescanso || 0,
            centroCosto: t.centroCosto || '',
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
            actualizadoEl: t.actualizadoEl || ''
          });
        });
        turnos.sort((a, b) => b.fecha.localeCompare(a.fecha));
        setTurnosList(turnos);
      } catch (turnosErr) {
        console.warn('No se encontraron turnos previos', turnosErr);
      }

    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos de control de staff', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  // Cálculo en tiempo real
  const liveCalculation: ResultadoCalculoHoras = useMemo(() => {
    const selectedStaff = staffList.find(s => s.uid === formStaffUid);
    return calculateOvertimeColombia({
      fecha: formFecha,
      horaEntrada: formHoraEntrada,
      horaSalida: formHoraSalida,
      minutosDescanso: Number(formMinutosDescanso) || 0,
      horarioLaboral: selectedStaff?.horarioLaboral
    });
  }, [staffList, formStaffUid, formFecha, formHoraEntrada, formHoraSalida, formMinutosDescanso]);

  // Abrir modal de nuevo turno
  const handleOpenNewTurno = (presetStaffUid?: string) => {
    setEditingTurno(null);
    const defaultStaff = presetStaffUid || (staffList.length > 0 ? staffList[0].uid : '');
    const staffObj = staffList.find(s => s.uid === defaultStaff);
    
    setFormStaffUid(defaultStaff);
    setFormFecha(new Date().toISOString().substring(0, 10));
    setFormHoraEntrada(staffObj?.horarioLaboral?.horaEntradaDefecto || '08:00');
    setFormHoraSalida(staffObj?.horarioLaboral?.horaSalidaDefecto || '17:00');
    setFormMinutosDescanso(staffObj?.horarioLaboral?.minutosDescansoDefecto ?? 60);
    setFormCentroCosto('');
    setFormObservaciones('');
    setShowTurnoModal(true);
  };

  // Abrir modal para editar turno
  const handleOpenEditTurno = (t: TurnoStaffRecord) => {
    setEditingTurno(t);
    setFormStaffUid(t.staffUid);
    setFormFecha(t.fecha);
    setFormHoraEntrada(t.horaEntrada);
    setFormHoraSalida(t.horaSalida);
    setFormMinutosDescanso(t.minutosDescanso);
    setFormCentroCosto(t.centroCosto || '');
    setFormObservaciones(t.observaciones || '');
    setShowTurnoModal(true);
  };

  // Guardar Turno
  const handleSaveTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffUid) {
      toast({ title: 'Selecciona un miembro', description: 'Debes seleccionar el miembro del staff para el turno.', variant: 'destructive' });
      return;
    }

    const staffObj = staffList.find(s => s.uid === formStaffUid);
    if (!staffObj) return;

    setIsSaving(true);
    try {
      const calc = liveCalculation;

      const payload: Omit<TurnoStaffRecord, 'id'> = {
        staffUid: formStaffUid,
        staffNombre: `${staffObj.nombres} ${staffObj.apellidos}`.trim(),
        staffIdentificacion: staffObj.numeroIdentificacion || 'N/A',
        fecha: formFecha,
        horaEntrada: formHoraEntrada,
        horaSalida: formHoraSalida,
        minutosDescanso: Number(formMinutosDescanso) || 0,
        centroCosto: formCentroCosto.trim() || undefined,
        observaciones: formObservaciones.trim() || undefined,
        horasTotalesEfectivas: calc.horasTotalesEfectivas,
        horasOrdinariasDiurnas: calc.horasOrdinariasDiurnas,
        horasRecargoNocturno: calc.horasRecargoNocturno,
        horasExtraDiurna: calc.horasExtraDiurna,
        horasExtraNocturna: calc.horasExtraNocturna,
        horasDominicalOrdinaria: calc.horasDominicalOrdinaria,
        horasExtraDominicalDiurna: calc.horasExtraDominicalDiurna,
        horasExtraDominicalNocturna: calc.horasExtraDominicalNocturna,
        totalHorasExtras: calc.totalHorasExtras,
        esDominicalOFestivo: calc.esDominicalOFestivo,
        nombreFestivo: calc.nombreFestivo || undefined,
        valorEstimadoTotal: calc.valorEstimadoTotal || undefined,
        creadoEl: editingTurno ? editingTurno.creadoEl : new Date().toISOString(),
        actualizadoEl: new Date().toISOString()
      };

      if (editingTurno) {
        await updateDoc(doc(db, 'staffTurnos', editingTurno.id), payload);
        toast({ title: 'Turno actualizado', description: `Se actualizaron las horas de ${payload.staffNombre}.` });
      } else {
        await addDoc(collection(db, 'staffTurnos'), payload);
        toast({ title: 'Turno registrado', description: `Se registraron ${calc.horasTotalesEfectivas}h para ${payload.staffNombre}.` });
      }

      setShowTurnoModal(false);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error al guardar turno', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar turno
  const handleDeleteTurno = async (turno: TurnoStaffRecord) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el registro del ${turno.fecha} para ${turno.staffNombre}?`)) return;
    try {
      await deleteDoc(doc(db, 'staffTurnos', turno.id));
      toast({ title: 'Turno eliminado', description: 'El registro fue retirado con éxito.' });
      setTurnosList(prev => prev.filter(t => t.id !== turno.id));
    } catch (err) {
      toast({ title: 'Error al eliminar turno', variant: 'destructive' });
    }
  };

  // Exportar Excel
  const handleExportTurnosExcel = () => {
    const exportData = filteredTurnos.map((t, i) => ({
      '#': i + 1,
      'EMPLEADO / STAFF': t.staffNombre,
      'CÉDULA / IDENTIFICACIÓN': t.staffIdentificacion,
      'FECHA': t.fecha,
      'DÍA DOMINICAL / FESTIVO': t.esDominicalOFestivo ? `SÍ (${t.nombreFestivo || 'Domingo'})` : 'NO',
      'HORA ENTRADA': t.horaEntrada,
      'HORA SALIDA': t.horaSalida,
      'DESCANSO (MIN)': t.minutosDescanso,
      'TOTAL HORAS LABORADAS': t.horasTotalesEfectivas,
      'HORAS ORD. DIURNAS (HO)': t.horasOrdinariasDiurnas,
      'RECARGO NOCTURNO (RN +35%)': t.horasRecargoNocturno,
      'DOMINICAL ORD. (RDF +75%)': t.horasDominicalOrdinaria,
      'EXTRA DIURNA (HED +25%)': t.horasExtraDiurna,
      'EXTRA NOCTURNA (HEN +75%)': t.horasExtraNocturna,
      'EXTRA DOM/FEST DIURNA (HEDDF +100%)': t.horasExtraDominicalDiurna,
      'EXTRA DOM/FEST NOCTURNA (HENDF +150%)': t.horasExtraDominicalNocturna,
      'TOTAL HORAS EXTRAS': t.totalHorasExtras,
      'CENTRO DE COSTO / EVENTO': t.centroCosto || 'N/A',
      'VALOR ESTIMADO (COP)': t.valorEstimadoTotal ? `$${t.valorEstimadoTotal.toLocaleString()}` : 'N/A',
      'OBSERVACIONES': t.observaciones || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Control_Staff_Horas_Extras');
    XLSX.writeFile(wb, `control_staff_horas_extras_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Reporte Exportado', description: `Se descargó el archivo Excel con ${exportData.length} turnos calculados.` });
  };

  // Filtrado de turnos
  const filteredTurnos = useMemo(() => {
    return turnosList.filter(t => {
      if (filterStaffUid !== 'todos' && t.staffUid !== filterStaffUid) return false;
      if (filterMes !== 'todos' && !t.fecha.startsWith(filterMes)) return false;
      if (filterSoloExtras && t.totalHorasExtras <= 0) return false;
      if (filterCCO !== 'todos' && (t.centroCosto || '').toUpperCase() !== filterCCO.toUpperCase()) return false;
      if (!turnoSearch.trim()) return true;
      const q = turnoSearch.toLowerCase();
      return (
        t.staffNombre.toLowerCase().includes(q) ||
        t.staffIdentificacion.toLowerCase().includes(q) ||
        t.fecha.toLowerCase().includes(q) ||
        (t.centroCosto && t.centroCosto.toLowerCase().includes(q)) ||
        (t.observaciones && t.observaciones.toLowerCase().includes(q))
      );
    });
  }, [turnosList, filterStaffUid, filterMes, filterSoloExtras, filterCCO, turnoSearch]);

  // KPIs
  const kpisTurnos = useMemo(() => {
    let totalHoras = 0;
    let totalHED = 0;
    let totalHEN = 0;
    let totalDominicales = 0;
    let totalHorasExtras = 0;
    let valorEstimado = 0;

    filteredTurnos.forEach(t => {
      totalHoras += t.horasTotalesEfectivas || 0;
      totalHED += t.horasExtraDiurna || 0;
      totalHEN += t.horasExtraNocturna || 0;
      totalDominicales += (t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0);
      totalHorasExtras += t.totalHorasExtras || 0;
      if (t.valorEstimadoTotal) valorEstimado += t.valorEstimadoTotal;
    });

    return {
      totalTurnos: filteredTurnos.length,
      totalHoras: Math.round(totalHoras * 10) / 10,
      totalHED: Math.round(totalHED * 10) / 10,
      totalHEN: Math.round(totalHEN * 10) / 10,
      totalDominicales: Math.round(totalDominicales * 10) / 10,
      totalHorasExtras: Math.round(totalHorasExtras * 10) / 10,
      valorEstimado: Math.round(valorEstimado)
    };
  }, [filteredTurnos]);

  // Meses disponibles
  const availableTurnoMonths = useMemo(() => {
    const set = new Set<string>();
    turnosList.forEach(t => {
      if (t.fecha && t.fecha.length >= 7) {
        set.add(t.fecha.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [turnosList]);

  if (hasAccess === null || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white font-inter text-sm uppercase tracking-widest animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#C8102E]" />
        Cargando Control de Staff...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4 lg:p-8 font-inter">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C28] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/staff"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                <span>Ir al Directorio de Staff</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                  CONTROL DE STAFF
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    HORAS EXTRAS & ASISTENCIA
                  </span>
                </h1>
                <p className="text-xs text-zinc-400">
                  Registro de horas de entrada y salida con validación automática de horas extras diurnas, nocturnas, dominicales y festivas (CST Colombia)
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportTurnosExcel}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-2 transition"
              title="Descargar reporte en Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNewTurno()}
              className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-red-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Turno</span>
            </button>
          </div>
        </div>

        {/* KPIS DE HORAS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-4">
            <span className="text-zinc-500 text-[11px] font-bold uppercase block">Total Horas</span>
            <span className="text-2xl font-black text-white font-mono">{kpisTurnos.totalHoras}h</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">{kpisTurnos.totalTurnos} turnos registrados</span>
          </div>
          <div className="bg-[#0E0E14] border border-amber-500/20 rounded-xl p-4">
            <span className="text-amber-400/80 text-[11px] font-bold uppercase block">Extras Diurnas (HED)</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{kpisTurnos.totalHED}h</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">+25% recargo (6am-9pm)</span>
          </div>
          <div className="bg-[#0E0E14] border border-purple-500/20 rounded-xl p-4">
            <span className="text-purple-400/80 text-[11px] font-bold uppercase block">Extras Noct. (HEN)</span>
            <span className="text-2xl font-black text-purple-400 font-mono">{kpisTurnos.totalHEN}h</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">+75% recargo (9pm-6am)</span>
          </div>
          <div className="bg-[#0E0E14] border border-rose-500/20 rounded-xl p-4">
            <span className="text-rose-400/80 text-[11px] font-bold uppercase block">Dominical / Festivo</span>
            <span className="text-2xl font-black text-rose-400 font-mono">{kpisTurnos.totalDominicales}h</span>
            <span className="text-[10px] text-zinc-500 block mt-0.5">+75% a +150% recargo</span>
          </div>
          <div className="bg-[#0E0E14] border border-emerald-500/20 rounded-xl p-4">
            <span className="text-emerald-400/80 text-[11px] font-bold uppercase block">Total Horas Extras</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{kpisTurnos.totalHorasExtras}h</span>
            {kpisTurnos.valorEstimado > 0 ? (
              <span className="text-[10px] text-emerald-400 block mt-0.5 font-bold">~${kpisTurnos.valorEstimado.toLocaleString()} COP</span>
            ) : (
              <span className="text-[10px] text-zinc-500 block mt-0.5">HED + HEN + Dom/Fest</span>
            )}
          </div>
        </div>

        {/* FILTERS AND SEARCH */}
        <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar turno, staff, cédula o CCO..."
              value={turnoSearch}
              onChange={(e) => setTurnoSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Staff filter */}
            <select
              value={filterStaffUid}
              onChange={(e) => setFilterStaffUid(e.target.value)}
              className="bg-black/50 border border-[#1C1C28] rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="todos">Todo el Staff ({staffList.length})</option>
              {staffList.map(s => (
                <option key={s.uid} value={s.uid}>{s.nombres} {s.apellidos}</option>
              ))}
            </select>

            {/* Mes filter */}
            {availableTurnoMonths.length > 0 && (
              <select
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
                className="bg-black/50 border border-[#1C1C28] rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
              >
                <option value="todos">Todos los meses</option>
                {availableTurnoMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* CCO filter */}
            {centrosCostoList.length > 0 && (
              <select
                value={filterCCO}
                onChange={(e) => setFilterCCO(e.target.value)}
                className="bg-black/50 border border-[#1C1C28] rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer max-w-[180px]"
              >
                <option value="todos">Todos los CCOs</option>
                {centrosCostoList.map(cc => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>
            )}

            {/* Solo Extras toggle */}
            <button
              type="button"
              onClick={() => setFilterSoloExtras(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterSoloExtras
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                  : 'bg-black/50 border-[#1C1C28] text-zinc-400 hover:text-white'
              }`}
            >
              {filterSoloExtras ? '★ Con Horas Extras' : 'Ver solo Extras'}
            </button>

            {/* Reset Filters */}
            {(turnoSearch || filterStaffUid !== 'todos' || filterMes !== 'todos' || filterSoloExtras || filterCCO !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setTurnoSearch('');
                  setFilterStaffUid('todos');
                  setFilterMes('todos');
                  setFilterSoloExtras(false);
                  setFilterCCO('todos');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE TURNOS Y HORAS EXTRAS */}
        <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-[#1C1C28] text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Staff / Empleado</th>
                  <th className="py-3.5 px-4">Fecha y Día</th>
                  <th className="py-3.5 px-4 text-center">Horario</th>
                  <th className="py-3.5 px-4 text-center">Horas Efectivas</th>
                  <th className="py-3.5 px-4">Desglose de Horas y Recargos</th>
                  <th className="py-3.5 px-4">Centro de Costo</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C28]/60 text-zinc-300">
                {filteredTurnos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">No se encontraron turnos registrados con los filtros actuales.</p>
                      <p className="text-[11px] mt-1 text-zinc-600">
                        Haz clic en &quot;Registrar Turno&quot; para ingresar horas de entrada y salida del staff.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTurnos.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">
                            {t.staffNombre}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            CC: {t.staffIdentificacion}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-200">
                            {t.fecha}
                          </span>
                          {t.esDominicalOFestivo ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {t.nombreFestivo || 'Domingo'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Día hábil</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-bold text-white text-xs">
                            {t.horaEntrada} - {t.horaSalida}
                          </span>
                          {t.minutosDescanso > 0 && (
                            <span className="text-[10px] text-zinc-500">
                              Descanso: {t.minutosDescanso}m
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono font-black text-base text-white">
                          {t.horasTotalesEfectivas}h
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {t.horasOrdinariasDiurnas > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {t.horasOrdinariasDiurnas}h Ordinarias
                            </span>
                          )}
                          {t.horasRecargoNocturno > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              <Moon className="w-3 h-3 text-indigo-400" />
                              {t.horasRecargoNocturno}h RN (+35%)
                            </span>
                          )}
                          {t.horasDominicalOrdinaria > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-500/30">
                              {t.horasDominicalOrdinaria}h Dom/Fest (+75%)
                            </span>
                          )}
                          {t.horasExtraDiurna > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-400" />
                              {t.horasExtraDiurna}h HED (+25%)
                            </span>
                          )}
                          {t.horasExtraNocturna > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/70 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Moon className="w-3 h-3 text-purple-400" />
                              {t.horasExtraNocturna}h HEN (+75%)
                            </span>
                          )}
                          {t.horasExtraDominicalDiurna > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-500/40">
                              {t.horasExtraDominicalDiurna}h HEDDF (+100%)
                            </span>
                          )}
                          {t.horasExtraDominicalNocturna > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-500/40">
                              {t.horasExtraDominicalNocturna}h HENDF (+150%)
                            </span>
                          )}
                        </div>
                        {t.observaciones && (
                          <p className="text-[10px] text-zinc-400 mt-1 italic">
                            &quot;{t.observaciones}&quot;
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.centroCosto ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                            <Building2 className="w-3 h-3 text-amber-400" />
                            {t.centroCosto}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTurno(t)}
                            title="Editar Turno"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTurno(t)}
                            title="Eliminar Turno"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 border border-red-500/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: REGISTRAR / EDITAR TURNO */}
      <AnimatePresence>
        {showTurnoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-[#C8102E]/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-xl">
                    <Clock className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {editingTurno ? 'MODIFICAR TURNO DE TRABAJO' : 'REGISTRAR TURNO Y CALCULAR HORAS EXTRAS'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Ingresa la hora de entrada y salida para clasificar automáticamente las horas según la ley colombiana
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTurnoModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTurno} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Selección de Staff y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Miembro del Staff <span className="text-[#C8102E]">*</span>
                    </label>
                    <select
                      required
                      value={formStaffUid}
                      onChange={(e) => {
                        setFormStaffUid(e.target.value);
                        const s = staffList.find(item => item.uid === e.target.value);
                        if (s?.horarioLaboral?.horaEntradaDefecto) {
                          setFormHoraEntrada(s.horarioLaboral.horaEntradaDefecto);
                          setFormHoraSalida(s.horarioLaboral.horaSalidaDefecto || '17:00');
                          setFormMinutosDescanso(s.horarioLaboral.minutosDescansoDefecto ?? 60);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">[ Selecciona un miembro ]</option>
                      {staffList.map(s => (
                        <option key={s.uid} value={s.uid}>
                          {s.nombres} {s.apellidos} (CC: {s.numeroIdentificacion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Fecha del Turno <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="w-full px-3.5 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                    />
                    {liveCalculation.esDominicalOFestivo && (
                      <span className="text-[10px] text-rose-400 font-bold block mt-1">
                        ★ {liveCalculation.nombreFestivo || 'Día Domingo'} (Aplica recargo dominical/festivo)
                      </span>
                    )}
                  </div>
                </div>

                {/* Hora Entrada, Hora Salida y Descanso */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Hora Entrada <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formHoraEntrada}
                      onChange={(e) => setFormHoraEntrada(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Hora Salida <span className="text-[#C8102E]">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formHoraSalida}
                      onChange={(e) => setFormHoraSalida(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Descanso (Min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={15}
                      value={formMinutosDescanso}
                      onChange={(e) => setFormMinutosDescanso(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Centro de Costo / Evento */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Centro de Costo / Evento Asociado (Opcional)
                  </label>
                  <select
                    value={formCentroCosto}
                    onChange={(e) => setFormCentroCosto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">[ Ningún CCO asociado / Sede General ]</option>
                    {centrosCostoList.map(cc => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>

                {/* PREVISUALIZADOR EN TIEMPO REAL DEL CÁLCULO */}
                <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Cálculo de Horas en Tiempo Real
                    </span>
                    <span className="text-xs font-mono font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      {liveCalculation.horasTotalesEfectivas}h Totales
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-[#1C1C28]">
                      <span className="text-[10px] text-zinc-400 block">Ord. Diurna</span>
                      <span className="text-sm font-bold text-white font-mono">{liveCalculation.horasOrdinariasDiurnas}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-indigo-500/20">
                      <span className="text-[10px] text-indigo-400 block">Recargo Noct. (+35%)</span>
                      <span className="text-sm font-bold text-indigo-300 font-mono">{liveCalculation.horasRecargoNocturno}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-amber-500/20">
                      <span className="text-[10px] text-amber-400 block">Extra Diurna (HED)</span>
                      <span className="text-sm font-bold text-amber-300 font-mono">{liveCalculation.horasExtraDiurna}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-purple-500/20">
                      <span className="text-[10px] text-purple-400 block">Extra Noct. (HEN)</span>
                      <span className="text-sm font-bold text-purple-300 font-mono">{liveCalculation.horasExtraNocturna}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-rose-500/20">
                      <span className="text-[10px] text-rose-400 block">Dom/Fest Ord. (+75%)</span>
                      <span className="text-sm font-bold text-rose-300 font-mono">{liveCalculation.horasDominicalOrdinaria}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-red-500/20">
                      <span className="text-[10px] text-red-400 block">Extra Dom. Diurna</span>
                      <span className="text-sm font-bold text-red-300 font-mono">{liveCalculation.horasExtraDominicalDiurna}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-fuchsia-500/20">
                      <span className="text-[10px] text-fuchsia-400 block">Extra Dom. Noct.</span>
                      <span className="text-sm font-bold text-fuchsia-300 font-mono">{liveCalculation.horasExtraDominicalNocturna}h</span>
                    </div>

                    <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 block">Total Horas Extras</span>
                      <span className="text-sm font-black text-emerald-300 font-mono">{liveCalculation.totalHorasExtras}h</span>
                    </div>
                  </div>

                  {liveCalculation.valorEstimadoTotal && liveCalculation.valorEstimadoTotal > 0 && (
                    <div className="pt-1 text-right text-xs text-emerald-400 font-semibold">
                      Valor estimado de nómina: <span className="font-mono text-white text-sm font-bold">${liveCalculation.valorEstimadoTotal.toLocaleString()} COP</span>
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Observaciones / Novedad (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Apoyo logístico montaje de pista, desmontaje y cargue..."
                    value={formObservaciones}
                    onChange={(e) => setFormObservaciones(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="p-4 bg-black/60 border-t border-[#1C1C28] flex items-center justify-end gap-2 -mx-5 -mb-5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTurnoModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#C8102E] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingTurno ? 'Actualizar Turno' : 'Guardar Turno'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
