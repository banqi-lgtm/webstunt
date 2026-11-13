'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  Building2, Plus, Search, Edit3, Trash2, Calendar, CheckCircle2, 
  Clock, AlertTriangle, ArrowLeft, Download, RefreshCw, X, Loader2,
  FileSpreadsheet, Filter, Check, ShieldAlert, Sparkles, Layers,
  CalendarCheck, CalendarClock, HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export interface CentroCostoItem {
  id: string;
  nombre: string;
  estado: string; // 'Programado' | 'En Curso' | 'Realizado' | 'Cancelado'
  fecha: string;  // Periodo de prestación del servicio
  fechaInicio?: string;
  fechaFin?: string;
  mes?: string;
  creadoEl?: string;
  actualizadoEl?: string;
  origen?: string;
}

const ESTADOS_DISPONIBLES = [
  { id: 'Programado', label: 'Programado', color: 'bg-blue-950/70 text-blue-400 border-blue-500/30' },
  { id: 'En Curso', label: 'En Curso', color: 'bg-cyan-950/70 text-cyan-400 border-cyan-500/30' },
  { id: 'Realizado', label: 'Realizado', color: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30' },
  { id: 'Cancelado', label: 'Cancelado', color: 'bg-rose-950/70 text-rose-400 border-rose-500/30' }
];

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

// 50 CCOs oficiales del archivo public/ccos.xlsx
export const CANONICAL_CCOS_SEED: Omit<CentroCostoItem, 'creadoEl' | 'actualizadoEl'>[] = [
  // FEBRERO
  { id: 'VALIDA-MOTOCROSS-YAMAHA', nombre: 'VÁLIDA MOTOCROSS YAMAHA', fecha: '1-Feb', mes: 'FEBRERO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SKILL-FEST', nombre: 'SKILL FEST', fecha: '07 al 13-feb', mes: 'FEBRERO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: '1RA-VALIDA-COPA-STUNT-COLOMBIA', nombre: '1RA VÁLIDA COPA STUNT COLOMBIA', fecha: '22-Feb', mes: 'FEBRERO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // MARZO
  { id: 'ACTIVACION-MOTOREX', nombre: 'ACTIVACIÓN MOTOREX', fecha: '13 al 15-mar', mes: 'MARZO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'GLADIADORES-MONDONEDO', nombre: 'GLADIADORES MONDOÑEDO', fecha: '14-Mar', mes: 'MARZO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RALLY-AVENTURA-CHIA', nombre: 'RALLY AVENTURA CHÍA', fecha: '21 al 22-mar', mes: 'MARZO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SHOW-PILOTOS-STUNT-MEDELLIN', nombre: 'SHOW PILOTOS STUNT MEDELLÍN', fecha: '25-Mar', mes: 'MARZO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // ABRIL
  { id: 'SALES-TRAINING-SUZUKI', nombre: 'SALES TRAINING SUZUKI', fecha: '18 al 19-abr', mes: 'ABRIL', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'LANZAMIENTO-METELE-NITROX-BOGOTA', nombre: 'LANZAMIENTO MÉTELE NITROX BOGOTÁ', fecha: '22-Apr', mes: 'ABRIL', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ADVENTURE-CHALLENGE-PALMIRA', nombre: 'ADVENTURE CHALLENGE PALMIRA', fecha: '26-Apr', mes: 'ABRIL', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'MRX-GOPRO-MANIZALES', nombre: 'MRX GOPRO MANIZALES', fecha: '26-Apr', mes: 'ABRIL', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'BIZ-FEST-MACARENA', nombre: 'BIZ FEST MACARENA', fecha: '29-Apr', mes: 'ABRIL', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // MAYO
  { id: 'GP-COLOMBIA-TOCANCIPA-SUZUKI', nombre: 'GP COLOMBIA TOCANCIPÁ (ACOMPAÑAMIENTO SUZUKI)', fecha: '16 al 17-may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'MRX-GOPRO-MEDELLIN', nombre: 'MRX GOPRO MEDELLÍN', fecha: '17-May', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'FERIA-DE-LAS-2-RUEDAS', nombre: 'FERIA DE LAS 2 RUEDAS', fecha: '21 al 25-may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ACTIVACION-MRX-GOPRO-F2R-COPA-STUNT', nombre: 'ACTIVACIÓN MRX GOPRO F2R COPA STUNT', fecha: '21 al 24-may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'COPA-STUNT-F2R', nombre: 'COPA STUNT F2R', fecha: '23 al 24-may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'FESTIVAL-STUNT-2026', nombre: 'FESTIVAL STUNT 2026', fecha: '23 al 24-may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ACTIVACION-COMERCIAL-F2R', nombre: 'ACTIVACIÓN COMERCIAL F2R', fecha: '21 al 24 - may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ACTIVACION-SOCIOS-F2R', nombre: 'ACTIVACIÓN SOCIOS F2R', fecha: '21 al 24 - may', mes: 'MAYO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // JUNIO
  { id: 'MRX-GOPRO-SANTA-MARTA', nombre: 'MRX GOPRO SANTA MARTA', fecha: '7-June', mes: 'JUNIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'BODEGAZO-MEDELLIN', nombre: 'BODEGAZO MEDELLIN', fecha: '11 al 13 - junio', mes: 'JUNIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ENDURO-WOMEN-MOTORANCH', nombre: 'ENDURO WOMEN MOTORANCH', fecha: '28 - June', mes: 'JUNIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'MOTOCROSS-SAN-JERONIMO', nombre: 'MOTOCROSS SAN JERONIMO', fecha: '28 -June', mes: 'JUNIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // JULIO
  { id: 'GLADIADORES-GIRARDOT', nombre: 'GLADIADORES GIRARDOT', fecha: '4 al 5 -julio', mes: 'JULIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'MRX-GOPRO-CHIA', nombre: 'MRX GOPRO CHIA', fecha: '12 - July', mes: 'JULIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SUZUKI-CHALLENGER-PEREIRA', nombre: 'SUZUKI CHALLENGER PEREIRA', fecha: '26 -July', mes: 'JULIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'VALIDA-NACIONAL-DE-MOTOCROSS-FEDEMOTO', nombre: 'VALIDA NACIONAL DE MOTOCROSS FEDEMOTO', fecha: '26-July', mes: 'JULIO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // AGOSTO
  { id: 'MRX-GOPRO-CALI', nombre: 'MRX GOPRO CALI', fecha: '2 - August', mes: 'AGOSTO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'DORADAL-TRANSPORTE-MULA', nombre: 'DORADAL TRANSPORTE MULA', fecha: '13 y 16 agosto', mes: 'AGOSTO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RODAJE-MOBIL-NEIVA', nombre: 'RODAJE MOBIL', fecha: '18 al 20 -agosto', mes: 'AGOSTO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RODAJE-MOBIL-MATEO-MORENO', nombre: 'RODAJE MOBIL - RODAJE MATEO MORENO', fecha: '23 al 31-agosto', mes: 'AGOSTO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ENCUENTRO-DE-ROYAL-ENFIELD', nombre: 'ENCUENTRO DE ROYAL ENFIELD', fecha: '27 al 30 -agosto', mes: 'AGOSTO', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // SEPTIEMBRE
  { id: 'RODAJE-DE-MOBIL-BUCARAMANGA', nombre: 'RODAJE DE MOBIL', fecha: '1 al 3 -septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RODAJE-AKT-KONTROL', nombre: 'RODAJE AKT KONTROL', fecha: '1 al 3 -septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RODAJE-DE-MOBIL-CAJAMARCA', nombre: 'RODAJE DE MOBIL', fecha: '8 al 10 - septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SEGUNDA-VALIDA-MOTO-GP-COLOMBIA', nombre: 'SEGUNDA VALIDA DEL MOTO GP COLOMBIA', fecha: '11 al 13 - septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RODAJE-DE-MOBIL-PASTO', nombre: 'RODAJE DE MOBIL', fecha: '14 al 18 - septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'ASADO-DE-MOTOREX', nombre: 'ASADO DE MOTOREX', fecha: '22 -September', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'TRACK-DAY-TOCANCIPA', nombre: 'TRACK DAY', fecha: '24 al 26 - septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SUZUKI-CHALLENGE-PUERTO-COLOMBIA', nombre: 'SUZUKI CHALLENGE', fecha: '25 al 28 - septiembre', mes: 'SEPTIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // OCTUBRE
  { id: 'MOTOREX-DUAL-SERIES', nombre: 'MOTOREX DUAL SERIES', fecha: '1 al 5 - octubre', mes: 'OCTUBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'SUZUKI-CHALLENGE-BUCARAMANGA', nombre: 'SUZUKI CHALLENGE', fecha: '9 al 11 - octubre', mes: 'OCTUBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'STUNT-DAY-MEDELLIN', nombre: 'STUNT DAY', fecha: '12 - October', mes: 'OCTUBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'GLADIADORES-SANTA-FE', nombre: 'GLADIADORES', fecha: '16 al 19 octubre', mes: 'OCTUBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'EXPO-2-RUEDAS-OCTUBRE', nombre: 'EXPO 2 RUEDAS', fecha: '28 al 31 octubre', mes: 'OCTUBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  
  // NOVIEMBRE
  { id: 'EXPO-2-RUEDAS-NOVIEMBRE', nombre: 'EXPO 2 RUEDAS', fecha: '1 November', mes: 'NOVIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'PRIMER-ENCUENTRO-NACIONAL-GIXXER-SUZUKI', nombre: 'PRIMER ENCUENTRO NACIONAL DE GIXXER SUZUKI', fecha: '7 - 8 - noviembre', mes: 'NOVIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'RALLY-KTM-MOTOREX', nombre: 'RALLY KTM MOTOREX', fecha: '11 al 16 - noviembre', mes: 'NOVIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' },
  { id: 'FINAL-GP-COLOMBIANO-IRC', nombre: 'FINAL DEL GP COLOMBIANO GRAN PREMIO IRC', fecha: '18 al 23 - noviembre', mes: 'NOVIEMBRE', estado: 'Programado', origen: 'EXCEL_CCOS' }
];

// Mapa de corrección y asignación automática de fechas para CCOs existentes
const LEGACY_CCO_HEAL_MAP: Record<string, { fecha: string; mes: string; estado?: string }> = {
  '1ER ENCUENTRO NACIONAL SUZUKI': {
    fecha: '7 - 8 - noviembre',
    mes: 'NOVIEMBRE',
    estado: 'Programado'
  },
  'EXPO 2 RUEDAS BOGOTA': {
    fecha: '28 al 31 octubre',
    mes: 'OCTUBRE',
    estado: 'Programado'
  },
  'F2R-NITROX-MAYO': {
    fecha: '21 al 25-may',
    mes: 'MAYO',
    estado: 'Programado'
  },
  'BODEGAJE': {
    fecha: '11 al 13 - junio',
    mes: 'JUNIO',
    estado: 'Programado'
  }
};

// Registros de prueba u obsoletos a eliminar automáticamente
const OBSOLETE_TEST_CCO_IDS = [
  'AP - ARCHIVO PLANO',
  'AP---ARCHIVO-PLANO'
];

export default function CentrosDeCostoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [centros, setCentros] = useState<CentroCostoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [mesFilter, setMesFilter] = useState('todos');
  const [sinPeriodoFilter, setSinPeriodoFilter] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCentro, setSelectedCentro] = useState<CentroCostoItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form states (Create)
  const [formNombre, setFormNombre] = useState('');
  const [formEstado, setFormEstado] = useState('Programado');
  const [formFecha, setFormFecha] = useState('');
  const [formFechaInicio, setFormFechaInicio] = useState('');
  const [formFechaFin, setFormFechaFin] = useState('');
  const [formMes, setFormMes] = useState('');

  // Form states (Edit)
  const [editNombre, setEditNombre] = useState('');
  const [editEstado, setEditEstado] = useState('Programado');
  const [editFecha, setEditFecha] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editMes, setEditMes] = useState('');

  // Check Permissions
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '');
          if (isSuperAdmin) {
            setHasAccess(true);
            await fetchCentrosCosto(true);
            return;
          }
          if (userDoc.exists()) {
            const data = userDoc.data();
            const interfaces = data.interfaces || [];
            if (
              interfaces.includes('codigos') ||
              interfaces.includes('admin') ||
              interfaces.includes('cuentas') ||
              interfaces.includes('cuentas-de-cobro') ||
              interfaces.includes('centros-de-costo')
            ) {
              setHasAccess(true);
              await fetchCentrosCosto(true);
            } else {
              setHasAccess(false);
              router.push('/dashboard');
            }
          } else {
            setHasAccess(false);
            router.push('/dashboard');
          }
        } catch (e) {
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch and Auto-heal from Firestore
  const fetchCentrosCosto = useCallback(async (autoSeedIfEmpty = false) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'centrosCosto'));
      const list: CentroCostoItem[] = [];
      const needsHealBatch: { docId: string; payload: Partial<CentroCostoItem> }[] = [];
      const toDeleteDocs: string[] = [];

      snap.forEach(d => {
        const docId = d.id;
        const data = d.data();
        const rawName = (data.nombre || docId || '').trim().toUpperCase();

        // 1. Detectar y eliminar registros de prueba obsoletos como "AP - ARCHIVO PLANO"
        if (OBSOLETE_TEST_CCO_IDS.includes(docId) || OBSOLETE_TEST_CCO_IDS.includes(rawName)) {
          toDeleteDocs.push(docId);
          return;
        }

        // Excluir ruidos internos como ARRENDAMIENTO
        if (!rawName || rawName.includes('ARRENDAMIENTO')) {
          return;
        }

        let fecha = data.fecha || (data.fechaInicio ? `${data.fechaInicio}${data.fechaFin ? ` al ${data.fechaFin}` : ''}` : '');
        let mes = data.mes || '';
        let estado = data.estado || 'Programado';

        // 2. Auto-heal: Verificar si es uno de los CCOs existentes que necesitan fecha/mes de ccos.xlsx
        const healInfo = LEGACY_CCO_HEAL_MAP[rawName] || LEGACY_CCO_HEAL_MAP[docId];
        if (healInfo) {
          if (!fecha || fecha === 'Por definir' || !mes) {
            fecha = healInfo.fecha;
            mes = healInfo.mes;
            estado = healInfo.estado || estado;
            needsHealBatch.push({
              docId,
              payload: {
                fecha,
                mes,
                estado,
                actualizadoEl: new Date().toISOString()
              }
            });
          }
        }

        list.push({
          id: docId,
          nombre: rawName,
          estado: estado,
          fecha: fecha || 'Por definir',
          fechaInicio: data.fechaInicio || '',
          fechaFin: data.fechaFin || '',
          mes: mes || '',
          creadoEl: data.creadoEl || '',
          actualizadoEl: data.actualizadoEl || '',
          origen: data.origen || 'SISTEMA'
        });
      });

      // Ejecutar borrado de registros de prueba en segundo plano
      if (toDeleteDocs.length > 0) {
        Promise.all(toDeleteDocs.map(id => deleteDoc(doc(db, 'centrosCosto', id)))).catch(console.error);
      }

      // Ejecutar auto-heal de fechas en segundo plano
      if (needsHealBatch.length > 0) {
        Promise.all(
          needsHealBatch.map(item => updateDoc(doc(db, 'centrosCosto', item.docId), item.payload))
        ).catch(console.error);
      }

      // 3. Auto-seed: Si hay menos de 20 CCOs en la base de datos, poblar automáticamente con los 50 de ccos.xlsx
      if (autoSeedIfEmpty && list.length < 20) {
        console.log('Centros de costo insuficientes en Firestore. Sembrando automáticamente los 50 eventos...');
        const existingNames = new Set(list.map(c => c.nombre));
        const seedBatch: CentroCostoItem[] = [];

        for (const item of CANONICAL_CCOS_SEED) {
          if (!existingNames.has(item.nombre)) {
            const newItem: CentroCostoItem = {
              ...item,
              creadoEl: new Date().toISOString(),
              actualizadoEl: new Date().toISOString()
            };
            seedBatch.push(newItem);
            list.push(newItem);
            // Guardar en Firestore
            setDoc(doc(db, 'centrosCosto', item.id), newItem, { merge: true }).catch(console.error);
          }
        }
      }

      // Ordenar alfabéticamente por nombre
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCentros(list);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudieron cargar los centros de costo.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Import / Synchronize from public/ccos.xlsx
  const handleImportFromExcel = async () => {
    setIsImporting(true);
    try {
      let importedCount = 0;
      let rawData: any[][] = [];

      try {
        const res = await fetch('/ccos.xlsx');
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        }
      } catch (fetchErr) {
        console.warn('No se pudo leer archivo remoto ccos.xlsx, recurriendo a semilla canónica integrada.', fetchErr);
      }

      if (rawData.length > 5) {
        let currentMonth = 'FEBRERO';
        for (let i = 5; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          // Detección de fila de cabecera de Mes
          const cellA = row[0] ? String(row[0]).trim() : '';
          if (cellA) {
            const upA = cellA.toUpperCase();
            for (const m of MESES) {
              if (upA.includes(m)) {
                currentMonth = m;
                break;
              }
            }
          }

          // Col 2: Evento (Nombre del CCO)
          const evento = row[2] ? String(row[2]).trim() : '';
          if (!evento || evento.toLowerCase() === 'evento') continue;

          // Col 1: Fecha realización
          const fecha = row[1] ? String(row[1]).trim() : '';

          // Col 0: Estado
          let estado = 'Programado';
          if (cellA && !cellA.includes('.jp') && !cellA.includes('.pn') && !MESES.includes(cellA.toUpperCase())) {
            estado = cellA;
          }

          const ccoNombre = evento.toUpperCase();
          const docId = `${ccoNombre}-${currentMonth}`.replace(/[/\\#? ]/g, '-');

          const payload: CentroCostoItem = {
            id: docId,
            nombre: ccoNombre,
            estado: estado,
            fecha: fecha || 'Por definir',
            mes: currentMonth,
            actualizadoEl: new Date().toISOString(),
            origen: 'EXCEL_CCOS'
          };

          await setDoc(doc(db, 'centrosCosto', docId), payload, { merge: true });
          importedCount++;
        }
      } else {
        // Semilla directa de respaldo con los 50 eventos oficiales
        for (const item of CANONICAL_CCOS_SEED) {
          const payload = {
            ...item,
            actualizadoEl: new Date().toISOString()
          };
          await setDoc(doc(db, 'centrosCosto', item.id), payload, { merge: true });
          importedCount++;
        }
      }

      // Eliminar registros obsoletos durante la sincronización
      for (const obsId of OBSOLETE_TEST_CCO_IDS) {
        await deleteDoc(doc(db, 'centrosCosto', obsId)).catch(() => {});
      }

      toast({
        title: '¡Sincronización exitosa!',
        description: `Se sincronizaron y actualizaron ${importedCount} centros de costo oficiales con su periodo de prestación del servicio.`
      });
      await fetchCentrosCosto(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error al sincronizar',
        description: err.message || 'Ocurrió un error al procesar los centros de costo.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Create Single CCO
  const handleCreateCCO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      toast({ title: 'Nombre obligatorio', description: 'Por favor ingresa el nombre del Centro de Costo.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const cleanNombre = formNombre.trim().toUpperCase();
      const docId = cleanNombre.replace(/[/\\#? ]/g, '-');
      
      let finalFecha = formFecha.trim();
      if (!finalFecha && formFechaInicio) {
        finalFecha = formFechaFin ? `${formFechaInicio} al ${formFechaFin}` : formFechaInicio;
      }

      const newCCO: CentroCostoItem = {
        id: docId,
        nombre: cleanNombre,
        estado: formEstado || 'Programado',
        fecha: finalFecha || 'Por definir',
        fechaInicio: formFechaInicio || '',
        fechaFin: formFechaFin || '',
        mes: formMes.trim().toUpperCase() || '',
        creadoEl: new Date().toISOString(),
        actualizadoEl: new Date().toISOString(),
        origen: 'MANUAL'
      };

      await setDoc(doc(db, 'centrosCosto', docId), newCCO);
      toast({ title: 'Centro de Costo creado', description: `Se registró ${cleanNombre} con éxito.` });

      setShowCreateModal(false);
      setFormNombre('');
      setFormEstado('Programado');
      setFormFecha('');
      setFormFechaInicio('');
      setFormFechaFin('');
      setFormMes('');
      await fetchCentrosCosto(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo crear el centro de costo.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const openEdit = (c: CentroCostoItem) => {
    setSelectedCentro(c);
    setEditNombre(c.nombre);
    setEditEstado(c.estado || 'Programado');
    setEditFecha(c.fecha && c.fecha !== 'Por definir' ? c.fecha : '');
    setEditFechaInicio(c.fechaInicio || '');
    setEditFechaFin(c.fechaFin || '');
    setEditMes(c.mes || '');
    setShowEditModal(true);
  };

  // Save Edit
  const handleUpdateCCO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentro || !editNombre.trim()) return;

    setIsSaving(true);
    try {
      const cleanNombre = editNombre.trim().toUpperCase();
      let finalFecha = editFecha.trim();
      if (!finalFecha && editFechaInicio) {
        finalFecha = editFechaFin ? `${editFechaInicio} al ${editFechaFin}` : editFechaInicio;
      }

      const updateData = {
        nombre: cleanNombre,
        estado: editEstado,
        fecha: finalFecha || 'Por definir',
        fechaInicio: editFechaInicio || '',
        fechaFin: editFechaFin || '',
        mes: editMes.trim().toUpperCase() || '',
        actualizadoEl: new Date().toISOString()
      };

      await updateDoc(doc(db, 'centrosCosto', selectedCentro.id), updateData);
      toast({ title: 'Actualizado', description: `Se actualizaron los datos de ${cleanNombre}.` });

      setShowEditModal(false);
      setSelectedCentro(null);
      await fetchCentrosCosto(false);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo actualizar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete CCO
  const handleDeleteCCO = async (c: CentroCostoItem) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el Centro de Costo "${c.nombre}"?`)) return;

    try {
      await deleteDoc(doc(db, 'centrosCosto', c.id));
      toast({ title: 'Eliminado', description: `Se eliminó ${c.nombre}.` });
      setCentros(prev => prev.filter(item => item.id !== c.id));
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredCentros.map((c, i) => ({
      '#': i + 1,
      'ESTADO': c.estado,
      'PERIODO DE PRESTACIÓN DEL SERVICIO': c.fecha,
      'CENTRO DE COSTO / EVENTO': c.nombre,
      'MES': c.mes || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Centros_de_Costo');
    XLSX.writeFile(wb, `centros_de_costo_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Exportado', description: `Se descargó el archivo Excel con ${exportData.length} registros.` });
  };

  // Filtered List
  const filteredCentros = useMemo(() => {
    return centros.filter(c => {
      if (sinPeriodoFilter && c.fecha && c.fecha !== 'Por definir') {
        return false;
      }
      if (estadoFilter !== 'todos' && c.estado.toLowerCase() !== estadoFilter.toLowerCase()) {
        return false;
      }
      if (mesFilter !== 'todos' && (c.mes || '').toUpperCase() !== mesFilter.toUpperCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.fecha.toLowerCase().includes(q) ||
        (c.mes && c.mes.toLowerCase().includes(q)) ||
        c.estado.toLowerCase().includes(q)
      );
    });
  }, [centros, searchQuery, estadoFilter, mesFilter, sinPeriodoFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = centros.length;
    const programados = centros.filter(c => c.estado === 'Programado').length;
    const enCurso = centros.filter(c => c.estado === 'En Curso').length;
    const realizados = centros.filter(c => c.estado === 'Realizado').length;
    const sinPeriodo = centros.filter(c => !c.fecha || c.fecha === 'Por definir').length;
    return { total, programados, enCurso, realizados, sinPeriodo };
  }, [centros]);

  // Unique Meses present in data
  const availableMeses = useMemo(() => {
    const set = new Set<string>();
    centros.forEach(c => {
      if (c.mes) set.add(c.mes.toUpperCase());
    });
    // Ordenar de acuerdo al orden natural de los meses
    return Array.from(set).sort((a, b) => {
      const idxA = MESES.indexOf(a);
      const idxB = MESES.indexOf(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [centros]);

  if (hasAccess === null || loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white font-inter text-sm uppercase tracking-widest animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#C8102E]" />
        Cargando Centros de Costo...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4 md:p-8 font-inter">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C28] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/cuentas-de-cobro"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                <span>Volver a Cuentas de Cobro</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                  CENTROS DE COSTO (CCO)
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    OFICIAL
                  </span>
                </h1>
                <p className="text-xs text-zinc-400">
                  Gestión integral de eventos y centros de costo basados en las columnas de Estado, Periodo de prestación del servicio y Evento
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleImportFromExcel}
              disabled={isImporting}
              className="px-3.5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-md"
              title="Sincronizar centros de costo desde public/ccos.xlsx"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-purple-400" />
              )}
              <span>{isImporting ? 'Sincronizando...' : 'Sincronizar ccos.xlsx'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-2 transition"
              title="Descargar listado en Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-red-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Centro de Costo</span>
            </button>
          </div>
        </div>

        {/* KPIS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-xl p-4">
            <span className="text-zinc-500 text-[11px] font-bold uppercase block">Total CCOs</span>
            <span className="text-2xl font-black text-white font-mono">{kpis.total}</span>
          </div>
          <div className="bg-[#0E0E14] border border-blue-500/20 rounded-xl p-4">
            <span className="text-blue-400/80 text-[11px] font-bold uppercase block">Programados</span>
            <span className="text-2xl font-black text-blue-400 font-mono">{kpis.programados}</span>
          </div>
          <div className="bg-[#0E0E14] border border-cyan-500/20 rounded-xl p-4">
            <span className="text-cyan-400/80 text-[11px] font-bold uppercase block">En Curso</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">{kpis.enCurso}</span>
          </div>
          <div className="bg-[#0E0E14] border border-emerald-500/20 rounded-xl p-4">
            <span className="text-emerald-400/80 text-[11px] font-bold uppercase block">Realizados</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{kpis.realizados}</span>
          </div>
          <div 
            onClick={() => setSinPeriodoFilter(prev => !prev)}
            className={`border rounded-xl p-4 cursor-pointer transition ${
              sinPeriodoFilter 
                ? 'bg-amber-950/40 border-amber-500 text-amber-300' 
                : kpis.sinPeriodo > 0 
                  ? 'bg-[#0E0E14] border-amber-500/30 hover:border-amber-500/50' 
                  : 'bg-[#0E0E14] border-[#1C1C28]'
            }`}
            title="Haz clic para filtrar los que no tienen periodo asignado"
          >
            <div className="flex items-center justify-between">
              <span className="text-amber-400/80 text-[11px] font-bold uppercase block">Sin Periodo</span>
              {sinPeriodoFilter && <span className="text-[9px] bg-amber-500 text-black font-black px-1.5 py-0.2 rounded">ACTIVO</span>}
            </div>
            <span className="text-2xl font-black text-amber-400 font-mono">{kpis.sinPeriodo}</span>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por evento, periodo o mes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Estado filter */}
            <div className="flex items-center gap-1 bg-black/40 border border-[#1C1C28] rounded-xl p-1 text-xs">
              <span className="text-[10px] text-zinc-500 px-2 font-bold uppercase">Estado:</span>
              <button
                type="button"
                onClick={() => setEstadoFilter('todos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  estadoFilter === 'todos' ? 'bg-[#C8102E] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {ESTADOS_DISPONIBLES.map(est => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setEstadoFilter(est.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    estadoFilter === est.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {est.label}
                </button>
              ))}
            </div>

            {/* Mes filter */}
            {availableMeses.length > 0 && (
              <select
                value={mesFilter}
                onChange={(e) => setMesFilter(e.target.value)}
                className="bg-black/50 border border-[#1C1C28] rounded-xl px-3 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
              >
                <option value="todos">Todos los meses</option>
                {availableMeses.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* Reset Filter Button */}
            {(estadoFilter !== 'todos' || mesFilter !== 'todos' || sinPeriodoFilter || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setEstadoFilter('todos');
                  setMesFilter('todos');
                  setSinPeriodoFilter(false);
                  setSearchQuery('');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition"
                title="Limpiar filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-[#1C1C28] text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Periodo de prestación del servicio</th>
                  <th className="py-3.5 px-4">Centro de Costo / Evento</th>
                  <th className="py-3.5 px-4 text-center">Mes</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C28]/60 text-zinc-300">
                {filteredCentros.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500">
                      <Building2 className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold">No se encontraron Centros de Costo con los filtros actuales.</p>
                      <p className="text-[11px] mt-1 text-zinc-600">
                        Haz clic en &quot;Sincronizar ccos.xlsx&quot; para restaurar todos los eventos oficiales o crea uno nuevo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCentros.map((c, index) => {
                    const estadoObj = ESTADOS_DISPONIBLES.find(e => e.id.toLowerCase() === c.estado.toLowerCase()) || {
                      label: c.estado,
                      color: 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    };

                    const hasPeriodo = c.fecha && c.fecha !== 'Por definir';

                    return (
                      <tr key={c.id} className="hover:bg-zinc-900/50 transition">
                        <td className="py-3 px-4 font-mono text-zinc-500 text-center font-bold">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${estadoObj.color}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {estadoObj.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasPeriodo ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="font-medium text-zinc-200">
                                {c.fecha}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition group"
                              title="Haga clic para asignar periodo de prestación del servicio"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                              <span>Por definir (Asignar)</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white text-sm tracking-wide block uppercase">
                            {c.nombre}
                          </span>
                          {c.origen === 'EXCEL_CCOS' && (
                            <span className="text-[9px] text-purple-400 font-mono">Oficial ccos.xlsx</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {c.mes ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {c.mes}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              title="Modificar Centro de Costo y Periodo"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCCO(c)}
                              title="Eliminar Centro de Costo"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-red-400 border border-red-500/30 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: CREAR CENTRO DE COSTO */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-[#C8102E]/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-xl">
                    <Plus className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">NUEVO CENTRO DE COSTO</h3>
                    <p className="text-xs text-zinc-400">Registra un nuevo CCO o evento para el sistema</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCCO} className="p-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Nombre del Centro de Costo / Evento <span className="text-[#C8102E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. COPA STUNT COLOMBIA MEDELLIN"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white uppercase outline-none"
                    autoFocus
                  />
                </div>

                {/* Estado y Mes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Estado
                    </label>
                    <select
                      value={formEstado}
                      onChange={(e) => setFormEstado(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      {ESTADOS_DISPONIBLES.map(est => (
                        <option key={est.id} value={est.id}>{est.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Mes
                    </label>
                    <select
                      value={formMes}
                      onChange={(e) => setFormMes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">[ Seleccionar Mes ]</option>
                      {MESES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Periodo de prestación del servicio */}
                <div className="bg-black/30 border border-[#1C1C28] rounded-xl p-3.5 space-y-2.5">
                  <label className="text-xs font-bold text-[#C8102E] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C8102E]" />
                    Periodo de prestación del servicio
                  </label>

                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1">Descripción del periodo / rango:</span>
                    <input
                      type="text"
                      placeholder="Ej. 07 al 13-feb o 15 de Marzo"
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-[#C8102E] rounded-lg text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Fecha inicio (opcional):</span>
                      <input
                        type="date"
                        value={formFechaInicio}
                        onChange={(e) => setFormFechaInicio(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-[#1C1C28] focus:border-[#C8102E] rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Fecha fin (opcional):</span>
                      <input
                        type="date"
                        value={formFechaFin}
                        onChange={(e) => setFormFechaFin(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-[#1C1C28] focus:border-[#C8102E] rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-[#1C1C28] flex items-center justify-end gap-2 -mx-5 -mb-5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
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
                    <span>Guardar Centro de Costo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDITAR CENTRO DE COSTO Y PERIODO */}
      <AnimatePresence>
        {showEditModal && selectedCentro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-amber-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-xl">
                    <Edit3 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">MODIFICAR CENTRO DE COSTO</h3>
                    <p className="text-xs text-zinc-400">Actualiza el nombre, estado o periodo del CCO</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateCCO} className="p-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Nombre del Centro de Costo / Evento <span className="text-[#C8102E]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-amber-500 rounded-xl text-xs text-white uppercase outline-none"
                  />
                </div>

                {/* Estado y Mes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Estado
                    </label>
                    <select
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-amber-500 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      {ESTADOS_DISPONIBLES.map(est => (
                        <option key={est.id} value={est.id}>{est.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Mes
                    </label>
                    <select
                      value={editMes}
                      onChange={(e) => setEditMes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-amber-500 rounded-xl text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">[ Sin Mes ]</option>
                      {MESES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Periodo de prestación del servicio */}
                <div className="bg-black/30 border border-[#1C1C28] rounded-xl p-3.5 space-y-2.5">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Periodo de prestación del servicio
                  </label>

                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1">Descripción del periodo / rango:</span>
                    <input
                      type="text"
                      placeholder="Ej. 07 al 13-feb o 15 de Marzo"
                      value={editFecha}
                      onChange={(e) => setEditFecha(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-amber-500 rounded-lg text-xs text-white outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Fecha inicio (opcional):</span>
                      <input
                        type="date"
                        value={editFechaInicio}
                        onChange={(e) => setEditFechaInicio(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-[#1C1C28] focus:border-amber-500 rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Fecha fin (opcional):</span>
                      <input
                        type="date"
                        value={editFechaFin}
                        onChange={(e) => setEditFechaFin(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-[#1C1C28] focus:border-amber-500 rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-[#1C1C28] flex items-center justify-end gap-2 -mx-5 -mb-5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Guardar Cambios</span>
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
