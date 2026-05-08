'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ClipboardList, Search, Play, ShieldAlert, User, Phone, Mail, MapPin, Instagram } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface Calificacion {
  combos: number;
  drif: number;
  acro: number;
  endos: number;
  flow: number;
  agres: number;
  error: number;
  total: number;
}

interface Registration {
  id: string;
  uid: string;
  categoria: string | string[];
  motocicleta: {
    placa: string;
    marca: string;
    referencia: string;
  };
  registradoEl: string;
  estadoPago: string;
  nombres: string;
  apellidos: string;
  numeroIdentificacion: string;
  calificaciones?: Record<string, Calificacion>;
}

// ---------------------------------------------------------------------------
// DUMMY DATA FALLBACK
// ---------------------------------------------------------------------------
const dummyAlto: Registration[] = [
  {
    id: 'dummy_alto_1', uid: 'u1', categoria: 'ALTO CILINDRAJE', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'CAMILO', apellidos: 'RESTREPO', numeroIdentificacion: '10203040',
    motocicleta: { placa: 'YTX-123', marca: 'YAMAHA', referencia: 'MT09' }
  }
];

const dummyOpen: Registration[] = [
  {
    id: 'dummy_open_1', uid: 'u2', categoria: 'OPEN', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'SEBASTIAN', apellidos: 'MARTINEZ', numeroIdentificacion: '98765432',
    motocicleta: { placa: 'PKS-999', marca: 'HONDA', referencia: 'CBR600' }
  },
  {
    id: 'dummy_open_2', uid: 'u3', categoria: 'OPEN', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'ANDRES', apellidos: 'GOMEZ', numeroIdentificacion: '11223344',
    motocicleta: { placa: 'ZXY-456', marca: 'YAMAHA', referencia: 'R6' }
  },
  {
    id: 'dummy_open_3', uid: 'u4', categoria: 'OPEN', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'MATEO', apellidos: 'LOPEZ', numeroIdentificacion: '55667788',
    motocicleta: { placa: 'QWE-789', marca: 'KAWASAKI', referencia: 'ZX6R' }
  },
  {
    id: 'dummy_open_4', uid: 'u5', categoria: 'OPEN', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'DANIEL', apellidos: 'OSORIO', numeroIdentificacion: '99887766',
    motocicleta: { placa: 'ASD-123', marca: 'SUZUKI', referencia: 'GSXR' }
  },
  {
    id: 'dummy_open_5', uid: 'u6', categoria: 'OPEN', registradoEl: '', estadoPago: 'aprobado',
    nombres: 'JULIAN', apellidos: 'CASTAÑO', numeroIdentificacion: '44332211',
    motocicleta: { placa: 'FGH-456', marca: 'YAMAHA', referencia: 'MT07' }
  }
];

// ---------------------------------------------------------------------------
// MODAL WIZARD SECUENCIAL
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// MODAL CALIFICACIÓN (TODO EN UNA PANTALLA)
// ---------------------------------------------------------------------------
const criteriaList = [
  { id: 'combos', label: 'COMBOS' },
  { id: 'drif', label: 'DRIF' },
  { id: 'acro', label: 'ACRO' },
  { id: 'endos', label: 'ENDOS' },
  { id: 'flow', label: 'FLOW' },
  { id: 'agres', label: 'AGRES' },
  { id: 'error', label: 'ERROR' }
];

const GradingModal = ({
  pilot,
  currentUid,
  onClose,
  onSaveAndNext
}: {
  pilot: Registration;
  currentUid: string;
  onClose: () => void;
  onSaveAndNext: (isLastStep: boolean) => void;
}) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const existingScore = pilot.calificaciones?.[currentUid];
  const [scores, setScores] = useState({
    combos: existingScore?.combos || 0,
    drif: existingScore?.drif || 0,
    acro: existingScore?.acro || 0,
    endos: existingScore?.endos || 0,
    flow: existingScore?.flow || 0,
    agres: existingScore?.agres || 0,
    error: existingScore?.error || 0,
  });

  const totalTemp = scores.combos + scores.drif + scores.acro + scores.endos + scores.flow + scores.agres - scores.error;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const calificacionData: Calificacion = { ...scores, total: totalTemp };
      
      // Save to Firebase only if it's not a dummy ID
      if (!pilot.id.startsWith('dummy')) {
        await setDoc(doc(db, 'event_registrations', pilot.id), {
          calificaciones: { [currentUid]: calificacionData }
        }, { merge: true });
      }
      
      // Update local state instantly
      if (!pilot.calificaciones) pilot.calificaciones = {};
      pilot.calificaciones[currentUid] = calificacionData;
      
      onSaveAndNext(true); // Tell parent to jump to next pilot or close
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo guardar la calificación.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleScoreChange = (id: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setScores(prev => ({ ...prev, [id as keyof typeof scores]: num }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl relative my-auto">
        
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-[#2A2A2A] flex justify-between items-center bg-[#0D0D0D]">
          <div>
            <h2 className="text-[#E8E8E8] text-2xl font-bold uppercase tracking-widest">{pilot.nombres} {pilot.apellidos}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="bg-[#2A2A2A] text-[#E8E8E8] font-mono font-bold px-2 py-0.5 rounded text-sm">#{pilot.numeroIdentificacion}</span>
              <span className="text-[#F5C200] font-bold text-sm tracking-wider uppercase">{Array.isArray(pilot.categoria) ? pilot.categoria.join(', ') : pilot.categoria}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[#888888] text-xs font-bold uppercase tracking-widest block">Total</span>
            <span className="text-4xl font-black text-[#00FF88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)] leading-none">{totalTemp}</span>
          </div>
        </div>

        {/* Contenido (Grilla de inputs) */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {criteriaList.map((crit) => (
            <div key={crit.id} className="flex flex-col">
              <label className={`text-xs font-bold uppercase tracking-widest mb-2 ${crit.id === 'error' ? 'text-[#FF4444]' : 'text-[#888888]'}`}>
                {crit.label}
              </label>
              <Input 
                type="number" 
                value={scores[crit.id as keyof typeof scores] || ''}
                onChange={e => handleScoreChange(crit.id, e.target.value)}
                className={`text-2xl h-14 font-mono text-center border bg-[#0D0D0D] focus-visible:ring-0 ${crit.id === 'error' ? 'text-[#FF4444] border-red-900/50 focus-visible:border-[#FF4444]' : 'text-[#E8E8E8] border-[#2A2A2A] focus-visible:border-[#00FF88] focus-visible:text-[#00FF88]'}`}
              />
            </div>
          ))}
        </div>

        {/* Footer Controles */}
        <div className="px-6 py-5 bg-[#222222] border-t border-[#2A2A2A] flex justify-between gap-4 mt-auto">
          <button onClick={onClose} disabled={saving} className="border border-[#333333] text-[#888888] font-bold px-6 py-3 rounded hover:bg-[#1A1A1A] transition-colors w-1/3 uppercase tracking-wider">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={saving} className="bg-[#00FF88] text-[#0D0D0D] font-bold px-6 py-3 rounded hover:bg-[#00E67A] transition-colors w-2/3 uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            {saving ? 'Guardando...' : 'Confirmar Puntuación'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PAGE COMPONENT
// ---------------------------------------------------------------------------
export default function JuecesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Master Table State
  const [judgeNames, setJudgeNames] = useState<Record<string, string>>({});
  const [allJudgeUids, setAllJudgeUids] = useState<string[]>([]);
  const [judgeProfiles, setJudgeProfiles] = useState<any[]>([]);
  const [masterCategory, setMasterCategory] = useState<string>('OPEN');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  // Wizard State
  const [activePilotIndex, setActivePilotIndex] = useState<number | null>(null);
  const [activeCategoryList, setActiveCategoryList] = useState<Registration[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      setCurrentUid(user.uid);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const interfaces = data?.interfaces || [];
        
        const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '') || interfaces.includes('admin');
        
        if (isSuperAdmin || interfaces.includes('jueces')) {
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
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      const jNames: Record<string, string> = {};
      const officialJueces: string[] = [];
      const officialJuecesProfiles: any[] = [];
      
      usersSnap.forEach(doc => {
        const d = doc.data();
        usersMap.set(doc.id, d);
        if (d.nombres) {
          jNames[doc.id] = `${d.nombres.split(' ')[0]} ${d.apellidos ? d.apellidos.split(' ')[0] : ''}`.trim();
        }
        // Identificar como jurado ESTRICTAMENTE si el rol es 'juez'
        if (d.rol === 'juez') {
          officialJueces.push(doc.id);
          officialJuecesProfiles.push({ id: doc.id, ...d });
        }
      });
      setJudgeNames(jNames);
      setAllJudgeUids(officialJueces);
      setJudgeProfiles(officialJuecesProfiles);

      const regSnap = await getDocs(collection(db, 'event_registrations'));
      const fetched: Registration[] = [];
      
      regSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.uid && data.estadoPago === 'aprobado') {
          const userData = usersMap.get(data.uid) || {};
          fetched.push({
            id: docSnap.id,
            uid: data.uid,
            categoria: data.categoria || 'N/A',
            motocicleta: data.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
            registradoEl: data.registradoEl || new Date().toISOString(),
            estadoPago: data.estadoPago,
            nombres: userData.nombres || 'Desconocido',
            apellidos: userData.apellidos || '',
            numeroIdentificacion: userData.numeroIdentificacion || 'N/A',
            calificaciones: data.calificaciones || {}
          });
        }
      });
      
      fetched.sort((a, b) => a.nombres.localeCompare(b.nombres));

      // Inject Dummy Data if empty to ensure design is visible
      const openCount = fetched.filter(f => {
        const c = Array.isArray(f.categoria) ? f.categoria.join(' ') : String(f.categoria);
        return c.toUpperCase().includes('OPEN');
      }).length;
      const altoCount = fetched.filter(f => {
        const c = Array.isArray(f.categoria) ? f.categoria.join(' ') : String(f.categoria);
        return c.toUpperCase().includes('ALTO CILINDRAJE');
      }).length;
      
      if (openCount === 0) fetched.push(...dummyOpen);
      if (altoCount === 0) fetched.push(...dummyAlto);

      setRegistrations(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess === null || currentUid === null) return null;

  const groupedByCategory = registrations.reduce((acc, reg) => {
    let cats: string[] = [];
    if (Array.isArray(reg.categoria)) {
      cats = reg.categoria.map(c => String(c).toUpperCase());
    } else {
      cats = String(reg.categoria || 'N/A').toUpperCase().split(',').map(c => c.trim());
    }

    cats.forEach(cat => {
      let finalCat = cat;
      if (finalCat === 'ALTO') finalCat = 'ALTO CILINDRAJE';

      if (!acc[finalCat]) acc[finalCat] = [];
      if (!acc[finalCat].find(p => p.id === reg.id)) {
        acc[finalCat].push(reg);
      }
    });

    return acc;
  }, {} as Record<string, Registration[]>);

  // Forzar las 4 categorías principales siempre
  const displayCategories = ['OPEN', '2 TIEMPOS', '4 TIEMPOS', 'ALTO CILINDRAJE'];

  const handleStartSequential = (cat: string) => {
    const pilots = groupedByCategory[cat] || [];
    if (pilots.length === 0) {
      toast({ title: 'Sin pilotos', description: `No hay pilotos inscritos en ${cat}.` });
      return;
    }
    setActiveCategoryList(pilots);
    setActivePilotIndex(0);
  };

  const handleEvaluateSpecific = (cat: string, index: number) => {
    const pilots = groupedByCategory[cat] || [];
    setActiveCategoryList(pilots);
    setActivePilotIndex(index);
  };

  const handleWizardNext = () => {
    if (activePilotIndex !== null && activePilotIndex < activeCategoryList.length - 1) {
      setActivePilotIndex(activePilotIndex + 1); // Salta al modal del siguiente piloto
    } else {
      setActivePilotIndex(null); // Termina
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E8E8E8] font-sans">
      {/* HEADER */}
      <header className="px-6 py-8 md:px-10 max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-widest">Panel de Jueces</h1>
            <p className="text-[#888888]">Sistema centralizado de calificaciones.</p>
          </div>
          
          <Dialog open={isDirectoryOpen} onOpenChange={setIsDirectoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#00FF88]/50 text-[#00FF88] hover:bg-[#00FF88]/10 hover:text-[#00FF88] font-bold uppercase tracking-widest h-11 px-6">
                <ShieldAlert className="w-5 h-5 mr-2" /> Directorio de Jueces
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-[#1A1A1A] border-[#2A2A2A] max-h-[85vh] overflow-y-auto custom-scrollbar">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#2A2A2A] pb-4">
                  <ShieldAlert className="w-5 h-5 text-yellow-500"/> Hoja de Vida de Jueces
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-2">
                {judgeProfiles.length === 0 ? (
                   <p className="text-[#888888] text-center py-10 font-mono">No hay jueces registrados en el sistema.</p>
                ) : (
                   judgeProfiles.map(juez => (
                      <div key={juez.id} className="p-5 rounded-lg bg-[#222222] border border-[#2A2A2A] flex flex-col gap-4 transition-colors hover:border-[#00FF88]/50">
                         <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-[#0D0D0D] border-2 border-[#00FF88] flex items-center justify-center font-bold text-[#00FF88] text-2xl shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                             {juez.nombres?.charAt(0)}
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-white uppercase tracking-wider">{juez.nombres} {juez.apellidos}</h3>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">CC: {juez.numeroIdentificacion}</span>
                               <span className="text-xs text-purple-400 font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Juez Oficial</span>
                             </div>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-[#2A2A2A] pt-4">
                           <div className="flex items-center gap-2 text-[#E8E8E8]"><Mail className="w-4 h-4 text-[#888888] shrink-0"/> <span className="truncate">{juez.email}</span></div>
                           <div className="flex items-center gap-2 text-[#E8E8E8]"><Phone className="w-4 h-4 text-[#888888] shrink-0"/> <span>{juez.telefono || 'N/A'}</span></div>
                           <div className="flex items-center gap-2 text-[#E8E8E8]"><MapPin className="w-4 h-4 text-[#888888] shrink-0"/> <span className="truncate">{juez.ciudad || 'N/A'} - {juez.direccion || 'N/A'}</span></div>
                           <div className="flex items-center gap-2 text-[#E8E8E8]"><Instagram className="w-4 h-4 text-[#888888] shrink-0"/> <span className="truncate">{juez.instagram || 'N/A'}</span></div>
                         </div>
                      </div>
                   ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative w-full md:w-80">
          <Input 
            placeholder="Buscar..." 
            className="w-full bg-[#1A1A1A] border-[#2A2A2A] text-[#E8E8E8] h-10 px-4 pr-10 focus-visible:ring-[#00FF88] rounded"
          />
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-[#00FF88]" />
        </div>
      </header>

      {/* CARDS GRID - 4 columnas */}
      <main className="px-6 md:px-10 pb-20 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {displayCategories.map(cat => {
              const pilots = groupedByCategory[cat] || [];
              const graded = pilots.filter(p => p.calificaciones && p.calificaciones[currentUid]).length;
              const progress = pilots.length > 0 ? (graded / pilots.length) * 100 : 0;

              return (
                <div key={cat} className="bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col h-full rounded shadow-xl overflow-hidden">
                  
                  {/* CARD HEADER */}
                  <div className="p-5 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-black text-[#F5C200] uppercase tracking-widest">{cat}</h2>
                      <span className="bg-[#003320] text-[#00FF88] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        EN CURSO
                      </span>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[#888888] text-[10px] font-bold uppercase tracking-wider">Progreso</span>
                      <span className="font-mono text-xs"><span className="text-[#00FF88] font-bold">{graded}</span> <span className="text-[#888888]">/ {pilots.length}</span></span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#2A2A2A] h-1 rounded-[2px] overflow-hidden">
                      <div className="bg-[#00FF88] h-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  {/* TABLE (In-Card, always visible, no horizontal scroll) */}
                  <div className="flex-grow">
                    <table className="w-full text-left table-fixed text-xs border-t border-[#2A2A2A]">
                      <colgroup>
                        <col className="w-12 sm:w-16" />
                        <col className="w-auto" />
                        <col className="w-16 sm:w-20" />
                        <col className="w-12 sm:w-16" />
                      </colgroup>
                      <thead className="bg-[#1A1A1A] text-[#888888] font-bold uppercase text-[10px] border-b border-[#2A2A2A]">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-2 py-2">Piloto</th>
                          <th className="px-2 py-2 text-center">Estado</th>
                          <th className="px-3 py-2 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2A]">
                        {pilots.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[#555] font-bold uppercase tracking-widest text-xs">
                              Sin inscritos
                            </td>
                          </tr>
                        ) : (
                          pilots.map((pilot, index) => {
                            const isGraded = !!(pilot.calificaciones && pilot.calificaciones[currentUid]);
                            const score = isGraded ? pilot.calificaciones![currentUid].total : null;
                            const statusBg = isGraded ? 'bg-[#003320]' : 'bg-[#1A1200]';
                            const statusText = isGraded ? 'text-[#00FF88]' : 'text-[#F5C200]';
                            const statusLabel = isGraded ? 'Cal.' : 'Pend.';

                            return (
                              <tr 
                                key={pilot.id} 
                                onClick={() => handleEvaluateSpecific(cat, index)}
                                className="even:bg-[#222222] odd:bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                                title="Clic para evaluar a este piloto"
                              >
                                <td className="px-3 py-3">
                                  <span className="font-mono font-bold text-[#E8E8E8] bg-[#2A2A2A] px-1.5 py-0.5 rounded text-xs">
                                    {pilot.numeroIdentificacion.slice(-4)}
                                  </span>
                                </td>
                                <td className="px-2 py-3 truncate">
                                  <div className="text-[#E8E8E8] font-bold text-xs uppercase truncate">
                                    {pilot.nombres.split(' ')[0]} {pilot.apellidos.split(' ')[0]}
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className={`${statusBg} ${statusText} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {isGraded ? (
                                    <span className="text-[#00FF88] font-bold font-mono text-sm">{score}</span>
                                  ) : (
                                    <span className="text-[#555555] font-bold font-mono text-sm">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* BOTTOM ACTION */}
                  <button 
                    onClick={() => handleStartSequential(cat)}
                    disabled={pilots.length === 0}
                    className="w-full bg-[#00FF88] hover:bg-[#00E67A] disabled:bg-[#1A1A1A] disabled:text-[#333] disabled:border-t disabled:border-[#2A2A2A] text-[#0D0D0D] font-black text-sm h-12 flex items-center justify-center uppercase tracking-widest transition-all mt-auto shadow-[0_0_15px_rgba(0,255,136,0.15)] hover:shadow-[0_0_25px_rgba(0,255,136,0.3)] disabled:shadow-none"
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    INICIAR
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MASTER LEADERBOARD TABLE */}
      <section className="px-6 md:px-10 pb-20 max-w-[1600px] mx-auto mt-10">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-[#2A2A2A] bg-[#0D0D0D]">
            {displayCategories.map(cat => (
              <button 
                key={cat}
                onClick={() => setMasterCategory(cat)}
                className={`px-6 py-4 font-bold uppercase tracking-widest text-sm transition-colors border-b-2 ${masterCategory === cat ? 'border-[#00FF88] text-[#00FF88] bg-[#1A1A1A]' : 'border-transparent text-[#888888] hover:text-[#E8E8E8] hover:bg-[#111111]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="p-6">
            <div className="overflow-x-auto border border-[#2A2A2A] rounded-md">
            {(() => {
              const masterPilots = groupedByCategory[masterCategory] || [];
              const gradedJudgeUids = Array.from(new Set(
                masterPilots.flatMap(p => Object.keys(p.calificaciones || {}))
              ));
              
              // Mostrar jueces oficiales + cualquiera que ya haya calificado
              let displayJudgeUids = Array.from(new Set([...allJudgeUids, ...gradedJudgeUids]));
              
              // Si no hay jueces oficiales ni calificaciones, mostramos 3 columnas genéricas por defecto
              if (displayJudgeUids.length === 0) {
                displayJudgeUids = ['juez_1', 'juez_2', 'juez_3'];
              }

              if (masterPilots.length === 0) {
                return <div className="text-center text-[#888888] py-10 font-bold tracking-widest uppercase">No hay pilotos inscritos en {masterCategory}.</div>;
              }

              const getJudgeName = (uid: string) => {
                if (uid === 'juez_1') return 'Juez 1';
                if (uid === 'juez_2') return 'Juez 2';
                if (uid === 'juez_3') return 'Juez 3';
                return judgeNames[uid] || 'Jurado';
              };

              return (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-[#0D0D0D] text-[#E8E8E8] text-xs font-bold uppercase tracking-widest border-b border-[#2A2A2A]">
                    <tr>
                      <th rowSpan={2} className="w-[60px] min-w-[60px] px-2 py-3 border-r border-[#2A2A2A] bg-[#0D0D0D] sticky left-0 z-30 text-center">#</th>
                      <th rowSpan={2} className="px-4 py-3 border-r border-[#2A2A2A] w-[200px] min-w-[200px] max-w-[200px] bg-[#0D0D0D] sticky left-[60px] z-30 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.8)]">Piloto</th>
                      {criteriaList.map(c => (
                        <th key={c.id} colSpan={displayJudgeUids.length} className="px-4 py-2 border-r border-[#2A2A2A] text-center border-b">
                          {c.label}
                        </th>
                      ))}
                      <th colSpan={displayJudgeUids.length} className="px-4 py-2 border-r border-[#2A2A2A] text-center text-[#F5C200] border-b">Subtotal</th>
                      <th rowSpan={2} className="px-4 py-3 text-center text-[#00FF88] min-w-[80px]">Total</th>
                    </tr>
                    <tr>
                      {criteriaList.map(c => 
                        displayJudgeUids.map(uid => (
                          <th key={`${c.id}-${uid}`} className="px-2 py-1 border-r border-[#2A2A2A] text-center text-[10px] text-[#888888] font-normal truncate max-w-[80px]" title={getJudgeName(uid)}>
                            {getJudgeName(uid)}
                          </th>
                        ))
                      )}
                      {displayJudgeUids.map(uid => (
                        <th key={`sub-${uid}`} className="px-2 py-1 border-r border-[#2A2A2A] text-center text-[10px] text-[#F5C200] font-normal truncate max-w-[80px]" title={getJudgeName(uid)}>
                          {getJudgeName(uid)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {masterPilots.map((pilot, index) => {
                      const califs = pilot.calificaciones || {};
                      
                      // Calculate global total
                      const globalTotal = displayJudgeUids.reduce((sum, uid) => {
                        return sum + (califs[uid]?.total || 0);
                      }, 0);

                      const rowBg = index % 2 === 0 ? 'bg-[#1A1A1A]' : 'bg-[#222222]';

                      return (
                        <tr key={pilot.id} className={`group ${rowBg} hover:bg-[#2A2A2A] transition-colors`}>
                          <td className={`w-[60px] min-w-[60px] px-2 py-3 border-r border-[#2A2A2A] text-center sticky left-0 z-20 ${rowBg} group-hover:bg-[#2A2A2A]`}>
                            <span className="font-mono font-bold text-[#E8E8E8] bg-[#2A2A2A] px-2 py-1 rounded text-xs">
                              {pilot.numeroIdentificacion.slice(-4)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 border-r border-[#2A2A2A] font-bold text-sm uppercase truncate w-[200px] min-w-[200px] max-w-[200px] sticky left-[60px] z-20 ${rowBg} group-hover:bg-[#2A2A2A] shadow-[10px_0_15px_-5px_rgba(0,0,0,0.8)]`}>
                            {pilot.nombres} {pilot.apellidos}
                          </td>
                          
                          {criteriaList.map(c => 
                            displayJudgeUids.map(uid => {
                              const score = califs[uid]?.[c.id as keyof typeof califs[string]] || 0;
                              return (
                                <td key={`${pilot.id}-${c.id}-${uid}`} className={`px-2 py-3 border-r border-[#2A2A2A] text-center font-mono ${c.id === 'error' ? 'text-[#FF4444]' : 'text-[#E8E8E8]'}`}>
                                  {score}
                                </td>
                              );
                            })
                          )}
                          
                          {displayJudgeUids.map(uid => {
                            const subtotal = califs[uid]?.total || 0;
                            return (
                              <td key={`sub-${pilot.id}-${uid}`} className="px-2 py-3 border-r border-[#2A2A2A] text-center font-mono font-bold text-[#F5C200]">
                                {subtotal}
                              </td>
                            );
                          })}

                          <td className="px-4 py-3 text-center font-mono font-black text-lg text-[#00FF88]">
                            {globalTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
            </div>
          </div>
        </div>
      </section>

      {/* RENDERIZADO DEL MODAL */}
      {activePilotIndex !== null && (
        <GradingModal 
          pilot={activeCategoryList[activePilotIndex]}
          currentUid={currentUid as string}
          onClose={() => setActivePilotIndex(null)}
          onSaveAndNext={handleWizardNext}
        />
      )}

    </div>
  );
}
