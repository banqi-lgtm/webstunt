'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, orderBy, limit, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, ExternalLink, User, Bike, FileText, CheckCircle2, XCircle, CreditCard, Clock, AlertCircle, FileCheck2, Star, ShieldAlert, Eye, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import SocialMediaCard from '@/components/social-media-card';

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
  templateConfig?: any;
}

export default function PilotDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [pilot, setPilot] = useState<PilotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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
      
      const extractedUid = data.uid || id.replace('f2r_', '');

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

      setPilot({
        id: regDoc.id,
        uid: extractedUid,
        categoria: data.categoria || 'N/A',
        participacionPrevia: data.participacionPrevia || 'N/A',
        patrocinadores: data.patrocinadores || false,
        inquietudes: data.inquietudes || 'Ninguna',
        motocicleta: data.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
        documentos: data.documentos || { idUrl: '', placaUrl: '', propiedadUrl: '', soatUrl: '', deportistaUrl: '' },
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
        documentosRechazados: data.documentosRechazados || [],
        templateConfig: data.templateConfig || null
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
            estadoPago: status
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
            estadoPago: status
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
          motivo: finalMotivo
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
      const docRef = doc(db, 'event_registrations', pilot.id);
      if (isRejected) {
        // Deshacer rechazo
        await updateDoc(docRef, { documentosRechazados: arrayRemove(docKey) });
        setPilot({ ...pilot, documentosRechazados: (pilot.documentosRechazados || []).filter(k => k !== docKey) });
        toast({ title: 'Documento Aprobado', description: 'Se ha removido la marca de corrección.' });
      } else {
        // Rechazar
        await updateDoc(docRef, { documentosRechazados: arrayUnion(docKey) });
        setPilot({ ...pilot, documentosRechazados: [...(pilot.documentosRechazados || []), docKey] });
        toast({ title: 'Documento Rechazado', description: 'El piloto ha sido notificado para corregir este documento.', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado del documento.', variant: 'destructive' });
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

  const isDocsComplete = pilot.documentos.idUrl && pilot.documentos.placaUrl && pilot.documentos.propiedadUrl && pilot.documentos.soatUrl && pilot.documentos.deportistaUrl;
  const isPaymentApproved = pilot.estadoPago === 'aprobado' || pilot.estadoPago === 'pago_dia_evento';
  const isAllGreen = isDocsComplete && isPaymentApproved;

  const DocumentPreview = ({ title, url, docKey }: { title: string, url?: string, docKey?: string }) => {
    if (!url) return (
      <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 text-xs h-32 gap-2 text-center">
        <AlertCircle className="w-5 h-5 text-zinc-600" />
        Falta adjunto
      </div>
    );
    
    const isRejected = docKey ? pilot.documentosRechazados?.includes(docKey) : false;

    return (
      <div className="flex flex-col gap-1.5 h-full">
        <div className="flex justify-between items-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 truncate">{title}</span>
          {isRejected && <span className="text-[9px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Rechazado</span>}
        </div>
        <div className={`relative h-32 flex-grow bg-zinc-900 border rounded-lg overflow-hidden flex items-center justify-center transition-colors group ${isRejected ? 'border-red-500' : 'border-zinc-700 hover:border-green-500'}`}>
          <img src={url} alt={title} className="object-cover w-full h-full" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement?.classList.add('bg-zinc-800');
            (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML('beforeend', '<div class="text-zinc-500 flex flex-col items-center"><svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><span class="text-[10px] uppercase font-bold tracking-widest">PDF</span></div>');
          }}/>
          
          {/* Overlay de acciones */}
          <div className="absolute inset-0 bg-black/60 transition-opacity z-10 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <a href={url} target="_blank" rel="noopener noreferrer" className="bg-zinc-800 hover:bg-zinc-700 p-2.5 rounded-full transition-transform hover:scale-110 shadow-lg text-white" title="Ver documento">
              <Eye className="w-5 h-5" />
            </a>
            {isAdmin && docKey && (
              <button 
                onClick={() => toggleDocumentStatus(docKey, !!isRejected)} 
                disabled={updating}
                className={`${isRejected ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} p-2.5 rounded-full transition-transform hover:scale-110 shadow-lg text-white disabled:opacity-50`}
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

  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
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
                <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/50 shrink-0">
                  <User className="w-8 h-8 text-green-500" />
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
                                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md h-10 px-3 outline-none focus:border-green-500 transition-colors"
                              >
                                <option value="piloto">Piloto</option>
                                <option value="staff">Staff</option>
                                <option value="juez">Juez</option>
                              </select>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => setIsRoleDialogOpen(false)} variant="ghost" className="text-zinc-400">Cancelar</Button>
                              <Button onClick={handleChangeRole} disabled={updating || newRole === pilot.rol} className="bg-green-600 hover:bg-green-500 text-white">Guardar Cambios</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-400 flex flex-wrap items-center gap-2 mt-2 break-all text-xs sm:text-sm">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">
                      {pilot.categoria}
                    </span>
                    <span className="hidden sm:inline">•</span> {pilot.email}
                  </p>
                </div>
              </div>

              {/* Checklist Visual */}
              <div className={`flex flex-col items-start lg:items-end w-full lg:w-auto p-4 rounded-xl border ${isAllGreen ? 'bg-green-500/10 border-green-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck2 className={`w-5 h-5 ${isAllGreen ? 'text-green-400' : 'text-zinc-400'} shrink-0`} />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Checklist de Ingreso</span>
                </div>
                <div className="flex flex-row flex-wrap items-center justify-between lg:justify-end gap-4 sm:gap-6 w-full lg:w-auto">
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">Documentos (5/5)</span>
                    {isDocsComplete ? (
                      <span className="text-green-400 font-bold text-xs sm:text-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> COMPLETOS</span>
                    ) : (
                      <span className="text-red-400 font-bold text-xs sm:text-sm flex items-center gap-1"><XCircle className="w-3 h-3 sm:w-4 sm:h-4"/> INCOMPLETOS</span>
                    )}
                  </div>
                  <div className="flex flex-col items-start lg:items-end">
                    <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">Estado Financiero</span>
                    {isPaymentApproved ? (
                      <span className="text-green-400 font-bold text-xs sm:text-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4"/> APROBADO</span>
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
              <FileText className="w-5 h-5 text-green-500" /> Documentos Legales (Vista Rápida)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <DocumentPreview title="1. Identidad" url={pilot.documentos.idUrl} docKey="id" />
              <DocumentPreview title="2. Deportista" url={pilot.documentos.deportistaUrl} docKey="deportista" />
              <DocumentPreview title="3. Placa" url={pilot.documentos.placaUrl} docKey="placa" />
              <DocumentPreview title="4. Propiedad" url={pilot.documentos.propiedadUrl} docKey="propiedad" />
              <DocumentPreview title="5. SOAT" url={pilot.documentos.soatUrl} docKey="soat" />
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
                  <p className="text-green-400 font-mono font-bold text-lg uppercase tracking-wider">{pilot.motocicleta.placa}</p>
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
                    <span className="flex items-center gap-1.5 text-green-400 font-bold text-lg"><CheckCircle2 className="w-5 h-5"/> APROBADO 100%</span>
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
                              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md p-2 mb-2 text-sm focus:outline-none focus:border-[#39FF14]"
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
                          className="bg-green-600 hover:bg-green-500 text-white w-full sm:w-auto"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar 100%
                        </Button>
                      </>
                    )}

                    {pilot.estadoPago === 'revision_saldo' && (
                      <Button 
                        onClick={() => updatePaymentStatus('aprobado')} 
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-500 text-white w-full sm:w-auto"
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
    </div>
  );
}
