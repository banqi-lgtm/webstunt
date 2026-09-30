'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, updateDoc, orderBy } from 'firebase/firestore';
import { 
  FileSpreadsheet, Receipt, FileText, Plus, Trash2, CheckCircle, XCircle, Search, 
  Eye, Users, Calendar, DollarSign, Percent, ShieldCheck, Layers, Loader2, 
  Building2, UserCheck, RefreshCw, UserX, Download, UploadCloud, FileUp, 
  AlertTriangle, Printer, ArrowRight, Filter, ChevronRight, Edit3, ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CuentaDeCobro } from '../profile/CuentaDeCobro';
import * as XLSX from 'xlsx';

interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  creadoEl: string;
  asignadoAUid: string;
  asignadoANombre: string;
  cobradoPor?: string;
  cobradoPorUid?: string;
  cobradoEl?: string;
  centroCosto?: string;
  retencionMotivo?: string | null;
  retencionPorcentaje?: number | null;
  retencionValor?: number | null;
  estadoAprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  cuentaCobroNum?: string;
  firma?: string;
  firmaGenerada?: string;
  fecha?: string;
  documentoIdentificacion?: string;
  ciudad?: string;
  tipoDocumento?: string;
  esNoRegistrado?: boolean;
  origen?: string;
  consecutivoArchivo?: string;
  emailBeneficiario?: string;
  [key: string]: any;
}

interface Usuario {
  uid: string;
  nombre: string;
  rol: string;
}

interface StaffUser {
  uid: string;
  nombre: string;
  nombres: string;
  apellidos: string;
  documento: string;
  email: string;
  telefono: string;
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  ciudad?: string;
  rol?: string;
}

interface ArchivoPlanoRow {
  index: number;
  consecutivo: string;
  nombre: string;
  numeroId: string;
  ciudad: string;
  fecha: string;
  valor: number;
  descripcion: string;
  retencion: number;
  codigoProyectado: string;
  errors: string[];
  isValid: boolean;
}

// Safe Date Parser
function parseSafeDate(raw: any): { ymd: string; iso: string } {
  const today = new Date();
  const todayYMD = today.toISOString().split('T')[0];

  if (!raw) {
    return { ymd: todayYMD, iso: today.toISOString() };
  }

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return { ymd: raw.toISOString().split('T')[0], iso: raw.toISOString() };
  }

  if (typeof raw === 'number') {
    const excelEpoch = new Date((raw - (25567 + 2)) * 86400 * 1000);
    if (!isNaN(excelEpoch.getTime())) {
      return { ymd: excelEpoch.toISOString().split('T')[0], iso: excelEpoch.toISOString() };
    }
  }

  const str = String(raw).trim();
  if (!str) {
    return { ymd: todayYMD, iso: today.toISOString() };
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    const dateObj = new Date(`${y}-${m}-${d}T12:00:00Z`);
    if (!isNaN(dateObj.getTime())) {
      return { ymd: `${y}-${m}-${d}`, iso: dateObj.toISOString() };
    }
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    const dateObj = new Date(`${y}-${m}-${d}T12:00:00Z`);
    if (!isNaN(dateObj.getTime())) {
      return { ymd: `${y}-${m}-${d}`, iso: dateObj.toISOString() };
    }
  }

  const directDate = new Date(str);
  if (!isNaN(directDate.getTime())) {
    return { ymd: directDate.toISOString().split('T')[0], iso: directDate.toISOString() };
  }

  return { ymd: todayYMD, iso: today.toISOString() };
}

// Safe Valor Parser
function parseSafeValor(raw: any): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (!raw) return 0;
  const str = String(raw).trim();
  const clean = str.replace(/[^0-9]/g, '');
  const n = parseInt(clean, 10);
  return isNaN(n) ? 0 : n;
}

export default function CuentasDeCobroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cuentasFilter, setCuentasFilter] = useState<'todas' | 'ap' | 'staff' | 'no_registrados'>('todas');
  const [cuentasSearchQuery, setCuentasSearchQuery] = useState('');

  // Individual Cuenta de Cobro Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'no_registrado' | 'staff'>('no_registrado');
  const [staffUsersList, setStaffUsersList] = useState<StaffUser[]>([]);
  const [selectedStaffUid, setSelectedStaffUid] = useState<string>('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Unregistered form
  const [unregNombre, setUnregNombre] = useState('');
  const [unregTipoDoc, setUnregTipoDoc] = useState('CC');
  const [unregDocumento, setUnregDocumento] = useState('');
  const [unregCiudad, setUnregCiudad] = useState('Bello, Antioquia');
  const [unregFecha, setUnregFecha] = useState(new Date().toISOString().split('T')[0]);
  const [unregValor, setUnregValor] = useState('');
  const [unregDescripcion, setUnregDescripcion] = useState('');
  const [unregCentroCosto, setUnregCentroCosto] = useState('OPERACIONES PKS');
  const [unregRetencionMotivo, setUnregRetencionMotivo] = useState('');
  const [unregRetencionPorcentaje, setUnregRetencionPorcentaje] = useState('');
  const [isSavingCobro, setIsSavingCobro] = useState(false);

  // Archivo Plano (AP) States
  const [showArchivoPlanoModal, setShowArchivoPlanoModal] = useState<boolean>(false);
  const [archivoPlanoRows, setArchivoPlanoRows] = useState<ArchivoPlanoRow[]>([]);
  const [archivoPlanoFileName, setArchivoPlanoFileName] = useState<string>('');
  const [isProcessingArchivoPlano, setIsProcessingArchivoPlano] = useState<boolean>(false);

  // Invoice / Print State
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Details / Edit Modal State
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<Codigo | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editRetencionMotivo, setEditRetencionMotivo] = useState('');
  const [editRetencionPorcentaje, setEditRetencionPorcentaje] = useState('');
  const [editCentroCosto, setEditCentroCosto] = useState('');

  // Get Initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'XX';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '');
          if (isSuperAdmin) {
            setHasAccess(true);
            fetchData();
            return;
          }
          if (userDoc.exists()) {
            const data = userDoc.data();
            const interfaces = data.interfaces || [];
            if (interfaces.includes('codigos') || interfaces.includes('admin') || interfaces.includes('cuentas') || interfaces.includes('cuentas-de-cobro')) {
              setHasAccess(true);
              fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Codigos
      const codigosSnap = await getDocs(collection(db, 'codigos'));
      const codList = codigosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Codigo[];
      
      codList.sort((a, b) => {
        const da = new Date(a.fecha || a.cobradoEl || a.creadoEl).getTime();
        const dbTime = new Date(b.fecha || b.cobradoEl || b.creadoEl).getTime();
        return dbTime - da;
      });
      setCodigos(codList);

      // 2. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const uList = usersSnap.docs.map(doc => ({
        uid: doc.id,
        nombre: `${doc.data().nombres || ''} ${doc.data().apellidos || ''}`.trim() || doc.data().nombre || 'Sin Nombre',
        rol: doc.data().rol || doc.data().role || 'usuario'
      }));
      setUsuarios(uList);

      // 3. Staff Users
      const sList: StaffUser[] = usersSnap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          nombre: `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.nombre || 'Colaborador',
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          documento: data.numeroIdentificacion || data.documentoIdentidad || data.cedula || '',
          email: data.email || '',
          telefono: data.telefono || '',
          banco: data.banco || '',
          tipoCuenta: data.tipoCuenta || '',
          numeroCuenta: data.numeroCuenta || '',
          ciudad: data.ciudad || 'Bello, Antioquia',
          rol: data.rol || data.role || 'staff'
        };
      });
      setStaffUsersList(sList);

    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos de cuentas de cobro.', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  // Cuentas de Cobro List (AP, no registrados, staff, o cualquier cobrado)
  const cuentasDeCobroList = useMemo(() => {
    return codigos.filter(c => 
      c.centroCosto === 'AP - ARCHIVO PLANO' ||
      c.origen === 'AP - ARCHIVO PLANO' ||
      c.esNoRegistrado === true ||
      Boolean(c.consecutivoArchivo) ||
      Boolean(c.cuentaCobroNum) ||
      c.estado === 'cobrado'
    );
  }, [codigos]);

  // Filtered List
  const filteredCuentasDeCobro = useMemo(() => {
    return cuentasDeCobroList.filter(c => {
      const isAP = c.centroCosto === 'AP - ARCHIVO PLANO' || c.origen === 'AP - ARCHIVO PLANO' || Boolean(c.consecutivoArchivo);
      if (cuentasFilter === 'ap' && !isAP) return false;
      if (cuentasFilter === 'staff' && (c.esNoRegistrado || isAP)) return false;
      if (cuentasFilter === 'no_registrados' && !c.esNoRegistrado) return false;

      if (!cuentasSearchQuery.trim()) return true;
      const q = cuentasSearchQuery.toLowerCase();
      const nombre = (c.cobradoPor || c.asignadoANombre || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const desc = (c.descripcion || '').toLowerCase();
      const docId = (c.documentoIdentificacion || '').toLowerCase();
      const ciudad = (c.ciudad || '').toLowerCase();
      const consec = String(c.consecutivoArchivo || '');
      const cc = (c.centroCosto || '').toLowerCase();
      
      return nombre.includes(q) || id.includes(q) || desc.includes(q) || docId.includes(q) || ciudad.includes(q) || consec.includes(q) || cc.includes(q);
    });
  }, [cuentasDeCobroList, cuentasFilter, cuentasSearchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const totalBruto = cuentasDeCobroList.reduce((sum, c) => sum + (Number(c.valor) || 0), 0);
    const totalRetenciones = cuentasDeCobroList.reduce((sum, c) => {
      const val = Number(c.valor) || 0;
      const ret = c.retencionPorcentaje || 0;
      return sum + (val * (ret / 100));
    }, 0);
    const totalNeto = totalBruto - totalRetenciones;
    const totalAP = cuentasDeCobroList.filter(c => c.centroCosto === 'AP - ARCHIVO PLANO' || c.origen === 'AP - ARCHIVO PLANO' || Boolean(c.consecutivoArchivo)).length;
    const totalNoReg = cuentasDeCobroList.filter(c => c.esNoRegistrado).length;

    return { totalBruto, totalRetenciones, totalNeto, totalAP, totalNoReg };
  }, [cuentasDeCobroList]);

  // Excel Templates Download
  const handleDownloadTemplateExcel = () => {
    const today = new Date().toISOString().split('T')[0];
    const templateData = [
      {
        CONSECUTIVO: 1,
        NOMBRE: 'JUAN CAMILO PEREZ',
        NUMERO_ID: '1037654321',
        CIUDAD: 'MEDELLIN',
        FECHA: today,
        VALOR: 500000,
        DESCRIPCION: 'SERVICIOS DE LOGISTICA Y APOYO EN PISTA',
        RETENCION: 0
      },
      {
        CONSECUTIVO: 2,
        NOMBRE: 'MARIA ALEJANDRA GOMEZ',
        NUMERO_ID: '1020304050',
        CIUDAD: 'BELLO',
        FECHA: today,
        VALOR: 750000,
        DESCRIPCION: 'COORDINACION Y SEGURIDAD EVENTO',
        RETENCION: 4
      },
      {
        CONSECUTIVO: 3,
        NOMBRE: 'CARLOS ANDRES ZAPATA',
        NUMERO_ID: '71987654',
        CIUDAD: 'ENVIGADO',
        FECHA: today,
        VALOR: 600000,
        DESCRIPCION: 'MONTAJE TECNICO Y ESTRUCTURAS',
        RETENCION: 0
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 42 },
      { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PLANTILLA_AP');
    XLSX.writeFile(wb, 'plantilla_cuentas_cobro_AP.xlsx');
  };

  const handleDownloadTemplateCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const csvContent = 
      "CONSECUTIVO;NOMBRE;NUMERO_ID;CIUDAD;FECHA;VALOR;DESCRIPCION;RETENCION\n" +
      `1;JUAN CAMILO PEREZ;1037654321;MEDELLIN;${today};500000;SERVICIOS DE LOGISTICA Y APOYO EN PISTA;0\n` +
      `2;MARIA ALEJANDRA GOMEZ;1020304050;BELLO;${today};750000;COORDINACION Y SEGURIDAD EVENTO;4\n` +
      `3;CARLOS ANDRES ZAPATA;71987654;ENVIGADO;${today};600000;MONTAJE TECNICO Y ESTRUCTURAS;0\n`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_cuentas_cobro_AP.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload Archivo Plano
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoPlanoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (!rawData || rawData.length === 0) {
          toast({ title: 'Archivo vacío', description: 'El archivo no contiene filas con datos.', variant: 'destructive' });
          setArchivoPlanoRows([]);
          return;
        }

        const findVal = (row: any, candidates: string[]) => {
          const keys = Object.keys(row);
          for (const candidate of candidates) {
            const key = keys.find(k => k.trim().toLowerCase().replace(/[\s_\.\-]+/g, '') === candidate.toLowerCase().replace(/[\s_\.\-]+/g, ''));
            if (key && row[key] !== undefined && row[key] !== null) {
              return String(row[key]).trim();
            }
          }
          return '';
        };

        const runningMaxMap: Record<string, number> = {};

        const parsedRows: ArchivoPlanoRow[] = rawData.map((row, index) => {
          const nombre = findVal(row, ['nombre', 'nombredelapersona', 'colaborador', 'trabajador', 'persona']);
          const numeroId = findVal(row, ['numerodeid', 'numeroid', 'cedula', 'identificacion', 'documento', 'nit', 'id', 'numid']);
          const ciudad = findVal(row, ['ciudad', 'municipio', 'city']) || 'BELLO, ANTIOQUIA';
          let fechaRaw = findVal(row, ['fecha', 'fechadeemision', 'fechaemision', 'date', 'emision']);
          const valorRaw = findVal(row, ['valor', 'valorbruto', 'total', 'precio', 'monto', 'subtotal']);
          const descripcion = findVal(row, ['descripcion', 'concepto', 'servicio', 'detalle', 'motivo']);
          const retencionRaw = findVal(row, ['retencion', 'retenciones', 'retefuente', 'porcentaje', 'ret']);
          const consecutivoRaw = findVal(row, ['consecutivo', 'numero', 'nro', 'orden', 'item', 'consec']);

          // Parse fecha safely
          const safeDate = parseSafeDate(fechaRaw);
          const fecha = safeDate.ymd;

          // Parse valor safely
          const valor = parseSafeValor(valorRaw);

          // Parse retencion
          const cleanRetStr = retencionRaw ? String(retencionRaw).replace(/[^0-9.]/g, '') : '';
          const retencion = cleanRetStr ? parseFloat(cleanRetStr) : 0;

          // Validation
          const errors: string[] = [];
          if (!nombre) errors.push('Falta Nombre');
          if (!numeroId) errors.push('Falta Cédula/ID');
          if (!ciudad) errors.push('Falta Ciudad');
          if (!fechaRaw && !fecha) errors.push('Falta Fecha');
          if (!valor || valor <= 0) errors.push('Falta Valor válido');
          if (!descripcion) errors.push('Falta Descripción');

          // Projected code
          const initials = getInitials(nombre || 'XX');
          const prefix = `PKS-${initials}`;

          if (runningMaxMap[prefix] === undefined) {
            let maxNum = 0;
            codigos.forEach(c => {
              if (c.id.startsWith(prefix)) {
                const numStr = c.id.replace(prefix, '');
                const n = parseInt(numStr, 10);
                if (!isNaN(n) && n > maxNum) {
                  maxNum = n;
                }
              }
            });
            runningMaxMap[prefix] = maxNum;
          }

          runningMaxMap[prefix]++;
          const codigoProyectado = `${prefix}${runningMaxMap[prefix].toString().padStart(3, '0')}`;

          return {
            index: index + 1,
            consecutivo: consecutivoRaw || String(index + 1),
            nombre,
            numeroId,
            ciudad,
            fecha,
            valor,
            descripcion,
            retencion,
            codigoProyectado,
            errors,
            isValid: errors.length === 0
          };
        });

        setArchivoPlanoRows(parsedRows);
        toast({
          title: 'Archivo cargado',
          description: `Se leyeron ${parsedRows.length} filas del archivo.`
        });
      } catch (err) {
        console.error("Error al leer archivo plano:", err);
        toast({ title: 'Error', description: 'No se pudo leer el archivo. Verifica el formato (.xlsx o .csv).', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Save Batch AP
  const handleSaveArchivoPlanoCobros = async () => {
    const validRows = archivoPlanoRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({ title: 'Atención', description: 'No hay filas válidas para procesar.', variant: 'destructive' });
      return;
    }

    setIsProcessingArchivoPlano(true);
    try {
      const existingSnap = await getDocs(collection(db, 'codigos'));
      const existingIds = new Set(existingSnap.docs.map(d => d.id));

      const runningMax: Record<string, number> = {};
      existingIds.forEach(id => {
        const match = id.match(/^(PKS-[A-Z]+)(\d+)$/i);
        if (match) {
          const pref = match[1].toUpperCase();
          const n = parseInt(match[2], 10);
          if (!runningMax[pref] || n > runningMax[pref]) {
            runningMax[pref] = n;
          }
        }
      });

      let createdCount = 0;

      for (const row of validRows) {
        const initials = getInitials(row.nombre);
        const prefix = `PKS-${initials}`;
        if (!runningMax[prefix]) runningMax[prefix] = 0;
        
        let nextN = runningMax[prefix] + 1;
        let generatedId = `${prefix}${nextN.toString().padStart(3, '0')}`;
        while (existingIds.has(generatedId)) {
          nextN++;
          generatedId = `${prefix}${nextN.toString().padStart(3, '0')}`;
        }
        runningMax[prefix] = nextN;
        existingIds.add(generatedId);

        const safeDate = parseSafeDate(row.fecha);
        const timestamp = safeDate.iso;
        const cleanId = String(row.numeroId || '').replace(/\s+/g, '');
        const syntheticUid = `unreg_CC_${cleanId}`;

        const newCodigoData = {
          valor: row.valor,
          descripcion: row.descripcion,
          centroCosto: 'AP - ARCHIVO PLANO',
          estado: 'cobrado',
          estadoAprobacion: 'aprobado',
          creadoEl: timestamp,
          fecha: safeDate.ymd,
          cobradoEl: timestamp,
          cobradoPor: row.nombre,
          cobradoPorUid: syntheticUid,
          cuentaCobroNum: generatedId,
          asignadoAUid: syntheticUid,
          asignadoANombre: row.nombre,
          retencionMotivo: row.retencion > 0 ? `Retención (${row.retencion}%)` : null,
          retencionPorcentaje: row.retencion > 0 ? row.retencion : null,
          firmaGenerada: row.nombre,
          documentoIdentificacion: `CC ${row.numeroId}`,
          ciudad: row.ciudad,
          tipoDocumento: 'CC',
          esNoRegistrado: true,
          origen: 'AP - ARCHIVO PLANO',
          consecutivoArchivo: row.consecutivo
        };

        await setDoc(doc(db, 'codigos', generatedId), newCodigoData);
        createdCount++;
      }

      try {
        await setDoc(doc(db, 'centrosCosto', 'AP - ARCHIVO PLANO'), { nombre: 'AP - ARCHIVO PLANO' }, { merge: true });
      } catch (e) {}

      toast({
        title: '¡Cuentas de cobro creadas con éxito!',
        description: `Se crearon ${createdCount} cuentas de cobro como AP - ARCHIVO PLANO.`
      });

      setShowArchivoPlanoModal(false);
      setArchivoPlanoRows([]);
      setArchivoPlanoFileName('');
      await fetchData();
    } catch (err) {
      console.error("Error al procesar archivo plano:", err);
      toast({ title: 'Error', description: 'Ocurrió un error al procesar el archivo plano.', variant: 'destructive' });
    } finally {
      setIsProcessingArchivoPlano(false);
    }
  };

  // Single Save (Unregistered or Staff)
  const handleSaveSingleCobro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (createMode === 'no_registrado') {
      if (!unregNombre.trim() || !unregDocumento.trim() || !unregValor || !unregDescripcion.trim() || !unregCiudad.trim()) {
        toast({ title: 'Faltan datos requeridos', description: 'Nombre, documento, ciudad, fecha, valor y concepto son obligatorios.', variant: 'destructive' });
        return;
      }

      setIsSavingCobro(true);
      try {
        const initials = getInitials(unregNombre);
        const prefix = `PKS-${initials}`;

        const q = query(collection(db, 'codigos'));
        const allDocs = await getDocs(q);
        let maxNum = 0;
        allDocs.forEach(d => {
          if (d.id.startsWith(prefix)) {
            const numStr = d.id.replace(prefix, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });

        const nextNum = maxNum + 1;
        const generatedId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
        const cleanDoc = unregDocumento.replace(/\s+/g, '');
        const syntheticUid = `unreg_${unregTipoDoc}_${cleanDoc}`;
        const safeDate = parseSafeDate(unregFecha);
        const timestamp = safeDate.iso;

        const newCodigoData = {
          valor: Number(unregValor),
          descripcion: unregDescripcion,
          centroCosto: unregCentroCosto || 'OPERACIONES PKS',
          estado: 'cobrado',
          estadoAprobacion: 'aprobado',
          creadoEl: timestamp,
          fecha: safeDate.ymd,
          cobradoEl: timestamp,
          cobradoPor: unregNombre.trim(),
          cobradoPorUid: syntheticUid,
          cuentaCobroNum: generatedId,
          asignadoAUid: syntheticUid,
          asignadoANombre: unregNombre.trim(),
          retencionMotivo: unregRetencionPorcentaje ? (unregRetencionMotivo || `Retención (${unregRetencionPorcentaje}%)`) : null,
          retencionPorcentaje: unregRetencionPorcentaje ? Number(unregRetencionPorcentaje) : null,
          firmaGenerada: unregNombre.trim(),
          documentoIdentificacion: `${unregTipoDoc} ${unregDocumento.trim()}`,
          ciudad: unregCiudad.trim(),
          tipoDocumento: unregTipoDoc,
          esNoRegistrado: true
        };

        await setDoc(doc(db, 'codigos', generatedId), newCodigoData);
        toast({
          title: 'Cuenta de Cobro creada',
          description: `Se generó la cuenta de cobro ${generatedId} para ${unregNombre}.`
        });

        setShowCreateModal(false);
        setUnregNombre('');
        setUnregDocumento('');
        setUnregValor('');
        setUnregDescripcion('');
        setUnregRetencionMotivo('');
        setUnregRetencionPorcentaje('');
        await fetchData();
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'No se pudo crear la cuenta de cobro.', variant: 'destructive' });
      } finally {
        setIsSavingCobro(false);
      }
    } else {
      // Staff mode
      if (!selectedStaffUid || !unregValor || !unregDescripcion.trim()) {
        toast({ title: 'Faltan datos', description: 'Selecciona un colaborador e ingresa valor y concepto.', variant: 'destructive' });
        return;
      }

      setIsSavingCobro(true);
      try {
        const staff = staffUsersList.find(s => s.uid === selectedStaffUid);
        if (!staff) throw new Error('Colaborador no encontrado');

        const initials = getInitials(staff.nombre);
        const prefix = `PKS-${initials}`;

        const q = query(collection(db, 'codigos'));
        const allDocs = await getDocs(q);
        let maxNum = 0;
        allDocs.forEach(d => {
          if (d.id.startsWith(prefix)) {
            const numStr = d.id.replace(prefix, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });

        const nextNum = maxNum + 1;
        const generatedId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
        const safeDate = parseSafeDate(unregFecha);
        const timestamp = safeDate.iso;

        const newCodigoData = {
          valor: Number(unregValor),
          descripcion: unregDescripcion,
          centroCosto: unregCentroCosto || 'STAFF',
          estado: 'cobrado',
          estadoAprobacion: 'aprobado',
          creadoEl: timestamp,
          fecha: safeDate.ymd,
          cobradoEl: timestamp,
          cobradoPor: staff.nombre,
          cobradoPorUid: staff.uid,
          cuentaCobroNum: generatedId,
          asignadoAUid: staff.uid,
          asignadoANombre: staff.nombre,
          retencionMotivo: unregRetencionPorcentaje ? (unregRetencionMotivo || `Retención (${unregRetencionPorcentaje}%)`) : null,
          retencionPorcentaje: unregRetencionPorcentaje ? Number(unregRetencionPorcentaje) : null,
          firmaGenerada: staff.nombre,
          documentoIdentificacion: staff.documento ? `CC ${staff.documento}` : 'No registrado',
          ciudad: staff.ciudad || 'Bello, Antioquia',
          tipoDocumento: 'CC',
          esNoRegistrado: false
        };

        await setDoc(doc(db, 'codigos', generatedId), newCodigoData);
        toast({
          title: 'Cuenta de Cobro de Staff creada',
          description: `Se generó la cuenta de cobro ${generatedId} para ${staff.nombre}.`
        });

        setShowCreateModal(false);
        setSelectedStaffUid('');
        setUnregValor('');
        setUnregDescripcion('');
        await fetchData();
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Fallo al crear cuenta de cobro de staff.', variant: 'destructive' });
      } finally {
        setIsSavingCobro(false);
      }
    }
  };

  // View / Print Invoice
  const handleViewCuentaCobro = (codigo: Codigo) => {
    let cobradorName = codigo.cobradoPor || codigo.asignadoANombre || 'Colaborador';
    let cobradorDoc = codigo.documentoIdentificacion || 'No registrado';
    let cobradorCiudad = codigo.ciudad || 'BELLO, ANTIOQUIA';
    let banco = 'No registrado';
    let tipoCuenta = 'No registrado';
    let numeroCuenta = 'No registrado';

    if (!codigo.esNoRegistrado) {
      const staff = staffUsersList.find(s => s.uid === (codigo.cobradoPorUid || codigo.asignadoAUid));
      if (staff) {
        cobradorName = staff.nombre;
        if (staff.documento) cobradorDoc = `CC ${staff.documento}`;
        if (staff.ciudad) cobradorCiudad = staff.ciudad;
        if (staff.banco) banco = staff.banco;
        if (staff.tipoCuenta) tipoCuenta = staff.tipoCuenta;
        if (staff.numeroCuenta) numeroCuenta = staff.numeroCuenta;
      }
    }

    setInvoiceData({
      numero: codigo.id,
      fecha: codigo.fecha || codigo.cobradoEl || codigo.creadoEl || new Date().toISOString(),
      cobradorNombre: cobradorName,
      cobradorDocumento: cobradorDoc,
      valorTotal: codigo.valor,
      conceptos: [{
        item: 1,
        descripcion: codigo.descripcion,
        valor: codigo.valor,
        retencionMotivo: codigo.retencionMotivo || null,
        retencionPorcentaje: codigo.retencionPorcentaje || null
      }],
      banco,
      tipoCuenta,
      numeroCuenta,
      ciudad: cobradorCiudad,
      firmaPrevia: codigo.firmaGenerada || codigo.firma || cobradorName,
      isHistorical: true
    });
    setShowInvoice(true);
  };

  // Open Details Modal
  const openDetalles = (codigo: Codigo) => {
    setSelectedCodigo(codigo);
    setEditValor(codigo.valor.toString());
    setEditDescripcion(codigo.descripcion);
    setEditRetencionMotivo(codigo.retencionMotivo || '');
    setEditRetencionPorcentaje(codigo.retencionPorcentaje?.toString() || '');
    setEditCentroCosto(codigo.centroCosto || '');
    let initFecha = codigo.fecha ? codigo.fecha.substring(0, 10) : (codigo.cobradoEl ? codigo.cobradoEl.substring(0, 10) : new Date().toISOString().split('T')[0]);
    setEditFecha(initFecha);
    setShowDetallesModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedCodigo) return;
    try {
      const safeDate = parseSafeDate(editFecha);
      const timestamp = safeDate.iso;
      const updatePayload: any = {
        valor: Number(editValor),
        descripcion: editDescripcion,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        centroCosto: editCentroCosto,
        fecha: safeDate.ymd,
        cobradoEl: timestamp,
        estado: 'cobrado',
        estadoAprobacion: 'aprobado'
      };

      await updateDoc(doc(db, 'codigos', selectedCodigo.id), updatePayload);
      setCodigos(codigos.map(c => c.id === selectedCodigo.id ? { ...c, ...updatePayload } : c));
      toast({ title: 'Actualizado', description: 'La cuenta de cobro fue actualizada con éxito.' });
      setShowDetallesModal(false);
    } catch (e) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const handleDeleteCodigo = async (id: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la cuenta de cobro ${id}?`)) return;
    try {
      await deleteDoc(doc(db, 'codigos', id));
      toast({ title: 'Eliminado', description: `Cuenta de cobro ${id} eliminada.` });
      setShowDetallesModal(false);
      fetchData();
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  // Export to Excel
  const handleExportCuentasExcel = () => {
    const exportData = filteredCuentasDeCobro.map((c, i) => {
      const valorBruto = Number(c.valor) || 0;
      const retPorc = c.retencionPorcentaje || 0;
      const retValor = valorBruto * (retPorc / 100);
      const neto = valorBruto - retValor;
      return {
        'ITEM': i + 1,
        'CÓDIGO / ID': c.id,
        'CONSECUTIVO ARCHIVO': c.consecutivoArchivo || 'N/A',
        'TITULAR / COLABORADOR': c.cobradoPor || c.asignadoANombre,
        'TIPO': c.esNoRegistrado ? 'NO REGISTRADO' : 'STAFF',
        'DOCUMENTO': c.documentoIdentificacion || 'N/A',
        'CIUDAD': c.ciudad || 'BELLO, ANTIOQUIA',
        'FECHA': c.fecha || (c.cobradoEl ? c.cobradoEl.substring(0, 10) : ''),
        'CONCEPTO': c.descripcion,
        'CENTRO DE COSTO': c.centroCosto || 'N/A',
        'VALOR BRUTO': valorBruto,
        'RETENCIÓN %': retPorc > 0 ? `${retPorc}%` : '0%',
        'VALOR RETENCIÓN': retValor,
        'TOTAL NETO A PAGAR': neto,
        'ESTADO': (c.estadoAprobacion || 'aprobado').toUpperCase()
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuentas_de_Cobro');
    XLSX.writeFile(wb, `cuentas_de_cobro_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Exportación lista', description: `Se exportaron ${exportData.length} registros a Excel.` });
  };

  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white font-inter text-xl uppercase tracking-widest animate-pulse">
        VERIFICANDO_ACCESO...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-10 relative bg-[#0A0A0F] font-inter text-[#F5F5F7] overflow-hidden print:p-0 print:bg-transparent print:overflow-visible">
      {/* Dynamic Lighting Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#C8102E]/5 blur-[200px] mix-blend-screen pointer-events-none rounded-full print:hidden" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#1C1C28]/5 blur-[150px] mix-blend-screen pointer-events-none rounded-full print:hidden" />

      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-8 print:hidden">

        {/* Top Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#C8102E] to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-80 transition duration-500"></div>
              <div className="relative p-3.5 sm:p-4 bg-[#12121A] rounded-xl border border-[#1C1C28]">
                <Receipt className="w-7 h-7 sm:w-8 sm:h-8 text-[#C8102E]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 tracking-tight">
                CUENTAS DE COBRO
              </h1>
              <p className="text-zinc-400 font-inter tracking-wider text-xs sm:text-sm mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse bg-[#C8102E]"></span>
                GESTIÓN INTEGRAL, ARCHIVO PLANO (AP) Y FACTURACIÓN
              </p>
            </div>
          </div>

          {/* Quick Link to Códigos & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/codigos" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-inter text-xs tracking-wider uppercase bg-[#12121A] hover:bg-zinc-800 text-cyan-400 border border-cyan-500/30 transition-all hover:border-cyan-400"
            >
              <FileText className="w-4 h-4" />
              <span>Ir a Generador de Códigos</span>
            </Link>

            <button 
              type="button"
              onClick={() => setShowArchivoPlanoModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-inter text-xs tracking-wider uppercase bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-950/40 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-purple-300" />
              <span>Subir Archivo Plano (AP)</span>
            </button>

            <button 
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-inter text-xs tracking-wider uppercase bg-gradient-to-r from-[#C8102E] to-red-700 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-950/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Cuenta de Cobro</span>
            </button>

            <button 
              type="button"
              onClick={handleExportCuentasExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold font-inter text-xs tracking-wider uppercase bg-[#12121A] hover:bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-[#12121A]/80 border border-[#1C1C28] rounded-2xl p-4 backdrop-blur-md">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">Total Bruto</span>
            <div className="text-lg sm:text-xl font-black text-white">
              ${kpis.totalBruto.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">{filteredCuentasDeCobro.length} registros</span>
          </div>

          <div className="bg-[#12121A]/80 border border-[#1C1C28] rounded-2xl p-4 backdrop-blur-md">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400/90 block mb-1">Retenciones</span>
            <div className="text-lg sm:text-xl font-black text-amber-400">
              ${kpis.totalRetenciones.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Deducciones fiscales</span>
          </div>

          <div className="bg-[#12121A]/80 border border-[#1C1C28] rounded-2xl p-4 backdrop-blur-md col-span-2 sm:col-span-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Total Neto a Pagar</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              ${kpis.totalNeto.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-500/70 mt-1 block">Monto real desembolso</span>
          </div>

          <div className="bg-[#12121A]/80 border border-[#1C1C28] rounded-2xl p-4 backdrop-blur-md">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-400 block mb-1">Archivo Plano (AP)</span>
            <div className="text-lg sm:text-xl font-black text-purple-300">
              {kpis.totalAP}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Importados por lotes</span>
          </div>

          <div className="bg-[#12121A]/80 border border-[#1C1C28] rounded-2xl p-4 backdrop-blur-md">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1">No Registrados</span>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              {kpis.totalNoReg}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Externos / Sin usuario</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-[#12121A]/90 border border-[#1C1C28] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          {/* Sub-tabs / Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'todas', label: 'Todas las Cuentas', count: cuentasDeCobroList.length },
              { id: 'ap', label: 'Archivo Plano (AP)', count: kpis.totalAP },
              { id: 'staff', label: 'Staff Registrado', count: cuentasDeCobroList.length - kpis.totalNoReg },
              { id: 'no_registrados', label: 'No Registrados', count: kpis.totalNoReg },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCuentasFilter(f.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  cuentasFilter === f.id
                    ? 'bg-[#C8102E] text-white shadow-md shadow-red-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{f.label}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 text-zinc-300">
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text"
              value={cuentasSearchQuery}
              onChange={(e) => setCuentasSearchQuery(e.target.value)}
              placeholder="Buscar titular, cédula, ID, ciudad..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition"
            />
          </div>
        </div>

        {/* Main Cuentas de Cobro Table */}
        <div className="bg-[#12121A]/90 border border-[#1C1C28] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/60 border-b border-[#1C1C28] text-zinc-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Consecutivo / ID</th>
                  <th className="py-3.5 px-4">Titular / Colaborador</th>
                  <th className="py-3.5 px-4">Documento & Ciudad</th>
                  <th className="py-3.5 px-4">Fecha Emisión</th>
                  <th className="py-3.5 px-4">Concepto</th>
                  <th className="py-3.5 px-4 text-right">Valor Bruto</th>
                  <th className="py-3.5 px-4 text-center">Retención</th>
                  <th className="py-3.5 px-4 text-right">Neto a Pagar</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C28]/60 text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C8102E]" />
                      Cargando cuentas de cobro...
                    </td>
                  </tr>
                ) : filteredCuentasDeCobro.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500">
                      No se encontraron cuentas de cobro registradas.
                    </td>
                  </tr>
                ) : (
                  filteredCuentasDeCobro.map((c) => {
                    const valorBruto = Number(c.valor) || 0;
                    const retPorc = c.retencionPorcentaje || 0;
                    const retValor = valorBruto * (retPorc / 100);
                    const neto = valorBruto - retValor;
                    const isAP = c.centroCosto === 'AP - ARCHIVO PLANO' || c.origen === 'AP - ARCHIVO PLANO' || Boolean(c.consecutivoArchivo);

                    return (
                      <tr key={c.id} className="hover:bg-zinc-900/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {c.id}
                          {c.consecutivoArchivo && (
                            <span className="block text-[10px] text-purple-400 font-sans font-normal">
                              AP #{c.consecutivoArchivo}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white uppercase flex items-center gap-1.5 flex-wrap">
                            <span>{c.cobradoPor || c.asignadoANombre}</span>
                            {isAP ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300">
                                AP
                              </span>
                            ) : c.esNoRegistrado ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                                NO REGISTRADO
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-950/80 border border-blue-500/40 text-blue-300">
                                STAFF
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                          <div>{c.documentoIdentificacion || 'N/A'}</div>
                          <div className="text-[10px] text-zinc-500 uppercase">{c.ciudad || 'Bello, Antioquia'}</div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                          {c.fecha || (c.cobradoEl ? c.cobradoEl.substring(0, 10) : (c.creadoEl ? c.creadoEl.substring(0, 10) : 'N/A'))}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={c.descripcion}>
                          <span className="text-zinc-300">{c.descripcion}</span>
                          {c.centroCosto && (
                            <span className="block text-[10px] text-zinc-500">{c.centroCosto}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                          ${valorBruto.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {retPorc > 0 ? (
                            <div className="text-amber-400 font-bold">
                              {retPorc}%
                              <span className="block text-[10px] text-zinc-500 font-mono">
                                -${retValor.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">0%</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 whitespace-nowrap">
                          ${neto.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                            {c.estadoAprobacion || 'Aprobado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewCuentaCobro(c)}
                              title="Ver / Imprimir Cuenta de Cobro"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-cyan-500/30 transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openDetalles(c)}
                              title="Editar / Detalles"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCodigo(c.id)}
                              title="Eliminar Cuenta de Cobro"
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

      {/* MODAL 1: SUBIR ARCHIVO PLANO (AP) */}
      <AnimatePresence>
        {showArchivoPlanoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-purple-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-950/60 border border-purple-500/40 rounded-xl">
                    <UploadCloud className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">SUBIR ARCHIVO PLANO (AP)</h2>
                    <p className="text-xs text-zinc-400">Importación masiva de cuentas de cobro para personal no registrado o externo</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowArchivoPlanoModal(false);
                    setArchivoPlanoRows([]);
                    setArchivoPlanoFileName('');
                  }}
                  className="text-zinc-400 hover:text-white text-lg p-2"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Guidelines & Download Templates */}
                <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Estructura requerida de columnas:
                    </h4>
                    <p className="text-xs text-zinc-300 font-mono">
                      CONSECUTIVO | NOMBRE | NUMERO_ID | CIUDAD | FECHA | VALOR | DESCRIPCION | RETENCION
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      * Si no tiene retenciones, puedes dejar la columna en 0. Todas quedarán clasificadas bajo AP (Archivo Plano).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadTemplateExcel}
                      className="px-3 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar .XLSX</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTemplateCSV}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar .CSV</span>
                    </button>
                  </div>
                </div>

                {/* Upload Input Area */}
                <div className="border-2 border-dashed border-[#1C1C28] hover:border-purple-500/60 transition rounded-2xl p-6 text-center bg-black/30">
                  <input 
                    type="file" 
                    id="ap-file-upload-page" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="ap-file-upload-page" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="p-3.5 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-purple-400">
                      <FileUp className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {archivoPlanoFileName ? archivoPlanoFileName : 'Selecciona o arrastra el archivo de Excel o CSV'}
                      </span>
                      <span className="text-xs text-zinc-500">Soporta formatos .XLSX, .XLS y .CSV</span>
                    </div>
                  </label>
                </div>

                {/* Preview Table */}
                {archivoPlanoRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        Vista previa de datos ({archivoPlanoRows.filter(r => r.isValid).length} válidos de {archivoPlanoRows.length})
                      </h4>
                      {archivoPlanoRows.some(r => !r.isValid) && (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Hay filas con errores que no se guardarán
                        </span>
                      )}
                    </div>

                    <div className="border border-[#1C1C28] rounded-xl overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-black/60 sticky top-0 border-b border-[#1C1C28] text-zinc-400 font-bold uppercase">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Cód. Asignado</th>
                            <th className="py-2.5 px-3">Nombre</th>
                            <th className="py-2.5 px-3">Cédula / ID</th>
                            <th className="py-2.5 px-3">Ciudad</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3 text-right">Valor</th>
                            <th className="py-2.5 px-3 text-center">Retención</th>
                            <th className="py-2.5 px-3">Concepto</th>
                            <th className="py-2.5 px-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C28]/60 text-zinc-300">
                          {archivoPlanoRows.map((row) => (
                            <tr key={row.index} className={row.isValid ? 'hover:bg-zinc-900/40' : 'bg-red-950/20'}>
                              <td className="py-2 px-3 font-mono text-zinc-500">{row.consecutivo}</td>
                              <td className="py-2 px-3 font-mono font-bold text-purple-400">{row.codigoProyectado}</td>
                              <td className="py-2 px-3 font-bold text-white uppercase">{row.nombre}</td>
                              <td className="py-2 px-3">{row.numeroId}</td>
                              <td className="py-2 px-3 text-zinc-400 uppercase">{row.ciudad}</td>
                              <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">{row.fecha}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                                ${row.valor.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap font-bold text-amber-400">
                                {row.retencion > 0 ? `${row.retencion}%` : '0%'}
                              </td>
                              <td className="py-2 px-3 max-w-xs truncate">{row.descripcion}</td>
                              <td className="py-2 px-3 text-center">
                                {row.isValid ? (
                                  <span className="text-[10px] text-emerald-400 font-bold">Válido</span>
                                ) : (
                                  <span className="text-[10px] text-red-400 font-bold" title={row.errors.join(', ')}>
                                    Error
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-[#1C1C28] flex items-center justify-between bg-black/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowArchivoPlanoModal(false);
                    setArchivoPlanoRows([]);
                    setArchivoPlanoFileName('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isProcessingArchivoPlano || archivoPlanoRows.filter(r => r.isValid).length === 0}
                  onClick={handleSaveArchivoPlanoCobros}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-950/50"
                >
                  {isProcessingArchivoPlano ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando Lote...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Guardar {archivoPlanoRows.filter(r => r.isValid).length} Cuentas como AP</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREAR CUENTA DE COBRO (INDIVIDUAL) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-[#C8102E]/40 rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl">
                    <Plus className="w-6 h-6 text-[#C8102E]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">CREAR CUENTA DE COBRO</h2>
                    <p className="text-xs text-zinc-400">Genera una cuenta de cobro individual</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white text-lg p-2"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selector */}
              <div className="p-4 bg-black/30 border-b border-[#1C1C28] flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateMode('no_registrado')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 ${
                    createMode === 'no_registrado'
                      ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Persona No Registrada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateMode('staff')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 ${
                    createMode === 'staff'
                      ? 'bg-blue-950/80 border border-blue-500/40 text-blue-300'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Personal Staff Registrado</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveSingleCobro} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
                {createMode === 'no_registrado' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nombre Completo *</label>
                      <input 
                        type="text" 
                        required
                        value={unregNombre}
                        onChange={(e) => setUnregNombre(e.target.value.toUpperCase())}
                        placeholder="EJ: CARLOS ALBERTO MARIN"
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white uppercase outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Tipo Doc *</label>
                        <select
                          value={unregTipoDoc}
                          onChange={(e) => setUnregTipoDoc(e.target.value)}
                          className="w-full px-3 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                        >
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="NIT">NIT</option>
                          <option value="PASAPORTE">PASAPORTE</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Número Documento *</label>
                        <input 
                          type="text" 
                          required
                          value={unregDocumento}
                          onChange={(e) => setUnregDocumento(e.target.value)}
                          placeholder="EJ: 1037654321"
                          className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Ciudad *</label>
                        <input 
                          type="text" 
                          required
                          value={unregCiudad}
                          onChange={(e) => setUnregCiudad(e.target.value.toUpperCase())}
                          placeholder="EJ: MEDELLIN"
                          className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white uppercase outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fecha Emisión *</label>
                        <input 
                          type="date" 
                          required
                          value={unregFecha}
                          onChange={(e) => setUnregFecha(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Seleccionar Colaborador Staff *</label>
                      <select
                        value={selectedStaffUid}
                        onChange={(e) => setSelectedStaffUid(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                      >
                        <option value="">-- Elige un colaborador --</option>
                        {staffUsersList.map(s => (
                          <option key={s.uid} value={s.uid}>
                            {s.nombre} ({s.documento ? `CC: ${s.documento}` : 'Sin CC'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fecha Emisión *</label>
                      <input 
                        type="date" 
                        required
                        value={unregFecha}
                        onChange={(e) => setUnregFecha(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Valor a Cobrar *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={unregValor}
                      onChange={(e) => setUnregValor(e.target.value)}
                      placeholder="EJ: 500000"
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Centro de Costo</label>
                    <input 
                      type="text" 
                      value={unregCentroCosto}
                      onChange={(e) => setUnregCentroCosto(e.target.value.toUpperCase())}
                      placeholder="EJ: OPERACIONES PKS"
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white uppercase outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">Concepto / Descripción *</label>
                  <textarea 
                    required
                    rows={2}
                    value={unregDescripcion}
                    onChange={(e) => setUnregDescripcion(e.target.value)}
                    placeholder="Descripción detallada de las actividades o servicios prestados..."
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#1C1C28] focus:border-[#C8102E] rounded-xl text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-[#1C1C28]">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Retención % (Opcional)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.5"
                      value={unregRetencionPorcentaje}
                      onChange={(e) => setUnregRetencionPorcentaje(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-amber-500 rounded-lg text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Motivo Retención</label>
                    <input 
                      type="text" 
                      value={unregRetencionMotivo}
                      onChange={(e) => setUnregRetencionMotivo(e.target.value)}
                      placeholder="EJ: Retefuente 4%"
                      className="w-full px-3 py-2 bg-black/60 border border-[#1C1C28] focus:border-amber-500 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1C1C28]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingCobro}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C8102E] to-red-700 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/50"
                  >
                    {isSavingCobro ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Crear y Emitir Cuenta</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DETALLES / EDITAR */}
      <AnimatePresence>
        {showDetallesModal && selectedCodigo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#12121A] border border-[#1C1C28] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1C1C28] pb-3">
                <div>
                  <h3 className="text-base font-black text-white">DETALLES: {selectedCodigo.id}</h3>
                  <p className="text-xs text-zinc-400">Titular: {selectedCodigo.cobradoPor || selectedCodigo.asignadoANombre}</p>
                </div>
                <button onClick={() => setShowDetallesModal(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Valor</label>
                    <input 
                      type="number"
                      value={editValor}
                      onChange={(e) => setEditValor(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Fecha</label>
                    <input 
                      type="date"
                      value={editFecha}
                      onChange={(e) => setEditFecha(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Concepto</label>
                  <textarea 
                    rows={2}
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] rounded-lg text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Retención %</label>
                    <input 
                      type="number"
                      value={editRetencionPorcentaje}
                      onChange={(e) => setEditRetencionPorcentaje(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Centro Costo</label>
                    <input 
                      type="text"
                      value={editCentroCosto}
                      onChange={(e) => setEditCentroCosto(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1C1C28]">
                <button
                  type="button"
                  onClick={() => handleDeleteCodigo(selectedCodigo.id)}
                  className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDetallesModal(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: INVOICE PRINT VIEW */}
      <AnimatePresence>
        {showInvoice && invoiceData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center print:static print:bg-transparent print:h-auto print:overflow-visible print:block"
          >
            <div className="relative z-10 w-full max-w-4xl max-h-screen overflow-y-auto custom-scrollbar p-4 print:p-0 print:overflow-visible print:h-auto print:max-h-none">
              <CuentaDeCobro 
                {...invoiceData} 
                onClose={() => setShowInvoice(false)} 
                onConfirm={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
