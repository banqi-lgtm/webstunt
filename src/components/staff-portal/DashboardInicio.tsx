import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle, FileUp, Search, MessageCircle, ChevronRight, FileText, CheckCircle2, AlertCircle, AlertTriangle, Building2, Download, Eye, Calendar, Loader2, Sparkles } from 'lucide-react';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, setDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { CuentaDeCobro } from '../../app/(dashboard)/profile/CuentaDeCobro';
import { ConceptoAutocomplete } from '@/components/ConceptoAutocomplete';
import { getConceptoItem } from '@/lib/conceptosCatalogo';

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
  documentosRechazados?: string[];
  setDocumentosRechazados?: React.Dispatch<React.SetStateAction<string[]>>;
}

export function DashboardInicio({ activeTab, setActiveTab, rutUrl, certUrl, totalAcumulado, saldoPorCobrar, historial, userName, userDocument, userEmail, userUid, documentosRechazados = [], setDocumentosRechazados }: DashboardInicioProps) {
  
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showMissingDocsModal, setShowMissingDocsModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  const { toast } = useToast();
  const [isUpdatingRut, setIsUpdatingRut] = useState(false);
  const [isUpdatingCert, setIsUpdatingCert] = useState(false);

  const [localBanco, setLocalBanco] = useState('');
  const [localTipoCuenta, setLocalTipoCuenta] = useState('');
  const [localNumeroCuenta, setLocalNumeroCuenta] = useState('');

  const [showManualBankModal, setShowManualBankModal] = useState(false);
  const [pendingCertDownloadUrl, setPendingCertDownloadUrl] = useState<string | null>(null);
  const [manualBanco, setManualBanco] = useState('Nequi');
  const [manualTipoCuenta, setManualTipoCuenta] = useState('Ahorros');
  const [manualNumeroCuenta, setManualNumeroCuenta] = useState('');

  // Comprimir imagen a resolución balanceada (1600px, 0.88 quality) para agilizar OCR e IA
  const compressImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      };
      img.src = objectUrl;
    });
  };

  const handleSaveManualBank = async () => {
    const cleanNum = manualNumeroCuenta.replace(/\D/g, '').trim();
    if (!cleanNum) {
      toast({ title: "Campo requerido", description: "Por favor ingresa el número de cuenta.", variant: "destructive" });
      return;
    }
    try {
      const userRef = doc(db, 'users', userUid);
      const updateData: any = {
        banco: manualBanco,
        tipoCuenta: manualTipoCuenta,
        numeroCuenta: cleanNum,
      };
      if (pendingCertDownloadUrl) {
        updateData.certUrl = pendingCertDownloadUrl;
        setLocalCertUrl(pendingCertDownloadUrl);
      }
      const docKey = 'certBancaria';
      if (documentosRechazados.includes(docKey)) {
        updateData.documentosRechazados = arrayRemove(docKey);
      }
      await updateDoc(userRef, updateData);
      setLocalBanco(manualBanco);
      setLocalTipoCuenta(manualTipoCuenta);
      setLocalNumeroCuenta(cleanNum);
      if (setDocumentosRechazados && documentosRechazados.includes(docKey)) {
        setDocumentosRechazados(prev => prev.filter(k => k !== docKey));
      }
      setShowManualBankModal(false);
      setPendingCertDownloadUrl(null);
      toast({ title: "Datos Guardados", description: `${manualBanco} - ${manualTipoCuenta} N° ${cleanNum}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "No se pudieron guardar los datos.", variant: "destructive" });
    }
  };

  const handleUpdateDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'rut' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'rut') setIsUpdatingRut(true);
      if (type === 'cert') setIsUpdatingCert(true);

      const dataUrl = await compressImageIfNeeded(file);
      
      // Upload to Storage
      const storageRef = ref(storage, `users/${userUid}/${type}_${Date.now()}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      const body: any = {};
      if (type === 'rut') body.rutFile = { dataUrl, fileType: file.type || 'application/pdf' };
      if (type === 'cert') body.certFile = { dataUrl, fileType: file.type || 'application/pdf' };

      // Extract Data via AI
      toast({ title: "Procesando", description: `Analizando ${type.toUpperCase()} con IA...` });
      
      let data: any = {};
      try {
        const response = await fetch('/api/extract-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (response.ok) {
          data = await response.json();
          console.log("Raw AI Response:", data);
        } else {
          console.warn("AI extraction returned status:", response.status);
        }
      } catch (fErr) {
        console.warn("AI extraction fetch error:", fErr);
      }
      
      // Validar y normalizar
      if (type === 'rut') {
        if (!data.documentoIdentidad) {
          toast({ title: "Documento ilegible", description: "No pudimos extraer el NIT o cédula del RUT. Por favor revisa que el archivo sea nítido y vuelve a subirlo.", variant: "destructive" });
          return;
        }
      } else if (type === 'cert') {
        const cleanNum = String(data.numeroCuenta || '').replace(/\D/g, '');
        let detectedBank = data.banco;
        let detectedTipo = data.tipoCuenta || 'Ahorros';

        if (!detectedBank && cleanNum.length === 10 && cleanNum.startsWith('3')) {
          detectedBank = 'Nequi';
          detectedTipo = 'Ahorros';
        }

        if (!detectedBank || !cleanNum) {
          // Abrir modal de confirmación asistida sin bloquear al usuario
          setPendingCertDownloadUrl(downloadUrl);
          setManualBanco(detectedBank || 'Nequi');
          setManualTipoCuenta(detectedTipo || 'Ahorros');
          setManualNumeroCuenta(cleanNum || '');
          setShowManualBankModal(true);
          toast({ title: "Confirmar Datos Bancarios", description: "Verifica o completa los datos de tu cuenta para guardarla." });
          return;
        }

        data.banco = detectedBank;
        data.tipoCuenta = detectedTipo;
        data.numeroCuenta = cleanNum;
      }

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
        const cleanDoc = String(data.documentoIdentidad).replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
        updateData.numeroIdentificacion = cleanDoc;
        setLocalUserDocument(cleanDoc);
        toast({ title: "Datos extraídos", description: `Se actualizó el documento: ${cleanDoc}` });
      }
      if (data.nombreCompleto && type === 'rut') {
        updateData.nombreCompleto = data.nombreCompleto;
        updateData.nombre = data.nombreCompleto;
        if (data.nombres) updateData.nombres = data.nombres;
        if (data.apellidos) updateData.apellidos = data.apellidos;
        setLocalUserName(data.nombreCompleto);
        toast({ title: "Nombre extraído del RUT", description: data.nombreCompleto });
      }
      if (data.banco) {
        updateData.banco = data.banco;
        setLocalBanco(data.banco);
      }
      if (data.tipoCuenta) {
        updateData.tipoCuenta = data.tipoCuenta;
        setLocalTipoCuenta(data.tipoCuenta);
      }
      if (data.numeroCuenta) {
        updateData.numeroCuenta = data.numeroCuenta;
        setLocalNumeroCuenta(data.numeroCuenta);
      }
      if (data.ciudad) {
        updateData.ciudad = data.ciudad;
        setLocalUserCity(data.ciudad.replace(/[.,\s]+$/, '').trim());
      } else if (type === 'rut' && !updateData.ciudad && localUserCity) {
        updateData.ciudad = localUserCity;
      }

      const docKey = type === 'rut' ? 'rut' : 'certBancaria';
      if (documentosRechazados.includes(docKey)) {
        updateData.documentosRechazados = arrayRemove(docKey);
      }

      await updateDoc(userRef, updateData);
      
      // Optimizacion: actualizar estado local
      if (setDocumentosRechazados && documentosRechazados.includes(docKey)) {
        setDocumentosRechazados(prev => prev.filter(k => k !== docKey));
      }

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
  const [fechaEventoDesde, setFechaEventoDesde] = useState('');
  const [fechaEventoHasta, setFechaEventoHasta] = useState('');
  
  const [localUserName, setLocalUserName] = useState(userName || '');
  useEffect(() => {
    if (userName) setLocalUserName(userName);
  }, [userName]);

  const [localUserDocument, setLocalUserDocument] = useState(() => (userDocument || '').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim());
  useEffect(() => {
    if (userDocument) {
      setLocalUserDocument(userDocument.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim());
    }
  }, [userDocument]);
  
  const [localUserCity, setLocalUserCity] = useState('');
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userUid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.ciudad) {
            setLocalUserCity((d.ciudad || '').replace(/[.,\s]+$/, '').trim());
          }
          const fullName = d.nombreCompleto || `${d.nombres || ''} ${d.apellidos || ''}`.trim() || d.nombre || '';
          if (fullName) {
            setLocalUserName(fullName);
          }
          if (d.numeroIdentificacion) {
            setLocalUserDocument(String(d.numeroIdentificacion).replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim());
          }
          if (d.telefono || d.celular || d.telefonoContacto) {
            setTelefonoContacto(String(d.telefono || d.celular || d.telefonoContacto).trim());
          }
          if (d.banco) {
            setLocalBanco(String(d.banco).trim());
          }
          if (d.tipoCuenta) {
            setLocalTipoCuenta(String(d.tipoCuenta).trim());
          }
          if (d.numeroCuenta) {
            setLocalNumeroCuenta(String(d.numeroCuenta).trim());
          }
        }
      } catch(e) {}
    };
    fetchUserData();
  }, [userUid, userName]);
  
  const [localRutUrl, setLocalRutUrl] = useState(rutUrl);
  useEffect(() => setLocalRutUrl(rutUrl), [rutUrl]);
  
  const [localCertUrl, setLocalCertUrl] = useState(certUrl);
  useEffect(() => setLocalCertUrl(certUrl), [certUrl]);

  // Resolve Complete Titular (2 names, 2 surnames)
  const getResolvedTitular = (rawName: string, rawDoc?: string): string => {
    const clean = (rawDoc || '').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
    const upper = (rawName || '').toUpperCase();
    if (clean === '1000760142' || upper.includes('HANNA BERMUDEZ')) {
      return 'HANNA BERMUDEZ MARTINEZ';
    }
    if (clean === '1010096437' || upper.includes('GAVIRIA HERNANDEZ')) {
      return 'WILSON DANIEL GAVIRIA HERNANDEZ';
    }
    return rawName;
  };

  const handleCobrar = async (item: any) => {
    try {
      setLoadingInvoiceId(item.id);
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};

      const fullProfileName = localUserName || userData.nombreCompleto || `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() || userName;
      const cleanDoc = (userData.numeroIdentificacion || userData.documentoIdentidad || localUserDocument || userDocument || 'No registrado').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
      const resolvedCobradorNombre = getResolvedTitular(fullProfileName || item.asignadoANombre || 'Colaborador', cleanDoc);

      setInvoiceData({
        numero: item.id,
        fecha: item.creadoEl || new Date().toISOString(),
        cobradorNombre: resolvedCobradorNombre,
        cobradorDocumento: cleanDoc,
        cobradorTelefono: item.telefono || telefonoContacto || userData.telefono || userData.celular || 'No registrado',
        centroCosto: item.centroCosto || null,
        fechaEventoDesde: item.fechaEventoDesde || null,
        fechaEventoHasta: item.fechaEventoHasta || null,
        valorTotal: item.valor,
        conceptos: [{
          item: 1,
          descripcion: item.descripcion || item.concepto || 'Servicios prestados',
          valor: item.valor,
          fechaDesde: item.fechaEventoDesde || null,
          fechaHasta: item.fechaEventoHasta || null,
          retencionMotivo: item.retencionMotivo || null,
          retencionPorcentaje: item.retencionPorcentaje || null
        }],
        banco: localBanco || userData.banco || 'No registrado',
        tipoCuenta: localTipoCuenta || userData.tipoCuenta || 'No registrado',
        numeroCuenta: localNumeroCuenta || userData.numeroCuenta || 'No registrado',
        ciudad: (userData.ciudad || '').replace(/[.,\s]+$/, '').trim() || 'BELLO, ANTIOQUIA',
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
        estadoAprobacion: 'pendiente',
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

  const checkDocsBeforeTyping = (e: React.FocusEvent<HTMLInputElement>) => {
    const missingRut = !localRutUrl || documentosRechazados.includes('rut');
    const missingCert = !localCertUrl || documentosRechazados.includes('certBancaria');

    if (missingRut || missingCert) {
      e.target.blur();
      setShowMissingDocsModal(true);
    }
  };

  const handleContinuarCreacion = async () => {
    if (!localUserDocument || !localUserDocument.trim()) {
      toast({ title: "Atención", description: "Por favor ingresa tu número de documento.", variant: "destructive" });
      return;
    }

    if (!telefonoContacto || !telefonoContacto.trim()) {
      toast({ title: "Atención", description: "Por favor ingresa tu número de teléfono de contacto.", variant: "destructive" });
      return;
    }

    if (!concepto || !concepto.trim()) {
      toast({ title: "Atención", description: "Por favor ingresa un concepto.", variant: "destructive" });
      return;
    }

    if (!fechaEventoDesde || !fechaEventoDesde.trim()) {
      toast({ title: "Atención", description: "Por favor ingresa la fecha en la que se prestó el servicio (Desde).", variant: "destructive" });
      return;
    }

    if (!valorTotal || !valorTotal.trim()) {
      toast({ title: "Atención", description: "Por favor ingresa un valor total.", variant: "destructive" });
      return;
    }

    const missingRut = !localRutUrl || documentosRechazados.includes('rut');
    const missingCert = !localCertUrl || documentosRechazados.includes('certBancaria');

    if (missingRut || missingCert) {
      setShowMissingDocsModal(true);
      return;
    }

    try {
      setLoadingInvoiceId('new');
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};
      
      const numericValue = Number(valorTotal.replace(/\D/g, ''));

      const getInitials = (name: string) => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'XX';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      };
      
      const cleanDoc = (localUserDocument || userDocument || userData.numeroIdentificacion || 'No registrado').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
      const rawCobrador = (localUserName || userData.nombreCompleto || userData.nombres || userName).trim();
      const cobradorNombre = getResolvedTitular(rawCobrador, cleanDoc);
      const initials = getInitials(cobradorNombre);
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
      
      let nextNum = maxNum + 1;
      let generatedCodigoId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
      let codigoRef = doc(db, 'codigos', generatedCodigoId);
      let codigoSnap = await getDoc(codigoRef);
      
      while (codigoSnap.exists()) {
        nextNum++;
        generatedCodigoId = `${prefix}${nextNum.toString().padStart(3, '0')}`;
        codigoRef = doc(db, 'codigos', generatedCodigoId);
        codigoSnap = await getDoc(codigoRef);
      }

      setInvoiceData({
        numero: generatedCodigoId,
        fecha: fechaEmision,
        cobradorNombre: cobradorNombre,
        cobradorDocumento: cleanDoc,
        cobradorTelefono: telefonoContacto.trim(),
        centroCosto: null,
        fechaEventoDesde: fechaEventoDesde,
        fechaEventoHasta: fechaEventoHasta || null,
        valorTotal: numericValue,
        conceptos: [{
          item: 1,
          descripcion: concepto,
          valor: numericValue,
          fechaDesde: fechaEventoDesde,
          fechaHasta: fechaEventoHasta || null,
          retencionMotivo: null,
          retencionPorcentaje: null
        }],
        banco: localBanco || userData.banco || 'No registrado',
        tipoCuenta: localTipoCuenta || userData.tipoCuenta || 'No registrado',
        numeroCuenta: localNumeroCuenta || userData.numeroCuenta || 'No registrado',
        ciudad: (localUserCity || userData.ciudad || '').replace(/[.,\s]+$/, '').trim() || 'BELLO, ANTIOQUIA',
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
      // El ID ya fue generado y guardado en invoiceData.numero
      const generatedCodigoId = invoiceData?.numero || `PKS-XX000`;
      const numericValue = Number(valorTotal.replace(/\D/g, ''));
      const cityToSave = (localUserCity || '').replace(/[.,\s]+$/, '').trim() || 'BELLO, ANTIOQUIA';
      const docToSave = (localUserDocument || userDocument || '').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();
      const rawCobrador = (localUserName || invoiceData?.cobradorNombre || userName).trim();
      const cobradorNombre = getResolvedTitular(rawCobrador, docToSave);

      const matchedConcepto = getConceptoItem(concepto);
      const codigoContable = matchedConcepto ? matchedConcepto.codigo : null;
      const conceptoFinalParaGuardar = matchedConcepto && !concepto.startsWith(matchedConcepto.codigo) 
        ? `${matchedConcepto.codigo} - ${concepto}`
        : concepto;

      await setDoc(doc(db, 'codigos', generatedCodigoId), {
        asignadoAUid: userUid,
        asignadoANombre: cobradorNombre,
        cobradoPor: cobradorNombre,
        cobradoPorUid: userUid,
        documentoIdentificacion: docToSave,
        telefono: telefonoContacto.trim(),
        concepto: conceptoFinalParaGuardar,
        descripcion: conceptoFinalParaGuardar,
        codigoConcepto: codigoContable,
        codigoContable: codigoContable,
        valor: numericValue,
        retencionMotivo: null,
        retencionPorcentaje: null,
        estado: 'cobrado', // Ya fue firmada por el usuario
        estadoAprobacion: 'pendiente',
        firmaGenerada: firma,
        creadoEl: new Date().toISOString(),
        cobradoEl: new Date().toISOString(),
        fechaEmision: fechaEmision,
        centroCosto: 'PENDIENTE',
        fechaEventoDesde: fechaEventoDesde || null,
        fechaEventoHasta: fechaEventoHasta || null,
        ciudad: cityToSave
      });

      const userUpdatePayload: any = { 
        ciudad: cityToSave,
        telefono: telefonoContacto.trim()
      };
      if (cobradorNombre) {
        userUpdatePayload.nombreCompleto = cobradorNombre;
        userUpdatePayload.nombre = cobradorNombre;
      }
      if (docToSave) {
        userUpdatePayload.numeroIdentificacion = docToSave;
      }
      await updateDoc(doc(db, 'users', userUid), userUpdatePayload).catch(() => {});
      
      toast({ title: 'Éxito', description: 'Cuenta de cobro creada y enviada a revisión.' });
      setShowInvoiceModal(false);
      setConcepto('');
      setValorTotal('');
      setFechaEventoDesde('');
      setFechaEventoHasta('');
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

      const fullProfileName = localUserName || userData.nombreCompleto || `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() || userName;
      const rawDoc = item.documentoIdentificacion || userData.numeroIdentificacion || userData.documentoIdentidad || localUserDocument || userDocument || 'No registrado';
      const cleanDoc = rawDoc !== 'No registrado' ? rawDoc.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim() : rawDoc;
      const resolvedCobradorNombre = getResolvedTitular(fullProfileName || item.cobradoPor || item.asignadoANombre || 'Colaborador', cleanDoc);

      setInvoiceData({
        numero: item.id,
        fecha: item.fechaEmision || item.cobradoEl || item.creadoEl,
        cobradorNombre: resolvedCobradorNombre,
        cobradorDocumento: cleanDoc,
        cobradorTelefono: item.telefono || userData.telefono || userData.celular || 'No registrado',
        centroCosto: item.centroCosto || null,
        fechaEventoDesde: item.fechaEventoDesde || null,
        fechaEventoHasta: item.fechaEventoHasta || null,
        valorTotal: item.valor,
        conceptos: [{
          item: 1,
          descripcion: item.descripcion || 'Servicios prestados',
          valor: item.valor,
          fechaDesde: item.fechaEventoDesde || null,
          fechaHasta: item.fechaEventoHasta || null,
          retencionMotivo: item.retencionMotivo || null,
          retencionPorcentaje: item.retencionPorcentaje || null
        }],
        banco: localBanco || userData.banco || 'No registrado',
        tipoCuenta: localTipoCuenta || userData.tipoCuenta || 'No registrado',
        numeroCuenta: localNumeroCuenta || userData.numeroCuenta || 'No registrado',
        ciudad: (userData.ciudad || '').replace(/[.,\s]+$/, '').trim() || 'BELLO, ANTIOQUIA',
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
    // Si la cuenta está 'disponible' pero ya tiene firma, significa que fue radicada por el usuario
    const effectiveState = (item.estado === 'disponible' && item.firmaGenerada) ? 'cobrado' : item.estado;

    const isPending = effectiveState === 'disponible' || effectiveState === 'PENDIENTE DE PAGO';
    const isApproved = effectiveState === 'pagado' || effectiveState === 'PAGADO' || item.estadoAprobacion === 'aprobado';
    const isPendingApproval = effectiveState === 'cobrado' && !isApproved;

    if (isPending) return { label: 'PENDIENTE DE PAGO', colors: 'border-zinc-700 bg-[#1A1A1A] text-zinc-400', dot: 'bg-zinc-500', isPending, isApproved, isPendingApproval };
    if (isPendingApproval) return { label: 'PENDIENTE POR APROBACIÓN', colors: 'border-amber-500/30 bg-amber-500/10 text-amber-500', dot: 'bg-amber-500', isPending, isApproved, isPendingApproval };
    if (isApproved) return { label: 'PAGADO', colors: 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00]', dot: 'bg-[#00ff00]', isPending, isApproved, isPendingApproval };
    
    return { label: effectiveState, colors: 'border-zinc-700 bg-[#1A1A1A] text-zinc-400', dot: 'bg-zinc-500', isPending: false, isApproved: false, isPendingApproval: false };
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
              <label className="text-[11px] font-medium text-zinc-400">Número de documento <span className="text-[#E60000] font-bold">*</span></label>
              <input 
                type="text" 
                value={localRutUrl ? (localUserDocument ? localUserDocument.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim() : '') : ''} 
                placeholder="Se extraerá de tu RUT" 
                onChange={(e) => setLocalUserDocument(e.target.value.replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim())}
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] outline-none transition-all font-inter" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Nombre completo (Extraído del RUT o editable)</label>
              <input 
                type="text" 
                value={localUserName} 
                onChange={(e) => setLocalUserName(e.target.value.toUpperCase())} 
                placeholder="Se extraerá de tu RUT o escribe tu nombre" 
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-inter uppercase" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Correo electrónico</label>
              <input type="email" defaultValue={userEmail || ''} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Teléfono de contacto <span className="text-[#E60000] font-bold">*</span></label>
              <input type="text" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} placeholder="Ej: 300 123 4567" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Ciudad (Extraída del RUT o editable)</label>
              <input 
                type="text" 
                value={localUserCity} 
                onChange={(e) => setLocalUserCity(e.target.value.toUpperCase())} 
                placeholder="Ej. BELLO, MEDELLÍN, BOGOTÁ..." 
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-inter" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-medium text-zinc-400">Concepto de la cuenta de cobro <span className="text-[#E60000] font-bold">*</span></label>
              <ConceptoAutocomplete
                value={concepto}
                onChange={setConcepto}
                onFocus={checkDocsBeforeTyping}
                placeholder="Ej. Servicios de producción evento Copa Stunt"
                className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* RENGLÓN DINÁMICO: PERIODO DE PRESTACIÓN DEL SERVICIO (FECHAS) */}
            {concepto.trim().length > 0 && (
              <div className="col-span-1 md:col-span-2 bg-[#0D0D0D] border border-[#262626] rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#E60000] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#E60000]" /> Periodo de prestación del servicio (fechas) <span className="text-[#E60000]">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-medium">Requerido para la prestación del servicio</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-medium">Fecha en la que se prestó el servicio (Desde) <span className="text-[#E60000] font-bold">*</span></label>
                    <input
                      type="date"
                      required
                      value={fechaEventoDesde}
                      onChange={(e) => {
                        setFechaEventoDesde(e.target.value);
                      }}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-3.5 py-2.5 text-white text-xs hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-medium">Fecha fin del servicio (Hasta)</label>
                    <input
                      type="date"
                      value={fechaEventoHasta}
                      onChange={(e) => setFechaEventoHasta(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-3.5 py-2.5 text-white text-xs hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Valor total <span className="text-[#E60000] font-bold">*</span></label>
              <input type="text" onFocus={checkDocsBeforeTyping} value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="$ 2.500.000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-mono" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">Fecha de emisión</label>
                <span className="text-[10px] text-zinc-500">🔒 Fija (Se confirma al aprobar)</span>
              </div>
              <div className="relative">
                <input type="date" value={fechaEmision} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm outline-none transition-all appearance-none opacity-80 cursor-not-allowed" />
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
                      documentosRechazados.includes('rut') ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <span className="text-xs text-red-500 font-bold">Rechazado, volver a subir</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                          <div>
                            <a href={localRutUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                              <Eye className="w-4 h-4 text-[#E60000]" />
                              <span>Ver Documento</span>
                            </a>
                          </div>
                        </>
                      )
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
                      documentosRechazados.includes('certBancaria') ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <span className="text-xs text-red-500 font-bold">Rechazado, volver a subir</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                          <div>
                            <a href={localCertUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                              <Eye className="w-4 h-4 text-[#E60000]" />
                              <span>Ver Documento</span>
                            </a>
                          </div>
                        </>
                      )
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

      {/* MODAL DOCUMENTOS FALTANTES */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showMissingDocsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111] border border-[#222] rounded-xl p-8 max-w-md w-full text-center relative shadow-2xl shadow-red-900/20"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Documentos Pendientes</h3>
                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                  Para poder radicar tu cuenta de cobro, es obligatorio que subas tu <strong className="text-white">RUT</strong> y <strong className="text-white">Certificación Bancaria</strong> actualizados.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setShowMissingDocsModal(false);
                      document.getElementById('seccion-documentos')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full bg-[#E60000] hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                  >
                    Subir Documentos Ahora
                  </button>
                  <button 
                    onClick={() => setShowMissingDocsModal(false)}
                    className="w-full bg-transparent hover:bg-white/5 text-zinc-400 font-medium py-3 rounded-lg transition-colors border border-transparent hover:border-[#333]"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL CONFIRMAR DATOS BANCARIOS */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showManualBankModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111] border border-[#222] rounded-xl p-6 max-w-md w-full relative shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Confirmar Datos Bancarios</h3>
                    <p className="text-zinc-400 text-xs">Completa o verifica la información de tu certificación:</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Banco
                    </label>
                    <select
                      value={manualBanco}
                      onChange={(e) => setManualBanco(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Nequi">Nequi</option>
                      <option value="Bancolombia">Bancolombia</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Davivienda">Davivienda</option>
                      <option value="Banco de Bogotá">Banco de Bogotá</option>
                      <option value="Nu">Nu</option>
                      <option value="Lulo Bank">Lulo Bank</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Banco de Occidente">Banco de Occidente</option>
                      <option value="Banco Popular">Banco Popular</option>
                      <option value="Banco AV Villas">Banco AV Villas</option>
                      <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                      <option value="Banco Falabella">Banco Falabella</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={manualTipoCuenta}
                      onChange={(e) => setManualTipoCuenta(e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Ahorros">Ahorros</option>
                      <option value="Corriente">Corriente</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                      Número de Cuenta / Celular
                    </label>
                    <input
                      type="text"
                      value={manualNumeroCuenta}
                      onChange={(e) => setManualNumeroCuenta(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 3123456789 o 03112345678"
                      className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-zinc-600"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Solo números, sin guiones ni espacios.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowManualBankModal(false);
                      setPendingCertDownloadUrl(null);
                    }}
                    className="flex-1 bg-transparent hover:bg-white/5 text-zinc-400 font-medium py-2.5 rounded-lg border border-[#27272a] transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveManualBank}
                    className="flex-1 bg-[#E60000] hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg text-sm"
                  >
                    Guardar y Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
