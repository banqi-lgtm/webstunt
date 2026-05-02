'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Users, Search, Bike, ChevronRight, Clock, AlertCircle, CheckCircle2, ScanLine, User, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      const isSuperAdmin = user.email === 'wg12435@hotmail.com';
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        const interfaces = data?.interfaces || [];
        
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
        if (data.uid) {
          regsMap.set(data.uid, { id: docSnap.id, ...data });
        }
      });

      const fetched: Registration[] = [];
      
      // Combine users and registrations to show everyone
      usersMap.forEach((userData, userId) => {
        // Exclude super admin if they don't have basic pilot data
        if (userData.email === 'wg12435@hotmail.com' && !userData.numeroIdentificacion) return;
        
        // Skip users with missing names
        if (!userData.nombres) return;

        const regData = regsMap.get(userId) || {};
        
        fetched.push({
          id: regData.id || `f2r_${userId}`,
          uid: userId,
          categoria: regData.categoria || 'N/A',
          motocicleta: regData.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
          registradoEl: regData.registradoEl || userData.createdAt || new Date().toISOString(),
          estadoPago: regData.estadoPago || 'pendiente',
          nombres: userData.nombres || 'Desconocido',
          apellidos: userData.apellidos || '',
          email: userData.email || 'N/A',
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
    
    const matchesFilter = filterStatus === 'todos' || r.estadoPago === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const countEnRevision = registrations.filter(r => r.estadoPago === 'en_revision' || r.estadoPago === 'revision_saldo').length;

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
          
          <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 h-12 px-6 w-full md:w-auto font-bold shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <ScanLine className="w-5 h-5" /> ESCANEAR QR INGRESO
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
                        if (value && value.startsWith('f2r_')) {
                          setScannerOpen(false);
                          setFetchingScan(true);
                          setIsScannedDialogOpen(true);
                          try {
                             const regDoc = await getDoc(doc(db, 'event_registrations', value));
                             if (regDoc.exists()) {
                               const data = regDoc.data();
                               const extractedUid = data.uid || value.replace('f2r_', '');
                               const userDoc = await getDoc(doc(db, 'users', extractedUid));
                               const userData = userDoc.exists() ? userDoc.data() : {};
                               setScannedPilot({
                                  ...data,
                                  nombres: userData.nombres,
                                  apellidos: userData.apellidos,
                                  numeroIdentificacion: userData.numeroIdentificacion,
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
                        } else if (value) {
                          toast({ title: 'QR Inválido', description: 'Este código QR no pertenece al sistema de F2R.', variant: 'destructive' });
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
             if (!open) setScannedPilot(null);
          }}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
               {fetchingScan ? (
                 <div className="flex flex-col items-center justify-center py-10">
                   <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-zinc-400">Verificando pase de ingreso...</p>
                 </div>
               ) : scannedPilot ? (
                 <div className="flex flex-col gap-6 pt-4">
                   <h3 className="text-xl font-bold text-white text-center">Checklist de Ingreso</h3>
                   
                   <ul className="space-y-3">
                     {/* Pago */}
                     <li className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                        <span className="text-zinc-300 font-semibold text-lg">1. Pago de Inscripción</span>
                        {scannedPilot.estadoPago === 'aprobado' ? (
                          <span className="flex items-center text-green-400 font-bold text-lg"><CheckCircle2 className="w-6 h-6 mr-1" /> Aprobado</span>
                        ) : (
                          <span className="flex items-center text-red-400 font-bold text-lg"><XCircle className="w-6 h-6 mr-1" /> Pendiente</span>
                        )}
                     </li>
                     
                     {/* Docs */}
                     {(() => {
                        const docs = scannedPilot.documentos || {};
                        const docsComplete = docs.idUrl && docs.placaUrl && docs.propiedadUrl && docs.soatUrl && docs.deportistaUrl;
                        return (
                          <li className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                             <span className="text-zinc-300 font-semibold text-lg">2. Documentos Legales</span>
                             {docsComplete ? (
                               <span className="flex items-center text-green-400 font-bold text-lg"><CheckCircle2 className="w-6 h-6 mr-1" /> Completos</span>
                             ) : (
                               <span className="flex items-center text-orange-400 font-bold text-lg"><AlertCircle className="w-6 h-6 mr-1" /> Incompletos</span>
                             )}
                          </li>
                        );
                     })()}
                   </ul>

                   {/* Acces Permitted Banner */}
                   {scannedPilot.estadoPago === 'aprobado' && (() => {
                        const docs = scannedPilot.documentos || {};
                        const docsComplete = docs.idUrl && docs.placaUrl && docs.propiedadUrl && docs.soatUrl && docs.deportistaUrl;
                        if (docsComplete) return (
                          <div className="w-full bg-green-600 text-white font-black text-center py-4 rounded-lg text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse">
                            ¡ACCESO PERMITIDO!
                          </div>
                        );
                        return null;
                   })()}
                   
                   <div className="flex gap-2 w-full mt-2">
                      <Button onClick={() => setIsScannedDialogOpen(false)} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cerrar Escáner</Button>
                      <Link href={`/pilotos/f2r_${scannedPilot.uid}`} className="w-full">
                        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">Ver Expediente Completo</Button>
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
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'todos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFilterStatus('en_revision')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${filterStatus === 'en_revision' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-zinc-400 hover:text-white'}`}
                  >
                    En Revisión
                    {countEnRevision > 0 && (
                      <span className="bg-yellow-500 text-yellow-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{countEnRevision}</span>
                    )}
                  </button>
                  <button 
                    onClick={() => setFilterStatus('aprobado')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'aprobado' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Aprobados
                  </button>
                  <button 
                    onClick={() => setFilterStatus('pendiente')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'pendiente' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Sin Pagar
                  </button>
                  <button 
                    onClick={() => setFilterStatus('saldo_pendiente')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === 'saldo_pendiente' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Deben Saldo
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
                        {reg.estadoPago === 'aprobado' && (
                          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 w-fit">
                            <CheckCircle2 className="w-4 h-4" /> <span className="font-bold text-xs">APROBADO</span>
                          </div>
                        )}
                        {(reg.estadoPago === 'en_revision' || reg.estadoPago === 'revision_saldo') && (
                          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 w-fit">
                            <Clock className="w-4 h-4" /> <span className="font-bold text-xs">{reg.estadoPago === 'revision_saldo' ? 'REVISIÓN SALDO' : 'EN REVISIÓN'}</span>
                          </div>
                        )}
                        {reg.estadoPago === 'pendiente' && (
                          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 w-fit">
                            <AlertCircle className="w-4 h-4" /> <span className="font-bold text-xs">PENDIENTE</span>
                          </div>
                        )}
                        {reg.estadoPago === 'saldo_pendiente' && (
                          <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 w-fit">
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
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                          {reg.categoria}
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
                      <td className="px-6 py-4 text-right">
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
