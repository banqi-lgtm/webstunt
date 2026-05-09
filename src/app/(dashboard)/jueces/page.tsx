'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ClipboardList, Search, Play, ShieldAlert, User, Phone, Mail, MapPin, Instagram, Info, Flame, Gamepad2, Star, AlertTriangle } from 'lucide-react';
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
  { id: 'combos', label: 'COMBOS', max: 20 },
  { id: 'drif', label: 'DRIF', max: 10 },
  { id: 'acro', label: 'ACRO', max: 10 },
  { id: 'endos', label: 'ENDOS', max: 10 },
  { id: 'flow', label: 'FLOW', max: 10 },
  { id: 'agres', label: 'AGRES', max: 10 },
  { id: 'error', label: 'ERROR', max: 9999 }
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
      
      await setDoc(doc(db, 'calificaciones', pilot.id), {
        [currentUid]: calificacionData
      }, { merge: true });
      
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
    let num = parseInt(val, 10) || 0;
    const criterion = criteriaList.find(c => c.id === id);
    if (criterion) {
      num = Math.max(0, Math.min(num, criterion.max));
    }
    setScores(prev => ({ ...prev, [id as keyof typeof scores]: num }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(45deg, #0a0a0a 25%, transparent 25%, transparent 75%, #0a0a0a 75%, #0a0a0a), linear-gradient(45deg, #0a0a0a 25%, transparent 25%, transparent 75%, #0a0a0a 75%, #0a0a0a)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px'
      }}></div>
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
        <span className="text-[40rem] font-black text-white leading-none select-none">X</span>
      </div>

      {/* Main Modal Container */}
      <div className="relative z-10 bg-[#0a0a0a] border-2 border-[#00ff44] rounded-xl w-full max-w-2xl flex flex-col shadow-[0_0_30px_rgba(0,255,68,0.3)] my-auto">
        
        {/* Decorative corner screws */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full border border-[#555] bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center z-20"><div className="w-1.5 h-[1px] bg-[#555] rotate-45"></div></div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full border border-[#555] bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center z-20"><div className="w-1.5 h-[1px] bg-[#555] -rotate-45"></div></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full border border-[#555] bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center z-20"><div className="w-1.5 h-[1px] bg-[#555] rotate-90"></div></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full border border-[#555] bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] flex items-center justify-center z-20"><div className="w-1.5 h-[1px] bg-[#555] rotate-0"></div></div>

        {/* Header */}
        <div className="px-2 sm:px-4 py-1.5 sm:py-3 border-b-2 border-[#1a1a1a] flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden bg-gradient-to-b from-[#111] to-[#0a0a0a] rounded-t-xl gap-1.5 sm:gap-0">
          {/* Subtle top scanline */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff44]/50 to-transparent"></div>
          
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Custom Category Badge */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-[#00ff44] blur opacity-25"></div>
              <div className="relative bg-[#00220a] border border-[#00ff44] rounded-lg p-0.5 sm:p-1 w-8 h-8 sm:w-12 sm:h-12 flex flex-col items-center justify-center shadow-[inset_0_0_10px_rgba(0,255,68,0.2)]">
                <Flame className="w-3 h-3 sm:w-5 sm:h-5 text-[#00ff44] drop-shadow-[0_0_5px_rgba(0,255,68,0.8)]" />
                <span className="text-[#00ff44] font-black text-[6px] sm:text-[8px] mt-0 sm:mt-0.5 tracking-widest uppercase truncate max-w-full text-center">
                  {Array.isArray(pilot.categoria) ? pilot.categoria[0] : pilot.categoria}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-base sm:text-xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff] to-[#888888] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight">
                {pilot.nombres} {pilot.apellidos}
              </h2>
              <div className="text-[#888888] font-mono text-[9px] sm:text-xs tracking-widest mt-0 sm:mt-0.5">
                #{pilot.numeroIdentificacion}
              </div>
            </div>
          </div>

          {/* HUD Total Circle */}
          <div className="relative shrink-0 sm:ml-4 self-end sm:self-auto -mt-6 sm:mt-0">
             <div className="absolute -inset-2 bg-[#00ff44] blur opacity-20 rounded-full"></div>
             <div className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 border-[#00ff44] bg-[#001105] flex flex-col items-center justify-center shadow-[inset_0_0_15px_rgba(0,255,68,0.5),0_0_15px_rgba(0,255,68,0.3)]">
               <span className="text-[#00ff44] text-[5px] sm:text-[8px] font-black tracking-widest absolute top-1 sm:top-2 drop-shadow-[0_0_2px_rgba(0,255,68,0.8)]">TOTAL</span>
               <span className="text-lg sm:text-2xl font-black text-[#00ff44] drop-shadow-[0_0_8px_#00ff44] mt-1.5 sm:mt-2 font-mono leading-none">{totalTemp}</span>
             </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-1 bg-[#111] flex items-center justify-center relative z-10">
          <div className="w-1/3 h-[1px] bg-[#00ff44]/30"></div>
        </div>

        {/* Content Grid */}
        <div className="px-2 py-1.5 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-2 sm:gap-x-5 gap-y-1.5 sm:gap-y-3 bg-transparent">
          {criteriaList.filter(c => c.id !== 'error').map((crit) => (
            <div key={crit.id} className="flex flex-col items-center relative group">
              <label className="text-[#cccccc] text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-0.5 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)] z-10">
                {crit.label}
              </label>
              
              {/* LCD Input Container */}
              <div className="relative w-full">
                {/* HUD Angled Borders (Clip Path simulation via CSS) */}
                <div className="absolute inset-0 bg-[#00ff44]/5 blur-sm rounded"></div>
                <div 
                  className="relative bg-[#1a1a1a] border border-[#333] shadow-[inset_0_2px_10px_rgba(0,255,68,0.15)] flex items-center justify-center p-0.5"
                  style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                  {/* Subtle top edge glow */}
                  <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-[#00ff44]/40"></div>
                  
                  <Input 
                    type="number" 
                    min="0"
                    max={crit.max}
                    value={scores[crit.id as keyof typeof scores] === 0 ? '' : scores[crit.id as keyof typeof scores]}
                    onChange={e => handleScoreChange(crit.id, e.target.value)}
                    placeholder="0"
                    className="text-base sm:text-xl h-6 sm:h-10 w-full font-mono font-bold text-center bg-transparent border-none text-[#e8e8e8] placeholder:text-[#333] focus-visible:ring-0 focus-visible:text-[#00ff44] drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] px-0"
                  />
                </div>
              </div>
              
              <span className="text-[6px] sm:text-[8px] text-[#555] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] mt-0.5 flex items-center w-full justify-center opacity-70 whitespace-nowrap">
                <span className="w-full h-[1px] bg-[#333] mr-1 sm:mr-2"></span>
                ( 0 A {crit.max} )
                <span className="w-full h-[1px] bg-[#333] ml-1 sm:ml-2"></span>
              </span>
            </div>
          ))}
        </div>

        {/* ERROR Section */}
        <div className="px-2 sm:px-5 pb-1 sm:pb-2 pt-0 w-full flex flex-col items-center">
           <div className="w-full max-w-xs sm:max-w-sm flex flex-col items-center">
             <label className="text-[#ff2200] text-[9px] sm:text-xs font-black uppercase tracking-widest mb-0.5 flex items-center gap-1 sm:gap-2 drop-shadow-[0_0_8px_rgba(255,34,0,0.6)]">
                <AlertTriangle className="w-3 h-3" /> ERROR <AlertTriangle className="w-3 h-3" />
             </label>
             <div className="relative w-full">
                <div className="absolute inset-0 bg-[#ff2200]/10 blur-md rounded"></div>
                <div 
                  className="relative bg-[#1a0505] border border-[#ff2200] shadow-[inset_0_0_15px_rgba(255,34,0,0.3),0_0_10px_rgba(255,34,0,0.2)] flex items-center justify-center p-0.5"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <Input 
                    type="number" 
                    min="0"
                    max={9999}
                    value={scores.error === 0 ? '' : scores.error}
                    onChange={e => handleScoreChange('error', e.target.value)}
                    placeholder="0"
                    className="text-base sm:text-2xl h-6 sm:h-10 w-full font-mono font-black text-center bg-transparent border-none text-[#00ff44] placeholder:text-[#550000] focus-visible:ring-0 focus-visible:text-[#00ff44] drop-shadow-[0_0_8px_#00ff44] px-0"
                  />
                </div>
             </div>
             <span className="text-[6px] sm:text-[9px] text-[#ff2200] font-black uppercase tracking-[0.1em] mt-0.5 flex items-center w-full justify-center whitespace-nowrap">
                <span className="w-full h-[1px] bg-[#ff2200]/30 mr-1 sm:mr-2"></span>
                ⚠ ( 0 A INFINITO ) ⚠
                <span className="w-full h-[1px] bg-[#ff2200]/30 ml-1 sm:ml-2"></span>
              </span>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-[#111] border-t-2 border-[#222] flex justify-between items-center gap-1.5 sm:gap-3 relative overflow-hidden rounded-b-xl z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] opacity-50 pointer-events-none"></div>
          
          <button 
            onClick={onClose} 
            disabled={saving} 
            className="relative z-10 bg-[#8b0000] border border-[#ff2200]/50 text-white font-black px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#a00000] transition-colors w-1/3 uppercase tracking-widest text-[8px] sm:text-[10px] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-center"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            Cancelar
          </button>
          
          {/* Metallic separator */}
          <div className="w-1 h-5 sm:h-8 bg-[#333] border-x border-[#555] rounded-sm relative z-10 shadow-[inset_0_0_5px_rgba(0,0,0,0.8)] flex-none"></div>

          <button 
            onClick={handleConfirm} 
            disabled={saving} 
            className="relative z-10 bg-[#1a1a1a] border border-[#666] text-[#e8e8e8] font-black px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#2a2a2a] hover:border-[#00ff44] hover:text-[#00ff44] transition-all w-2/3 uppercase tracking-widest text-[8px] sm:text-[10px] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] flex items-center justify-between"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 opacity-70" />
              <span>{saving ? 'Guardando...' : 'Confirmar'}</span>
            </div>
            <Star className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 fill-current hidden sm:block" />
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
  const [isRulesOpen, setIsRulesOpen] = useState(false);

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

      // Fetch Calificaciones
      const califSnap = await getDocs(collection(db, 'calificaciones'));
      const califMap = new Map();
      califSnap.forEach(docSnap => {
        califMap.set(docSnap.id, docSnap.data());
      });

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
            calificaciones: califMap.get(docSnap.id) || {}
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


  const getCatColor = (cat: string) => {
    if (cat.includes('OPEN')) return 'border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]';
    if (cat.includes('TIEMPOS')) return 'border-[#ff6b00] text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.2)]';
    if (cat.includes('ALTO')) return 'border-[#ffd700] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]';
    return 'border-[#00cfff] text-[#00cfff]';
  };

  const getCatGlow = (cat: string) => {
    if (cat.includes('OPEN')) return 'shadow-[0_0_15px_rgba(0,255,136,0.2)] shadow-[inset_0_0_15px_rgba(0,255,136,0.05)] border-[#00ff88]';
    if (cat.includes('TIEMPOS')) return 'shadow-[0_0_15px_rgba(255,107,0,0.2)] shadow-[inset_0_0_15px_rgba(255,107,0,0.05)] border-[#ff6b00]';
    if (cat.includes('ALTO')) return 'shadow-[0_0_15px_rgba(255,215,0,0.2)] shadow-[inset_0_0_15px_rgba(255,215,0,0.05)] border-[#ffd700]';
    return 'border-[#00cfff]';
  };

  const getCatTextGlow = (cat: string) => {
    if (cat.includes('OPEN')) return 'text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]';
    if (cat.includes('TIEMPOS')) return 'text-[#ff6b00] drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]';
    if (cat.includes('ALTO')) return 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]';
    return 'text-[#00cfff]';
  };

  const getCatTextColor = (cat: string) => {
    if (cat.includes('OPEN')) return 'text-[#00ff88]';
    if (cat.includes('TIEMPOS')) return 'text-[#ff6b00]';
    if (cat.includes('ALTO')) return 'text-[#ffd700]';
    return 'text-[#00cfff]';
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black font-sans text-[#E8E8E8] relative">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* HEADER */}
      <header className="flex-none min-h-[90px] py-4 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between z-10 border-b border-[#1A2540] bg-black backdrop-blur-md gap-6">
          <div className="w-full md:w-[60%] flex items-center min-w-0 md:mr-4">
            <img src="/sponsors/Logosp.png" alt="Sponsors" className="w-full h-auto max-h-[120px] object-contain object-left" />
          </div>

        <div className="w-full md:w-[40%] flex flex-col items-center justify-center gap-2">
          <h1 className="text-lg md:text-xl font-black tracking-widest leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] text-center">
            PANEL DE JUECES
          </h1>
          <div className="flex gap-2">
            <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#00cfff]/50 text-[#00cfff] bg-[#00cfff]/5 hover:bg-[#00cfff]/20 hover:text-[#00cfff] font-bold uppercase tracking-widest h-9 px-4 text-xs shadow-[0_0_10px_rgba(0,207,255,0.2)]">
                  <Info className="w-4 h-4 mr-2" /> Instructivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl bg-[#0a1628] border-[#00cfff] text-[#E8E8E8] shadow-[0_0_30px_rgba(0,207,255,0.3)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1A2540] pb-4">
                    <Info className="w-5 h-5 text-[#00cfff]"/> Instructivo de Calificación
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4 text-sm text-[#888888]">
                  <p>Límites de puntuación permitidos:</p>
                  <ul className="list-disc pl-5 space-y-2 text-[#E8E8E8] font-mono">
                    <li><strong className="text-[#ff6b00]">COMBOS:</strong> 0 a 20 puntos</li>
                    <li><strong className="text-[#ff00cc]">DRIFT:</strong> 0 a 10 puntos</li>
                    <li><strong className="text-[#b026ff]">ACRO:</strong> 0 a 10 puntos</li>
                    <li><strong className="text-[#00cfff]">ENDOS:</strong> 0 a 10 puntos</li>
                    <li><strong className="text-[#00ff88]">FLOW:</strong> 0 a 10 puntos</li>
                    <li><strong className="text-[#ffd700]">AGRES:</strong> 0 a 10 puntos</li>
                    <li><strong className="text-[#ff3333]">ERROR:</strong> 0 a infinito (Se resta del total)</li>
                  </ul>
                  <p className="mt-4 pt-4 border-t border-[#1A2540] text-[10px] font-bold uppercase tracking-widest text-[#00cfff]">
                    * El sistema ajustará automáticamente cualquier valor que exceda estos límites.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDirectoryOpen} onOpenChange={setIsDirectoryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#00ff88]/50 text-[#00ff88] bg-[#00ff88]/5 hover:bg-[#00ff88]/20 hover:text-[#00ff88] font-bold uppercase tracking-widest h-9 px-4 text-xs shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Directorio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-[#0a1628] border-[#00ff88] max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1A2540] pb-4">
                    <ShieldAlert className="w-5 h-5 text-[#00ff88]"/> Hoja de Vida de Jueces
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-2">
                  {judgeProfiles.length === 0 ? (
                     <p className="text-[#888888] text-center py-10 font-mono">No hay jueces registrados en el sistema.</p>
                  ) : (
                     judgeProfiles.map(juez => (
                        <div key={juez.id} className="p-4 rounded-lg bg-[#0d1b2e] border border-[#1A2540] flex flex-col gap-4 transition-colors hover:border-[#00FF88]/50">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-[#050B14] border-2 border-[#00FF88] flex items-center justify-center font-bold text-[#00FF88] text-xl shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                               {juez.nombres?.charAt(0)}
                             </div>
                             <div>
                               <h3 className="text-lg font-bold text-white uppercase tracking-wider">{juez.nombres} {juez.apellidos}</h3>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] text-yellow-500 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">CC: {juez.numeroIdentificacion}</span>
                                 <span className="text-[10px] text-purple-400 font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Juez Oficial</span>
                               </div>
                             </div>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-[#1A2540] pt-3">
                             <div className="flex items-center gap-2 text-[#E8E8E8]"><Mail className="w-3 h-3 text-[#888888] shrink-0"/> <span className="truncate">{juez.email}</span></div>
                             <div className="flex items-center gap-2 text-[#E8E8E8]"><Phone className="w-3 h-3 text-[#888888] shrink-0"/> <span>{juez.telefono || 'N/A'}</span></div>
                             <div className="flex items-center gap-2 text-[#E8E8E8]"><MapPin className="w-3 h-3 text-[#888888] shrink-0"/> <span className="truncate">{juez.ciudad || 'N/A'} - {juez.direccion || 'N/A'}</span></div>
                             <div className="flex items-center gap-2 text-[#E8E8E8]"><Instagram className="w-3 h-3 text-[#888888] shrink-0"/> <span className="truncate">{juez.instagram || 'N/A'}</span></div>
                           </div>
                        </div>
                     ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>


        </div>
      </header>

      {/* TOP SECTION: CATEGORY CARDS */}
      <section className="flex-none p-4 md:p-6 z-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#00cfff] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {displayCategories.map(cat => {
              const pilots = groupedByCategory[cat] || [];
              const graded = pilots.filter(p => p.calificaciones && p.calificaciones[currentUid]).length;
              const progress = pilots.length > 0 ? (graded / pilots.length) * 100 : 0;
              const circumference = 2 * Math.PI * 18;
              const strokeDashoffset = circumference - (progress / 100) * circumference;

              return (
                <div key={cat} className={`bg-[#0d1b2e] border rounded-xl flex flex-col h-[280px] relative overflow-hidden ${getCatGlow(cat)}`}>
                  
                  {/* CARD HEADER */}
                  <div className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <h2 className={`text-xl font-black uppercase tracking-widest leading-none w-2/3 ${getCatTextGlow(cat)}`}>{cat}</h2>
                      
                      {/* Gauge Speedometer */}
                      <div className="relative w-12 h-12 flex-none">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="18" fill="none" stroke="#1A2540" strokeWidth="3" />
                          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" 
                            className={`${getCatTextColor(cat)} transition-all duration-1000`}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                          {graded}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1">
                      <span className="text-[#888888] text-[9px] font-bold uppercase tracking-wider">Progreso</span>
                      <span className="font-mono text-[10px]"><span className={`font-bold ${getCatTextColor(cat)}`}>{graded}</span> <span className="text-[#555]">/ {pilots.length}</span></span>
                    </div>
                    {/* Progress Bar linear */}
                    <div className="w-full bg-[#1A2540] h-[3px] mt-1 rounded-full overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                      <div className={`h-full transition-all bg-current ${getCatTextColor(cat)}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  {/* TABLE (In-Card, scrollable) */}
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 mt-2">
                    <table className="w-full text-left table-fixed text-[10px]">
                      <colgroup>
                        <col className="w-10" />
                        <col className="w-auto" />
                        <col className="w-12" />
                        <col className="w-10" />
                      </colgroup>
                      <thead className="text-[#888888] font-bold uppercase tracking-wider border-b border-[#1A2540] sticky top-0 bg-[#0d1b2e] z-10">
                        <tr>
                          <th className="px-2 py-1.5 font-mono">#</th>
                          <th className="px-1 py-1.5">Piloto</th>
                          <th className="px-1 py-1.5 text-center">Estado</th>
                          <th className="px-2 py-1.5 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A2540]">
                        {pilots.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center">
                              <div className="flex flex-col items-center justify-center text-[#555] gap-2">
                                <ShieldAlert className="w-6 h-6 opacity-50" />
                                <span className="font-bold uppercase tracking-widest text-[9px]">No hay inscritos aún<br/>en esta categoría</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          pilots.map((pilot, index) => {
                            const isGraded = !!(pilot.calificaciones && pilot.calificaciones[currentUid]);
                            const score = isGraded ? pilot.calificaciones![currentUid].total : null;
                            const statusBg = isGraded ? 'bg-[#003320] text-[#00ff88] border-[#00ff88]/30' : 'bg-[#331800] text-[#ff6b00] border-[#ff6b00]/30';
                            const statusLabel = isGraded ? 'CAL.' : 'PEND.';

                            return (
                              <tr 
                                key={pilot.id} 
                                onClick={() => handleEvaluateSpecific(cat, index)}
                                className="hover:bg-[#1A2540] transition-colors cursor-pointer group"
                              >
                                <td className="px-2 py-2">
                                  <span className="font-mono text-[#888888] group-hover:text-white transition-colors">
                                    {pilot.numeroIdentificacion.slice(-4)}
                                  </span>
                                </td>
                                <td className="px-1 py-2 truncate">
                                  <div className="text-[#E8E8E8] font-bold uppercase truncate group-hover:text-white transition-colors">
                                    {pilot.nombres.split(' ')[0]} {pilot.apellidos.split(' ')[0]}
                                  </div>
                                </td>
                                <td className="px-1 py-2 text-center">
                                  <span className={`${statusBg} border text-[8px] font-bold px-1.5 py-0.5 rounded uppercase`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {isGraded ? (
                                    <span className={`font-bold font-mono ${getCatTextColor(cat)}`}>{score}</span>
                                  ) : (
                                    <span className="text-[#555] font-bold font-mono">-</span>
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
                  <div className="p-3 bg-[#050B14]/50 border-t border-[#1A2540] flex-none">
                    <button 
                      onClick={() => handleStartSequential(cat)}
                      disabled={pilots.length === 0}
                      className="w-full bg-[#00ff88] hover:bg-[#00e67a] disabled:bg-[#1A2540] disabled:text-[#555] disabled:shadow-none text-[#050B14] font-black text-xs h-9 rounded-lg flex items-center justify-center uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                    >
                      <Play className="w-3 h-3 mr-2 fill-current" />
                      INICIAR
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM SECTION: DATA CONSOLE */}
      <section className="px-4 md:px-6 pb-12 z-10 flex flex-col mt-4">
        <div className="flex flex-col bg-[#0a1628]/80 backdrop-blur-md border border-[#00cfff] rounded-xl shadow-[0_0_20px_rgba(0,207,255,0.15)] relative w-full overflow-hidden">
          
          {/* Decorative corner markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00cfff] z-20"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00cfff] z-20"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00cfff] z-20"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00cfff] z-20"></div>

          {/* Console Header / Tabs */}
          <div className="flex-none flex items-center justify-between border-b border-[#00cfff]/30 bg-[#050B14]/60 px-4 py-3 w-full">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pr-4 flex-1">
              {displayCategories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setMasterCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${masterCategory === cat ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.2)]' : 'bg-transparent text-[#888888] border border-transparent hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-none pl-2 md:pl-0 border-l md:border-l-0 border-[#1A2540]">
              <span className="text-[#00cfff] font-mono text-[10px] tracking-[0.2em] uppercase font-bold drop-shadow-[0_0_5px_rgba(0,207,255,0.5)] whitespace-nowrap">DATA CONSOLE</span>
              <div className="flex gap-1 hidden md:flex">
                <div className="w-4 h-4 rounded-sm border border-[#ffd700] flex items-center justify-center text-[#ffd700] cursor-pointer hover:bg-[#ffd700]/20"><div className="w-2 h-0.5 bg-current"></div></div>
                <div className="w-4 h-4 rounded-sm border border-[#ff3333] flex items-center justify-center text-[#ff3333] cursor-pointer hover:bg-[#ff3333]/20"><div className="w-2 h-2 border border-current"></div></div>
              </div>
            </div>
          </div>

          {/* Console Table Container */}
          <div className="w-full overflow-x-auto custom-scrollbar pb-4">
            {(() => {
              const masterPilots = groupedByCategory[masterCategory] || [];
              const gradedJudgeUids = Array.from(new Set(
                masterPilots.flatMap(p => Object.keys(p.calificaciones || {}))
              ));
              
              let displayJudgeUids = Array.from(new Set([...allJudgeUids, ...gradedJudgeUids]));
              if (displayJudgeUids.length === 0) {
                displayJudgeUids = ['juez_1', 'juez_2', 'juez_3'];
              }

              if (masterPilots.length === 0) {
                return (
                  <div className="h-full flex items-center justify-center text-[#555] font-mono text-sm tracking-widest uppercase">
                    No data available for {masterCategory}
                  </div>
                );
              }

              const getJudgeName = (uid: string) => {
                if (uid === 'juez_1') return 'Juez 1';
                if (uid === 'juez_2') return 'Juez 2';
                if (uid === 'juez_3') return 'Juez 3';
                return judgeNames[uid] || 'Jurado';
              };

              // Re-create criteria with neon colors
              const neonCriteria = [
                { id: 'combos', label: 'COMBOS', color: 'text-[#ff6b00]', border: 'border-[#ff6b00]' },
                { id: 'drif', label: 'DRIFT', color: 'text-[#ff00cc]', border: 'border-[#ff00cc]' },
                { id: 'acro', label: 'ACRO', color: 'text-[#b026ff]', border: 'border-[#b026ff]' },
                { id: 'endos', label: 'ENDOS', color: 'text-[#00cfff]', border: 'border-[#00cfff]' },
                { id: 'flow', label: 'FLOW', color: 'text-[#00ff88]', border: 'border-[#00ff88]' },
                { id: 'agres', label: 'AGRESSIVITY', color: 'text-[#ffd700]', border: 'border-[#ffd700]' },
                { id: 'error', label: 'ERROR', color: 'text-[#ff3333]', border: 'border-[#ff3333]' }
              ];

              const sortedMasterPilots = [...masterPilots].map(pilot => {
                const califs = pilot.calificaciones || {};
                const globalTotal = displayJudgeUids.reduce((sum, uid) => sum + (califs[uid]?.total || 0), 0);
                return { ...pilot, _globalTotal: globalTotal };
              }).sort((a, b) => b._globalTotal - a._globalTotal);

              return (
                <table className="w-full text-left border-collapse min-w-[1000px] font-mono text-xs">
                  <thead className="sticky top-0 z-40 bg-[#0a1628] shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                    <tr>
                      <th rowSpan={2} className="w-12 px-2 py-2 text-center text-[#888888] sticky left-0 z-30 bg-[#0a1628]">#</th>
                      <th rowSpan={2} className="px-4 py-2 text-[#888888] w-[180px] sticky left-[48px] z-30 bg-[#0a1628] shadow-[5px_0_15px_rgba(0,0,0,0.5)]">PILOTO</th>
                      
                      {neonCriteria.map(c => (
                        <th key={c.id} colSpan={displayJudgeUids.length} className={`px-2 py-2 text-center ${c.color} ${c.border} border-x border-t bg-[#050B14]`}>
                          <span className="drop-shadow-[0_0_5px_currentColor]">{c.label}</span>
                        </th>
                      ))}
                      
                      <th colSpan={displayJudgeUids.length} className="px-2 py-2 text-center text-[#ffd700] border-x border-t border-[#ffd700] bg-[#050B14] min-w-[80px]">
                        <span className="drop-shadow-[0_0_5px_currentColor]">SUBTOTAL</span>
                      </th>
                      <th rowSpan={2} className="px-4 py-2 text-center text-[#00cfff] border border-[#00cfff] bg-[#050B14] shadow-[inset_0_0_10px_rgba(0,207,255,0.1)] min-w-[80px]">
                        <span className="drop-shadow-[0_0_5px_currentColor]">TOTAL</span>
                      </th>
                    </tr>
                    <tr>
                      {neonCriteria.map(c => 
                        displayJudgeUids.map(uid => (
                          <th key={`${c.id}-${uid}`} className={`px-1 py-1 text-center text-[8px] text-[#888888] border-x border-b ${c.border} bg-[#0a1628] truncate max-w-[80px]`} title={getJudgeName(uid)}>
                            {getJudgeName(uid).split(' ')[0]}
                          </th>
                        ))
                      )}
                      {displayJudgeUids.map(uid => (
                        <th key={`sub-${uid}`} className="px-1 py-1 text-center text-[8px] text-[#ffd700]/70 border-x border-b border-[#ffd700] bg-[#0a1628] truncate max-w-[80px]" title={getJudgeName(uid)}>
                          {getJudgeName(uid).split(' ')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2540]">
                    {sortedMasterPilots.map((pilot, index) => {
                      const califs = pilot.calificaciones || {};
                      const globalTotal = pilot._globalTotal;

                      return (
                        <tr key={pilot.id} className="hover:bg-[#1A2540]/50 transition-colors">
                          <td className="px-2 py-3 text-center text-[#555] sticky left-0 z-20 bg-[#0a1628] group-hover:bg-[#1A2540]">
                            {pilot.numeroIdentificacion.slice(-4)}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#E8E8E8] uppercase truncate sticky left-[48px] z-20 bg-[#0a1628] shadow-[5px_0_15px_rgba(0,0,0,0.5)] group-hover:bg-[#1A2540]">
                            {pilot.nombres.split(' ')[0]} {pilot.apellidos.split(' ')[0]}
                          </td>
                          
                          {neonCriteria.map(c => 
                            displayJudgeUids.map(uid => {
                              const score = califs[uid]?.[c.id as keyof Calificacion] || 0;
                              const isError = c.id === 'error';
                              return (
                                <td key={`${pilot.id}-${c.id}-${uid}`} className={`px-1 py-3 text-center border-x border-[#1A2540] bg-[#050B14]/20 ${isError && score > 0 ? 'text-[#ff3333]' : 'text-[#E8E8E8]'}`}>
                                  {score}
                                </td>
                              );
                            })
                          )}
                          
                          {displayJudgeUids.map(uid => {
                            const subtotal = califs[uid]?.total || 0;
                            return (
                              <td key={`sub-${pilot.id}-${uid}`} className="px-1 py-3 text-center font-bold text-[#ffd700] border-x border-[#1A2540] bg-[#ffd700]/5">
                                {subtotal}
                              </td>
                            );
                          })}

                          <td className="px-4 py-3 text-center border border-[#00cfff] bg-[#00cfff]/5">
                            <div className="w-full h-full min-h-[28px] rounded border border-[#00cfff]/50 flex items-center justify-center font-black text-base text-[#00cfff] drop-shadow-[0_0_8px_rgba(0,207,255,0.8)] shadow-[inset_0_0_10px_rgba(0,207,255,0.2)]">
                              {globalTotal}
                            </div>
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
      </section>

      {/* RENDERIZADO DEL MODAL */}
      {activePilotIndex !== null && (
        <GradingModal 
          key={activeCategoryList[activePilotIndex].id}
          pilot={activeCategoryList[activePilotIndex]}
          currentUid={currentUid}
          onClose={() => setActivePilotIndex(null)}
          onSaveAndNext={handleWizardNext}
        />
      )}

    </div>
  );
}
