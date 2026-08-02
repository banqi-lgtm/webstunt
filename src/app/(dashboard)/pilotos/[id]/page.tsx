'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, orderBy, limit, getDocs, setDoc, where } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, FileText, User, Camera, ShieldAlert, Settings, MapPin, XCircle, ChevronRight, AlertCircle, Phone, Download, Map, LayoutList, Fingerprint, Info, HeartPulse, Stethoscope, AlertTriangle, Syringe, Clock, Link as LinkIcon, Instagram, Star, Plus, ScanLine, Edit2, RefreshCw, Eye, FileCheck2, Bike, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import SocialMediaCard from '@/components/social-media-card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PilotDetail {
  id: string;
  uid: string;
  categoria: string;
  participacionPrevia: string;
  patrocinadores: boolean;
  inquietudes: string;
  motocicleta: {
    placa: string;
    marca: string;
    referencia: string;
  };
  documentos: {
    idUrl: string;
    placaUrl: string;
    propiedadUrl: string;
    soatUrl: string;
    deportistaUrl: string;
    videoUrl?: string;
  };
  registradoEl: string;
  estadoPago: string;
  comprobanteUrl?: string;
  comprobanteSaldoUrl?: string;
  saldoFaltante?: string;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  fechaNacimiento: string;
  instagram: string;
  redesSociales: string;
  seudonimo: string;
  tipoDocumento: string;
  nombreTutor?: string;
  cedulaTutor?: string;
  telefonoTutor?: string;
  correoTutor?: string;
  parentescoTutor?: string;
  rol: string;
  documentosRechazados?: string[];
  motivoSaldoFaltante?: string;
  historialSaldos?: string[];
  tipoSangre: string;
  eps: string;
  alergias: string;
  templateConfig?: any;
  codigosGenerados?: any[];
  rutUrl?: string;
  certUrl?: string;
}

export default function PilotDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [pilot, setPilot] = useState<PilotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // States para el modal de códigos
  const [showCodigoDetallesModal, setShowCodigoDetallesModal] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<any>(null);
  const [editValor, setEditValor] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCentroCosto, setEditCentroCosto] = useState('');
  const [editRetencionMotivo, setEditRetencionMotivo] = useState('');
  const [editRetencionPorcentaje, setEditRetencionPorcentaje] = useState('');
  const [centrosCostoList, setCentrosCostoList] = useState<string[]>([]);
  const [isCalculatingRetencion, setIsCalculatingRetencion] = useState(false);
  const [isSaldoDialogOpen, setIsSaldoDialogOpen] = useState(false);
  const [saldoAmount, setSaldoAmount] = useState('');
  const [motivoSaldo, setMotivoSaldo] = useState<string>('Fecha de pago después del 11 de mayo $350.000');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'piloto' | 'staff' | 'juez'>('piloto');
  const [isAdmin, setIsAdmin] = useState(false);

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
        
        const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '') || interfaces.includes('admin');
        setIsAdmin(isSuperAdmin);

        if (isSuperAdmin || interfaces.includes('pilotos')) {
          setHasAccess(true);
          fetchPilotData();
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

  const fetchPilotData = async () => {
    try {
      const regDoc = await getDoc(doc(db, 'event_registrations', id));
      const isRegExists = regDoc.exists();
      const data = isRegExists ? regDoc.data() : {};
      
      const extractedUid = data.uid || id.replace(/^(f2r|festival|nitrox)_/, '');

      if (!extractedUid) {
        toast({ title: 'Error', description: 'Piloto no válido', variant: 'destructive'});
        router.push('/pilotos');
        return;
      }
      
      const userDoc = await getDoc(doc(db, 'users', extractedUid));
      
      if (!isRegExists && !userDoc.exists()) {
        toast({ title: 'Error', description: 'Registro no encontrado', variant: 'destructive'});
        router.push('/pilotos');
        return;
      }

      const userData = userDoc.exists() ? userDoc.data() : {};

      // Load centros de costo para el modal
      try {
        const snapCC = await getDocs(collection(db, 'centrosCosto'));
        const fetchedCC: string[] = [];
        snapCC.forEach(docSnap => {
          fetchedCC.push(docSnap.data().nombre || docSnap.id);
        });
        setCentrosCostoList(fetchedCC);
      } catch (e) {
        console.error("Error fetching centrosCosto", e);
      }

      let rutUrl = userData.rutUrl || '';
      let certUrl = userData.certUrl || '';

      const qCodigos = query(collection(db, 'codigos'), where('asignadoAUid', '==', extractedUid));
      const snapCodigos = await getDocs(qCodigos);
      const fetchedCodigos = snapCodigos.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setPilot({
        id: regDoc.id,
        uid: extractedUid,
        categoria: data.categoria || 'N/A',
        participacionPrevia: data.participacionPrevia || 'N/A',
        patrocinadores: data.patrocinadores || false,
        inquietudes: data.inquietudes || 'Ninguna',
        motocicleta: data.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
        documentos: { idUrl: '', placaUrl: '', propiedadUrl: '', soatUrl: '', deportistaUrl: '', videoUrl: '', ...data.documentos },
        registradoEl: data.registradoEl || '',
        estadoPago: data.estadoPago || 'pendiente',
        comprobanteUrl: data.comprobanteUrl || '',
        comprobanteSaldoUrl: data.comprobanteSaldoUrl || '',
        saldoFaltante: data.saldoFaltante || '',
        motivoSaldoFaltante: data.motivoSaldoFaltante || '',
        historialSaldos: data.historialSaldos || [],
        nombres: userData.nombres || 'Desconocido',
        apellidos: userData.apellidos || '',
        email: userData.email || 'N/A',
        numeroIdentificacion: userData.numeroIdentificacion || 'N/A',
        telefono: userData.telefono || 'N/A',
        ciudad: userData.ciudad || 'N/A',
        direccion: userData.direccion || 'N/A',
        fechaNacimiento: userData.fechaNacimiento || 'N/A',
        instagram: userData.instagram || 'N/A',
        redesSociales: userData.redesSociales || 'N/A',
        seudonimo: userData.seudonimo || 'N/A',
        tipoDocumento: userData.tipoDocumento || 'CC',
        nombreTutor: userData.nombreTutor || '',
        cedulaTutor: userData.cedulaTutor || '',
        telefonoTutor: userData.telefonoTutor || '',
        correoTutor: userData.correoTutor || '',
        parentescoTutor: userData.parentescoTutor || '',
        rol: userData.rol || 'piloto',
        documentosRechazados: Array.from(new Set([...(data.documentosRechazados || []), ...(userData.documentosRechazados || [])])),
        templateConfig: data.templateConfig || null,
        tipoSangre: userData.tipoSangre || 'N/A',
        eps: userData.eps || 'N/A',
        alergias: userData.alergias || 'N/A',
        codigosGenerados: fetchedCodigos,
        rutUrl,
        certUrl
      });
      
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo cargar la información del piloto', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (status: 'aprobado' | 'rechazado' | 'en_revision' | 'rechazado_saldo' | 'pago_dia_evento') => {
    if (!pilot) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'event_registrations', pilot.id), { estadoPago: status });
      setPilot({ ...pilot, estadoPago: status });
      
      if (status === 'aprobado' || status === 'pago_dia_evento') {
        try {
          const qrDocRef = doc(db, 'listas_QR', pilot.id);
          const qrDocSnap = await getDoc(qrDocRef);
          
          if (!qrDocSnap.exists()) {
            const q = query(collection(db, 'listas_QR'), orderBy('kitNumber', 'desc'), limit(1));
            const snap = await getDocs(q);
            let nextKitNumber = 1;
            if (!snap.empty) {
              nextKitNumber = snap.docs[0].data().kitNumber + 1;
            }
            
            await setDoc(qrDocRef, {
              uid: pilot.uid,
              pilotId: pilot.id,
              nombres: pilot.nombres,
              apellidos: pilot.apellidos,
              categoria: Array.isArray(pilot.categoria) ? pilot.categoria.join(' / ') : pilot.categoria,
              kitNumber: nextKitNumber,
              kitEntregado: false,
              aprobadoEl: new Date().toISOString()
            });
            console.log(`Asignado Kit #${nextKitNumber} al piloto ${pilot.nombres}`);
          }
        } catch (qrErr) {
          console.error("Error al asignar kit en listas_QR:", qrErr);
        }

        fetch('/api/send-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pilot.email,
            nombre: pilot.nombres,
            estadoPago: status,
            eventId: pilot.id.split('_')[0]
          })
        }).catch(err => console.error('Error al enviar correo:', err));
        
        if (status === 'aprobado') {
          toast({ title: 'Pago Aprobado', description: 'El piloto ya tiene acceso a su código QR y se envió el correo.' });
        } else {
          toast({ title: 'Aprobado Especial', description: 'El piloto debe pagar el día del evento. Se envió correo.' });
        }
      } else if (status === 'rechazado' || status === 'rechazado_saldo') {
        fetch('/api/send-rejection-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pilot.email,
            nombre: pilot.nombres,
            estadoPago: status,
            eventId: pilot.id.split('_')[0]
          })
        }).catch(err => console.error('Error al enviar correo de rechazo:', err));

        if (status === 'rechazado') {
          toast({ title: 'Pago Rechazado', description: 'El estado de pago ha sido marcado como rechazado. Se envió correo.' });
        } else {
          toast({ title: 'Saldo Rechazado', description: 'El comprobante de saldo ha sido rechazado. Se envió correo.' });
        }
      } else {
        toast({ title: 'Revertido', description: 'El pago ha vuelto a revisión.' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado de pago.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const openCodigoDetalles = (codigo: any) => {
    setSelectedCodigo(codigo);
    setEditValor(codigo.valor ? codigo.valor.toString() : '');
    setEditDescripcion(codigo.descripcion || '');
    setEditCentroCosto(codigo.centroCosto || '');
    setEditRetencionMotivo(codigo.retencionMotivo || '');
    setEditRetencionPorcentaje(codigo.retencionPorcentaje ? codigo.retencionPorcentaje.toString() : '');
    setShowCodigoDetallesModal(true);
  };

  const handleAprobarCodigo = async () => {
    if (!selectedCodigo) return;
    try {
      await updateDoc(doc(db, 'codigos', selectedCodigo.id), {
        valor: Number(editValor),
        descripcion: editDescripcion,
        centroCosto: editCentroCosto,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        estadoAprobacion: 'aprobado'
      });
      const updated = pilot?.codigosGenerados?.map((c: any) => c.id === selectedCodigo.id ? { 
        ...c, 
        valor: Number(editValor),
        descripcion: editDescripcion,
        centroCosto: editCentroCosto,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        estadoAprobacion: 'aprobado' 
      } : c);
      setPilot(pilot ? { ...pilot, codigosGenerados: updated } : null);
      toast({ title: "Código aprobado" });
      setShowCodigoDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al aprobar", variant: "destructive" });
    }
  };

  const handleRechazarCodigo = async () => {
    if (!selectedCodigo) return;
    try {
      await updateDoc(doc(db, 'codigos', selectedCodigo.id), {
        estadoAprobacion: 'rechazado'
      });
      const updated = pilot?.codigosGenerados?.map((c: any) => c.id === selectedCodigo.id ? { ...c, estadoAprobacion: 'rechazado' } : c);
      setPilot(pilot ? { ...pilot, codigosGenerados: updated } : null);
      toast({ title: "Código rechazado" });
      setShowCodigoDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al rechazar", variant: "destructive" });
    }
  };

  const handleUpdateCodigo = async () => {
    if (!selectedCodigo) return;
    try {
      await updateDoc(doc(db, 'codigos', selectedCodigo.id), {
        valor: Number(editValor),
        descripcion: editDescripcion,
        centroCosto: editCentroCosto,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null
      });
      const updated = pilot?.codigosGenerados?.map((c: any) => c.id === selectedCodigo.id ? { 
        ...c, 
        valor: Number(editValor),
        descripcion: editDescripcion,
        centroCosto: editCentroCosto,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null
      } : c);
      setPilot(pilot ? { ...pilot, codigosGenerados: updated } : null);
      toast({ title: "Cambios guardados" });
      setShowCodigoDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleReportarSaldo = async () => {
    if (!pilot || !saldoAmount) return;
    
    const finalMotivo = motivoSaldo === 'Otra' ? motivoPersonalizado : motivoSaldo;
    if (motivoSaldo === 'Otra' && !motivoPersonalizado.trim()) {
      toast({ title: "Atención", description: "Debes escribir el motivo del saldo", variant: "destructive" });
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'event_registrations', pilot.id), { 
        estadoPago: 'saldo_pendiente',
        saldoFaltante: saldoAmount,
        motivoSaldoFaltante: finalMotivo
      });
      setPilot({ ...pilot, estadoPago: 'saldo_pendiente', saldoFaltante: saldoAmount, motivoSaldoFaltante: finalMotivo });
      
      fetch('/api/send-balance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pilot.email,
          nombre: pilot.nombres,
          saldoAmount: saldoAmount,
          motivo: finalMotivo,
          eventId: pilot.id.split('_')[0]
        })
      }).catch(err => console.error('Error al enviar correo de saldo:', err));

      setIsSaldoDialogOpen(false);
      toast({ title: 'Saldo Reportado', description: `Se ha notificado al piloto por correo que debe $${saldoAmount}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo reportar el saldo.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeRole = async () => {
    if (!pilot || !isAdmin) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', pilot.uid), { rol: newRole });
      
      // Cerrar el modal primero para evitar conflictos de animación de Radix UI
      setIsRoleDialogOpen(false);
      
      // Retrasar la actualización visual un instante para que el modal se cierre limpiamente
      setTimeout(() => {
        setPilot(prev => prev ? { ...prev, rol: newRole } : null);
        toast({ title: 'Rol Actualizado', description: `El usuario ahora tiene el rol de ${newRole.toUpperCase()}.` });
        setUpdating(false);
      }, 150);
      
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo actualizar el rol.', variant: 'destructive' });
      setUpdating(false);
    }
  };

  const handleDeletePilot = async () => {
    if (!pilot || !isAdmin) return;
    
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${pilot.nombres} ${pilot.apellidos} por completo del sistema? Esta acción no se puede deshacer.`)) return;

    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'event_registrations', pilot.id));
      await deleteDoc(doc(db, 'users', pilot.uid));
      
      toast({ title: 'Usuario Eliminado', description: 'El registro y el perfil han sido borrados de la base de datos.' });
      router.push('/pilotos');
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo eliminar al usuario. Es posible que no tengas permisos.', variant: 'destructive' });
      setUpdating(false);
    }
  };

  const toggleDocumentStatus = async (docKey: string, isRejected: boolean) => {
    if (!pilot || !isAdmin) return;
    setUpdating(true);
    try {
      const isStaffDoc = docKey === 'rut' || docKey === 'certBancaria';
      const collectionName = isStaffDoc ? 'users' : 'event_registrations';
      const docId = isStaffDoc ? pilot.uid : pilot.id;
      const docRef = doc(db, collectionName, docId);

      if (isRejected) {
        // Deshacer rechazo
        await updateDoc(docRef, { documentosRechazados: arrayRemove(docKey) });
        setPilot({ ...pilot, documentosRechazados: (pilot.documentosRechazados || []).filter(k => k !== docKey) });
        toast({ title: 'Documento Aprobado', description: 'Se ha removido la marca de corrección.' });
      } else {
        // Rechazar
        await updateDoc(docRef, { documentosRechazados: arrayUnion(docKey) });
        setPilot({ ...pilot, documentosRechazados: [...(pilot.documentosRechazados || []), docKey] });
        toast({ title: 'Documento Rechazado', description: 'El usuario ha sido notificado para corregir este documento.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del documento.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateCategory = async (newCategory: string) => {
    if (!pilot || !isAdmin) return;
    setUpdating(true);
    try {
      const newCats = [newCategory];
      await updateDoc(doc(db, 'event_registrations', pilot.id), {
        categoria: newCats
      });
      setPilot({ ...pilot, categoria: newCats as any });
      toast({ title: 'Categoría actualizada', description: 'La categoría se ha actualizado exitosamente.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo actualizar la categoría.', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  if (hasAccess === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        Cargando detalles...
      </div>
    );
  }

  if (!pilot) return null;

  const isSimplified = pilot.id.startsWith('festival_') || pilot.id.startsWith('nitrox_');
  const isDocsComplete = isSimplified 
    ? (pilot.id.startsWith('festival_')
        ? !!(pilot.documentos.idUrl && pilot.documentos.deportistaUrl && pilot.documentos.videoUrl)
        : !!(pilot.documentos.idUrl && pilot.documentos.deportistaUrl))
    : !!(pilot.documentos.idUrl && pilot.documentos.placaUrl && pilot.documentos.propiedadUrl && pilot.documentos.soatUrl && pilot.documentos.deportistaUrl);
  const isPaymentApproved = pilot.estadoPago === 'aprobado' || pilot.estadoPago === 'pago_dia_evento';
  const isAllGreen = isDocsComplete && isPaymentApproved;

  const DocumentPreview = ({ title, url, docKey, hideTitle }: { title: string, url?: string, docKey?: string, hideTitle?: boolean }) => {
    if (!url) return (
      <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 text-xs h-32 gap-2 text-center">
        <AlertCircle className="w-5 h-5 text-zinc-600" />
        Falta adjunto
      </div>
    );
    
    const isRejected = docKey ? pilot.documentosRechazados?.includes(docKey) : false;

    const handleDownloadImage = async (e: React.MouseEvent) => {
      e.preventDefault();
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const extension = blob.type.split('/')[1] || 'jpg';
        const safeName = `${pilot.nombres}_${pilot.apellidos}`.replace(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]/g, '_').replace(/_+/g, '_');
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
        a.download = `${safeName}_${safeTitle}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.error('Error downloading image', err);
        window.open(url, '_blank');
      }
    };

    return (
      <div className="flex flex-col gap-1.5 h-full">
        {!hideTitle && (
          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 truncate">{title}</span>
            {isRejected && <span className="text-[9px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Rechazado</span>}
          </div>
        )}
        <div className={`relative h-32 flex-grow bg-zinc-900 border rounded-lg overflow-hidden flex items-center justify-center transition-colors group ${isRejected ? 'border-red-500' : 'border-zinc-700 hover:border-red-600'}`}>
          {docKey === 'video' ? (
            <video src={url} className="object-cover w-full h-full" muted playsInline preload="metadata" />
          ) : (
            <img src={url} alt={title} className="object-cover w-full h-full" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement?.classList.add('bg-zinc-800');
              (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML('beforeend', '<div class="text-zinc-500 flex flex-col items-center"><svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><span class="text-[10px] uppercase font-bold tracking-widest">PDF</span></div>');
            }}/>
          )}
          
          {/* Overlay de acciones */}
          <div className="absolute inset-0 bg-black/60 transition-opacity z-10 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <a href={url} target="_blank" rel="noopener noreferrer" className="bg-zinc-800 hover:bg-zinc-700 p-2.5 rounded-full transition-transform hover:scale-110 shadow-lg text-white" title="Ver documento">
              <Eye className="w-5 h-5" />
            </a>
            <button onClick={handleDownloadImage} className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-full transition-transform hover:scale-110 shadow-lg text-white" title="Descargar documento">
              <Download className="w-5 h-5" />
            </button>
            {isAdmin && docKey && (
              <button 
                onClick={() => toggleDocumentStatus(docKey, !!isRejected)} 
                disabled={updating}
                className={`${isRejected ? 'bg-red-600 hover:bg-red-600' : 'bg-red-600 hover:bg-red-500'} p-2.5 rounded-full transition-transform hover:scale-110 shadow-lg text-white disabled:opacity-50`}
                title={isRejected ? "Deshacer rechazo" : "Rechazar documento (Pedir corregir)"}
              >
                {isRejected ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (pilot.rol === 'staff') {
    return (
      <div className="min-h-screen bg-[#050816] font-sans pb-12">
        {/* Navigation & Utilities */}
        <div className="sticky top-0 z-50 bg-[#050816]/90 backdrop-blur-md border-b border-[#1F1F1F]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/staff">
              <Button variant="ghost" className="text-[#64748B] hover:text-white hover:bg-[#151515] text-sm gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Directorio de Staff
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-[#0D0D0D] border border-[#22C55E]/50 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-[#22C55E]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{pilot.nombres} {pilot.apellidos}</h1>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#6B21A8]/20 text-[10px] font-bold text-[#D8B4FE] uppercase border border-[#6B21A8]/30">
                  <Star className="w-3 h-3" /> STAFF
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C55E]/10 font-bold text-[#22C55E] uppercase border border-[#22C55E]/20">
                  N/A
                </span>
                <span className="text-[#64748B]">•</span>
                <p className="text-[#64748B]">{pilot.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Documentos */}
              <div className="bg-[#0D0D0D] rounded-xl border border-[#1F1F1F] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#A855F7]" />
                  <h2 className="font-semibold text-base text-white">Documentos de Staff (RUT, CERT BANCARIA, DATOS)</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* RUT */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#64748B] font-medium tracking-wide">RUT - {pilot.rutUrl ? <span className="text-[#22C55E]">Validated</span> : <span className="text-[#EF4444]">Faltante</span>}</span>
                      </div>
                      <div className="h-32 w-full bg-white rounded-md overflow-hidden relative border border-[#1F1F1F]">
                        {pilot.rutUrl ? (
                          <DocumentPreview title="RUT" url={pilot.rutUrl} docKey="rut" hideTitle />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#151515]">
                            <AlertCircle className="w-6 h-6 text-[#64748B] mb-2" />
                            <span className="text-xs text-[#64748B]">Sin subir</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cert. Bancaria */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#64748B] font-medium tracking-wide">CERTIFICACIÓN BANCARIA - {pilot.certUrl ? <span className="text-[#22C55E]">Validated</span> : <span className="text-[#EF4444]">Faltante</span>}</span>
                      </div>
                      <div className="h-32 w-full bg-white rounded-md overflow-hidden relative border border-[#1F1F1F]">
                        {pilot.certUrl ? (
                          <DocumentPreview title="Cert. Bancaria" url={pilot.certUrl} docKey="certBancaria" hideTitle />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#151515]">
                            <AlertCircle className="w-6 h-6 text-[#64748B] mb-2" />
                            <span className="text-xs text-[#64748B]">Sin subir</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Personales */}
              <div className="bg-[#0D0D0D] rounded-xl border border-[#1F1F1F] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#64748B]" />
                  <h2 className="font-semibold text-base text-white">Datos Personales del Staff</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">TIPO DOC.</label>
                      <div className="text-[15px] text-white">{pilot.tipoDocumento || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">IDENTIFICACIÓN</label>
                      <div className="text-[15px] text-white">{pilot.numeroIdentificacion || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">SEUDÓNIMO</label>
                      <div className="text-[15px] text-white">{pilot.seudonimo || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">TELÉFONO</label>
                      <div className="text-[15px] text-white">{pilot.telefono || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">FECHA NAC.</label>
                      <div className="text-[15px] text-white">{pilot.fechaNacimiento || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">UBICACIÓN</label>
                      <div className="text-[15px] text-white">{pilot.ciudad || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">INSTAGRAM</label>
                      <div className="text-[15px] text-white">{pilot.instagram || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-[#64748B] block mb-1">INSCRIPCIÓN</label>
                      <div className="text-[15px] text-white">{pilot.registradoEl ? new Date(pilot.registradoEl).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column (4 cols) */}
            <div className="lg:col-span-4">
              <div className="bg-[#0D0D0D] rounded-xl border border-[#1F1F1F] overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#64748B]" />
                  <h2 className="font-semibold text-base text-white">Acciones de Perfil</h2>
                </div>
                <div className="p-6 flex flex-col gap-3">
                  <Button variant="outline" className="w-full bg-[#151515] border-[#1F1F1F] text-zinc-300 hover:bg-[#1A1A1A] hover:text-white h-11 transition-all justify-start">
                    <FileText className="w-4 h-4 mr-3 text-[#64748B]" /> Cargar Documentos
                  </Button>
                  <Button variant="outline" className="w-full bg-[#151515] border-[#1F1F1F] text-zinc-300 hover:bg-[#1A1A1A] hover:text-white h-11 transition-all justify-start">
                    <Edit2 className="w-4 h-4 mr-3 text-[#64748B]" /> Editar Perfil
                  </Button>
                  
                  <Link href="/codigos" className="w-full">
                    <Button variant="outline" className="w-full bg-[#151515] border-[#1F1F1F] text-zinc-300 hover:bg-[#1A1A1A] hover:text-white h-11 transition-all justify-start">
                      <Clock className="w-4 h-4 mr-3 text-[#64748B]" /> Ver Historial Completo
                    </Button>
                  </Link>
                  
                  {isAdmin && (
                    <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full bg-[#151515] border-[#1F1F1F] text-zinc-300 hover:bg-[#1A1A1A] hover:text-white h-11 transition-all justify-start" onClick={() => setNewRole((pilot.rol || 'piloto') as 'piloto' | 'staff' | 'juez')}>
                          <RefreshCw className="w-4 h-4 mr-3 text-[#64748B]" /> Cambiar Rol
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0D0D0D] border-[#1F1F1F] text-[#F1F5F9]">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-[#F59E0B]" />
                            Modificar Rol de Usuario
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-[#64748B] mb-4">
                            Selecciona el nuevo rol para <strong>{pilot.nombres} {pilot.apellidos}</strong>.
                          </p>
                          <select 
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as 'piloto' | 'staff' | 'juez')}
                            className="w-full bg-[#151515] border border-[#1F1F1F] text-white rounded-md h-10 px-3 outline-none focus:border-[#22C55E] transition-colors"
                          >
                            <option value="piloto">Piloto</option>
                            <option value="staff">Staff</option>
                            <option value="juez">Juez</option>
                          </select>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setIsRoleDialogOpen(false)} variant="ghost" className="text-[#64748B] hover:text-white hover:bg-[#1F1F1F]">Cancelar</Button>
                          <Button onClick={handleChangeRole} disabled={updating || newRole === pilot.rol} className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-black font-semibold">Guardar Cambios</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {isAdmin && (
                    <Button variant="outline" onClick={handleDeletePilot} disabled={updating} className="w-full bg-[#151515] border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444] h-11 mt-2 transition-all justify-start">
                      <XCircle className="w-4 h-4 mr-3" /> Eliminar del Sistema
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Historial Códigos Full Width */}
            <div className="lg:col-span-12">
              <div className="bg-[#0D0D0D] rounded-xl border border-[#1F1F1F] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#22C55E]" />
                  <h2 className="font-semibold text-base text-white">Historial de Códigos Generados</h2>
                </div>
                <div className="p-0 overflow-x-auto">
                  {pilot.codigosGenerados && pilot.codigosGenerados.length > 0 ? (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="text-[11px] text-[#64748B] uppercase tracking-widest bg-[#151515] border-b border-[#1F1F1F]">
                        <tr>
                          <th className="px-6 py-4 font-semibold">CÓDIGO</th>
                          <th className="px-6 py-4 font-semibold">VALOR</th>
                          <th className="px-6 py-4 font-semibold">DESCRIPCIÓN</th>
                          <th className="px-6 py-4 font-semibold">ESTADO</th>
                          <th className="px-6 py-4 font-semibold">FECHA</th>
                          <th className="px-6 py-4 font-semibold text-right">ACCIONES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F1F]">
                        {pilot.codigosGenerados.map((codigo) => (
                          <tr key={codigo.id} className="hover:bg-[#151515] transition-colors group">
                            <td className="px-6 py-4 font-mono text-[#22C55E] text-[13px]">{codigo.id}</td>
                            <td className="px-6 py-4 text-white text-[13px]">${Number(codigo.valor).toLocaleString()}</td>
                            <td className="px-6 py-4 text-white text-[13px] max-w-[200px] truncate" title={codigo.descripcion}>{codigo.descripcion}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider inline-flex items-center border ${
                                codigo.estadoAprobacion === 'pendiente' ? 'bg-transparent text-[#F97316] border-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]' :
                                codigo.estadoAprobacion === 'rechazado' ? 'bg-transparent text-[#EF4444] border-[#EF4444]' :
                                codigo.estado === 'aprobado' ? 'bg-transparent text-[#22C55E] border-[#22C55E]' :
                                codigo.estado === 'rechazado' ? 'bg-transparent text-[#EF4444] border-[#EF4444]' :
                                codigo.estado === 'pagado' ? 'bg-transparent text-[#3B82F6] border-[#3B82F6]' :
                                'bg-transparent text-[#F97316] border-[#F97316]'
                              }`}>
                                {(codigo.estadoAprobacion === 'pendiente' || codigo.estadoAprobacion === 'rechazado') ? codigo.estadoAprobacion : codigo.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white text-[13px]">{new Date(codigo.creadoEl || codigo.createdAt || Date.now()).toLocaleDateString('es-ES')}</td>
                            <td className="px-6 py-4 text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 px-3 text-[11px] uppercase tracking-widest border-[#1F1F1F] bg-[#151515] text-[#F1F5F9] hover:bg-[#1F1F1F] hover:text-white rounded-full transition-all"
                                onClick={() => openCodigoDetalles(codigo)}
                              >
                                Detalles
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center text-[#64748B]">
                      <FileText className="w-8 h-8 mb-4 opacity-30" />
                      <p className="text-sm font-medium">Aún no hay historial de códigos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
              <Link href="/pilotos">
                <Button variant="outline" className="w-fit gap-2 border-zinc-700 hover:bg-zinc-800 hover:text-white text-zinc-400 text-xs sm:text-sm">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Directorio
                </Button>
              </Link>

              {isAdmin && (
                <Button 
                  onClick={handleDeletePilot} 
                  disabled={updating}
                  variant="outline" 
                  className="w-full sm:w-fit border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs sm:text-sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Eliminar del Sistema
                </Button>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                <div className="p-3 bg-red-600/20 rounded-xl border border-red-600/50 shrink-0">
                  <User className="w-8 h-8 text-red-600" />
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white break-words w-full sm:w-auto leading-tight">{pilot.nombres} {pilot.apellidos}</h1>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      {pilot.rol === 'staff' ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest shrink-0">
                          <Star className="w-3 h-3" /> STAFF
                        </span>
                      ) : pilot.rol === 'juez' ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 uppercase tracking-widest shrink-0">
                          <ShieldAlert className="w-3 h-3" /> JUEZ
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest shrink-0">
                          <User className="w-3 h-3" /> PILOTO
                        </span>
                      )}
                      {isAdmin && (
                        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-2 text-[10px] sm:text-xs text-zinc-500 hover:text-white shrink-0" onClick={() => setNewRole((pilot.rol || 'piloto') as 'piloto' | 'staff' | 'juez')}>
                              Cambiar Rol
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-950 border-zinc-800">
                            <DialogHeader>
                              <DialogTitle className="text-white flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                                Modificar Rol de Usuario
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-zinc-400 mb-4">
                                Selecciona el nuevo rol para <strong>{pilot.nombres} {pilot.apellidos}</strong>. Los usuarios Staff desaparecerán de la lista de pilotos y tendrán su propia sección.
                              </p>
                              <select 
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as 'piloto' | 'staff' | 'juez')}
                                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md h-10 px-3 outline-none focus:border-red-600 transition-colors"
                              >
                                <option value="piloto">Piloto</option>
                                <option value="staff">Staff</option>
                                <option value="juez">Juez</option>
                              </select>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => setIsRoleDialogOpen(false)} variant="ghost" className="text-zinc-400">Cancelar</Button>
                              <Button onClick={handleChangeRole} disabled={updating || newRole === pilot.rol} className="bg-red-600 hover:bg-red-600 text-white">Guardar Cambios</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-400 flex flex-wrap items-center gap-2 mt-2 break-all text-xs sm:text-sm">
                    {isAdmin ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-600/10 text-red-500 border border-red-600/20 uppercase tracking-wider cursor-pointer hover:bg-red-600/20 transition-colors">
                            {Array.isArray(pilot.categoria) && pilot.categoria.length > 0 ? pilot.categoria.join(' / ') : (!pilot.categoria || pilot.categoria === 'N/A' || pilot.categoria.length === 0 ? 'N/A' : pilot.categoria)}
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-300 min-w-[120px]">
                          <DropdownMenuItem onClick={() => handleUpdateCategory('open')} className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer font-medium">OPEN</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCategory('2t')} className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer font-medium">2T</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCategory('4t')} className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer font-medium">4T</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCategory('alto')} className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer font-medium">ALTO</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateCategory('novatos')} className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white cursor-pointer font-medium">NOVATOS</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-600/10 text-red-500 border border-red-600/20 uppercase tracking-wider">
                        {Array.isArray(pilot.categoria) && pilot.categoria.length > 0 ? pilot.categoria.join(' / ') : (!pilot.categoria || pilot.categoria === 'N/A' || pilot.categoria.length === 0 ? 'N/A' : pilot.categoria)}
                      </span>
                    )}
                    <span className="hidden sm:inline">•</span> {pilot.email}
                  </p>
                </div>
              </div>

              {/* Checklist Visual */}
              <div className={`flex flex-col items-start lg:items-end w-full lg:w-auto p-4 rounded-xl border ${isAllGreen ? 'bg-red-600/10 border-red-600/30' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck2 className={`w-5 h-5 ${isAllGreen ? 'text-red-500' : 'text-zinc-400'} shrink-0`} />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Checklist de Ingreso</span>
                </div>
                <div className="flex flex-row flex-wrap items-center justify-between lg:justify-end gap-4 sm:gap-6 w-full lg:w-auto">
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">
                      Documentos ({pilot.id.startsWith('festival_') ? '3/3' : (pilot.id.startsWith('nitrox_') ? '2/2' : '5/5')})
                    </span>
                    {isDocsComplete ? (
                      <span className="text-red-500 font-bold text-xs sm:text-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> COMPLETOS</span>
                    ) : (
                      <span className="text-red-400 font-bold text-xs sm:text-sm flex items-center gap-1"><XCircle className="w-3 h-3 sm:w-4 sm:h-4"/> INCOMPLETOS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">Estado Financiero</span>
                    {isPaymentApproved ? (
                      <span className="text-red-500 font-bold text-xs sm:text-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> APROBADO</span>
                    ) : (
                      <span className="text-yellow-500 font-bold text-xs sm:text-sm flex items-center gap-1"><AlertCircle className="w-3 h-3 sm:w-4 sm:h-4"/> PENDIENTE</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Documentos Legales Rápidos (Arriba para validación inmediata) */}
        <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 mb-6">
          <CardHeader className="border-b border-zinc-800/50 pb-3 py-4">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" /> Documentos Legales (Vista Rápida)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <DocumentPreview title="1. Identidad" url={pilot.documentos.idUrl} docKey="id" />
              <DocumentPreview 
                title={pilot.id.startsWith('festival_') ? "2. Deportista (Bici)" : "2. Deportista"} 
                url={pilot.documentos.deportistaUrl} 
                docKey="deportista" 
              />
              {pilot.id.startsWith('festival_') && (
                <DocumentPreview title="3. Video Presentación" url={pilot.documentos.videoUrl} docKey="video" />
              )}
              {!isSimplified && (
                <>
                  <DocumentPreview title="3. Placa" url={pilot.documentos.placaUrl} docKey="placa" />
                  <DocumentPreview title="4. Propiedad" url={pilot.documentos.propiedadUrl} docKey="propiedad" />
                  <DocumentPreview title="5. SOAT" url={pilot.documentos.soatUrl} docKey="soat" />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          
          {/* Fila 1: Datos del Formulario en Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" /> Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Tipo Doc.</span>
                  <p className="text-sm text-zinc-300 font-mono">{pilot.tipoDocumento}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Identificación</span>
                  <p className="text-sm text-zinc-300 font-mono">{pilot.numeroIdentificacion}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Seudónimo (AKA)</span>
                  <p className="text-sm text-zinc-300 capitalize">{pilot.seudonimo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Teléfono</span>
                  <p className="text-sm text-zinc-300">{pilot.telefono}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Fecha Nac.</span>
                  <p className="text-sm text-zinc-300">{pilot.fechaNacimiento}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Ubicación</span>
                  <p className="text-sm text-zinc-300">{pilot.ciudad} - {pilot.direccion}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Instagram</span>
                  <p className="text-sm text-zinc-300">{pilot.instagram}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Part. Previa</span>
                  <p className="text-sm text-zinc-300 capitalize">{pilot.participacionPrevia}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Inscripción</span>
                  <p className="text-sm text-zinc-300">
                    {pilot.registradoEl ? new Date(pilot.registradoEl).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {pilot.nombreTutor && (
                  <div className="col-span-2 mt-2 pt-4 border-t border-zinc-800/50">
                    <span className="text-[10px] text-orange-400 uppercase font-bold tracking-widest block mb-3">Datos del Tutor (Adulto Responsable)</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Nombre Tutor</span>
                        <p className="text-sm text-zinc-300">{pilot.nombreTutor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Cédula Tutor</span>
                        <p className="text-sm text-zinc-300 font-mono">{pilot.cedulaTutor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Parentesco</span>
                        <p className="text-sm text-zinc-300 capitalize">{pilot.parentescoTutor}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Teléfono Tutor</span>
                        <p className="text-sm text-zinc-300">{pilot.telefonoTutor}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Correo Tutor</span>
                        <p className="text-sm text-zinc-300">{pilot.correoTutor}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50">
              <CardHeader className="pb-3 border-b border-zinc-800/50">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Bike className="w-4 h-4 text-zinc-400" /> Motocicleta
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-semibold">Placa</span>
                  <p className="text-red-500 font-mono font-bold text-lg uppercase tracking-wider">{pilot.motocicleta.placa}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-semibold">Marca</span>
                  <p className="text-zinc-300 uppercase">{pilot.motocicleta.marca}</p>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase font-semibold">Referencia</span>
                  <p className="text-zinc-300">{pilot.motocicleta.referencia}</p>
                </div>
              </CardContent>
            </Card>

            {pilot.inquietudes && (
              <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50">
                <CardHeader className="pb-3 border-b border-zinc-800/50">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" /> Inquietudes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-zinc-400 text-sm italic">"{pilot.inquietudes}"</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fila 2: Verificación Financiera y Comprobantes */}
          <div className="space-y-6">
            
            {/* Panel de Aprobación de Pago */}
            <Card className="bg-zinc-900 border-zinc-800 w-full shadow-[0_0_15px_rgba(255,255,255,0.02)]">
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 uppercase font-bold mb-1">Estado de la Verificación Financiera</span>
                  {pilot.estadoPago === 'aprobado' && (
                    <span className="flex items-center gap-1.5 text-red-500 font-bold text-lg"><CheckCircle2 className="w-5 h-5"/> APROBADO 100%</span>
                  )}
                  {pilot.estadoPago === 'pago_dia_evento' && (
                    <span className="flex items-center gap-1.5 text-blue-400 font-bold text-lg"><CheckCircle2 className="w-5 h-5"/> APROBADO - PAGO DÍA DEL EVENTO</span>
                  )}
                  {pilot.estadoPago === 'en_revision' && (
                    <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-lg"><Clock className="w-5 h-5"/> EN REVISIÓN INICIAL</span>
                  )}
                  {pilot.estadoPago === 'revision_saldo' && (
                    <span className="flex items-center gap-1.5 text-orange-400 font-bold text-lg"><Clock className="w-5 h-5"/> EN REVISIÓN DE SALDO</span>
                  )}
                  {pilot.estadoPago === 'rechazado' && (
                    <span className="flex items-center gap-1.5 text-red-400 font-bold text-lg"><XCircle className="w-5 h-5"/> RECHAZADO</span>
                  )}
                  {pilot.estadoPago === 'rechazado_saldo' && (
                    <span className="flex items-center gap-1.5 text-red-400 font-bold text-lg"><XCircle className="w-5 h-5"/> RECHAZADO SALDO</span>
                  )}
                  {(pilot.estadoPago === 'pendiente' || pilot.estadoPago === 'borrador') && (
                    <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-lg"><AlertCircle className="w-5 h-5"/> PENDIENTE DE PAGO</span>
                  )}
                  {pilot.estadoPago === 'saldo_pendiente' && (
                    <span className="flex items-center gap-1.5 text-orange-400 font-bold text-lg"><AlertCircle className="w-5 h-5"/> DEBE SALDO FALTANTE (${pilot.saldoFaltante})</span>
                  )}
                </div>
                
                {(pilot.estadoPago === 'en_revision' || pilot.estadoPago === 'revision_saldo') && (
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {pilot.estadoPago === 'en_revision' && (
                      <Button 
                        onClick={() => updatePaymentStatus('rechazado')} 
                        disabled={updating}
                        variant="outline" 
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                      </Button>
                    )}
                    
                    {pilot.estadoPago === 'revision_saldo' && (
                      <Button 
                        onClick={() => updatePaymentStatus('rechazado_saldo')} 
                        disabled={updating}
                        variant="outline" 
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar Saldo
                      </Button>
                    )}

                    <Dialog open={isSaldoDialogOpen} onOpenChange={setIsSaldoDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 w-full sm:w-auto"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" /> Reportar Saldo Faltante
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-950 border-zinc-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Reportar Saldo Faltante</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">Monto que quedó debiendo el piloto (Ej: 50.000):</label>
                            <Input 
                              value={saldoAmount} 
                              onChange={(e) => setSaldoAmount(e.target.value)} 
                              className="bg-zinc-900 border-zinc-700 text-white"
                              placeholder="$ Ej. 35.000"
                              type="number"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-zinc-400 mb-2 block">Motivo del saldo <span className="text-red-500">*</span></label>
                            <select 
                              value={motivoSaldo}
                              onChange={(e) => setMotivoSaldo(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md p-2 mb-2 text-sm focus:outline-none focus:border-[#E60000]"
                            >
                              <option value="Fecha de pago después del 11 de mayo $350.000">Fecha de pago después del 11 de mayo $350.000</option>
                              <option value="Pago incompleto por error de transferencia">Pago incompleto por error de transferencia</option>
                              <option value="Otra">Otra (escribir manualmente)</option>
                            </select>
                            {motivoSaldo === 'Otra' && (
                              <Input 
                                value={motivoPersonalizado}
                                onChange={(e) => setMotivoPersonalizado(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white mt-2"
                                placeholder="Escribe el motivo del saldo..."
                              />
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setIsSaldoDialogOpen(false)} variant="ghost" className="text-zinc-400">Cancelar</Button>
                          <Button onClick={handleReportarSaldo} disabled={updating || !saldoAmount} className="bg-orange-600 hover:bg-orange-500 text-white">Confirmar Saldo</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {pilot.estadoPago === 'en_revision' && (
                      <>
                        <Button 
                          onClick={() => updatePaymentStatus('pago_dia_evento')} 
                          disabled={updating}
                          variant="outline"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 w-full sm:w-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar - Pago Día del Evento
                        </Button>
                        <Button 
                          onClick={() => updatePaymentStatus('aprobado')} 
                          disabled={updating}
                          className="bg-red-600 hover:bg-red-600 text-white w-full sm:w-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar 100%
                        </Button>
                      </>
                    )}

                    {pilot.estadoPago === 'revision_saldo' && (
                      <Button 
                        onClick={() => updatePaymentStatus('aprobado')} 
                        disabled={updating}
                        className="bg-red-600 hover:bg-red-600 text-white w-full sm:w-auto"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar Faltante (Liberar QR)
                      </Button>
                    )}
                  </div>
                )}

                {(pilot.estadoPago === 'aprobado' || pilot.estadoPago === 'pago_dia_evento') && (
                  <Button 
                    onClick={() => updatePaymentStatus('en_revision')} 
                    disabled={updating}
                    variant="outline" 
                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  >
                    Revertir a Revisión Inicial
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Comprobantes de Pago Destacados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pilot.comprobanteUrl && (
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50">
                  <CardHeader className="border-b border-zinc-800/50 pb-4">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-yellow-500" /> Comprobante Inicial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-48 w-full mx-auto">
                      <DocumentPreview title="Transferencia" url={pilot.comprobanteUrl} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {pilot.historialSaldos && pilot.historialSaldos.length > 0 ? (
                pilot.historialSaldos.map((url, index) => (
                  <Card key={index} className="bg-zinc-950/80 backdrop-blur-xl border-orange-500/30">
                    <CardHeader className="border-b border-zinc-800/50 pb-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-orange-400 text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5" /> Comprobante de Saldo {pilot.historialSaldos!.length > 1 ? `#${index + 1}` : ''}
                        </CardTitle>
                        {pilot.estadoPago === 'revision_saldo' && index === pilot.historialSaldos!.length - 1 && (
                          <CardDescription className="text-zinc-400 mt-1">
                            Saldo reportado: ${pilot.saldoFaltante}
                          </CardDescription>
                        )}
                      </div>
                      {pilot.estadoPago === 'revision_saldo' && index === pilot.historialSaldos!.length - 1 && (
                        <div className="flex gap-1">
                          <Button onClick={() => window.open(url, '_blank')} variant="ghost" size="icon" className="text-zinc-400 hover:text-white" title="Ver comprobante en nueva pestaña">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => updatePaymentStatus('rechazado_saldo')} variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Rechazar saldo">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="h-48 w-full mx-auto">
                        <DocumentPreview title={`Transferencia Saldo ${index + 1}`} url={url} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : pilot.comprobanteSaldoUrl ? (
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-orange-500/30">
                  <CardHeader className="border-b border-zinc-800/50 pb-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-orange-400 text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5" /> Comprobante de Saldo
                      </CardTitle>
                      {pilot.estadoPago === 'revision_saldo' && (
                        <CardDescription className="text-zinc-400 mt-1">
                          Saldo reportado: ${pilot.saldoFaltante}
                        </CardDescription>
                      )}
                    </div>
                    {pilot.estadoPago === 'revision_saldo' && (
                      <div className="flex gap-1">
                        <Button onClick={() => window.open(pilot.comprobanteSaldoUrl, '_blank')} variant="ghost" size="icon" className="text-zinc-400 hover:text-white" title="Ver comprobante en nueva pestaña">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => updatePaymentStatus('rechazado')} variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" title="Rechazar saldo">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-48 w-full mx-auto">
                      <DocumentPreview title="Transferencia Saldo" url={pilot.comprobanteSaldoUrl} />
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Social Media Card Section */}
            <div className="mt-6">
              <SocialMediaCard 
                pilotId={pilot.id}
                pilotName={`${pilot.nombres} ${pilot.apellidos}`}
                pilotPseudonym={pilot.seudonimo}
                pilotCategory={pilot.categoria}
                pilotPhotoUrl={pilot.documentos.deportistaUrl}
                pilotCity={pilot.ciudad}
                pilotInstagram={pilot.instagram}
                initialConfig={pilot.templateConfig}
                isAdmin={isAdmin}
                onSaveSuccess={fetchPilotData}
              />
            </div>

          </div>

        </div>
      </div>
      {/* Modal Detalles Código */}
      {showCodigoDetallesModal && selectedCodigo && (
        <Dialog open={showCodigoDetallesModal} onOpenChange={setShowCodigoDetallesModal}>
          <DialogContent className="bg-[#0b0d14] border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Detalles del Código
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Código</label>
                <div className="text-xl font-mono text-red-600 font-bold">{selectedCodigo.id}</div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Valor</label>
                <input 
                  type="number" 
                  value={editValor} 
                  onChange={(e) => setEditValor(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Descripción</label>
                <input 
                  type="text" 
                  value={editDescripcion} 
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Centro de Costo</label>
                <select 
                  value={editCentroCosto} 
                  onChange={(e) => setEditCentroCosto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-red-600"
                >
                  <option value="">[ NINGUNO ]</option>
                  {centrosCostoList.map((cc) => (
                    <option key={cc} value={cc}>{cc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Retención (Motivo)</label>
                  <select 
                    value={editRetencionMotivo} 
                    onChange={(e) => setEditRetencionMotivo(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-2 py-2 outline-none focus:border-red-600 text-xs"
                  >
                    <option value="">[ NINGUNA ]</option>
                    <option value="Servicios Generales">Servicios Generales</option>
                    <option value="Honorarios y Comisiones">Honorarios y Comisiones</option>
                    <option value="Compras">Compras</option>
                    <option value="Arrendamientos">Arrendamientos</option>
                    <option value="Transporte">Transporte</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Retención (%)</label>
                  <input 
                    type="number" 
                    value={editRetencionPorcentaje} 
                    onChange={(e) => setEditRetencionPorcentaje(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              {isAdmin ? (
                <>
                  {selectedCodigo.estadoAprobacion === 'pendiente' && (
                    <Button onClick={handleAprobarCodigo} className="col-span-2 sm:col-span-1 bg-red-600 hover:bg-red-600 text-white w-full">Aprobar</Button>
                  )}
                  {selectedCodigo.estadoAprobacion === 'pendiente' && (
                    <Button onClick={handleRechazarCodigo} variant="outline" className="col-span-1 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400 w-full">Rechazar</Button>
                  )}
                  <Button onClick={handleUpdateCodigo} variant="secondary" className="col-span-1 sm:col-span-1 bg-zinc-800 hover:bg-zinc-700 text-white w-full">Actualizar Info</Button>
                </>
              ) : (
                <Button onClick={() => setShowCodigoDetallesModal(false)} variant="ghost" className="col-span-2 text-zinc-400 w-full">Cerrar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
