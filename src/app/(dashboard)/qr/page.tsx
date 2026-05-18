'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Printer, Users, Box, QrCode, Search, RefreshCw, CheckCircle2, XCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCode from 'react-qr-code';

interface Registration {
  id: string;
  uid: string;
  categoria: string;
  motocicleta: {
    placa: string;
    marca: string;
    referencia: string;
  };
  nombres: string;
  apellidos: string;
  estadoPago: string;
  numeroIdentificacion?: string;
  kitNumber?: number;
  kitEntregado?: boolean;
}

export default function QrPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'none' | 'pilotos' | 'cajas'>('none');
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

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
        
        if (isSuperAdmin || interfaces.includes('qr')) {
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

  useEffect(() => {
    if (printMode !== 'none') {
      // Small delay to allow the DOM to render the print view
      const timer = setTimeout(() => {
        window.print();
        // Return to normal view after print dialog closes
        setPrintMode('none');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

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

      // 3. Fetch listas_QR
      const qrSnap = await getDocs(collection(db, 'listas_QR'));
      const qrMap = new Map();
      qrSnap.forEach(docSnap => {
         qrMap.set(docSnap.id, docSnap.data());
      });

      const fetched: Registration[] = [];
      
      usersMap.forEach((userData, userId) => {
        // Skip staff and judges
        if (userData.rol === 'staff' || userData.rol === 'juez') return;

        const regData = regsMap.get(userId) || {};
        const estadoPago = (regData.estadoPago === 'borrador' ? 'pendiente' : regData.estadoPago) || 'pendiente';
        
        // Solo aprobados o pago día evento
        if (estadoPago === 'aprobado' || estadoPago === 'pago_dia_evento') {
          const regId = regData.id || `f2r_${userId}`;
          const kitInfo = qrMap.get(regId);
          fetched.push({
            id: regId,
            uid: userId,
            categoria: Array.isArray(regData.categoria) ? regData.categoria.join(' / ') : (regData.categoria || 'N/A'),
            motocicleta: regData.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
            estadoPago,
            nombres: userData.nombres || 'Desconocido',
            apellidos: userData.apellidos || '',
            numeroIdentificacion: userData.numeroIdentificacion || regData.numeroIdentificacion || '',
            kitNumber: kitInfo?.kitNumber,
            kitEntregado: kitInfo?.kitEntregado || false,
          });
        }
      });
      
      // Ordenar alfabéticamente
      fetched.sort((a, b) => a.nombres.localeCompare(b.nombres));
      
      setRegistrations(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncKits = async () => {
    try {
       setLoading(true);
       let nextKitNumber = 1;
       const q = query(collection(db, 'listas_QR'), orderBy('kitNumber', 'desc'), limit(1));
       const snap = await getDocs(q);
       if (!snap.empty) {
         nextKitNumber = snap.docs[0].data().kitNumber + 1;
       }
       
       // Ordenamos alfabéticamente para mantener compatibilidad de kits antiguos
       const sortedRegs = [...registrations].sort((a, b) => a.nombres.localeCompare(b.nombres));
       let synced = 0;
       
       for (const reg of sortedRegs) {
          if (!reg.kitNumber) {
             await setDoc(doc(db, 'listas_QR', reg.id), {
               uid: reg.uid,
               pilotId: reg.id,
               nombres: reg.nombres,
               apellidos: reg.apellidos,
               categoria: reg.categoria,
               kitNumber: nextKitNumber,
               kitEntregado: false,
               aprobadoEl: new Date().toISOString()
             });
             nextKitNumber++;
             synced++;
          }
       }
       await fetchRegistrations();
       toast({ title: 'Kits Sincronizados', description: `Se asignaron ${synced} números de kit nuevos.` });
    } catch (e) {
       console.error(e);
       toast({ title: 'Error', description: 'No se pudieron sincronizar los kits.', variant: 'destructive' });
       setLoading(false);
    }
  };

  if (hasAccess === null) return null;

  const filteredRegistrations = registrations.filter(r => 
    r.nombres.toLowerCase().includes(search.toLowerCase()) ||
    r.apellidos.toLowerCase().includes(search.toLowerCase()) ||
    r.motocicleta.placa.toLowerCase().includes(search.toLowerCase()) ||
    r.categoria.toLowerCase().includes(search.toLowerCase()) ||
    (r.numeroIdentificacion && r.numeroIdentificacion.toLowerCase().includes(search.toLowerCase()))
  );

  // Render para impresión exclusiva
  if (printMode !== 'none') {
    return (
      <div className="w-full text-white print-container" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 1cm; size: A4; }
            body, html { background-color: #ffffff !important; color: #000 !important; }
            .print-container { padding: 0 !important; background-color: #ffffff !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .qr-card { break-inside: avoid; page-break-inside: avoid; border: 2px dashed #999; padding: 2px; background-color: #ffffff !important; }
            .qr-card-inner { background-color: #0A0A0A !important; border: 2px solid #39FF14 !important; border-radius: 12px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; }
          }
        `}} />
        
        {printMode === 'pilotos' && (
          <div className="grid grid-cols-2 gap-8">
            {filteredRegistrations.map(pilot => (
              <div key={pilot.id} className="qr-card">
                <div className="qr-card-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/sponsors/PKS Blanco.png" alt="F2R" className="h-8 object-contain mb-4" />
                  
                  <div className="bg-white p-3 rounded-lg">
                    <QRCode value={pilot.id} size={150} fgColor="#000000" bgColor="#FFFFFF" level="M" />
                  </div>
                  
                  <div className="mt-4 w-full text-center">
                    <h3 className="font-bold text-xl text-white uppercase truncate" style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}>{pilot.nombres}</h3>
                    <p className="text-zinc-400 text-sm truncate">{pilot.apellidos}</p>
                    <div className="flex justify-between items-center mt-4 w-full border-t border-zinc-800 pt-3">
                      <span className="text-[#39FF14] font-bold text-sm uppercase tracking-widest">{pilot.motocicleta.placa}</span>
                      <span className="text-zinc-500 text-[11px] uppercase truncate max-w-[50%]">{pilot.categoria}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {printMode === 'cajas' && (
          <div className="grid grid-cols-2 gap-8">
            {filteredRegistrations.map((pilot, index) => {
              const cajaId = `kit_${pilot.id}`;
              return (
                <div key={cajaId} className="qr-card">
                  <div className="qr-card-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/sponsors/PKS Blanco.png" alt="F2R" className="h-8 object-contain mb-4" />
                    
                    <div className="bg-white p-3 rounded-lg relative">
                      <QRCode value={cajaId} size={150} fgColor="#000000" bgColor="#FFFFFF" level="H" />
                      {/* Small neon accent inside white area */}
                      <div className="absolute inset-0 border-2 border-[#39FF14] pointer-events-none rounded-lg opacity-30"></div>
                    </div>
                    
                    <div className="mt-4 w-full text-center">
                      <h3 className="font-black text-2xl text-[#39FF14] uppercase tracking-widest truncate" style={{ textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>
                        {pilot.nombres} {pilot.apellidos}
                      </h3>
                      <div className="flex flex-col justify-center items-center mt-3 w-full border-t border-zinc-800 pt-3">
                        <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest truncate max-w-full">{pilot.categoria}</span>
                        <span className="text-white font-bold text-lg mt-1">KIT {pilot.kitNumber || '?'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render normal de UI (pantalla)
  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#39FF14]/5 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-xl border border-[#39FF14]/30 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
              <QrCode className="w-8 h-8 text-[#39FF14]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Generador QR</h1>
              <p className="text-zinc-400">Códigos de acceso para pilotos aprobados y etiquetas de cajas.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-zinc-500 flex flex-col items-center">
             <div className="w-10 h-10 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(57,255,20,0.5)]"></div>
             Cargando pilotos aprobados...
          </div>
        ) : (
          <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
            <CardHeader className="border-b border-zinc-800/50 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-white text-xl">Gestión de Impresión</CardTitle>
                  <CardDescription className="text-zinc-400">Pilotos Filtrados: <span className="text-[#39FF14] font-bold">{filteredRegistrations.length}</span> / {registrations.length}</CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Buscar piloto, placa, cédula o categoría..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-zinc-900 border-zinc-700 text-white h-9" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              
              <Tabs defaultValue="pilotos" className="w-full">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 bg-zinc-900 border border-zinc-800 mb-8 p-1 h-12">
                  <TabsTrigger value="pilotos" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-[#39FF14] text-zinc-400 font-bold uppercase tracking-wider h-full">
                    <Users className="w-4 h-4 mr-2 hidden sm:block" /> Pilotos
                  </TabsTrigger>
                  <TabsTrigger value="cajas" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-[#39FF14] text-zinc-400 font-bold uppercase tracking-wider h-full">
                    <Box className="w-4 h-4 mr-2 hidden sm:block" /> Cajas
                  </TabsTrigger>
                  <TabsTrigger value="entregas" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-[#39FF14] text-zinc-400 font-bold uppercase tracking-wider h-full">
                    <Package className="w-4 h-4 mr-2 hidden sm:block" /> Entregas
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pilotos" className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm max-w-xl">
                      Genera un código QR único para cada piloto en estado <span className="text-green-400 font-bold">Aprobado</span> o <span className="text-blue-400 font-bold">Pago Día Evento</span>.
                    </p>
                    <Button 
                      onClick={() => setPrintMode('pilotos')}
                      className="w-full sm:w-auto bg-[#39FF14] hover:bg-[#32E011] text-black font-bold h-12 px-8 shadow-[0_0_20px_rgba(57,255,20,0.3)] shrink-0"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      IMPRIMIR PILOTOS
                    </Button>
                  </div>
                  
                  {/* Preview Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-70">
                    {filteredRegistrations.slice(0, 10).map(pilot => (
                       <div key={pilot.id} className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-3 flex flex-col items-center text-center">
                          <QRCode value={pilot.id} size={80} fgColor="#FFFFFF" bgColor="transparent" />
                          <h4 className="text-white text-xs font-bold mt-3 truncate w-full">{pilot.nombres}</h4>
                          <span className="text-zinc-500 text-[10px]">{pilot.motocicleta.placa}</span>
                       </div>
                    ))}
                    {filteredRegistrations.length > 10 && (
                      <div className="border border-zinc-800 bg-zinc-900/20 border-dashed rounded-lg flex flex-col items-center justify-center text-zinc-500 p-4">
                        <span className="font-bold text-xl">+{filteredRegistrations.length - 10}</span>
                        <span className="text-xs">Pilotos ocultos en vista previa</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="cajas" className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm max-w-xl">
                      Genera etiquetas QR para los kits de cada piloto filtrado, vinculadas a su expediente. {isAdmin && <span className="block mt-1 text-orange-400 font-bold text-xs">Si ves kits con número "?", usa el botón de sincronizar.</span>}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {isAdmin && (
                        <Button 
                          onClick={handleSyncKits}
                          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 px-4 shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0"
                          title="Sincronizar Pilotos Antiguos"
                        >
                          <RefreshCw className="w-5 h-5 mr-2" /> SINC KITS
                        </Button>
                      )}
                      <Button 
                        onClick={() => setPrintMode('cajas')}
                        className="w-full sm:w-auto bg-zinc-100 hover:bg-white text-black font-bold h-12 px-8 shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
                      >
                        <Printer className="w-5 h-5 mr-2" />
                        IMPRIMIR CAJAS
                      </Button>
                    </div>
                  </div>

                  {/* Preview Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-70">
                    {[...filteredRegistrations].sort((a,b)=>(a.kitNumber || 999)-(b.kitNumber || 999)).slice(0, 10).map((pilot) => (
                       <div key={`preview_kit_${pilot.id}`} className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-3 flex flex-col items-center text-center relative overflow-hidden">
                          {pilot.kitEntregado && <div className="absolute top-0 right-0 bg-green-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">ENTREGADO</div>}
                          <QRCode value={`kit_${pilot.id}`} size={80} fgColor="#39FF14" bgColor="transparent" />
                          <h4 className="text-[#39FF14] text-xs font-black mt-3 uppercase truncate w-full">{pilot.nombres}</h4>
                          <span className="text-zinc-500 text-[10px] font-bold">KIT {pilot.kitNumber || '?'}</span>
                       </div>
                    ))}
                    {filteredRegistrations.length > 10 && (
                      <div className="border border-zinc-800 bg-zinc-900/20 border-dashed rounded-lg flex flex-col items-center justify-center text-zinc-500 p-4">
                        <span className="font-bold text-xl">+{filteredRegistrations.length - 10}</span>
                        <span className="text-xs">Kits ocultos en vista previa</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="entregas" className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 mb-6">
                    <p className="text-zinc-400 text-sm max-w-xl">
                      Listado de kits asignados y su estado de entrega en tiempo real. 
                    </p>
                    <div className="flex items-center gap-4 text-sm font-bold w-full sm:w-auto justify-between sm:justify-end">
                       <span className="text-green-400"><CheckCircle2 className="inline w-4 h-4 mr-1"/> {registrations.filter(r => r.kitEntregado).length} Entregados</span>
                       <span className="text-red-400"><XCircle className="inline w-4 h-4 mr-1"/> {registrations.filter(r => r.kitNumber && !r.kitEntregado).length} Pendientes</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-zinc-300">
                        <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="px-6 py-4 font-semibold tracking-wider">Número Kit</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Piloto</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Categoría</th>
                            <th className="px-6 py-4 font-semibold tracking-wider text-right">Estado de Entrega</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filteredRegistrations].sort((a,b)=>(a.kitNumber || 999)-(b.kitNumber || 999)).map((pilot) => (
                            <tr key={pilot.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-[#39FF14] font-black text-lg bg-[#39FF14]/10 px-3 py-1 rounded-md border border-[#39FF14]/20">
                                  KIT {pilot.kitNumber || '?'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-white uppercase">{pilot.nombres} {pilot.apellidos}</div>
                                <div className="text-xs text-zinc-500 font-mono mt-0.5">{pilot.numeroIdentificacion || pilot.motocicleta.placa}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded border border-zinc-700 uppercase">{pilot.categoria}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {pilot.kitEntregado ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> ENTREGADO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                    <XCircle className="w-4 h-4" /> NO ENTREGADO
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filteredRegistrations.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                No se encontraron registros con esa búsqueda.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
                
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
