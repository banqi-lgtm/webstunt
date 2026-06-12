import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle, FileUp, Search, MessageCircle, ChevronRight, FileText, CheckCircle2, AlertCircle, Building2, Download, Eye, Calendar, Loader2, Sparkles } from 'lucide-react';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { CuentaDeCobro } from '../../app/(dashboard)/profile/CuentaDeCobro';

interface DashboardInicioProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rutUrl: string | null;
  certUrl: string | null;
  totalAcumulado: number;
  saldoPorCobrar: number;
  historial: any[];
  userName: string;
  userDocument: string;
  userEmail: string;
  userUid: string;
}

export function DashboardInicio({ activeTab, setActiveTab, rutUrl, certUrl, totalAcumulado, saldoPorCobrar, historial, userName, userDocument, userEmail, userUid }: DashboardInicioProps) {
  
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const { toast } = useToast();
  const [isUpdatingRut, setIsUpdatingRut] = useState(false);
  const [isUpdatingCert, setIsUpdatingCert] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpdateDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'rut' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'rut') setIsUpdatingRut(true);
      if (type === 'cert') setIsUpdatingCert(true);

      const dataUrl = await fileToBase64(file);
      
      // Upload to Storage
      const storageRef = ref(storage, `users/${userUid}/${type}_${Date.now()}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      const body: any = {};
      if (type === 'rut') body.rutFile = { dataUrl, fileType: file.type };
      if (type === 'cert') body.certFile = { dataUrl, fileType: file.type };

      // Extract Data via AI
      toast({ title: "Procesando", description: `Analizando ${type.toUpperCase()} con IA...` });
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      console.log("Raw AI Response:", data);
      toast({ title: "Debug IA", description: JSON.stringify(data).substring(0, 200) });

      // Update Firestore
      const userRef = doc(db, 'users', userUid);
      const updateData: any = {};
      if (type === 'rut') {
        updateData.rutUrl = downloadUrl;
        setLocalRutUrl(downloadUrl);
      }
      if (type === 'cert') {
        updateData.certUrl = downloadUrl;
        setLocalCertUrl(downloadUrl);
      }
      
      if (data.documentoIdentidad && type === 'rut') {
        updateData.numeroIdentificacion = data.documentoIdentidad;
        setLocalUserDocument(data.documentoIdentidad);
        toast({ title: "Datos extraídos", description: `Se actualizó el NIT: ${data.documentoIdentidad}` });
      }
      if (data.banco) updateData.banco = data.banco;
      if (data.tipoCuenta) updateData.tipoCuenta = data.tipoCuenta;
      if (data.numeroCuenta) updateData.numeroCuenta = data.numeroCuenta;

      await updateDoc(userRef, updateData);
      
      toast({ title: "Documento actualizado", description: "Tus datos se han guardado y actualizado en pantalla correctamente." });
      
    } catch (error) {
      console.error("Error al actualizar documento", error);
      toast({ title: "Error", description: "No se pudo actualizar el documento.", variant: "destructive" });
    } finally {
      if (type === 'rut') setIsUpdatingRut(false);
      if (type === 'cert') setIsUpdatingCert(false);
    }
  };


const [concepto, setConcepto] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  
const [localUserDocument, setLocalUserDocument] = useState(userDocument);
  useEffect(() => setLocalUserDocument(userDocument), [userDocument]);
  
  const [localRutUrl, setLocalRutUrl] = useState(rutUrl);
  useEffect(() => setLocalRutUrl(rutUrl), [rutUrl]);
  
  const [localCertUrl, setLocalCertUrl] = useState(certUrl);
  useEffect(() => setLocalCertUrl(certUrl), [certUrl]);
  
  const [retencionMotivo, setRetencionMotivo] = useState('');
  const [retencionPorcentaje, setRetencionPorcentaje] = useState<number | null>(null);
  const [isCalculatingRetencion, setIsCalculatingRetencion] = useState(false);

  const calcularRetencion = async () => {
    if (!concepto || !valorTotal) return;
    setIsCalculatingRetencion(true);
    try {
      const numericValue = valorTotal.replace(/\D/g, '');
      const response = await fetch('/api/retencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: concepto, valor: numericValue })
      });
      const data = await response.json();
      if (data.motivo && data.porcentaje !== undefined) {
        setRetencionMotivo(data.motivo);
        setRetencionPorcentaje(data.porcentaje);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculatingRetencion(false);
    }
  };


const handleCobrar = async (item: any) => {
    try {
      setLoadingInvoiceId(item.id);
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};

      setInvoiceData({
        numero: item.cuentaCobroNum || `CC-${item.id.substring(0,6).toUpperCase()}`,
        fecha: item.creadoEl || new Date().toISOString(),
        cobradorNombre: userData.nombreCompleto || userData.nombres || userName || item.asignadoANombre,
        cobradorDocumento: userData.documentoIdentidad || userDocument || 'No registrado',
        valorTotal: item.valor,
        conceptos: [{
          item: 1,
          descripcion: item.descripcion || item.concepto || 'Servicios prestados',
          valor: item.valor,
          retencionMotivo: item.retencionMotivo || null,
          retencionPorcentaje: item.retencionPorcentaje || null
        }],
        banco: userData.banco || 'No registrado',
        tipoCuenta: userData.tipoCuenta || 'No registrado',
        numeroCuenta: userData.numeroCuenta || 'No registrado',
        ciudad: userData.ciudad || 'BELLO, ANTIOQUIA',
        isHistorical: false,
        itemId: item.id
      });
      setShowInvoiceModal(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Error al preparar la cuenta de cobro', variant: 'destructive' });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const confirmarCobro = async (itemId: string, firma: string) => {
    try {
      const itemRef = doc(db, 'codigos', itemId);
      await updateDoc(itemRef, {
        estado: 'cobrado',
        firmaGenerada: firma,
        cobradoEl: new Date().toISOString()
      });
      toast({ title: 'Éxito', description: 'Cuenta de cobro firmada y generada correctamente.' });
      setShowInvoiceModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch(e) {
      toast({ title: 'Error', description: 'Error al confirmar la cuenta de cobro', variant: 'destructive' });
    }
  };

  const handleContinuarCreacion = async () => {
    if (!concepto || !valorTotal) {
      toast({ title: "Atención", description: "Por favor ingresa un concepto y un valor total.", variant: "destructive" });
      return;
    }

    try {
      setLoadingInvoiceId('new');
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};
      
      const numericValue = Number(valorTotal.replace(/\D/g, ''));

      setInvoiceData({
        numero: 'Por generar',
        fecha: fechaEmision,
        cobradorNombre: userData.nombreCompleto || userData.nombres || userName,
        cobradorDocumento: localUserDocument || 'No registrado',
        valorTotal: numericValue,
        conceptos: [{
          item: 1,
          descripcion: concepto,
          valor: numericValue,
          retencionMotivo: retencionMotivo || null,
          retencionPorcentaje: retencionPorcentaje || null
        }],
        banco: userData.banco || 'No registrado',
        tipoCuenta: userData.tipoCuenta || 'No registrado',
        numeroCuenta: userData.numeroCuenta || 'No registrado',
        ciudad: userData.ciudad || 'BELLO, ANTIOQUIA',
        isHistorical: false,
        isNew: true
      });
      setShowInvoiceModal(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Error al preparar la cuenta', variant: 'destructive' });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const guardarNuevaCuenta = async (firma: string) => {
    try {
      const numericValue = Number(valorTotal.replace(/\D/g, ''));
      const cuentaCobroNum = `CC-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

      await addDoc(collection(db, 'codigos'), {
        asignadoAUid: userUid,
        asignadoANombre: userName,
        concepto: concepto,
        descripcion: concepto,
        valor: numericValue,
        retencionMotivo: retencionMotivo || null,
        retencionPorcentaje: retencionPorcentaje || null,
        estado: 'cobrado', // Ya fue firmada por el usuario
        firmaGenerada: firma,
        creadoEl: new Date().toISOString(),
        cobradoEl: new Date().toISOString(),
        fechaEmision: fechaEmision,
        cuentaCobroNum: cuentaCobroNum
      });
      
      toast({ title: 'Éxito', description: 'Cuenta de cobro creada y firmada correctamente.' });
      setShowInvoiceModal(false);
      setConcepto('');
      setValorTotal('');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Error al guardar la nueva cuenta de cobro', variant: 'destructive' });
    }
  };

  const handleViewCuenta = async (item: any) => {
    try {
      setLoadingInvoiceId(item.id);
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};

      setInvoiceData({
        numero: item.cuentaCobroNum || 'N/A',
        fecha: item.cobradoEl || item.creadoEl,
        cobradorNombre: userData.nombreCompleto || userData.nombres || userName || item.asignadoANombre,
        cobradorDocumento: userData.documentoIdentidad || userDocument || 'No registrado',
        valorTotal: item.valor,
        conceptos: [{
          item: 1,
          descripcion: item.descripcion || 'Servicios prestados',
          valor: item.valor,
          retencionMotivo: item.retencionMotivo || null,
          retencionPorcentaje: item.retencionPorcentaje || null
        }],
        banco: userData.banco || 'No registrado',
        tipoCuenta: userData.tipoCuenta || 'No registrado',
        numeroCuenta: userData.numeroCuenta || 'No registrado',
        ciudad: userData.ciudad || 'BELLO, ANTIOQUIA',
        isHistorical: true
      });
      setShowInvoiceModal(true);
    } catch (e) {
      alert("Error al cargar la cuenta de cobro");
    } finally {
      setLoadingInvoiceId(null);
    }
  };
  const totalPagado = totalAcumulado - saldoPorCobrar > 0 ? totalAcumulado - saldoPorCobrar : 0;
  const tAcumuladoDisplay = totalAcumulado || 0;
  const tSaldoDisplay = saldoPorCobrar || 0;

  const showFormAndDocs = activeTab === 'inicio';
  const showCuentasAndPagos = ['cuentas', 'pagos', 'historial'].includes(activeTab);

  const getStatusInfo = (item: any) => {
    const isPending = item.estado === 'disponible' || item.estado === 'PENDIENTE DE PAGO';
    const isApproved = item.estado === 'pagado' || item.estado === 'PAGADO' || item.estadoAprobacion === 'aprobado';
    const isPendingApproval = item.estado === 'cobrado' && !isApproved;

    if (isPending) return { label: 'PENDIENTE DE PAGO', colors: 'border-zinc-700 bg-[#1A1A1A] text-zinc-400', dot: 'bg-zinc-500', isPending, isApproved, isPendingApproval };
    if (isPendingApproval) return { label: 'PENDIENTE POR APROBACIÓN', colors: 'border-amber-500/30 bg-amber-500/10 text-amber-500', dot: 'bg-amber-500', isPending, isApproved, isPendingApproval };
    if (isApproved) return { label: 'PAGADO', colors: 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00]', dot: 'bg-[#00ff00]', isPending, isApproved, isPendingApproval };
    
    return { label: item.estado, colors: 'border-zinc-700 bg-[#1A1A1A] text-zinc-400', dot: 'bg-zinc-500', isPending: false, isApproved: false, isPendingApproval: false };
  };

  return (
    <div className="space-y-6">

      {showFormAndDocs && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* FORMULARIO CUENTA DE COBRO */}
        <div id="seccion-formulario" className="xl:col-span-7 bg-[#111111] border border-[#222222] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase mb-6">Realiza tu cuenta de cobro</h3>
          
          {/* STEPPER */}
          <div className="flex items-center justify-between mb-8 relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#222222] -z-10"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] pr-2">
              <div className="w-7 h-7 rounded-full bg-[#E60000] shadow-[0_0_10px_rgba(230,0,0,0.4)] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">1</div>
              <span className="text-white text-[11px] font-bold mt-1 sm:mt-0 uppercase tracking-wide">Información</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] px-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">2</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Documentos</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] px-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">3</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Resumen</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] pl-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">4</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Enviado</span>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Tipo de documento</label>
              <select disabled defaultValue="Cédula de ciudadanía" className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none opacity-80 cursor-not-allowed">
                <option>Cédula de ciudadanía</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Número de documento</label>
              <input type="text" value={localRutUrl ? (localUserDocument || '') : ''} placeholder="Se extraerá de tu RUT" disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Nombre completo</label>
              <input type="text" defaultValue={userName || ''} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Correo electrónico</label>
              <input type="email" defaultValue={userEmail || ''} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
<div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Teléfono de contacto</label>
              <input type="text" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} placeholder="Ej: 300 123 4567" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Concepto de la cuenta de cobro</label>
              <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} onBlur={calcularRetencion} placeholder="Ej. Servicios de producción evento Copa Stunt" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-zinc-400">Valor total</label>
                {retencionMotivo && (
                  <div className="flex items-center gap-1 text-[10px] text-[#00ff00]">
                    <Sparkles className="w-3 h-3" />
                    <span>IA: {retencionMotivo} ({retencionPorcentaje}%)</span>
                  </div>
                )}
                {isCalculatingRetencion && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculando...</span>
                  </div>
                )}
              </div>
              <input type="text" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} onBlur={calcularRetencion} placeholder="$ 2.500.000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Fecha de emisión</label>
              <div className="relative">
                <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none" />
                <Calendar className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1A1A1A]">
            <button onClick={handleContinuarCreacion} disabled={loadingInvoiceId === 'new'} className="w-full sm:w-auto bg-[#E60000] hover:bg-red-700 text-white font-bold text-sm px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95 disabled:opacity-50">
              {loadingInvoiceId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOCUMENTOS REQUERIDOS */}
        <div id="seccion-documentos" className="xl:col-span-5 bg-[#111111] border border-[#222222] rounded-xl p-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase">Documentos requeridos</h3>
            <span className="bg-[#00ff00]/10 text-[#00ff00] text-[10px] font-bold px-2 py-1 rounded">PERFIL 100%</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            
            {/* RUT BOX */}
            <div className="bg-[#0D0D0D] border border-[#222222] hover:border-[#333] transition-colors rounded-xl p-4 flex gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg h-fit border border-[#222]">
                <FileText className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">RUT</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight">Adjunta tu RUT actualizado.</p>
                  </div>
                </div>
                
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {localRutUrl ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                        <div>
                          <a href={localRutUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                            <Eye className="w-4 h-4 text-[#E60000]" />
                            <span>Ver Documento</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-xs text-amber-500 font-medium">Documento pendiente</span>
                        </div>
                      </>
                    )}
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingRut && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{localRutUrl ? 'Actualizar' : 'Subir'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'rut')} />
                  </label>
                </div>
              </div>
            </div>

            {/* CERTIFICACION BOX */}
            <div className="bg-[#0D0D0D] border border-[#222222] hover:border-[#333] transition-colors rounded-xl p-4 flex gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg h-fit border border-[#222]">
                <Building2 className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">Certificación bancaria</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight">Adjunta tu certificación<br className="hidden sm:block"/>bancaria actualizada.</p>
                  </div>
                </div>
                
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {localCertUrl ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                        <div>
                          <a href={localCertUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                            <Eye className="w-4 h-4 text-[#E60000]" />
                            <span>Ver Documento</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-xs text-amber-500 font-medium">Documento pendiente</span>
                        </div>
                      </>
                    )}
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingCert && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{localCertUrl ? 'Actualizar' : 'Subir'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'cert')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 flex gap-3 text-zinc-500 items-start bg-[#1A1A1A]/30 p-3 rounded-lg border border-[#222]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-zinc-300 font-semibold mr-1">Importante:</strong>
                El RUT y la certificación bancaria son necesarios para validar tu información y garantizar el correcto proceso de pago.
              </p>
            </div>

          </div>
        </div>

      </div>
      )}

      {showCuentasAndPagos && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* MIS CUENTAS DE COBRO */}
        <div id="seccion-pagos" className="xl:col-span-8 bg-transparent border border-[#222222] rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[#E60000] font-black tracking-widest text-xs uppercase">MIS CUENTAS DE COBRO</h3>
            <button onClick={() => setActiveTab('cuentas')} className="text-[#E60000] text-xs font-semibold hover:text-red-400 flex items-center gap-1 group">
              Ver todas <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* TABLE FOR DESKTOP */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500 border-b border-[#222222] text-[10px] tracking-widest uppercase font-bold">
                <tr>
                  <th className="pb-4 px-2">#</th>
                  <th className="pb-4">FECHA</th>
                  <th className="pb-4">CONCEPTO</th>
                  <th className="pb-4">VALOR</th>
                  <th className="pb-4">ESTADO</th>
                  <th className="pb-4">CUENTA DE COBRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">No tienes cuentas de cobro registradas.</td>
                  </tr>
                )}
                {historial.map((item: any, i) => {
                  const status = getStatusInfo(item);
                  return (
                  <tr key={item.id} className="text-zinc-300 hover:bg-[#1A1A1A]/30 transition-colors group">
                    <td className="py-5 px-2 text-zinc-500 text-xs font-mono">{i + 1}</td>
                    <td className="py-5 text-xs font-medium text-zinc-400">{item.fecha || (item.cobradoEl ? new Date(item.cobradoEl).toLocaleDateString() : 'N/A')}</td>
                    <td className="py-5 truncate max-w-[200px] text-xs font-medium text-zinc-300" title={item.descripcion || item.concepto}>{item.descripcion || item.concepto}</td>
                    <td className="py-5 font-black text-white tracking-wider">${Number(item.valor).toLocaleString('es-CO')}</td>
                    <td className="py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[10px] font-bold tracking-wide uppercase whitespace-nowrap ${status.colors}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-5 text-xs">
                      {status.isApproved || status.isPendingApproval ? (
                        <button onClick={() => handleViewCuenta(item)} disabled={loadingInvoiceId === item.id} className="flex items-center gap-1.5 text-[#E60000] hover:text-red-400 hover:underline disabled:opacity-50">
                          {loadingInvoiceId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                          Cuenta_00{i+1}.pdf 
                          <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </button>
                      ) : status.isPending ? (
                        <button onClick={() => handleCobrar(item)} className="px-3 py-1.5 bg-[#E60000]/10 text-[#E60000] border border-[#E60000]/20 hover:bg-[#E60000] hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50" disabled={loadingInvoiceId === item.id}>
                          {loadingInvoiceId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Cobrar y Firmar'}
                        </button>
                      ) : <span className="text-zinc-600">-</span>}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* CARDS FOR MOBILE */}
          <div className="md:hidden flex flex-col gap-4">
            {historial.length === 0 && (
              <div className="text-center text-zinc-500 py-6 text-sm">No tienes cuentas de cobro registradas.</div>
            )}
            {historial.map((item: any, i) => {
              const status = getStatusInfo(item);
              return (
              <div key={item.id} className="bg-[#0A0A0A] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[10px] font-bold tracking-wide uppercase whitespace-nowrap ${status.colors}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <span className="text-xs text-zinc-500">{item.fecha || (item.cobradoEl ? new Date(item.cobradoEl).toLocaleDateString() : 'N/A')}</span>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-medium">{item.descripcion || item.concepto}</h4>
                  <p className="text-white font-black text-base mt-1">${Number(item.valor).toLocaleString('es-CO')}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]">
                   {status.isApproved || status.isPendingApproval ? (
                      <button onClick={() => handleViewCuenta(item)} disabled={loadingInvoiceId === item.id} className="flex items-center gap-1.5 text-zinc-400 text-xs hover:text-white disabled:opacity-50">
                        {loadingInvoiceId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
                        Descargar cuenta de cobro
                      </button>
                    ) : status.isPending ? (
                      <button onClick={() => handleCobrar(item)} className="flex items-center gap-1.5 text-[#E60000] text-xs font-bold uppercase hover:text-red-400 disabled:opacity-50" disabled={loadingInvoiceId === item.id}>
                        {loadingInvoiceId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} 
                        Cobrar y Firmar
                      </button>
                    ) : <span className="text-zinc-600 text-xs">Sin cuenta de cobro</span>}
                </div>
              </div>
            )})}
          </div>
          
        </div>

        {/* RESUMEN DE PAGOS */}
        <div className="xl:col-span-4 bg-transparent border border-[#222222] rounded-xl p-6 flex flex-col">
          <h3 className="text-[#E60000] font-black tracking-widest text-xs uppercase mb-8">RESUMEN DE PAGOS</h3>
          
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-zinc-600 rounded-full"></div>
                <span className="text-zinc-400 text-sm font-medium leading-tight">Total cuentas de<br/>cobro</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-white text-sm font-bold mb-0.5">$</span>
                <span className="text-white font-black text-xl tracking-wider">{tAcumuladoDisplay.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-[#00ff00] rounded-full"></div>
                <span className="text-zinc-400 text-sm font-medium leading-tight">Total<br/>pagado</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-[#00ff00] text-sm font-bold mb-0.5">$</span>
                <span className="text-[#00ff00] font-black text-xl tracking-wider">{totalPagado.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-10 bg-orange-500 rounded-full"></div>
                <span className="text-zinc-400 text-sm font-medium leading-tight">Total<br/>pendiente</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-orange-500 text-sm font-bold mb-0.5">$</span>
                <span className="text-orange-500 font-black text-xl tracking-wider">{tSaldoDisplay.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="mt-4">
              <button className="w-full px-4 py-3.5 border border-[#333] hover:border-[#E60000] hover:bg-[#E60000]/5 text-white text-xs uppercase font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 group">
                Ver detalle completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>
      )}

      {/* MODAL DE CUENTA DE COBRO */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showInvoiceModal && invoiceData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center print:static print:bg-transparent print:h-auto print:overflow-visible print:block"
            >
              <div className="relative z-10 w-full max-w-4xl max-h-screen overflow-y-auto custom-scrollbar p-4 print:p-0 print:overflow-visible print:h-auto print:max-h-none">
                <CuentaDeCobro 
                  {...invoiceData} 
                  onClose={() => setShowInvoiceModal(false)} 
                  onConfirm={(firma) => {
                    if (invoiceData && !invoiceData.isHistorical) {
                      if (invoiceData.isNew) {
                        guardarNuevaCuenta(firma);
                      } else {
                        confirmarCobro(invoiceData.itemId, firma);
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
