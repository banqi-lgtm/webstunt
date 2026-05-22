'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Users, Search, Bike, ChevronRight, Clock, AlertCircle, CheckCircle2, ScanLine, User, XCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import BulkSocialMediaExport from '@/components/bulk-social-media-export';

interface Registration {
  id: string;
  uid: string;
  categoria: string;
  motocicleta: {
    placa: string;
    marca: string;
    referencia: string;
  };
  registradoEl: string;
  estadoPago: string;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion?: string;
  telefono?: string;
  ciudad?: string;
  prioridadRechazado?: boolean;
  tallaCamisa?: string;
}

export default function PilotosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos'); // 'todos', 'en_revision', 'aprobado', 'pendiente', 'saldo_pendiente', 'revision_saldo'
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedPilot, setScannedPilot] = useState<any | null>(null);
  const [isScannedDialogOpen, setIsScannedDialogOpen] = useState(false);
  const [fetchingScan, setFetchingScan] = useState(false);
  const [scanningKitFor, setScanningKitFor] = useState<any | null>(null);
  const [kitScanVerified, setKitScanVerified] = useState(false);

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
        
        if (isSuperAdmin || interfaces.includes('pilotos')) {
          setHasAccess(true);
          fetchRegistrations();
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

  const fetchRegistrations = async () => {
    try {
      // 1. Fetch Users to get names
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      usersSnap.forEach(doc => {
        usersMap.set(doc.id, doc.data());
      });

      // 2. Fetch Registrations
      const regSnap = await getDocs(collection(db, 'event_registrations'));
      const regsMap = new Map();
      regSnap.forEach(docSnap => {
        const data = docSnap.data();
        const extractedUid = data.uid || docSnap.id.replace('f2r_', '');
        if (extractedUid) {
          regsMap.set(extractedUid, { id: docSnap.id, ...data });
        }
      });

      const fetched: Registration[] = [];
      
      // Combine users and registrations to show everyone
      usersMap.forEach((userData, userId) => {
        // Exclude super admin if they don't have basic pilot data
        if (['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(userData.email) && !userData.numeroIdentificacion) return;
        
        // Skip users with missing names
        if (!userData.nombres) return;

        // Skip staff members and judges
        if (userData.rol === 'staff' || userData.rol === 'juez') return;

        const regData = regsMap.get(userId) || {};
        
        fetched.push({
          id: regData.id || `f2r_${userId}`,
          uid: userId,
          categoria: regData.categoria || 'N/A',
          motocicleta: regData.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
          registradoEl: regData.registradoEl || userData.createdAt || new Date().toISOString(),
          estadoPago: (regData.estadoPago === 'borrador' ? 'pendiente' : regData.estadoPago) || 'pendiente',
          nombres: userData.nombres || 'Desconocido',
          apellidos: userData.apellidos || '',
          email: userData.email || 'N/A',
          numeroIdentificacion: userData.numeroIdentificacion || regData.numeroIdentificacion || 'N/A',
          telefono: userData.telefono || regData.telefono || 'N/A',
          ciudad: userData.ciudad || regData.ciudad || 'Medellin',
          prioridadRechazado: regData.prioridadRechazado || false,
          tallaCamisa: userData.tallaCamisa || regData.tallaCamisa || 'N/A',
        });
      });
      
      // Ordenar por fecha de registro (más recientes primero)
      fetched.sort((a, b) => new Date(b.registradoEl).getTime() - new Date(a.registradoEl).getTime());
      
      setRegistrations(fetched);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar los pilotos inscritos', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess === null) return null;

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.nombres.toLowerCase().includes(search.toLowerCase()) || 
                          r.apellidos.toLowerCase().includes(search.toLowerCase()) ||
                          r.motocicleta.placa.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filterStatus === 'todos' || 
                          r.estadoPago === filterStatus ||
                          (filterStatus === 'en_revision' && r.estadoPago === 'revision_saldo') ||
                          (filterStatus === 'pendiente' && r.estadoPago === 'rechazado') ||
                          (filterStatus === 'aprobado' && r.estadoPago === 'pago_dia_evento');
    
    return matchesSearch && matchesFilter;
  });

  const exportToExcel = () => {
    const getGender = (name: string) => {
      if (!name) return 'Masculino';
      const firstName = name.split(' ')[0].toLowerCase();
      const femaleList = ['maria', 'maría', 'ana', 'carmen', 'isabel', 'ruth', 'luz', 'flor', 'karen', 'jenny', 'yenny', 'yuri', 'marisol', 'shirley', 'lady', 'leidy', 'astrid', 'ingrid', 'judith', 'gladys', 'doris', 'miriam', 'myriam', 'kelly', 'angie', 'lizeth', 'sharon', 'evelyn', 'gloria', 'diana'];
      if (firstName.endsWith('a') || femaleList.includes(firstName)) {
        return 'Femenino';
      }
      return 'Masculino';
    };

    const data = filteredRegistrations.map(reg => ({
      "idDocument": reg.numeroIdentificacion || 'N/A',
      "company": "COPA STUNT",
      "name": reg.nombres,
      "lastName": reg.apellidos,
      "country": "CO",
      "city": reg.ciudad || "Medellin",
      "emergencyPhone": reg.telefono || 'N/A',
      "gender": getGender(reg.nombres),
      "type": "Deportista",
      "Talla de Camisa": reg.tallaCamisa || 'N/A'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pilotos");
    
    XLSX.writeFile(workbook, `Pilotos_F2R_${filterStatus}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const countTodos = registrations.length;
  const countEnRevision = registrations.filter(r => r.estadoPago === 'en_revision' || r.estadoPago === 'revision_saldo').length;
  const countAprobados = registrations.filter(r => r.estadoPago === 'aprobado' || r.estadoPago === 'pago_dia_evento').length;
  const countSinPagar = registrations.filter(r => r.estadoPago === 'pendiente' || r.estadoPago === 'rechazado').length;
  const countDebenSaldo = registrations.filter(r => r.estadoPago === 'saldo_pendiente').length;

  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/50">
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Directorio de Pilotos</h1>
              <p className="text-zinc-400">Listado y gestión de pilotos inscritos en la Copa Stunt F2R.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <BulkSocialMediaExport pilots={filteredRegistrations} />
            
            <Button onClick={exportToExcel} className="bg-zinc-800 hover:bg-zinc-700 text-white gap-2 h-12 px-6 w-full sm:w-auto font-bold shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-zinc-700">
              <Download className="w-5 h-5" /> EXPORTAR EXCEL
            </Button>
            
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 h-12 px-6 w-full sm:w-auto font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <ScanLine className="w-5 h-5" /> ESCANEAR QR
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white text-center">Escáner de Validación</DialogTitle>
              </DialogHeader>
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center relative mt-4 border-2 border-zinc-800">
                {scannerOpen && (
                  <Scanner
                    onScan={async (detectedCodes) => {
                      if (detectedCodes && detectedCodes.length > 0) {
                        const value = detectedCodes[0].rawValue;
                        if (value) {
                          const isPilot = value.startsWith('f2r_');
                          const isKit = value.startsWith('kit_f2r_');
                          
                          if (isPilot || isKit) {
                            const docId = isKit ? value.replace('kit_', '') : value;
                            setScannerOpen(false);
                            setFetchingScan(true);
                            setIsScannedDialogOpen(true);
                            try {
                               const regDoc = await getDoc(doc(db, 'event_registrations', docId));
                             if (regDoc.exists()) {
                               const data = regDoc.data();
                               const extractedUid = data.uid || docId.replace('f2r_', '');
                               const userDoc = await getDoc(doc(db, 'users', extractedUid));
                               const userData = userDoc.exists() ? userDoc.data() : {};
                               
                               const qrDoc = await getDoc(doc(db, 'listas_QR', docId));
                               const kitData = qrDoc.exists() ? qrDoc.data() : null;

                               setScannedPilot({
                                  ...data,
                                  nombres: userData.nombres,
                                  apellidos: userData.apellidos,
                                  numeroIdentificacion: userData.numeroIdentificacion,
                                  isKitScan: isKit,
                                  kitNumber: kitData?.kitNumber,
                                  kitEntregado: kitData?.kitEntregado,
                                  docId: docId
                               });
                             } else {
                               setScannedPilot(null);
                             }
                          } catch (e) {
                             console.error(e);
                             setScannedPilot(null);
                          } finally {
                             setFetchingScan(false);
                          }
                        } else {
                          toast({ title: 'QR Inválido', description: 'Este código QR no pertenece al sistema de F2R.', variant: 'destructive' });
                        }
                        }
                      }
                    }}
                    components={{
                      finder: true,
                    }}
                  />
                )}
                <div className="absolute inset-0 border-4 border-green-500/30 m-8 rounded-2xl pointer-events-none"></div>
              </div>
              <p className="text-zinc-500 text-center text-sm mt-4">
                Apunta la cámara al código QR en el celular del piloto.
              </p>
            </DialogContent>
          </Dialog>

          <Dialog open={isScannedDialogOpen} onOpenChange={(open) => {
             setIsScannedDialogOpen(open);
             if (!open) {
                setScannedPilot(null);
                setScanningKitFor(null);
                setKitScanVerified(false);
             }
          }}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
               <DialogTitle className="sr-only">Resultado del Escáner</DialogTitle>
               {scanningKitFor ? (
                 <div className="flex flex-col items-center justify-center py-4 w-full">
                   <h3 className="text-lg font-bold text-white mb-4">Escanea el KIT {scanningKitFor.kitNumber}</h3>
                   
                   {!kitScanVerified ? (
                     <div className="w-full aspect-square max-w-[300px] rounded-xl overflow-hidden bg-black flex items-center justify-center relative border-2 border-[#39FF14]">
                       <Scanner
                          onScan={async (detectedCodes) => {
                            if (detectedCodes && detectedCodes.length > 0) {
                              const value = detectedCodes[0].rawValue;
                              if (value === `kit_${scanningKitFor.docId}`) {
                                 setKitScanVerified(true);
                                 toast({ title: 'Kit Correcto', description: 'El QR corresponde al kit de este piloto.' });
                              } else if (value) {
                                 toast({ title: 'QR Incorrecto', description: 'Este no es el kit asignado a este piloto.', variant: 'destructive' });
                              }
                            }
                          }}
                          components={{ finder: true }}
                       />
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-4 py-8 w-full">
                        <CheckCircle2 className="w-20 h-20 text-[#39FF14] animate-pulse" />
                        <h4 className="text-xl font-bold text-white uppercase tracking-widest text-center">Kit {scanningKitFor.kitNumber} Verificado</h4>
                        <p className="text-zinc-400 text-center mb-6">El código QR coincide con el piloto {scanningKitFor.nombres}.</p>
                        
                        <Button 
                          onClick={async () => {
                             try {
                               await updateDoc(doc(db, 'listas_QR', scanningKitFor.docId), {
                                 kitEntregado: true,
                                 entregadoEl: new Date().toISOString()
                               });
                               setScannedPilot({ ...scanningKitFor, kitEntregado: true });
                               setScanningKitFor(null);
                               setKitScanVerified(false);
                               toast({ title: '¡Entrega Guardada!', description: `Se ha registrado la entrega del Kit ${scanningKitFor.kitNumber}.` });
                             } catch (e) {
                               toast({ title: 'Error', description: 'No se pudo guardar la entrega', variant: 'destructive' });
                             }
                          }}
                          className="w-full bg-[#39FF14] hover:bg-[#32E011] text-black font-bold h-12 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                        >
                          CONFIRMAR ENTREGA
                        </Button>
                     </div>
                   )}

                   <Button onClick={() => { setScanningKitFor(null); setKitScanVerified(false); }} variant="outline" className="mt-6 w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                     Volver al Checklist
                   </Button>
                 </div>
               ) : fetchingScan ? (
                 <div className="flex flex-col items-center justify-center py-10">
                   <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-zinc-400">Verificando pase de ingreso...</p>
                 </div>
               ) : scannedPilot ? (
                 <div className="flex flex-col gap-6 pt-4">
                   <div className="flex flex-col gap-1 text-center bg-zinc-900/50 py-2 rounded-lg border border-zinc-800/50">
                     <p className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{scannedPilot.nombres} {scannedPilot.apellidos}</p>
                     <p className="text-xs font-mono text-zinc-400">ID: {scannedPilot.numeroIdentificacion || 'N/A'}</p>
                   </div>
                   <h3 className="text-xl font-bold text-white text-center">
                     {scannedPilot.isKitScan ? 'Verificación de Kit' : 'Checklist de Ingreso'}
                   </h3>
                   
                   <ul className="space-y-3">
                     {/* Pago */}
                     <li className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 gap-2">
                        <span className="text-zinc-300 font-semibold text-base sm:text-lg">1. Pago de Inscripción</span>
                        {scannedPilot.estadoPago === 'aprobado' || scannedPilot.estadoPago === 'pago_dia_evento' ? (
                          <span className={`flex items-center font-bold text-base sm:text-lg ${scannedPilot.estadoPago === 'pago_dia_evento' ? 'text-blue-400' : 'text-green-400'}`}><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> {scannedPilot.estadoPago === 'pago_dia_evento' ? 'Pago Día Evento' : 'Aprobado'}</span>
                        ) : (
                          <span className="flex items-center text-red-400 font-bold text-base sm:text-lg"><XCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> Pendiente</span>
                        )}
                     </li>
                     
                     {/* Docs */}
                     {(() => {
                        const docs = scannedPilot.documentos || {};
                        const rechazos = scannedPilot.documentosRechazados || [];
                        const docsComplete = docs.idUrl && docs.placaUrl && docs.propiedadUrl && docs.soatUrl && docs.deportistaUrl && rechazos.length === 0;
                        
                        const pendientes = [];
                        if (!docs.idUrl || rechazos.includes('id')) pendientes.push("Identidad");
                        if (!docs.placaUrl || rechazos.includes('placa')) pendientes.push("Placa");
                        if (!docs.propiedadUrl || rechazos.includes('propiedad')) pendientes.push("Tarjeta Prop.");
                        if (!docs.soatUrl || rechazos.includes('soat')) pendientes.push("SOAT");
                        if (!docs.deportistaUrl || rechazos.includes('deportista')) pendientes.push("Foto Piloto");

                        return (
                          <li className="flex flex-col p-3 sm:p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 gap-2">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                               <span className="text-zinc-300 font-semibold text-base sm:text-lg">2. Documentos Legales</span>
                               {docsComplete ? (
                                 <span className="flex items-center text-green-400 font-bold text-base sm:text-lg"><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> Completos</span>
                               ) : (
                                 <span className="flex items-center text-orange-400 font-bold text-base sm:text-lg"><AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-1" /> Incompletos</span>
                               )}
                             </div>
                             {!docsComplete && pendientes.length > 0 && (
                               <div className="mt-1 text-xs text-orange-400/90 bg-orange-500/10 p-2 rounded border border-orange-500/20 leading-relaxed">
                                 <span className="font-bold uppercase tracking-wider">Pendiente/Rechazado:</span><br/> {pendientes.join(' • ')}
                               </div>
                             )}
                          </li>
                        );
                     })()}
                   </ul>

                   {/* Acces Permitted Banner */}
                   {(scannedPilot.estadoPago === 'aprobado' || scannedPilot.estadoPago === 'pago_dia_evento') && (() => {
                        const docs = scannedPilot.documentos || {};
                        const rechazos = scannedPilot.documentosRechazados || [];
                        const docsComplete = docs.idUrl && docs.placaUrl && docs.propiedadUrl && docs.soatUrl && docs.deportistaUrl && rechazos.length === 0;
                        if (docsComplete) return (
                          <div className="flex flex-col gap-4 mt-2">
                            <div className="w-full bg-green-600 text-white font-black text-center py-4 rounded-lg text-lg sm:text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
                              ¡ACCESO PERMITIDO!
                            </div>
                            
                            {scannedPilot.kitNumber && (
                              <div className="w-full bg-zinc-900 border border-green-500/30 p-4 rounded-lg flex flex-col items-center text-center">
                                <span className="text-zinc-400 text-sm uppercase tracking-wider mb-1">Kit Asignado</span>
                                <span className="text-4xl font-black text-[#39FF14] mb-3 drop-shadow-[0_0_10px_rgba(57,255,20,0.3)]">KIT {scannedPilot.kitNumber}</span>
                                {scannedPilot.kitEntregado ? (
                                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5"/> ENTREGADO
                                  </span>
                                ) : (
                                  <Button 
                                    onClick={() => setScanningKitFor(scannedPilot)}
                                    className="w-full bg-[#39FF14] hover:bg-[#32E011] text-black font-bold h-12 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                                  >
                                    <ScanLine className="w-5 h-5 mr-2" /> ESCANEAR QR KIT
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                        return null;
                   })()}
                   
                   <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                      <Button onClick={() => setIsScannedDialogOpen(false)} variant="outline" className="w-full sm:w-1/2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-11">Cerrar Escáner</Button>
                      <Link href={`/pilotos/f2r_${scannedPilot.uid}`} className="w-full sm:w-1/2">
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white h-11">Ver Expediente</Button>
                      </Link>
                   </div>
                 </div>
               ) : (
                 <div className="py-10 text-center">
                   <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-white">Piloto no encontrado</h3>
                   <p className="text-zinc-400 mt-2">El código QR no corresponde a ningún registro válido.</p>
                 </div>
               )}
            </DialogContent>
          </Dialog>
          </div>

        </div>

        <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-white text-xl">Pilotos Registrados</CardTitle>
                <CardDescription className="text-zinc-400">Total: {registrations.length} Inscritos</CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
                {/* Tabs de Filtro */}
                <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 overflow-x-auto">
                  <button 
                    onClick={() => setFilterStatus('todos')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Todos
                    <span className="bg-zinc-700/50 text-zinc-300 text-xs font-bold px-1.5 py-0.5 rounded-full">{countTodos}</span>
                  </button>
                  <button 
                    onClick={() => setFilterStatus('en_revision')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'en_revision' ? 'bg-[#FFFF00]/10 text-[#FFFF00] border border-[#FFFF00]/30 shadow-[0_0_10px_rgba(255,255,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
                  >
                    En Revisión
                    <span className={`${filterStatus === 'en_revision' ? 'bg-[#FFFF00] text-black' : 'bg-zinc-800 text-zinc-500'} text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors`}>{countEnRevision}</span>
                  </button>
                  <button 
                    onClick={() => setFilterStatus('aprobado')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'aprobado' ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 shadow-[0_0_10px_rgba(57,255,20,0.2)]' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Aprobados
                    <span className={`${filterStatus === 'aprobado' ? 'bg-[#39FF14] text-black' : 'bg-zinc-800 text-zinc-500'} text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors`}>{countAprobados}</span>
                  </button>
                  <button 
                    onClick={() => setFilterStatus('pendiente')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'pendiente' ? 'bg-[#FF073A]/10 text-[#FF073A] border border-[#FF073A]/30 shadow-[0_0_10px_rgba(255,7,58,0.2)]' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Sin Pagar
                    <span className={`${filterStatus === 'pendiente' ? 'bg-[#FF073A] text-white' : 'bg-zinc-800 text-zinc-500'} text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors`}>{countSinPagar}</span>
                  </button>
                  <button 
                    onClick={() => setFilterStatus('saldo_pendiente')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'saldo_pendiente' ? 'bg-[#FF5E00]/10 text-[#FF5E00] border border-[#FF5E00]/30 shadow-[0_0_10px_rgba(255,94,0,0.2)]' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Deben Saldo
                    <span className={`${filterStatus === 'saldo_pendiente' ? 'bg-[#FF5E00] text-white' : 'bg-zinc-800 text-zinc-500'} text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors`}>{countDebenSaldo}</span>
                  </button>
                </div>
                
                {/* Búsqueda */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Buscar piloto..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-zinc-900 border-zinc-700 text-white h-9" 
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Cargando base de datos de pilotos...</div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900/50 text-zinc-300 uppercase font-semibold text-xs border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Estado Pago</th>
                    <th className="px-6 py-4">Piloto</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4">Motocicleta</th>
                    <th className="px-6 py-4">Fecha Reg.</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4">
                        {(reg.estadoPago === 'aprobado' || reg.estadoPago === 'pago_dia_evento') && (
                          <div style={{ color: reg.estadoPago === 'aprobado' ? '#39FF14' : '#60A5FA', backgroundColor: reg.estadoPago === 'aprobado' ? 'rgba(57, 255, 20, 0.1)' : 'rgba(96, 165, 250, 0.1)', borderColor: reg.estadoPago === 'aprobado' ? 'rgba(57, 255, 20, 0.2)' : 'rgba(96, 165, 250, 0.2)', textShadow: reg.estadoPago === 'aprobado' ? '0 0 10px rgba(57, 255, 20, 0.4)' : '0 0 10px rgba(96, 165, 250, 0.4)' }} className="flex items-center gap-2 px-3 py-1 rounded-full border w-fit">
                            <CheckCircle2 className="w-4 h-4" /> <span className="font-bold text-xs">{reg.estadoPago === 'aprobado' ? 'APROBADO' : 'DÍA EVENTO'}</span>
                          </div>
                        )}
                        {(reg.estadoPago === 'en_revision' || reg.estadoPago === 'revision_saldo') && (
                          <div style={{ color: '#FFFF00', backgroundColor: 'rgba(255, 255, 0, 0.1)', borderColor: 'rgba(255, 255, 0, 0.2)', textShadow: '0 0 10px rgba(255, 255, 0, 0.4)' }} className="flex items-center gap-2 px-3 py-1 rounded-full border w-fit">
                            <Clock className="w-4 h-4" /> <span className="font-bold text-xs">{reg.estadoPago === 'revision_saldo' ? 'REVISIÓN SALDO' : 'EN REVISIÓN'}</span>
                          </div>
                        )}
                        {reg.estadoPago === 'pendiente' && (
                          <div style={{ color: '#FF073A', backgroundColor: 'rgba(255, 7, 58, 0.1)', borderColor: 'rgba(255, 7, 58, 0.2)', textShadow: '0 0 10px rgba(255, 7, 58, 0.4)' }} className="flex items-center gap-2 px-3 py-1 rounded-full border w-fit">
                            <AlertCircle className="w-4 h-4" /> <span className="font-bold text-xs">PENDIENTE</span>
                          </div>
                        )}
                        {reg.estadoPago === 'rechazado' && (
                          <div style={{ color: '#FF073A', backgroundColor: 'rgba(255, 7, 58, 0.1)', borderColor: 'rgba(255, 7, 58, 0.2)', textShadow: '0 0 10px rgba(255, 7, 58, 0.4)' }} className="flex items-center gap-2 px-3 py-1 rounded-full border w-fit">
                            <AlertCircle className="w-4 h-4" /> <span className="font-bold text-xs">RECHAZADO</span>
                          </div>
                        )}
                        {reg.estadoPago === 'saldo_pendiente' && (
                          <div style={{ color: '#FF5E00', backgroundColor: 'rgba(255, 94, 0, 0.1)', borderColor: 'rgba(255, 94, 0, 0.2)', textShadow: '0 0 10px rgba(255, 94, 0, 0.4)' }} className="flex items-center gap-2 px-3 py-1 rounded-full border w-fit">
                            <AlertCircle className="w-4 h-4" /> <span className="font-bold text-xs">DEBE SALDO</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{reg.nombres} {reg.apellidos}</span>
                          <span className="text-zinc-500 text-xs">{reg.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ color: '#00FFFF', backgroundColor: 'rgba(0, 255, 255, 0.1)', borderColor: 'rgba(0, 255, 255, 0.2)', textShadow: '0 0 10px rgba(0, 255, 255, 0.4)' }} className="inline-block px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider">
                          {Array.isArray(reg.categoria) && reg.categoria.length > 0 ? reg.categoria.join(' / ') : (!reg.categoria || reg.categoria === 'N/A' || reg.categoria.length === 0 ? 'N/A' : reg.categoria)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Bike className="w-4 h-4 text-zinc-500" />
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-mono font-bold uppercase">{reg.motocicleta.placa}</span>
                            <span className="text-xs text-zinc-500">{reg.motocicleta.marca} {reg.motocicleta.referencia}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-400">
                          {reg.registradoEl ? new Date(reg.registradoEl).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        {reg.prioridadRechazado && (
                          <div className="absolute top-4 right-12 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse z-10" title="Re-subida de comprobante rechazado"></div>
                        )}
                        <Link href={`/pilotos/${reg.id}`}>
                          <button className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredRegistrations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">No hay registros que coincidan con la búsqueda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
