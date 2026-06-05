'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, listAll } from 'firebase/storage';
import { FileText, CheckCircle, Clock, Banknote, DollarSign, CheckSquare, Square, Upload, Loader2, Sparkles, Terminal, Eye, Pencil, Plus } from 'lucide-react';
import { CuentaDeCobro } from './CuentaDeCobro';
import { motion, AnimatePresence } from 'framer-motion';
interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  cobradoEl?: string;
  cuentaCobroNum?: string;
  firma?: string;
  retencionMotivo?: string | null;
  retencionPorcentaje?: number | null;
  estadoAprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  cobradoPorUid?: string;
  centroCosto?: string;
}

export function StaffProfileView({ userUid, userName, userDocument }: { userUid: string, userName: string, userDocument: string }) {
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);
  const [codigosDisponibles, setCodigosDisponibles] = useState<Codigo[]>([]);
  const [historial, setHistorial] = useState<Codigo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // User Profile details
  const [claimNombre, setClaimNombre] = useState(userName);
  const [claimDocumento, setClaimDocumento] = useState(userDocument);
  const [claimCiudad, setClaimCiudad] = useState('');

  
  // Bank details
  const [claimBanco, setClaimBanco] = useState('');
  const [claimTipoCuenta, setClaimTipoCuenta] = useState('Ahorros');
  const [claimNumeroCuenta, setClaimNumeroCuenta] = useState('');

  // Cuenta de cobro modal state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Document Upload State
  const [hasBankDocs, setHasBankDocs] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [certFileBase64, setCertFileBase64] = useState<string | null>(null);
  const [rutFileBase64, setRutFileBase64] = useState<string | null>(null);
  const [rutUrl, setRutUrl] = useState<string | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);

  // Manual Invoice State
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState(false);
  const [manualValor, setManualValor] = useState('');
  const [manualDescripcion, setManualDescripcion] = useState('');
  const [manualCentroCosto, setManualCentroCosto] = useState('');
  const [manualRetencionMotivo, setManualRetencionMotivo] = useState('');
  const [manualRetencionPorcentaje, setManualRetencionPorcentaje] = useState('');

  const fetchUserData = async () => {
    try {
      const userRef = doc(db, 'users', userUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const d = userSnap.data();
        if (d.banco && d.numeroCuenta) {
          setHasBankDocs(true);
          setClaimBanco(d.banco);
          setClaimTipoCuenta(d.tipoCuenta || 'Ahorros');
          setClaimNumeroCuenta(d.numeroCuenta);
        } else {
          setHasBankDocs(false);
        }
        if (d.documentoIdentidad) {
          setClaimDocumento(d.documentoIdentidad);
        }
        if (d.ciudad) {
          setClaimCiudad(d.ciudad);
        }
        
        try {
          const docsRef = ref(storage, `documents/${userUid}`);
          const res = await listAll(docsRef);
          let latestRut = null;
          let latestCert = null;
          const items = res.items.sort((a, b) => b.name.localeCompare(a.name));
          for (const item of items) {
            if (!latestRut && item.name.includes('rut_')) latestRut = item;
            if (!latestCert && item.name.includes('certificacion_')) latestCert = item;
          }
          if (latestRut) setRutUrl(await getDownloadURL(latestRut));
          if (latestCert) setCertUrl(await getDownloadURL(latestCert));
        } catch(e) {
          console.error("Error fetching documents from storage", e);
        }
      }
    } catch (e) {
      console.error('Error fetching user data', e);
    }
  };

  const fetchCodigos = async () => {
    try {
      const q = query(
        collection(db, 'codigos'), 
        where('asignadoAUid', '==', userUid)
      );
      const snap = await getDocs(q);
      const disponibles: Codigo[] = [];
      const cobrados: Codigo[] = [];
      
      snap.forEach(d => {
        const data = { id: d.id, ...d.data() } as Codigo;
        if (data.estado === 'disponible') disponibles.push(data);
        else cobrados.push(data);
      });
      
      // Sort
      disponibles.sort((a, b) => b.valor - a.valor);
      cobrados.sort((a, b) => {
        if (!a.cobradoEl || !b.cobradoEl) return 0;
        return new Date(b.cobradoEl).getTime() - new Date(a.cobradoEl).getTime();
      });
      
      setCodigosDisponibles(disponibles);
      setHistorial(cobrados);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userUid) {
      fetchUserData();
      fetchCodigos();
    }
  }, [userUid]);

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRutFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processDocumentAI = async () => {
    if (!certFileBase64 && !rutFileBase64) {
      toast({ title: 'Faltan documentos', description: 'Debes subir al menos un documento para procesar.', variant: 'destructive' });
      return;
    }
    setUploadingDocs(true);
    try {
      // 1. Subir a Storage
      let newCertUrl = certUrl;
      let newRutUrl = rutUrl;

      if (certFileBase64) {
        const storageCertRef = ref(storage, `documents/${userUid}/certificacion_${Date.now()}`);
        await uploadString(storageCertRef, certFileBase64, 'data_url');
        newCertUrl = await getDownloadURL(storageCertRef);
        setCertUrl(newCertUrl);
      }
      
      if (rutFileBase64) {
        const storageRutRef = ref(storage, `documents/${userUid}/rut_${Date.now()}`);
        await uploadString(storageRutRef, rutFileBase64, 'data_url');
        newRutUrl = await getDownloadURL(storageRutRef);
        setRutUrl(newRutUrl);
      }

      // 2. Extraer con IA
      const reqBody: any = {};
      if (certFileBase64) {
        reqBody.certFile = {
          dataUrl: certFileBase64,
          fileType: certFileBase64.split(';')[0].split(':')[1]
        };
      }
      if (rutFileBase64) {
        reqBody.rutFile = {
          dataUrl: rutFileBase64,
          fileType: rutFileBase64.split(';')[0].split(':')[1]
        };
      }

      const res = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error en la respuesta de la IA');
      }
      
      const newBanco = data.banco || claimBanco;
      const newTipo = data.tipoCuenta || claimTipoCuenta;
      const newNum = data.numeroCuenta || claimNumeroCuenta;
      const newDoc = data.documentoIdentidad || claimDocumento;
      const newCiudad = data.ciudad || claimCiudad;
      
      if (certFileBase64 && (!data.banco || !data.numeroCuenta)) {
        toast({ title: 'Error de IA', description: 'La inteligencia artificial no pudo detectar el banco ni el número de cuenta. Sube imágenes más claras.', variant: 'destructive' });
        return;
      }

      if (rutFileBase64 && !data.documentoIdentidad) {
        toast({ title: 'Error de IA', description: 'La inteligencia artificial no pudo detectar el NIT en el RUT. Sube imágenes más claras.', variant: 'destructive' });
        return;
      }

      setClaimBanco(newBanco);
      setClaimTipoCuenta(newTipo);
      setClaimNumeroCuenta(newNum);
      if (newDoc) setClaimDocumento(newDoc);
      if (newCiudad) setClaimCiudad(newCiudad);

      // 3. Guardar en Firestore
      await updateDoc(doc(db, 'users', userUid), {
        banco: newBanco,
        tipoCuenta: newTipo,
        numeroCuenta: newNum,
        documentoIdentidad: newDoc,
        ciudad: newCiudad,
        documentosValidadosConIA: true
      });

      setHasBankDocs(true);
      setShowUploadModal(false);
      setCertFileBase64(null);
      setRutFileBase64(null);
      toast({ title: 'Éxito', description: 'Documentos extraídos y guardados.' });
      
      // Auto-generate invoice directly
      generateAndShowInvoice(newBanco, newTipo, newNum, newDoc, newCiudad);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Error al procesar el documento', variant: 'destructive' });
    } finally {
      setUploadingDocs(false);
    }
  };

  const generateAndShowInvoice = (
    bancoOverride?: string, 
    tipoOverride?: string, 
    numOverride?: string, 
    docOverride?: string,
    ciudadOverride?: string
  ) => {
    if (selectedIds.length === 0) return;
    
    const numCuenta = `CC-${(historial.length + 1).toString().padStart(3, '0')}`;
    const now = new Date().toISOString();
    
    const codigosAProcesar = codigosDisponibles.filter(c => selectedIds.includes(c.id));
    let totalValor = 0;
    let conceptosData: { item: number, descripcion: string, valor: number, retencionMotivo?: string | null, retencionPorcentaje?: number | null }[] = [];

    let i = 1;
    for (const codigo of codigosAProcesar) {
      totalValor += Number(codigo.valor);
      conceptosData.push({ 
        item: i++, 
        descripcion: `CÓDIGO: ${codigo.id} - ${codigo.descripcion}`, 
        valor: Number(codigo.valor),
        retencionMotivo: codigo.retencionMotivo,
        retencionPorcentaje: codigo.retencionPorcentaje
      });
    }

    setInvoiceData({
      numero: numCuenta,
      fecha: now,
      cobradorNombre: claimNombre,
      cobradorDocumento: docOverride || claimDocumento,
      valorTotal: totalValor,
      conceptos: conceptosData,
      banco: bancoOverride || claimBanco,
      tipoCuenta: tipoOverride || claimTipoCuenta,
      numeroCuenta: numOverride || claimNumeroCuenta,
      ciudad: ciudadOverride || claimCiudad
    });
    
    setShowInvoice(true);
  };

  const handleShowHistoricalInvoice = (refNumber: string) => {
    const codesInInvoice = historial.filter(c => c.cuentaCobroNum === refNumber);
    if (codesInInvoice.length === 0) return;
    
    let totalValor = 0;
    let conceptosData: { item: number, descripcion: string, valor: number, retencionMotivo?: string | null, retencionPorcentaje?: number | null }[] = [];
    
    let i = 1;
    for (const codigo of codesInInvoice) {
      totalValor += Number(codigo.valor);
      conceptosData.push({ 
        item: i++, 
        descripcion: `CÓDIGO: ${codigo.id} - ${codigo.descripcion}`, 
        valor: Number(codigo.valor),
        retencionMotivo: codigo.retencionMotivo,
        retencionPorcentaje: codigo.retencionPorcentaje
      });
    }
    
    const date = codesInInvoice[0].cobradoEl || new Date().toISOString();
    const savedFirma = codesInInvoice.find(c => c.firma)?.firma || '';
    
    setInvoiceData({
      numero: refNumber,
      fecha: date,
      cobradorNombre: claimNombre,
      cobradorDocumento: claimDocumento,
      valorTotal: totalValor,
      conceptos: conceptosData,
      banco: claimBanco,
      tipoCuenta: claimTipoCuenta,
      numeroCuenta: claimNumeroCuenta,
      ciudad: claimCiudad,
      firmaPrevia: savedFirma,
      isHistorical: true
    });
    
    setShowInvoice(true);
  };

  const handlePreClaim = () => {
    if (selectedIds.length === 0) return;
    setClaimNombre(userName);
    if (!hasBankDocs) {
      setShowUploadModal(true);
      return;
    }
    generateAndShowInvoice();
  };

  const generateManualInvoice = () => {
    if (!manualValor || !manualDescripcion) return;
    if (!hasBankDocs) {
      setShowManualInvoiceModal(false);
      setShowUploadModal(true);
      return;
    }

    const numCuenta = `CC-${(historial.length + 1).toString().padStart(3, '0')}`;
    const now = new Date().toISOString();
    
    setInvoiceData({
      numero: numCuenta,
      fecha: now,
      cobradorNombre: claimNombre,
      cobradorDocumento: claimDocumento,
      valorTotal: Number(manualValor),
      conceptos: [{
        item: 1,
        descripcion: `COBRO MANUAL - ${manualDescripcion}`,
        valor: Number(manualValor),
        retencionMotivo: manualRetencionMotivo || null,
        retencionPorcentaje: manualRetencionPorcentaje ? Number(manualRetencionPorcentaje) : null
      }],
      banco: claimBanco,
      tipoCuenta: claimTipoCuenta,
      numeroCuenta: claimNumeroCuenta,
      ciudad: claimCiudad,
      isManual: true,
      manualData: {
        valor: Number(manualValor),
        descripcion: manualDescripcion,
        centroCosto: manualCentroCosto,
        retencionMotivo: manualRetencionMotivo,
        retencionPorcentaje: manualRetencionPorcentaje ? Number(manualRetencionPorcentaje) : null
      }
    });
    
    setShowManualInvoiceModal(false);
    setShowInvoice(true);
  };

  const handleConfirmClaim = async (firmaData: string) => {
    setIsClaiming(true);
    try {
      const now = invoiceData.fecha;
      const numCuenta = invoiceData.numero;
      const codigosAProcesar = codigosDisponibles.filter(c => selectedIds.includes(c.id));

      // Guardar firma en el estado local para que no se pierda si el componente se recarga
      setInvoiceData((prev: any) => ({ ...prev, firmaPrevia: firmaData }));

      if (invoiceData.isManual) {
        const getInitials = (name: string) => {
          const parts = name.trim().split(' ').filter(Boolean);
          if (parts.length === 0) return 'XX';
          if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        };
        const initials = getInitials(claimNombre || 'USR');
        const prefix = `PKS-${initials}`;
        
        const q = query(collection(db, 'codigos'), where('asignadoAUid', '==', userUid));
        const userCodigosSnap = await getDocs(q);
        
        let maxNum = 0;
        userCodigosSnap.forEach(docSnap => {
          const id = docSnap.id;
          if (id.startsWith(prefix)) {
            const numStr = id.replace(prefix, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        
        const nextNumStr = (maxNum + 1).toString().padStart(3, '0');
        const manualCodeId = `${prefix}${nextNumStr}`;

        const newCodeRef = doc(db, 'codigos', manualCodeId);
        await setDoc(newCodeRef, {
          valor: invoiceData.manualData.valor,
          descripcion: invoiceData.manualData.descripcion,
          centroCosto: invoiceData.manualData.centroCosto || '',
          retencionMotivo: invoiceData.manualData.retencionMotivo || null,
          retencionPorcentaje: invoiceData.manualData.retencionPorcentaje || null,
          estado: 'cobrado',
          estadoAprobacion: 'pendiente',
          creadoEl: now,
          asignadoAUid: userUid,
          asignadoANombre: claimNombre,
          cobradoPor: claimNombre,
          cobradoPorUid: userUid,
          cobradoEl: now,
          cuentaCobroNum: numCuenta,
          firma: firmaData
        });
      } else {
        for (const codigo of codigosAProcesar) {
          const codigoRef = doc(db, 'codigos', codigo.id);
          await updateDoc(codigoRef, {
            estado: 'cobrado',
            cobradoPor: claimNombre,
            cobradoPorUid: userUid,
            cobradoEl: now,
            cuentaCobroNum: numCuenta,
            firma: firmaData
          });
        }
      }

      toast({ title: '¡Éxito!', description: `Se ha generado la cuenta de cobro exitosamente.` });
      
      setSelectedIds([]);
      fetchCodigos();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Ocurrió un error al confirmar el cobro.', variant: 'destructive' });
    } finally {
      setIsClaiming(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === codigosDisponibles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(codigosDisponibles.map(c => c.id));
    }
  };

  const totalAcumulado = historial.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);

  return (
    <>
      <div className="min-h-screen p-4 lg:p-10 relative bg-[#050816] font-exo text-[#d9faff] overflow-hidden selection:bg-[#00e5ff]/30 print:hidden">
        
        {/* --- HUD BACKGROUND EFFECTS --- */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00e5ff15_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#00ff88]/5 blur-[250px] mix-blend-screen pointer-events-none rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#00e5ff]/10 blur-[200px] mix-blend-screen pointer-events-none rounded-full" />
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-screen pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto w-full relative z-10 space-y-10">
          
          {/* --- HEADER --- */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#00ff88] to-[#00e5ff] blur-lg opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
                <div className="relative p-5 bg-[#081120]/80 backdrop-blur-xl border border-[#00ff88]/30 shadow-[0_0_20px_rgba(0,255,136,0.2)]" style={{ clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' }}>
                  <Terminal className="w-8 h-8 text-[#00ff88]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-4xl font-black text-white font-orbitron tracking-[0.1em] md:tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">SISTEMA PKS COBRO</h1>
                  <span className="px-2 py-0.5 bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] text-[10px] font-orbitron tracking-widest animate-pulse">EN_LÍNEA</span>
                </div>
                <p className="text-[#00e5ff] font-mono text-xs md:text-sm tracking-[0.3em] uppercase opacity-80 mt-1">INTERFAZ SEGURA DE PAGOS</p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end opacity-50">
              <div className="flex gap-1 mb-1">
                <div className="w-8 h-1 bg-[#00ff88]"></div>
                <div className="w-2 h-1 bg-[#00e5ff]"></div>
                <div className="w-1 h-1 bg-white"></div>
              </div>
              <span className="font-mono text-xs tracking-widest text-[#00e5ff]">{new Date().toISOString().split('T')[0]} // V-2.0.4</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* --- LEFT PANEL: TOKENS DISPONIBLES --- */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col"
            >
              <div className="relative bg-[#081120]/60 backdrop-blur-3xl border border-[#00ff88]/20 shadow-[0_0_50px_rgba(0,255,136,0.05)] flex-1 flex flex-col group"
                   style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0% 100%)' }}>
                
                {/* HUD Accents */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-50"></div>
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#00ff88]/40 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00ff88] opacity-50"></div>
                
                <div className="p-6 border-b border-[#00ff88]/10 bg-gradient-to-r from-[#00ff88]/5 to-transparent flex flex-row items-center justify-between">
                  <div>
                    <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]">Códigos Disponibles</h2>
                    <p className="text-[10px] text-[#00ff88]/60 font-mono uppercase tracking-[0.3em] mt-1">Seleccione entradas para autenticar</p>
                  </div>
                  {codigosDisponibles.length > 0 && (
                    <button 
                      onClick={selectAll} 
                      className="relative overflow-hidden text-[10px] font-orbitron font-bold text-[#00ff88] border border-[#00ff88]/40 hover:bg-[#00ff88]/10 hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] px-4 py-2 transition-all tracking-[0.2em] uppercase"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <span className="relative z-10">{selectedIds.length === codigosDisponibles.length ? 'DESELECCIONAR_TODO' : 'SELECCIONAR_TODO'}</span>
                    </button>
                  )}
                </div>
                
                <div className="flex-1 p-0 relative min-h-[400px]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="w-16 h-16 border-[3px] border-[#00ff88]/10 border-t-[#00ff88] border-r-[#00e5ff] rounded-full animate-spin shadow-[0_0_30px_rgba(0,255,136,0.2)]"></div>
                      <span className="font-orbitron tracking-widest text-[#00ff88] text-xs animate-pulse">OBTENIENDO_DATOS...</span>
                    </div>
                  ) : codigosDisponibles.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#00e5ff]/40">
                      <motion.div 
                        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.05, 0.95] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-32 h-32 mb-6 relative flex items-center justify-center"
                      >
                        <div className="absolute inset-0 border border-[#00e5ff]/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-2 border border-dashed border-[#00ff88]/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                        <CheckCircle className="w-10 h-10 text-[#00e5ff]/50 drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                      </motion.div>
                      <span className="font-orbitron tracking-[0.3em] uppercase text-sm drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">Sin Tokens Pendientes</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#00ff88]/10 max-h-[500px] overflow-y-auto custom-scrollbar">
                      <AnimatePresence>
                        {codigosDisponibles.map((c, idx) => {
                          const isSelected = selectedIds.includes(c.id);
                          return (
                            <motion.div 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              key={c.id} 
                              onClick={() => toggleSelection(c.id)}
                              className={`p-5 flex items-center justify-between cursor-pointer transition-all duration-300 relative overflow-hidden ${isSelected ? 'bg-gradient-to-r from-[#00ff88]/10 to-transparent' : 'hover:bg-[#00e5ff]/[0.03]'}`}
                            >
                              {isSelected && <div className="absolute left-0 top-0 w-1 h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></div>}
                              {isSelected && <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#00ff88]/10 to-transparent opacity-50"></div>}
                              
                              <div className="flex items-center gap-5 relative z-10">
                                <div className={`relative flex items-center justify-center w-6 h-6 border transition-all duration-300 ${isSelected ? 'border-[#00ff88] bg-[#00ff88]/20 shadow-[0_0_15px_rgba(0,255,136,0.4)]' : 'border-[#00e5ff]/30 text-transparent'}`} style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}>
                                  {isSelected && <div className="w-2.5 h-2.5 bg-[#00ff88] shadow-[0_0_8px_#00ff88]"></div>}
                                </div>
                                <div>
                                  <div className={`font-bold font-mono text-lg tracking-widest transition-colors ${isSelected ? 'text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.6)]' : 'text-[#d9faff] group-hover:text-white'}`}>
                                    {c.id}
                                  </div>
                                  <div className="text-[11px] text-[#00bfff] font-rajdhani tracking-widest uppercase opacity-80 mt-1">{c.descripcion}</div>
                                </div>
                              </div>
                              <div className={`font-mono font-bold tracking-[0.1em] text-lg relative z-10 ${isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-[#00e5ff]'}`}>
                                ${Number(c.valor).toLocaleString()}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                
                {codigosDisponibles.length > 0 && (
                  <div className="p-6 border-t border-[#00ff88]/20 bg-[#050816]/80 backdrop-blur-xl relative z-20">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[#00bfff] font-mono uppercase tracking-[0.2em] text-[10px]">CANTIDAD_AUTORIZADA: <span className="text-white text-xs">{selectedIds.length}</span></span>
                      <span className="text-white font-mono font-black tracking-widest text-xl drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">
                        <span className="text-[#00e5ff] mr-2">Σ</span>${codigosDisponibles.filter(c => selectedIds.includes(c.id)).reduce((acc, curr) => acc + Number(curr.valor), 0).toLocaleString()}
                      </span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: selectedIds.length > 0 ? 1.01 : 1 }}
                      whileTap={{ scale: selectedIds.length > 0 ? 0.98 : 1 }}
                      onClick={handlePreClaim} 
                      disabled={selectedIds.length === 0} 
                      className={`w-full relative group h-14 overflow-hidden border ${selectedIds.length > 0 ? 'bg-[#00ff88]/10 border-[#00ff88] cursor-pointer shadow-[0_0_20px_rgba(0,255,136,0.2)]' : 'bg-[#081120] border-[#00e5ff]/20 opacity-50 cursor-not-allowed'}`}
                      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                    >
                      {selectedIds.length > 0 && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/0 via-[#00ff88]/30 to-[#00ff88]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          <div className="absolute left-0 top-0 w-2 h-full bg-[#00ff88]"></div>
                        </>
                      )}
                      <div className={`relative flex items-center justify-center gap-3 w-full h-full font-orbitron font-bold tracking-[0.2em] uppercase transition-all duration-300 ${selectedIds.length > 0 ? 'text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.5)] group-hover:text-white' : 'text-[#00e5ff]/50'}`}>
                        <Sparkles className="w-5 h-5" />
                        INICIAR PROTOCOLO
                      </div>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* --- RIGHT PANEL: ACUMULADO & HISTORY --- */}
            <div className="lg:col-span-7 space-y-8 flex flex-col">
              
              {/* DOCUMENTOS */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="bg-[#081120]/60 backdrop-blur-3xl border border-[#00ff88]/30 shadow-[0_0_20px_rgba(0,255,136,0.1)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-white font-orbitron font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00ff88]" /> Mis Documentos
                  </h3>
                  <p className="text-[10px] text-[#00ff88]/70 font-mono tracking-widest mt-1 uppercase">RUT y Certificación Bancaria</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {rutUrl && (
                    <a href={rutUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/20 transition-colors">
                      <Eye className="w-3 h-3" /> VER RUT
                    </a>
                  )}
                  {certUrl && (
                    <a href={certUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/20 transition-colors">
                      <Eye className="w-3 h-3" /> VER CERT
                    </a>
                  )}
                  <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#00e5ff]/10 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-mono hover:bg-[#00e5ff]/20 transition-colors">
                    <Pencil className="w-3 h-3" /> EDITAR
                  </button>
                  <button onClick={() => setShowManualInvoiceModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#ff007f]/10 border border-[#ff007f]/40 text-[#ff007f] text-xs font-mono hover:bg-[#ff007f]/20 transition-colors">
                    <Plus className="w-3 h-3" /> CREAR COBRO MANUAL
                  </button>
                </div>
              </motion.div>

              {/* TOTAL ACUMULADO */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[#081120]/60 backdrop-blur-3xl border border-[#00e5ff]/30 shadow-[0_0_40px_rgba(0,229,255,0.1)] relative group overflow-hidden"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%)' }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5ff] to-transparent"></div>
                
                <div className="absolute -right-10 -top-10 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-all duration-700 transform group-hover:scale-110 pointer-events-none">
                  <DollarSign className="w-80 h-80 text-[#00e5ff]" />
                </div>
                
                <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] flex items-center gap-3">
                      <div className="w-2 h-2 bg-[#00e5ff] animate-pulse"></div>
                      Valor Total Reclamado
                    </h2>
                    <p className="text-[10px] text-[#00bfff] font-mono uppercase tracking-[0.3em] mt-2 opacity-80">Valor Reclamado Histórico / Acumulado</p>
                  </div>
                  <div className="text-5xl md:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#00ff88] drop-shadow-[0_0_25px_rgba(0,229,255,0.4)] tracking-tighter">
                    ${totalAcumulado.toLocaleString()}
                  </div>
                </div>
              </motion.div>

              {/* TOKEN HISTORY */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#081120]/60 backdrop-blur-3xl border border-[#00bfff]/20 shadow-[0_0_40px_rgba(0,191,255,0.05)] flex-1 flex flex-col relative"
                style={{ clipPath: 'polygon(20px 0%, 100% 0%, 100% 100%, 0% 100%, 0% 20px)' }}
              >
                <div className="absolute top-0 left-0 w-[20px] h-[20px] border-t border-l border-[#00bfff] opacity-50"></div>
                
                <div className="p-6 border-b border-[#00bfff]/20 bg-gradient-to-r from-[#00bfff]/5 to-transparent flex items-center justify-between">
                  <h2 className="text-lg font-orbitron font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_5px_rgba(0,191,255,0.5)]">Historial de Códigos</h2>
                  <span className="text-[10px] font-mono text-[#00bfff] tracking-widest border border-[#00bfff]/30 px-2 py-1 bg-[#00bfff]/10">REGISTROS: {historial.length}</span>
                </div>
                
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                      <div className="w-10 h-10 border-2 border-[#00bfff]/20 border-t-[#00bfff] rounded-full animate-spin"></div>
                      <span className="font-orbitron text-[10px] tracking-widest text-[#00bfff]">ACCEDIENDO_BD...</span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#050816]/80 text-[#00bfff]/70 font-mono text-[10px] uppercase tracking-[0.3em] border-b border-[#00bfff]/20">
                        <tr>
                          <th className="px-8 py-5 font-normal">ID_Código / Desc</th>
                          <th className="px-8 py-5 font-normal">Valor_Extraído</th>
                          <th className="px-8 py-5 font-normal">Fecha / Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#00bfff]/10">
                        <AnimatePresence>
                          {historial.map((c, idx) => (
                            <motion.tr 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              key={c.id} 
                              className="group hover:bg-[#00e5ff]/[0.05] transition-all duration-300"
                            >
                              <td className="px-8 py-5">
                                <span className="text-[#d9faff] font-bold font-mono text-base tracking-widest group-hover:text-[#00e5ff] transition-colors drop-shadow-[0_0_5px_rgba(0,229,255,0)] group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{c.id}</span>
                                <div className="text-[10px] text-[#00bfff]/60 font-rajdhani uppercase tracking-widest mt-1.5">{c.descripcion}</div>
                                {c.estadoAprobacion === 'pendiente' && (
                                  <div className="mt-1 text-yellow-400 font-orbitron text-[9px] font-bold uppercase tracking-widest animate-pulse">
                                    PENDIENTE POR APROBACION
                                  </div>
                                )}
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-[#00ff88] font-mono font-bold tracking-[0.1em] drop-shadow-[0_0_5px_rgba(0,255,136,0.3)]">${Number(c.valor).toLocaleString()}</span>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2 text-[#00bfff]">
                                    <Clock className="w-3.5 h-3.5 opacity-70" />
                                    <span className="text-[11px] font-mono tracking-widest">
                                      {c.cobradoEl ? new Date(c.cobradoEl).toISOString().replace('T', ' ').substring(0, 16) : 'DESCONOCIDO'}
                                    </span>
                                  </div>
                                  {c.cuentaCobroNum && (
                                    <button 
                                      onClick={() => handleShowHistoricalInvoice(c.cuentaCobroNum as string)}
                                      className="text-[9px] font-orbitron text-white font-bold tracking-widest uppercase bg-[#00e5ff]/20 hover:bg-[#00e5ff]/40 px-2 py-0.5 rounded-sm w-fit border border-[#00e5ff]/30 transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#00e5ff]"
                                    >
                                      REF: {c.cuentaCobroNum}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                        {historial.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-8 py-24 text-center text-[#00bfff]/40">
                              <span className="font-orbitron tracking-[0.3em] uppercase text-sm">NO_SE_ENCONTRARON_DATOS_HISTORICOS</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HUD MODALS --- */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 bg-[#050816]/80 flex items-center justify-center p-4 print:hidden"
          >
            {/* Scanline overlay over modal */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 mix-blend-overlay z-40"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#081120]/90 backdrop-blur-2xl border border-[#00e5ff]/40 shadow-[0_0_80px_rgba(0,229,255,0.15)] w-full max-w-2xl relative z-50 overflow-hidden"
              style={{ clipPath: 'polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)' }}
            >
              {/* Top Neon Bar */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00ff88] via-[#00e5ff] to-[#00ff88]"></div>
              
              <div className="p-4 md:p-6 border-b border-[#00e5ff]/20 bg-gradient-to-r from-[#00e5ff]/10 to-transparent">
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,229,255,0.6)] flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#00ff88]" />
                  DOCUMENTACIÓN_REQUERIDA
                </h2>
                <p className="text-[10px] text-[#00bfff] font-mono mt-2 uppercase tracking-[0.2em]">Suba la Certificación Bancaria y el RUT. El Núcleo de IA extraerá los parámetros automáticamente.</p>
              </div>
              
              <div className="p-4 md:p-6 space-y-4 md:space-y-6 relative max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00ff88]/5 blur-3xl pointer-events-none rounded-full"></div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#00ff88] font-orbitron uppercase tracking-[0.2em]">01 // Certificación Bancaria</label>
                    {certFileBase64 && <span className="text-[9px] text-[#00ff88] font-mono tracking-widest px-2 py-0.5 border border-[#00ff88]/30">CARGADO</span>}
                  </div>
                  <div className={`relative overflow-hidden border ${certFileBase64 ? 'border-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-[#00e5ff]/30 border-dashed bg-[#050816]/50 hover:border-[#00e5ff]/80'} p-4 md:p-6 text-center transition-all duration-300 group`}
                       style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                    <Upload className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 transition-colors ${certFileBase64 ? 'text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 'text-[#00e5ff]/50 group-hover:text-[#00e5ff]'}`} />
                    <p className="text-[10px] md:text-xs font-mono tracking-widest text-[#d9faff]/70 mb-3">{certFileBase64 ? 'DATOS_DE_CERTIFICACIÓN_ADQUIRIDOS' : 'HAGA CLIC O ARRASTRE EL ARCHIVO AQUÍ'}</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleCertFileChange}
                      className="w-full text-[10px] font-mono text-[#00bfff] file:mr-4 file:py-2.5 file:px-5 file:border-0 file:text-[10px] file:font-bold file:font-orbitron file:tracking-[0.2em] file:bg-[#00e5ff]/10 file:text-[#00e5ff] file:border file:border-[#00e5ff]/40 hover:file:bg-[#00e5ff]/20 hover:file:shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer transition-all"
                      style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
                    />
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#00ff88] font-orbitron uppercase tracking-[0.2em]">02 // Identificación Tributaria (RUT)</label>
                    {rutFileBase64 && <span className="text-[9px] text-[#00ff88] font-mono tracking-widest px-2 py-0.5 border border-[#00ff88]/30">CARGADO</span>}
                  </div>
                  <div className={`relative overflow-hidden border ${rutFileBase64 ? 'border-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-[#00e5ff]/30 border-dashed bg-[#050816]/50 hover:border-[#00e5ff]/80'} p-4 md:p-6 text-center transition-all duration-300 group`}
                       style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                    <Upload className={`w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 transition-colors ${rutFileBase64 ? 'text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 'text-[#00e5ff]/50 group-hover:text-[#00e5ff]'}`} />
                    <p className="text-[10px] md:text-xs font-mono tracking-widest text-[#d9faff]/70 mb-3">{rutFileBase64 ? 'DATOS_DEL_RUT_ADQUIRIDOS' : 'HAGA CLIC O ARRASTRE EL ARCHIVO AQUÍ'}</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleRutFileChange}
                      className="w-full text-[10px] font-mono text-[#00bfff] file:mr-4 file:py-2.5 file:px-5 file:border-0 file:text-[10px] file:font-bold file:font-orbitron file:tracking-[0.2em] file:bg-[#00e5ff]/10 file:text-[#00e5ff] file:border file:border-[#00e5ff]/40 hover:file:bg-[#00e5ff]/20 hover:file:shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer transition-all"
                      style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6 relative z-10">
                  <button 
                    onClick={() => setShowUploadModal(false)} 
                    disabled={uploadingDocs} 
                    className="w-full md:w-1/3 h-14 bg-transparent border border-[#00e5ff]/30 text-[#00e5ff]/60 hover:bg-[#00e5ff]/10 hover:text-[#00e5ff] font-orbitron font-bold text-[11px] uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    ABORTAR
                  </button>
                  <button 
                    onClick={processDocumentAI} 
                    disabled={(!certFileBase64 && !rutFileBase64) || uploadingDocs} 
                    className={`w-full md:w-2/3 h-14 flex items-center justify-center font-orbitron font-bold text-[10px] md:text-[11px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border ${(!certFileBase64 && !rutFileBase64) || uploadingDocs ? 'bg-[#050816] border-[#00ff88]/20 text-[#00ff88]/30 cursor-not-allowed' : 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/40 hover:text-white hover:shadow-[0_0_25px_rgba(0,255,136,0.6)]'}`}
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                  >
                    {uploadingDocs ? (
                      <><div className="w-4 h-4 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin mr-3"></div> INICIALIZANDO_IA...</>
                    ) : 'EJECUTAR_EXTRACCIÓN'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* MANUAL INVOICE MODAL */}
        {showManualInvoiceModal && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 bg-[#050816]/80 flex items-center justify-center p-4 print:hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 mix-blend-overlay z-40"></div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#081120]/90 backdrop-blur-2xl border border-[#ff007f]/40 shadow-[0_0_80px_rgba(255,0,127,0.15)] w-full max-w-xl relative z-50 overflow-hidden p-6"
              style={{ clipPath: 'polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)' }}
            >
              <div className="flex items-center gap-4 border-b border-[#ff007f]/20 pb-4 mb-6">
                <div className="p-3 bg-[#ff007f]/10 border border-[#ff007f]/30">
                  <Plus className="w-6 h-6 text-[#ff007f]" />
                </div>
                <div>
                  <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]">Crear Cobro Manual</h2>
                  <p className="text-[10px] text-[#ff007f] font-mono tracking-[0.2em] mt-1">EMISIÓN DIRECTA DE CUENTA DE COBRO</p>
                </div>
              </div>
              
              <div className="space-y-4 font-mono text-sm max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <div>
                  <label className="text-[10px] text-[#ff007f] tracking-widest block mb-1">VALOR A COBRAR *</label>
                  <Input 
                    type="number" 
                    value={manualValor} 
                    onChange={e => setManualValor(e.target.value)} 
                    placeholder="Ej: 500000"
                    className="bg-[#050816]/50 border-[#ff007f]/30 text-white focus-visible:ring-[#ff007f]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#ff007f] tracking-widest block mb-1">DESCRIPCIÓN DEL COBRO *</label>
                  <Input 
                    type="text" 
                    value={manualDescripcion} 
                    onChange={e => setManualDescripcion(e.target.value)} 
                    placeholder="Ej: Servicios de edición de video"
                    className="bg-[#050816]/50 border-[#ff007f]/30 text-white focus-visible:ring-[#ff007f]" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#ff007f] tracking-widest block mb-1">CENTRO DE COSTO (OPCIONAL)</label>
                  <Input 
                    type="text" 
                    value={manualCentroCosto} 
                    onChange={e => setManualCentroCosto(e.target.value)} 
                    placeholder="Ej: PROYECTO-X"
                    className="bg-[#050816]/50 border-[#ff007f]/30 text-white focus-visible:ring-[#ff007f]" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#ff007f] tracking-widest block mb-1">MOTIVO DE RETENCIÓN (OPCIONAL)</label>
                    <Input 
                      type="text" 
                      value={manualRetencionMotivo} 
                      onChange={e => setManualRetencionMotivo(e.target.value)} 
                      placeholder="Ej: Honorarios"
                      className="bg-[#050816]/50 border-[#ff007f]/30 text-white focus-visible:ring-[#ff007f]" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#ff007f] tracking-widest block mb-1">% RETENCIÓN (OPCIONAL)</label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={manualRetencionPorcentaje} 
                      onChange={e => setManualRetencionPorcentaje(e.target.value)} 
                      placeholder="Ej: 11"
                      className="bg-[#050816]/50 border-[#ff007f]/30 text-white focus-visible:ring-[#ff007f]" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6 mt-4 border-t border-[#ff007f]/20">
                <button 
                  onClick={() => setShowManualInvoiceModal(false)}
                  className="w-1/3 h-12 bg-transparent border border-[#ff007f]/30 text-[#ff007f]/60 hover:bg-[#ff007f]/10 hover:text-[#ff007f] font-orbitron font-bold text-[10px] uppercase tracking-widest transition-all"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  CANCELAR
                </button>
                <button 
                  onClick={generateManualInvoice}
                  disabled={!manualValor || !manualDescripcion}
                  className={`w-2/3 h-12 flex items-center justify-center font-orbitron font-bold text-[11px] uppercase tracking-[0.2em] transition-all border ${(!manualValor || !manualDescripcion) ? 'bg-[#050816] border-[#ff007f]/20 text-[#ff007f]/30 cursor-not-allowed' : 'bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f] hover:bg-[#ff007f]/40 hover:text-white hover:shadow-[0_0_20px_rgba(255,0,127,0.5)]'}`}
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  EMITIR CUENTA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* --- INVOICE MODAL --- */}
      <AnimatePresence>
        {showInvoice && invoiceData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center print:static print:bg-transparent print:h-auto print:overflow-visible print:block"
          >
            {/* Holographic background for invoice modal */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00ff8815_1px,transparent_1px),linear-gradient(to_bottom,#00ff8815_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none print:hidden"></div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 mix-blend-overlay z-0 print:hidden"></div>

            <div className="relative z-10 w-full max-w-4xl max-h-screen overflow-y-auto custom-scrollbar p-4 print:p-0 print:overflow-visible print:h-auto print:max-h-none">
              <CuentaDeCobro 
                {...invoiceData} 
                onClose={() => setShowInvoice(false)} 
                onConfirm={handleConfirmClaim}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
