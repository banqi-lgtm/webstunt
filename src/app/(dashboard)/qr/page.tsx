'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Printer, Users, Box, ArrowLeft, QrCode, Search } from 'lucide-react';
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
}

export default function QrPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'none' | 'pilotos' | 'cajas'>('none');
  const [search, setSearch] = useState('');

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

      const fetched: Registration[] = [];
      
      usersMap.forEach((userData, userId) => {
        // Skip staff and judges
        if (userData.rol === 'staff' || userData.rol === 'juez') return;

        const regData = regsMap.get(userId) || {};
        const estadoPago = (regData.estadoPago === 'borrador' ? 'pendiente' : regData.estadoPago) || 'pendiente';
        
        // Solo aprobados o pago día evento
        if (estadoPago === 'aprobado' || estadoPago === 'pago_dia_evento') {
          fetched.push({
            id: regData.id || `f2r_${userId}`,
            uid: userId,
            categoria: Array.isArray(regData.categoria) ? regData.categoria.join(' / ') : (regData.categoria || 'N/A'),
            motocicleta: regData.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
            estadoPago,
            nombres: userData.nombres || 'Desconocido',
            apellidos: userData.apellidos || '',
            numeroIdentificacion: userData.numeroIdentificacion || regData.numeroIdentificacion || '',
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
            {Array.from({ length: registrations.length }).map((_, index) => {
              const cajaId = `caja_${index + 1}`;
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
                      <h3 className="font-black text-3xl text-[#39FF14] uppercase tracking-widest" style={{ textShadow: '0 0 10px rgba(57,255,20,0.5)' }}>
                        CAJA {index + 1}
                      </h3>
                      <div className="flex justify-center items-center mt-4 w-full border-t border-zinc-800 pt-3">
                        <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">COPA STUNT F2R 2026</span>
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
                <TabsList className="w-full sm:w-auto grid grid-cols-2 bg-zinc-900 border border-zinc-800 mb-8 p-1 h-12">
                  <TabsTrigger value="pilotos" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-[#39FF14] text-zinc-400 font-bold uppercase tracking-wider h-full">
                    <Users className="w-4 h-4 mr-2" /> QRs Pilotos
                  </TabsTrigger>
                  <TabsTrigger value="cajas" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-[#39FF14] text-zinc-400 font-bold uppercase tracking-wider h-full">
                    <Box className="w-4 h-4 mr-2" /> QRs Cajas
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pilotos" className="space-y-6">
                  <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm max-w-xl">
                      Genera un código QR único para cada piloto en estado <span className="text-green-400 font-bold">Aprobado</span> o <span className="text-blue-400 font-bold">Pago Día Evento</span>.
                    </p>
                    <Button 
                      onClick={() => setPrintMode('pilotos')}
                      className="bg-[#39FF14] hover:bg-[#32E011] text-black font-bold h-12 px-8 shadow-[0_0_20px_rgba(57,255,20,0.3)] shrink-0"
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
                  <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                    <p className="text-zinc-400 text-sm max-w-xl">
                      Genera etiquetas QR consecutivas (<span className="text-[#39FF14] font-mono">caja_1</span> a <span className="text-[#39FF14] font-mono">caja_{registrations.length}</span>) correspondientes al número total de pilotos aprobados.
                    </p>
                    <Button 
                      onClick={() => setPrintMode('cajas')}
                      className="bg-zinc-100 hover:bg-white text-black font-bold h-12 px-8 shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      IMPRIMIR CAJAS
                    </Button>
                  </div>

                  {/* Preview Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 opacity-70">
                    {Array.from({ length: Math.min(registrations.length, 10) }).map((_, index) => (
                       <div key={`preview_caja_${index}`} className="border border-zinc-800 bg-zinc-900/50 rounded-lg p-3 flex flex-col items-center text-center">
                          <QRCode value={`caja_${index + 1}`} size={80} fgColor="#39FF14" bgColor="transparent" />
                          <h4 className="text-[#39FF14] text-sm font-black mt-3 uppercase">CAJA {index + 1}</h4>
                       </div>
                    ))}
                    {registrations.length > 10 && (
                      <div className="border border-zinc-800 bg-zinc-900/20 border-dashed rounded-lg flex flex-col items-center justify-center text-zinc-500 p-4">
                        <span className="font-bold text-xl">+{registrations.length - 10}</span>
                        <span className="text-xs">Cajas ocultas en vista previa</span>
                      </div>
                    )}
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
