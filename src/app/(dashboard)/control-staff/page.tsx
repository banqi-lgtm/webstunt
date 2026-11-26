'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Search, Clock, Calendar, Plus, Edit3, Trash2, Download, AlertTriangle, 
  CheckCircle2, Settings, X, Loader2, Building2, Sun, Moon,
  DollarSign, ArrowLeft, ArrowRight, Users, Filter, Sparkles, Eye, BarChart3,
  CalendarDays, FileSpreadsheet, ChevronRight, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
  calculateOvertimeColombia, 
  HorarioLaboralStaff, 
  ResultadoCalculoHoras,
  formatHora12,
  getInfoPeriodoHora,
  getDiaSiguiente,
  horaAMinutos
} from '@/lib/overtime-calculator';
import { isDominicalOFestivoColombia } from '@/lib/colombian-holidays';

interface StaffMember {
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

interface TurnoStaffRecord {
  id: string;
  staffUid: string;
  staffNombre: string;
  staffIdentificacion: string;
  fecha: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD
  cruzaMedianoche?: boolean;
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
  actualizadoEl?: string;
  origen?: string;
}

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatFechaCompleta(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${diasSemana[dateObj.getDay()]}, ${d} de ${MESES_ES[m - 1]} de ${y}`;
}

export default function ControlStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  // Navigation tabs: 'turnos' | 'reportes'
  const [activeTab, setActiveTab] = useState<'turnos' | 'reportes'>('turnos');

  // Data lists
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [turnosList, setTurnosList] = useState<TurnoStaffRecord[]>([]);
  const [centrosCostoList, setCentrosCostoList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters (Turnos view)
  const [turnoSearch, setTurnoSearch] = useState('');
  const [filterStaffUid, setFilterStaffUid] = useState('todos');
  const [filterMes, setFilterMes] = useState('todos');
  const [filterSoloExtras, setFilterSoloExtras] = useState(false);
  const [filterCCO, setFilterCCO] = useState('todos');

  // Filters (Reportes view)
  const [reportPeriodo, setReportPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('mes');
  const [reportStaffUid, setReportStaffUid] = useState('todos');

  // Modals
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<TurnoStaffRecord | null>(null);
  const [detalleTurno, setDetalleTurno] = useState<TurnoStaffRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states: Registro de Turno
  const [formStaffUid, setFormStaffUid] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().substring(0, 10));
  const [formFechaFin, setFormFechaFin] = useState('');
  const [formHoraEntrada, setFormHoraEntrada] = useState('08:00');
  const [formHoraSalida, setFormHoraSalida] = useState('16:00');
  const [formMinutosDescanso, setFormMinutosDescanso] = useState(60);
  const [formCentroCosto, setFormCentroCosto] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');

  // Detección automática si la jornada termina al día siguiente (horaSalida < horaEntrada)
  const cruzaAlOtroDia = useMemo(() => {
    if (!formHoraEntrada || !formHoraSalida) return false;
    return horaAMinutos(formHoraSalida) < horaAMinutos(formHoraEntrada);
  }, [formHoraEntrada, formHoraSalida]);

  // Si cruza al otro día, autocompletar formFechaFin con el día siguiente si está vacía o inválida
  useEffect(() => {
    if (cruzaAlOtroDia) {
      if (!formFechaFin || formFechaFin <= formFecha) {
        setFormFechaFin(getDiaSiguiente(formFecha));
      }
    } else {
      setFormFechaFin(formFecha);
    }
  }, [cruzaAlOtroDia, formFecha]);

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

      // 2. Cargar Centros de Costo (Deduplicados)
      try {
        const ccoSnap = await getDocs(collection(db, 'centrosCosto'));
        const ccoSet = new Set<string>();
        ccoSnap.forEach(d => {
          const name = (d.data().nombre || d.id || '').trim().toUpperCase();
          if (name && !name.includes('ARRENDAMIENTO') && !name.includes('ARCHIVO PLANO')) {
            ccoSet.add(name);
          }
        });
        const ccos = Array.from(ccoSet).sort();
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
            fechaFin: t.fechaFin || (horaAMinutos(t.horaSalida || '') < horaAMinutos(t.horaEntrada || '') ? getDiaSiguiente(t.fecha || '') : t.fecha || ''),
            cruzaMedianoche: Boolean(t.cruzaMedianoche || (horaAMinutos(t.horaSalida || '') < horaAMinutos(t.horaEntrada || ''))),
            horaEntrada: t.horaEntrada || '',
            horaSalida: t.horaSalida || '',
            minutosDescanso: t.minutosDescanso || 0,
            horasDescanso: t.horasDescanso || (t.minutosDescanso ? t.minutosDescanso / 60 : 0),
            horasFaltantes: t.horasFaltantes || 0,
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
            horasFestivoOrdinaria: t.horasFestivoOrdinaria || 0,
            horasExtraFestivoDiurna: t.horasExtraFestivoDiurna || 0,
            horasExtraFestivoNocturna: t.horasExtraFestivoNocturna || 0,
            totalHorasOrdinarias: t.totalHorasOrdinarias || t.horasOrdinariasDiurnas || 0,
            totalHorasExtras: t.totalHorasExtras || 0,
            totalHorasDominicalesYFestivas: t.totalHorasDominicalesYFestivas || 0,
            esDomingo: Boolean(t.esDomingo),
            esFestivo: Boolean(t.esFestivo),
            esDominicalOFestivo: Boolean(t.esDominicalOFestivo),
            nombreFestivo: t.nombreFestivo || undefined,
            valorEstimadoTotal: t.valorEstimadoTotal || undefined,
            creadoEl: t.creadoEl || '',
            actualizadoEl: t.actualizadoEl || '',
            origen: t.origen || 'ADMIN'
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
      fechaFin: cruzaAlOtroDia ? formFechaFin : formFecha,
      horaEntrada: formHoraEntrada,
      horaSalida: formHoraSalida,
      minutosDescanso: Number(formMinutosDescanso) || 0,
      horarioLaboral: selectedStaff?.horarioLaboral
    });
  }, [staffList, formStaffUid, formFecha, formFechaFin, cruzaAlOtroDia, formHoraEntrada, formHoraSalida, formMinutosDescanso]);

  // Abrir modal de nuevo turno
  const handleOpenNewTurno = (presetStaffUid?: string) => {
    setEditingTurno(null);
    const defaultStaff = presetStaffUid || (staffList.length > 0 ? staffList[0].uid : '');
    const staffObj = staffList.find(s => s.uid === defaultStaff);
    
    setFormStaffUid(defaultStaff);
    setFormFecha(new Date().toISOString().substring(0, 10));
    setFormFechaFin('');
    setFormHoraEntrada(staffObj?.horarioLaboral?.horaEntradaDefecto || '08:00');
    setFormHoraSalida(staffObj?.horarioLaboral?.horaSalidaDefecto || '16:00');
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
    const cruzaba = Boolean(t.cruzaMedianoche || (horaAMinutos(t.horaSalida) < horaAMinutos(t.horaEntrada)));
    setFormFechaFin(t.fechaFin || (cruzaba ? getDiaSiguiente(t.fecha) : t.fecha));
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

    if (cruzaAlOtroDia) {
      if (!formFechaFin) {
        toast({
          title: 'Fecha Fin Obligatoria',
          description: 'La hora de salida es menor a la de entrada (termina al día siguiente). Debes seleccionar la fecha de fin de jornada.',
          variant: 'destructive'
        });
        return;
      }
      if (formFechaFin < formFecha) {
        toast({
          title: 'Fecha Fin Inválida',
          description: 'La fecha de fin de jornada no puede ser anterior a la fecha de inicio del turno.',
          variant: 'destructive'
        });
        return;
      }
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
        fechaFin: cruzaAlOtroDia ? formFechaFin : formFecha,
        cruzaMedianoche: cruzaAlOtroDia,
        horaEntrada: formHoraEntrada,
        horaSalida: formHoraSalida,
        minutosDescanso: Number(formMinutosDescanso) || 0,
        horasDescanso: calc.horasDescanso,
        horasFaltantes: calc.horasFaltantes,
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
        horasFestivoOrdinaria: calc.horasFestivoOrdinaria,
        horasExtraFestivoDiurna: calc.horasExtraFestivoDiurna,
        horasExtraFestivoNocturna: calc.horasExtraFestivoNocturna,
        totalHorasOrdinarias: calc.totalHorasOrdinarias,
        totalHorasExtras: calc.totalHorasExtras,
        totalHorasDominicalesYFestivas: calc.totalHorasDominicalesYFestivas,
        esDomingo: calc.esDomingo,
        esFestivo: calc.esFestivo,
        esDominicalOFestivo: calc.esDominicalOFestivo,
        nombreFestivo: calc.nombreFestivo || undefined,
        valorEstimadoTotal: calc.valorEstimadoTotal || undefined,
        creadoEl: editingTurno ? editingTurno.creadoEl : new Date().toISOString(),
        actualizadoEl: new Date().toISOString()
      };

      let savedRecord: TurnoStaffRecord;
      if (editingTurno) {
        await updateDoc(doc(db, 'staffTurnos', editingTurno.id), payload);
        savedRecord = { id: editingTurno.id, ...payload };
        toast({ title: 'Turno actualizado', description: `Se actualizaron las horas de ${payload.staffNombre}.` });
      } else {
        const docRef = await addDoc(collection(db, 'staffTurnos'), payload);
        savedRecord = { id: docRef.id, ...payload };
        toast({ title: 'Turno registrado', description: `Se registraron ${calc.horasTotalesEfectivas}h para ${payload.staffNombre}.` });
      }

      setShowTurnoModal(false);
      setDetalleTurno(savedRecord);
      await loadAllData();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error al guardar turno', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar turno
  const handleDeleteTurno = async (id: string, staffName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el turno registrado para ${staffName}?`)) return;

    try {
      await deleteDoc(doc(db, 'staffTurnos', id));
      toast({ title: 'Turno eliminado', description: 'El turno fue retirado del control.' });
      setTurnosList(prev => prev.filter(t => t.id !== id));
      if (detalleTurno?.id === id) setDetalleTurno(null);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error al eliminar', description: e.message, variant: 'destructive' });
    }
  };

  // Exportar Excel detallado
  const handleExportTurnosExcel = () => {
    if (turnosFiltrados.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay turnos para exportar con los filtros seleccionados.', variant: 'destructive' });
      return;
    }

    const dataToExport = turnosFiltrados.map(t => ({
      'Fecha Inicio': t.fecha,
      'Fecha Fin': t.fechaFin || t.fecha,
      'Colaborador': t.staffNombre,
      'Identificación': t.staffIdentificacion,
      'Hora Entrada': t.horaEntrada,
      'Hora Salida': t.horaSalida,
      'Descanso (Min)': t.minutosDescanso,
      'Horas Efectivas': t.horasTotalesEfectivas,
      'Ord. Diurnas (7h)': t.horasOrdinariasDiurnas,
      'Recargo Nocturno (h)': t.horasRecargoNocturno,
      'Extra Diurna HED (h)': t.horasExtraDiurna,
      'Extra Nocturna HEN (h)': t.horasExtraNocturna,
      'Dominical Ord. (h)': t.horasDominicalOrdinaria,
      'Extra Dom. Diurna (h)': t.horasExtraDominicalDiurna,
      'Extra Dom. Nocturna (h)': t.horasExtraDominicalNocturna,
      'Festivo Ord. (h)': t.horasFestivoOrdinaria || 0,
      'Extra Fest. Diurna (h)': t.horasExtraFestivoDiurna || 0,
      'Extra Fest. Nocturna (h)': t.horasExtraFestivoNocturna || 0,
      'Total Extras (h)': t.totalHorasExtras,
      'Horas Faltantes (h)': t.horasFaltantes || 0,
      'Tipo Día': t.esDominicalOFestivo ? (t.nombreFestivo || 'Dominical') : 'Hábil',
      'Centro de Costo': t.centroCosto || 'N/A',
      'Observaciones': t.observaciones || '',
      'Origen': t.origen || 'ADMIN',
      'Valor Estimado (COP)': t.valorEstimadoTotal || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Control de Staff');
    XLSX.writeFile(wb, `Control_Staff_7H_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Exportar Reporte Consolidado por Colaborador
  const handleExportConsolidadoExcel = () => {
    if (reporteConsolidadoPorStaff.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay datos en el reporte para exportar.', variant: 'destructive' });
      return;
    }

    const dataToExport = reporteConsolidadoPorStaff.map(r => ({
      'Colaborador': r.nombre,
      'Identificación': r.identificacion,
      'Días Laborados': r.diasLaborados,
      'Total Horas Trabajadas': r.totalHoras,
      'Horas Ordinarias (7h)': r.totalOrdinarias,
      'Extras Diurnas (HED)': r.totalHED,
      'Extras Nocturnas (HEN)': r.totalHEN,
      'Horas Dominicales': r.totalDominicales,
      'Horas Festivas': r.totalFestivas,
      'Total Horas Extras': r.totalExtras,
      'Horas Faltantes': r.totalFaltantes,
      'Valor Estimado (COP)': r.totalValorEstimado
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen por Colaborador');
    XLSX.writeFile(wb, `Resumen_Nomina_Staff_${reportPeriodo}_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Filtro de turnos para vista de lista
  const turnosFiltrados = useMemo(() => {
    return turnosList.filter(t => {
      // 1. Búsqueda por texto (nombre, identificación, cco)
      if (turnoSearch) {
        const q = turnoSearch.toLowerCase();
        const matches = t.staffNombre.toLowerCase().includes(q) ||
          t.staffIdentificacion.toLowerCase().includes(q) ||
          (t.centroCosto && t.centroCosto.toLowerCase().includes(q)) ||
          (t.observaciones && t.observaciones.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Filtro por miembro de staff
      if (filterStaffUid !== 'todos' && t.staffUid !== filterStaffUid) {
        return false;
      }

      // 3. Filtro por mes (YYYY-MM)
      if (filterMes !== 'todos' && !t.fecha.startsWith(filterMes)) {
        return false;
      }

      // 4. Filtro solo con horas extras
      if (filterSoloExtras && t.totalHorasExtras <= 0) {
        return false;
      }

      // 5. Filtro por Centro de Costo
      if (filterCCO !== 'todos') {
        const ccoTurno = (t.centroCosto || '').trim().toUpperCase();
        if (ccoTurno !== filterCCO.toUpperCase()) return false;
      }

      return true;
    });
  }, [turnosList, turnoSearch, filterStaffUid, filterMes, filterSoloExtras, filterCCO]);

  // KPIs de la vista de turnos
  const kpisTurnos = useMemo(() => {
    let totalHoras = 0;
    let totalOrdinarias = 0;
    let totalExtras = 0;
    let totalHED = 0;
    let totalHEN = 0;
    let totalDomFest = 0;
    let totalFaltantes = 0;
    let totalValor = 0;

    turnosFiltrados.forEach(t => {
      totalHoras += t.horasTotalesEfectivas || 0;
      totalOrdinarias += t.horasOrdinariasDiurnas || 0;
      totalExtras += t.totalHorasExtras || 0;
      totalHED += t.horasExtraDiurna || 0;
      totalHEN += t.horasExtraNocturna || 0;
      totalDomFest += (t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0) + (t.horasFestivoOrdinaria || 0) + (t.horasExtraFestivoDiurna || 0) + (t.horasExtraFestivoNocturna || 0);
      totalFaltantes += t.horasFaltantes || 0;
      totalValor += t.valorEstimadoTotal || 0;
    });

    return {
      totalTurnos: turnosFiltrados.length,
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalOrdinarias: Math.round(totalOrdinarias * 100) / 100,
      totalExtras: Math.round(totalExtras * 100) / 100,
      totalHED: Math.round(totalHED * 100) / 100,
      totalHEN: Math.round(totalHEN * 100) / 100,
      totalDomFest: Math.round(totalDomFest * 100) / 100,
      totalFaltantes: Math.round(totalFaltantes * 100) / 100,
      totalValor: Math.round(totalValor)
    };
  }, [turnosFiltrados]);

  // ==========================================
  // LÓGICA DE REPORTES (DIARIO, SEMANAL, MENSUAL)
  // ==========================================
  const turnosReportePeriodo = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);

    // Calcular inicio de semana (Lunes de la semana actual)
    const dayOfWeek = today.getDay(); // 0 es domingo
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + diffToMonday);
    const mondayStr = mondayDate.toISOString().substring(0, 10);

    // Calcular inicio de mes
    const currentMonthStr = todayStr.substring(0, 7);

    return turnosList.filter(t => {
      // Filtro de colaborador para reporte
      if (reportStaffUid !== 'todos' && t.staffUid !== reportStaffUid) {
        return false;
      }

      // Filtro de periodo
      if (reportPeriodo === 'hoy') {
        return t.fecha === todayStr;
      } else if (reportPeriodo === 'semana') {
        return t.fecha >= mondayStr && t.fecha <= todayStr;
      } else if (reportPeriodo === 'mes') {
        return t.fecha.startsWith(currentMonthStr);
      }
      return true; // 'todos'
    });
  }, [turnosList, reportPeriodo, reportStaffUid]);

  // Consolidado por Colaborador en el Periodo
  const reporteConsolidadoPorStaff = useMemo(() => {
    const map = new Map<string, {
      staffUid: string;
      nombre: string;
      identificacion: string;
      diasLaborados: number;
      totalHoras: number;
      totalOrdinarias: number;
      totalHED: number;
      totalHEN: number;
      totalDominicales: number;
      totalFestivas: number;
      totalExtras: number;
      totalFaltantes: number;
      totalValorEstimado: number;
    }>();

    turnosReportePeriodo.forEach(t => {
      const existing = map.get(t.staffUid) || {
        staffUid: t.staffUid,
        nombre: t.staffNombre,
        identificacion: t.staffIdentificacion,
        diasLaborados: 0,
        totalHoras: 0,
        totalOrdinarias: 0,
        totalHED: 0,
        totalHEN: 0,
        totalDominicales: 0,
        totalFestivas: 0,
        totalExtras: 0,
        totalFaltantes: 0,
        totalValorEstimado: 0
      };

      existing.diasLaborados += 1;
      existing.totalHoras += t.horasTotalesEfectivas || 0;
      existing.totalOrdinarias += t.horasOrdinariasDiurnas || 0;
      existing.totalHED += t.horasExtraDiurna || 0;
      existing.totalHEN += t.horasExtraNocturna || 0;
      existing.totalDominicales += (t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0);
      existing.totalFestivas += (t.horasFestivoOrdinaria || 0) + (t.horasExtraFestivoDiurna || 0) + (t.horasExtraFestivoNocturna || 0);
      existing.totalExtras += t.totalHorasExtras || 0;
      existing.totalFaltantes += t.horasFaltantes || 0;
      existing.totalValorEstimado += t.valorEstimadoTotal || 0;

      map.set(t.staffUid, existing);
    });

    return Array.from(map.values()).map(r => ({
      ...r,
      totalHoras: Math.round(r.totalHoras * 100) / 100,
      totalOrdinarias: Math.round(r.totalOrdinarias * 100) / 100,
      totalHED: Math.round(r.totalHED * 100) / 100,
      totalHEN: Math.round(r.totalHEN * 100) / 100,
      totalDominicales: Math.round(r.totalDominicales * 100) / 100,
      totalFestivas: Math.round(r.totalFestivas * 100) / 100,
      totalExtras: Math.round(r.totalExtras * 100) / 100,
      totalFaltantes: Math.round(r.totalFaltantes * 100) / 100,
      totalValorEstimado: Math.round(r.totalValorEstimado)
    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [turnosReportePeriodo]);

  // Lista de meses disponibles para filtros
  const mesesDisponibles = useMemo(() => {
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
                    JORNADA LEGAL 7H / DÍA
                  </span>
                </h1>
                <p className="text-xs text-zinc-400">
                  Cálculo automático de horas ordinarias (base 7h), horas extras diurnas, nocturnas, dominicales y festivos colombianos.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={activeTab === 'turnos' ? handleExportTurnosExcel : handleExportConsolidadoExcel}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              title="Descargar reporte en Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{activeTab === 'turnos' ? 'Exportar Turnos' : 'Exportar Consolidado'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenNewTurno()}
              className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-red-950/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Turno</span>
            </button>
          </div>
        </div>

        {/* TABS DE VISTA: TURNOS VS REPORTES */}
        <div className="flex items-center gap-2 border-b border-[#1C1C28] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('turnos')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'turnos'
                ? 'bg-zinc-900/80 text-white border-emerald-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Turnos y Asistencia ({turnosList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reportes')}
            className={`px-4 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'reportes'
                ? 'bg-zinc-900/80 text-white border-emerald-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resumen y Reportes por Periodo</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* VISTA 1: LISTADO DE TURNOS Y ASISTENCIA                        */}
        {/* ============================================================== */}
        {activeTab === 'turnos' && (
          <div className="space-y-6">
            {/* KPIS DE HORAS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-4">
                <span className="text-zinc-500 text-[11px] font-bold uppercase block">Total Horas</span>
                <span className="text-2xl font-black text-white font-mono">{kpisTurnos.totalHoras}h</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">{kpisTurnos.totalTurnos} turnos registrados</span>
              </div>
              <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-4">
                <span className="text-zinc-400 text-[11px] font-bold uppercase block">Ordinarias (7h)</span>
                <span className="text-2xl font-black text-zinc-200 font-mono">{kpisTurnos.totalOrdinarias}h</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Jornada legal diurna</span>
              </div>
              <div className="bg-[#0E0E14] border border-amber-500/20 rounded-xl p-4">
                <span className="text-amber-400/80 text-[11px] font-bold uppercase block">Extras Diurnas (HED)</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{kpisTurnos.totalHED}h</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">+25% recargo</span>
              </div>
              <div className="bg-[#0E0E14] border border-purple-500/20 rounded-xl p-4">
                <span className="text-purple-400/80 text-[11px] font-bold uppercase block">Extras Noct. (HEN)</span>
                <span className="text-2xl font-black text-purple-400 font-mono">{kpisTurnos.totalHEN}h</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">+75% recargo nocturno</span>
              </div>
              <div className="bg-[#0E0E14] border border-rose-500/20 rounded-xl p-4 col-span-2 sm:col-span-1">
                <span className="text-rose-400/80 text-[11px] font-bold uppercase block">Dom / Festivas</span>
                <span className="text-2xl font-black text-rose-400 font-mono">{kpisTurnos.totalDomFest}h</span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">Recargos 75% / 100% / 150%</span>
              </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar colaborador, cédula o novedad..."
                  value={turnoSearch}
                  onChange={(e) => setTurnoSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterStaffUid}
                  onChange={(e) => setFilterStaffUid(e.target.value)}
                  className="bg-black/60 border border-[#1C1C28] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none cursor-pointer font-mono"
                >
                  <option value="todos">Todos los colaboradores</option>
                  {staffList.map(s => (
                    <option key={s.uid} value={s.uid}>{s.nombres} {s.apellidos}</option>
                  ))}
                </select>

                {mesesDisponibles.length > 0 && (
                  <select
                    value={filterMes}
                    onChange={(e) => setFilterMes(e.target.value)}
                    className="bg-black/60 border border-[#1C1C28] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none cursor-pointer font-mono"
                  >
                    <option value="todos">Todos los meses</option>
                    {mesesDisponibles.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}

                {centrosCostoList.length > 0 && (
                  <select
                    value={filterCCO}
                    onChange={(e) => setFilterCCO(e.target.value)}
                    className="bg-black/60 border border-[#1C1C28] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="todos">Todos los CCOs</option>
                    {centrosCostoList.map((cc, idx) => (
                      <option key={`filter-cco-${cc}-${idx}`} value={cc}>{cc}</option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setFilterSoloExtras(prev => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    filterSoloExtras
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      : 'bg-black/40 border-[#1C1C28] text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Solo con Horas Extras</span>
                </button>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE TURNOS */}
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-orbitron">
                    Turnos Registrados ({turnosFiltrados.length})
                  </h2>
                </div>
              </div>

              {turnosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                  No hay turnos registrados que coincidan con los filtros seleccionados.
                </div>
              ) : (
                <>
                  {/* Vista Móvil: Tarjetas individuales */}
                  <div className="block lg:hidden divide-y divide-[#1C1C28]">
                    {turnosFiltrados.map(t => (
                      <div key={`mob-t-${t.id}`} className="p-4 space-y-2.5 hover:bg-zinc-900/30 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-white text-sm">{t.staffNombre}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">CC: {t.staffIdentificacion}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setDetalleTurno(t)}
                              className="px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalles</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditTurno(t)}
                              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTurno(t.id, t.staffNombre)}
                              className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-red-200"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="text-white font-bold">{t.fecha}</span>
                            {t.fechaFin && t.fechaFin !== t.fecha && (
                              <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-500/30">
                                🌙 Fin: {t.fechaFin}
                              </span>
                            )}
                            <span className="mx-1">•</span>
                            <span className="text-white font-semibold">{formatHora12(t.horaEntrada, false)} - {formatHora12(t.horaSalida, false)}</span>
                            {(t.horaEntrada === '12:00' || t.horaSalida === '12:00' || t.horaEntrada === '00:00' || t.horaSalida === '00:00') && (
                              <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-500/20 ml-1">
                                {t.horaEntrada === '12:00' && 'Entr: 12 PM Mediodía'}
                                {t.horaEntrada === '00:00' && 'Entr: 12 AM Medianoche'}
                                {t.horaSalida === '12:00' && 'Sal: 12 PM Mediodía'}
                                {t.horaSalida === '00:00' && 'Sal: 12 AM Medianoche'}
                              </span>
                            )}
                            {t.minutosDescanso > 0 && <span className="text-zinc-600 ml-1">({t.minutosDescanso}m desc.)</span>}
                          </div>
                          <span className="text-white font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {t.horasTotalesEfectivas}h
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                            Ord: {t.horasOrdinariasDiurnas}h
                          </span>
                          {t.totalHorasExtras > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 font-bold">
                              +{t.totalHorasExtras}h Extra (HED: {t.horasExtraDiurna}h / HEN: {t.horasExtraNocturna}h)
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">Sin extras</span>
                          )}
                          {t.horasFaltantes && t.horasFaltantes > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30 font-bold">
                              ⚠️ {t.horasFaltantes}h faltantes
                            </span>
                          ) : null}
                          {t.esDominicalOFestivo && (
                            <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold">
                              {t.nombreFestivo || 'Dominical'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista Desktop: Tabla estructurada */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/60 text-zinc-400 uppercase font-bold border-b border-[#1C1C28] text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Colaborador</th>
                          <th className="py-3 px-3">Fecha</th>
                          <th className="py-3 px-3">Horario</th>
                          <th className="py-3 px-2 text-center">Efectivas</th>
                          <th className="py-3 px-2 text-center">Ord. (7h)</th>
                          <th className="py-3 px-2 text-center">HED (+25%)</th>
                          <th className="py-3 px-2 text-center">HEN (+75%)</th>
                          <th className="py-3 px-2 text-center">Dom / Fest</th>
                          <th className="py-3 px-2 text-center">Faltantes</th>
                          <th className="py-3 px-3">CCO / Origen</th>
                          <th className="py-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1C1C28]">
                        {turnosFiltrados.map(t => (
                          <tr key={`desk-t-${t.id}`} className="hover:bg-zinc-900/30 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{t.staffNombre}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">CC: {t.staffIdentificacion}</div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-zinc-300">
                              <div>{t.fecha}</div>
                              {t.fechaFin && t.fechaFin !== t.fecha && (
                                <span className="inline-block text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold mt-0.5">
                                  🌙 Fin: {t.fechaFin}
                                </span>
                              )}
                              {t.esDominicalOFestivo && (
                                <span className="block text-[9px] text-amber-400 font-bold">
                                  {t.nombreFestivo || 'Dominical'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-400">
                              <div className="font-semibold text-white">{formatHora12(t.horaEntrada, false)} - {formatHora12(t.horaSalida, false)}</div>
                              {(t.horaEntrada === '12:00' || t.horaSalida === '12:00' || t.horaEntrada === '00:00' || t.horaSalida === '00:00') && (
                                <div className="text-[10px] text-amber-400 font-semibold">
                                  {t.horaEntrada === '12:00' && 'Entrada: 12 PM (Mediodía)'}
                                  {t.horaEntrada === '00:00' && 'Entrada: 12 AM (Medianoche)'}
                                  {t.horaSalida === '12:00' && 'Salida: 12 PM (Mediodía)'}
                                  {t.horaSalida === '00:00' && 'Salida: 12 AM (Medianoche)'}
                                </div>
                              )}
                              {t.minutosDescanso > 0 && (
                                <span className="block text-[10px] text-zinc-600">({t.minutosDescanso}m desc.)</span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-black text-white bg-zinc-900/40">
                              {t.horasTotalesEfectivas}h
                            </td>
                            <td className="py-3 px-2 text-center font-mono text-zinc-300">
                              {t.horasOrdinariasDiurnas}h
                            </td>
                            <td className="py-3 px-2 text-center font-mono">
                              {t.horasExtraDiurna > 0 ? (
                                <span className="text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded">
                                  {t.horasExtraDiurna}h
                                </span>
                              ) : <span className="text-zinc-600">-</span>}
                            </td>
                            <td className="py-3 px-2 text-center font-mono">
                              {t.horasExtraNocturna > 0 ? (
                                <span className="text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">
                                  {t.horasExtraNocturna}h
                                </span>
                              ) : <span className="text-zinc-600">-</span>}
                            </td>
                            <td className="py-3 px-2 text-center font-mono">
                              {((t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0) + (t.horasFestivoOrdinaria || 0) + (t.horasExtraFestivoDiurna || 0) + (t.horasExtraFestivoNocturna || 0)) > 0 ? (
                                <span className="text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded">
                                  {((t.horasDominicalOrdinaria || 0) + (t.horasExtraDominicalDiurna || 0) + (t.horasExtraDominicalNocturna || 0) + (t.horasFestivoOrdinaria || 0) + (t.horasExtraFestivoDiurna || 0) + (t.horasExtraFestivoNocturna || 0))}h
                                </span>
                              ) : <span className="text-zinc-600">-</span>}
                            </td>
                            <td className="py-3 px-2 text-center font-mono">
                              {t.horasFaltantes && t.horasFaltantes > 0 ? (
                                <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                                  {t.horasFaltantes}h
                                </span>
                              ) : <span className="text-zinc-600">-</span>}
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[11px] text-zinc-300 block truncate max-w-[140px]" title={t.centroCosto}>
                                {t.centroCosto || 'N/A'}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                t.origen === 'LOGEO_PERSONAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500'
                              }`}>
                                {t.origen || 'ADMIN'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetalleTurno(t)}
                                  className="px-2 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 hover:text-emerald-200 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="Ver desglose completo de horas"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detalles</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTurno(t)}
                                  className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                                  title="Editar Turno"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTurno(t.id, t.staffNombre)}
                                  className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:text-red-200 cursor-pointer"
                                  title="Eliminar Turno"
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
        )}

        {/* ============================================================== */}
        {/* VISTA 2: REPORTES Y RESÚMENES POR PERIODO (DIARIO/SEMANAL/MES)  */}
        {/* ============================================================== */}
        {activeTab === 'reportes' && (
          <div className="space-y-6">
            {/* FILTROS DEL REPORTE */}
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-orbitron">
                    Generador de Reportes de Nómina & Horas
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Consolidación automática por trabajador basada en la jornada ordinaria de 7 horas diarias.
                  </p>
                </div>
              </div>

              {/* Selector de Periodo */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-black/60 border border-[#1C1C28] rounded-xl p-1">
                  {[
                    { id: 'hoy', label: 'Hoy (Diario)' },
                    { id: 'semana', label: 'Esta Semana' },
                    { id: 'mes', label: 'Este Mes' },
                    { id: 'todos', label: 'Todo el Histórico' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setReportPeriodo(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        reportPeriodo === p.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <select
                  value={reportStaffUid}
                  onChange={(e) => setReportStaffUid(e.target.value)}
                  className="bg-black/60 border border-[#1C1C28] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none cursor-pointer font-mono"
                >
                  <option value="todos">Todos los colaboradores</option>
                  {staffList.map(s => (
                    <option key={s.uid} value={s.uid}>{s.nombres} {s.apellidos}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TARJETAS RESUMEN DEL PERIODO */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-3.5">
                <span className="text-zinc-500 text-[10px] font-bold uppercase block">Total Horas</span>
                <span className="text-xl font-black text-white font-mono">
                  {reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalHoras, 0).toFixed(1)}h
                </span>
                <span className="text-[10px] text-zinc-500 block">Horas efectivas</span>
              </div>

              <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-3.5">
                <span className="text-zinc-400 text-[10px] font-bold uppercase block">Ordinarias (7h)</span>
                <span className="text-xl font-black text-zinc-200 font-mono">
                  {reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalOrdinarias, 0).toFixed(1)}h
                </span>
                <span className="text-[10px] text-zinc-500 block">Base laboral</span>
              </div>

              <div className="bg-[#0E0E14] border border-amber-500/20 rounded-xl p-3.5">
                <span className="text-amber-400 text-[10px] font-bold uppercase block">Total Extras</span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalExtras, 0).toFixed(1)}h
                </span>
                <span className="text-[10px] text-zinc-500 block">Diurnas + Nocturnas</span>
              </div>

              <div className="bg-[#0E0E14] border border-rose-500/20 rounded-xl p-3.5">
                <span className="text-rose-400 text-[10px] font-bold uppercase block">Dom / Festivas</span>
                <span className="text-xl font-black text-rose-300 font-mono">
                  {reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalDominicales + r.totalFestivas, 0).toFixed(1)}h
                </span>
                <span className="text-[10px] text-zinc-500 block">Recargo legal</span>
              </div>

              <div className="bg-[#0E0E14] border border-yellow-500/20 rounded-xl p-3.5">
                <span className="text-yellow-400 text-[10px] font-bold uppercase block">Faltantes</span>
                <span className="text-xl font-black text-yellow-300 font-mono">
                  {reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalFaltantes, 0).toFixed(1)}h
                </span>
                <span className="text-[10px] text-zinc-500 block">Déficit jornada</span>
              </div>

              <div className="bg-[#0E0E14] border border-emerald-500/30 rounded-xl p-3.5">
                <span className="text-emerald-400 text-[10px] font-bold uppercase block">Total Nómina Est.</span>
                <span className="text-lg font-black text-emerald-300 font-mono truncate block">
                  ${reporteConsolidadoPorStaff.reduce((acc, r) => acc + r.totalValorEstimado, 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-zinc-500 block">COP estimados</span>
              </div>
            </div>

            {/* TABLA CONSOLIDADA POR COLABORADOR */}
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-orbitron">
                    Resumen Consolidado por Trabajador ({reporteConsolidadoPorStaff.length} colaboradores activos)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleExportConsolidadoExcel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exportar Consolidado</span>
                </button>
              </div>

              {reporteConsolidadoPorStaff.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs">
                  No hay registros de horas en el periodo seleccionado ({reportPeriodo}).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/60 text-zinc-400 uppercase font-bold border-b border-[#1C1C28] text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Colaborador</th>
                        <th className="py-3 px-2 text-center">Días Trab.</th>
                        <th className="py-3 px-2 text-center">Total Horas</th>
                        <th className="py-3 px-2 text-center">Ordinarias (7h)</th>
                        <th className="py-3 px-2 text-center">HED (+25%)</th>
                        <th className="py-3 px-2 text-center">HEN (+75%)</th>
                        <th className="py-3 px-2 text-center">Dominicales</th>
                        <th className="py-3 px-2 text-center">Festivas</th>
                        <th className="py-3 px-2 text-center">Total Extras</th>
                        <th className="py-3 px-2 text-center">Faltantes</th>
                        <th className="py-3 px-4 text-right">Valor Nómina</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C28]">
                      {reporteConsolidadoPorStaff.map((r, idx) => (
                        <tr key={`rep-${r.staffUid}-${idx}`} className="hover:bg-zinc-900/30 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{r.nombre}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">CC: {r.identificacion}</span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-zinc-300">
                            {r.diasLaborados}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-black text-white bg-zinc-900/40">
                            {r.totalHoras}h
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-zinc-300">
                            {r.totalOrdinarias}h
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-amber-400 font-bold">
                            {r.totalHED > 0 ? `${r.totalHED}h` : '-'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-purple-400 font-bold">
                            {r.totalHEN > 0 ? `${r.totalHEN}h` : '-'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-rose-400 font-bold">
                            {r.totalDominicales > 0 ? `${r.totalDominicales}h` : '-'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-orange-400 font-bold">
                            {r.totalFestivas > 0 ? `${r.totalFestivas}h` : '-'}
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-black text-emerald-400 bg-emerald-950/20">
                            {r.totalExtras}h
                          </td>
                          <td className="py-3 px-2 text-center font-mono">
                            {r.totalFaltantes > 0 ? (
                              <span className="text-yellow-400 font-bold bg-yellow-950/40 px-1.5 py-0.5 rounded">
                                {r.totalFaltantes}h
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            {r.totalValorEstimado > 0 ? `$${r.totalValorEstimado.toLocaleString()} COP` : 'Pendiente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: FORMULARIO REGISTRAR / EDITAR TURNO                   */}
      {/* ============================================================== */}
      {showTurnoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-red-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-orbitron">
                    {editingTurno ? 'Editar Turno de Staff' : 'Registrar Nuevo Turno'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Jornada ordinaria legal: 7 horas diarias. Horas extras calculadas automáticamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTurnoModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTurno} className="p-5 space-y-4">
              {/* Colaborador */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Miembro del Staff <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formStaffUid}
                  onChange={(e) => setFormStaffUid(e.target.value)}
                  disabled={Boolean(editingTurno)}
                  className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona un colaborador...</option>
                  {staffList.map(s => (
                    <option key={s.uid} value={s.uid}>
                      {s.nombres} {s.apellidos} (CC: {s.numeroIdentificacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Fecha del Turno <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formFecha}
                  onChange={(e) => setFormFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono"
                />
              </div>

              {/* Horas Entrada y Salida con Diferenciador 12 AM vs 12 PM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hora Entrada</span>
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formHoraEntrada}
                    onChange={(e) => setFormHoraEntrada(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono text-center font-bold"
                  />
                  {/* Diferenciador 12 AM vs 12 PM */}
                  <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                    <span className={`font-mono text-[11px] font-bold ${
                      formHoraEntrada === '12:00' 
                        ? 'text-amber-400' 
                        : formHoraEntrada === '00:00' 
                        ? 'text-purple-400' 
                        : 'text-zinc-400'
                    }`}>
                      {formHoraEntrada === '12:00' && '☀️ 12:00 PM (Mediodía)'}
                      {formHoraEntrada === '00:00' && '🌙 12:00 AM (Medianoche)'}
                      {formHoraEntrada !== '12:00' && formHoraEntrada !== '00:00' && formatHora12(formHoraEntrada)}
                    </span>
                    {formHoraEntrada === '12:00' && (
                      <button
                        type="button"
                        onClick={() => setFormHoraEntrada('00:00')}
                        className="text-[10px] text-purple-400 hover:text-purple-300 text-left underline font-medium"
                      >
                        ¿Medianoche? Cambiar a 12 AM (00:00)
                      </button>
                    )}
                    {formHoraEntrada === '00:00' && (
                      <button
                        type="button"
                        onClick={() => setFormHoraEntrada('12:00')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 text-left underline font-medium"
                      >
                        ¿Mediodía? Cambiar a 12 PM (12:00)
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Hora Salida</span>
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formHoraSalida}
                    onChange={(e) => setFormHoraSalida(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none font-mono text-center font-bold"
                  />
                  {/* Diferenciador 12 AM vs 12 PM */}
                  <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                    <span className={`font-mono text-[11px] font-bold ${
                      formHoraSalida === '12:00' 
                        ? 'text-amber-400' 
                        : formHoraSalida === '00:00' 
                        ? 'text-purple-400' 
                        : 'text-zinc-400'
                    }`}>
                      {formHoraSalida === '12:00' && '☀️ 12:00 PM (Mediodía)'}
                      {formHoraSalida === '00:00' && '🌙 12:00 AM (Medianoche)'}
                      {formHoraSalida !== '12:00' && formHoraSalida !== '00:00' && formatHora12(formHoraSalida)}
                    </span>
                    {formHoraSalida === '12:00' && (
                      <button
                        type="button"
                        onClick={() => setFormHoraSalida('00:00')}
                        className="text-[10px] text-purple-400 hover:text-purple-300 text-left underline font-medium"
                      >
                        ¿Medianoche? Cambiar a 12 AM (00:00)
                      </button>
                    )}
                    {formHoraSalida === '00:00' && (
                      <button
                        type="button"
                        onClick={() => setFormHoraSalida('12:00')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 text-left underline font-medium"
                      >
                        ¿Mediodía? Cambiar a 12 PM (12:00)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CAMPO OBLIGATORIO: Fecha Fin de Jornada si horaSalida < horaEntrada */}
              {cruzaAlOtroDia && (
                <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>Fecha Fin de Jornada * (Obligatorio)</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30">
                      🌙 Termina al otro día
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Como la hora de salida ({formatHora12(formHoraSalida)}) es menor a la de entrada ({formatHora12(formHoraEntrada)}), la jornada culmina al día siguiente.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={formFechaFin}
                      min={formFecha}
                      onChange={(e) => setFormFechaFin(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black/60 border border-purple-500/50 focus:border-purple-400 rounded-xl text-xs text-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setFormFechaFin(getDiaSiguiente(formFecha))}
                      className="px-2.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/30 text-purple-200 text-[11px] font-bold whitespace-nowrap"
                    >
                      +1 Día
                    </button>
                  </div>
                  {formFechaFin && formFechaFin < formFecha && (
                    <span className="text-[11px] text-red-400 font-medium block">
                      ⚠️ La fecha fin no puede ser anterior a la fecha de inicio ({formFecha}).
                    </span>
                  )}
                </div>
              )}

              {/* Aviso si la estancia supera 14 horas */}
              {liveCalculation.horasBrutasEstancia >= 14 && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs space-y-1 text-amber-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Verificación de Horario ({liveCalculation.horasBrutasEstancia}h de estancia):</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Registrando de <strong className="text-white">{formatHora12(formHoraEntrada)}</strong> a <strong className="text-white">{formatHora12(formHoraSalida)}</strong>.
                    <br />
                    • <strong>12:00 PM</strong> = Mediodía de día.
                    <br />
                    • <strong>12:00 AM (00:00)</strong> = Medianoche de noche/madrugada.
                  </p>
                </div>
              )}

              {/* Descanso */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Tiempo de Descanso / Almuerzo (Minutos)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 30, 60, 90].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormMinutosDescanso(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        formMinutosDescanso === m
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-black/40 border-[#1C1C28] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m === 0 ? 'Sin desc.' : `${m} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Centro de Costo (Opcional) */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Centro de Costo (Opcional)
                </label>
                <input
                  type="text"
                  list="ccos-datalist"
                  placeholder="Ej. COPA STUNT F2R, EVENTO MEDELLÍN..."
                  value={formCentroCosto}
                  onChange={(e) => setFormCentroCosto(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none"
                />
                <datalist id="ccos-datalist">
                  {centrosCostoList.map((cc, idx) => (
                    <option key={`dl-cco-${cc}-${idx}`} value={cc} />
                  ))}
                </datalist>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Observaciones / Novedad (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Apoyo en montaje de pista, acreditaciones..."
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-red-600 rounded-xl text-xs text-white outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1C1C28]">
                <button
                  type="button"
                  onClick={() => setShowTurnoModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#C8102E] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTurno ? 'Actualizar Turno' : 'Guardar Turno'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DETALLES DEL TURNO POST-GUARDADO / CONSULTA           */}
      {/* ============================================================== */}
      {detalleTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-orbitron">
                    Detalles del Turno
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {detalleTurno.staffNombre} (CC: {detalleTurno.staffIdentificacion})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetalleTurno(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Header info */}
              <div className="bg-black/40 border border-zinc-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fecha(s) del Turno:</span>
                  <div className="text-right">
                    <span className="text-white font-mono font-bold block">{formatFechaCompleta(detalleTurno.fecha)}</span>
                    {detalleTurno.fechaFin && detalleTurno.fechaFin !== detalleTurno.fecha && (
                      <span className="text-[11px] text-purple-400 font-mono font-bold block">
                        ➔ Termina el {formatFechaCompleta(detalleTurno.fechaFin)} (🌙 +1 día)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800/60 pt-1.5">
                  <span className="text-zinc-400">Horario Registrado:</span>
                  <span className="text-white font-mono font-bold text-right">
                    {formatHora12(detalleTurno.horaEntrada)} a {formatHora12(detalleTurno.horaSalida)}
                    {detalleTurno.minutosDescanso > 0 && (
                      <span className="text-zinc-500 font-normal ml-1">({detalleTurno.minutosDescanso}m descanso)</span>
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

              {/* 8 BOXES CALCULATION */}
              <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Cálculo Oficial de Horas
                  </span>
                  <span className="text-xs font-mono font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                    {detalleTurno.horasTotalesEfectivas}h Totales
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-[#1C1C28]">
                    <span className="text-[10px] text-zinc-400 block truncate">Ord. Diurna (Base 7h)</span>
                    <span className="text-sm font-bold text-white font-mono">{detalleTurno.horasOrdinariasDiurnas}h</span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-indigo-500/20">
                    <span className="text-[10px] text-indigo-400 block truncate">Recargo Noct. (+35%)</span>
                    <span className="text-sm font-bold text-indigo-300 font-mono">{detalleTurno.horasRecargoNocturno}h</span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block truncate">Extra Diurna (HED)</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">{detalleTurno.horasExtraDiurna}h</span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-purple-500/20">
                    <span className="text-[10px] text-purple-400 block truncate">Extra Noct. (HEN)</span>
                    <span className="text-sm font-bold text-purple-300 font-mono">{detalleTurno.horasExtraNocturna}h</span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 block truncate">Dominicales (+75%/+100%)</span>
                    <span className="text-sm font-bold text-rose-300 font-mono">
                      {((detalleTurno.horasDominicalOrdinaria || 0) + (detalleTurno.horasExtraDominicalDiurna || 0) + (detalleTurno.horasExtraDominicalNocturna || 0))}h
                    </span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-orange-500/20">
                    <span className="text-[10px] text-orange-400 block truncate">Festivas (+75%/+100%)</span>
                    <span className="text-sm font-bold text-orange-300 font-mono">
                      {((detalleTurno.horasFestivoOrdinaria || 0) + (detalleTurno.horasExtraFestivoDiurna || 0) + (detalleTurno.horasExtraFestivoNocturna || 0))}h
                    </span>
                  </div>

                  <div className="bg-[#0E0E14] p-2.5 rounded-lg border border-zinc-700/30">
                    <span className="text-[10px] text-zinc-400 block truncate">Descanso / Almuerzo</span>
                    <span className="text-sm font-bold text-zinc-300 font-mono">{detalleTurno.minutosDescanso} min</span>
                  </div>

                  <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-400 block font-bold truncate">Total Horas Extras</span>
                    <span className="text-sm font-black text-emerald-300 font-mono">{detalleTurno.totalHorasExtras}h</span>
                  </div>
                </div>

                {/* Banner de Horas Faltantes */}
                {typeof detalleTurno.horasFaltantes === 'number' && detalleTurno.horasFaltantes > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Horas Faltantes:</strong> Faltaron <strong>{detalleTurno.horasFaltantes}h</strong> para completar la jornada legal de 7 horas diarias.</span>
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

              {detalleTurno.observaciones && (
                <div className="bg-black/40 border border-zinc-800 rounded-xl p-3 text-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Novedad / Observaciones:
                  </span>
                  <p className="text-zinc-300 italic">{detalleTurno.observaciones}</p>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setDetalleTurno(null)}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
