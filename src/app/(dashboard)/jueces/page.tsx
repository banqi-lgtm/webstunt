'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ClipboardList, Search, Play, ShieldAlert, User, Phone, Mail, MapPin, Instagram, Info, Flame, Gamepad2, Star, AlertTriangle, Edit2, Trophy, Download, FileText, Maximize, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';

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
  mejoras?: string;
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
  seudonimo?: string;
  instagram?: string;
  documentos?: {
    deportistaUrl?: string;
    [key: string]: any;
  };
  calificaciones?: Record<string, Calificacion>;
}

// ---------------------------------------------------------------------------
// DUMMY DATA FALLBACK
// ---------------------------------------------------------------------------

const MAIN_LOGO = { src: "/sponsors/copa stunt nitrox f2r.png", alt: "Copa Stunt F2R", className: "h-20 sm:h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] shrink-0 mx-2 sm:mx-6" };

const SPONSOR_LOGOS = [
  { src: "/sponsors/Nitrox Blanco.png", alt: "Nitrox", className: "h-10 sm:h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0" },
  { src: "/sponsors/Mobil Blanco.png", alt: "Mobil Super", className: "h-10 sm:h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0" },
  { src: "/sponsors/PKS Blanco.png", alt: "PKS", className: "h-8 sm:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/Trakku.png", alt: "Trakku", className: "h-8 sm:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/IRC Blanco.png", alt: "IRC", className: "h-8 sm:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/Fedemoto.png", alt: "Fedemoto", className: "h-8 sm:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" }
];

const dummyNitrox: Registration[] = [];

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
// HELPER FUNC
// ---------------------------------------------------------------------------
const getScoreForCategory = (pilot: Registration, uid: string, cat: string): Calificacion | undefined => {
  if (!pilot.calificaciones) return undefined;
  if (pilot.calificaciones[`${uid}_${cat}`]) return pilot.calificaciones[`${uid}_${cat}`];
  
  if (pilot.calificaciones[uid]) {
    let cats: string[] = [];
    if (Array.isArray(pilot.categoria)) {
      cats = pilot.categoria.map(c => String(c).toUpperCase());
    } else {
      cats = String(pilot.categoria || 'N/A').toUpperCase().split(',').map(c => c.trim());
    }
    
    let firstCat = cats[0] || '';
    if (firstCat.includes('ALTO') || firstCat === 'CATEGORIA NITROX' || firstCat === 'NITROX') firstCat = 'NITROX';
    if (firstCat === '2T') firstCat = '2 TIEMPOS';
    if (firstCat === '4T') firstCat = '4 TIEMPOS';
    
    if (firstCat === cat) {
      return pilot.calificaciones[uid];
    }
  }
  return undefined;
};

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
  currentCategory,
  onClose,
  onSaveAndNext,
  initialReadOnly = false
}: {
  pilot: Registration;
  currentUid: string;
  currentCategory: string;
  onClose: () => void;
  onSaveAndNext: (isLastStep: boolean) => void;
  initialReadOnly?: boolean;
}) => {
  const [saving, setSaving] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly || false);
  const { toast } = useToast();
  
  const existingScore = getScoreForCategory(pilot, currentUid, currentCategory);
  const [scores, setScores] = useState({
    combos: existingScore?.combos || 0,
    drif: existingScore?.drif || 0,
    acro: existingScore?.acro || 0,
    endos: existingScore?.endos || 0,
    flow: existingScore?.flow || 0,
    agres: existingScore?.agres || 0,
    error: existingScore?.error || 0,
    mejoras: existingScore?.mejoras || '',
  });

  const totalTemp = scores.combos + scores.drif + scores.acro + scores.endos + scores.flow + scores.agres - scores.error;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const calificacionData: Calificacion = { ...scores, total: totalTemp };
      
      await setDoc(doc(db, 'calificaciones', pilot.id), {
        [`${currentUid}_${currentCategory}`]: calificacionData
      }, { merge: true });
      
      // Update local state instantly
      if (!pilot.calificaciones) pilot.calificaciones = {};
      pilot.calificaciones[`${currentUid}_${currentCategory}`] = calificacionData;
      
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
          <div className="relative shrink-0 sm:ml-4 self-end sm:self-auto -mt-6 sm:mt-0 flex items-center gap-3">
             {isReadOnly && (
               <button 
                 onClick={() => setIsReadOnly(false)}
                 className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#00cfff] bg-[#001122] flex items-center justify-center text-[#00cfff] hover:bg-[#00cfff]/20 transition-colors shadow-[0_0_10px_rgba(0,207,255,0.3)] z-50 group/edit"
                 title="Editar Calificación"
               >
                 <Edit2 className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
               </button>
             )}
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
                    disabled={isReadOnly || saving}
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
                    disabled={isReadOnly || saving}
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

        {/* MEJORAS Section */}
        <div className="px-2 sm:px-5 pb-2 sm:pb-4 w-full flex flex-col items-center">
           <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
             <label className="text-[#00cfff] text-[9px] sm:text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1 sm:gap-2 drop-shadow-[0_0_8px_rgba(0,207,255,0.6)]">
                <FileText className="w-3 h-3" /> MEJORAS <FileText className="w-3 h-3" />
             </label>
             <div className="relative w-full">
                <div className="absolute inset-0 bg-[#00cfff]/5 blur-sm rounded"></div>
                <div 
                  className="relative bg-[#1a1a1a] border border-[#333] shadow-[inset_0_2px_10px_rgba(0,207,255,0.1)] flex items-center justify-center p-1"
                  style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                  <div className="absolute top-0 left-1/4 w-1/2 h-[1px] bg-[#00cfff]/40"></div>
                  <textarea 
                    disabled={isReadOnly || saving}
                    value={scores.mejoras}
                    onChange={e => setScores(prev => ({ ...prev, mejoras: e.target.value }))}
                    placeholder="Observaciones o mejoras..."
                    rows={2}
                    className="text-xs sm:text-sm w-full font-mono text-left bg-transparent border-none text-[#e8e8e8] placeholder:text-[#555] focus-visible:ring-0 focus-visible:outline-none drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] p-2 resize-none"
                  />
                </div>
             </div>
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
          {!isReadOnly && <div className="w-1 h-5 sm:h-8 bg-[#333] border-x border-[#555] rounded-sm relative z-10 shadow-[inset_0_0_5px_rgba(0,0,0,0.8)] flex-none"></div>}

          {!isReadOnly && (
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
          )}
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOfficialJudge, setIsOfficialJudge] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<'f2r' | 'nitrox' | 'festival' | 'stuntday'>('f2r');

  const getEventHeaderInfo = () => {
    switch (selectedEvent) {
      case 'nitrox':
        return {
          title: 'Copa Stunt Nitrox',
          logo: '/sponsors/Copa Stunt Nitrox Blanco.png',
        };
      case 'festival':
        return {
          title: 'Festival Stunt',
          logo: '/sponsors/4T.jpeg',
        };
      case 'stuntday':
        return {
          title: 'Stunt Day 2026',
          logo: '/sponsors/stuntday3.png',
        };
      case 'f2r':
      default:
        return {
          title: 'Copa Stunt F2R',
          logo: '/sponsors/copa stunt nitrox f2r.png',
        };
    }
  };

  const eventInfo = getEventHeaderInfo();

  // Master Table State
  const [judgeNames, setJudgeNames] = useState<Record<string, string>>({});
  const [allJudgeUids, setAllJudgeUids] = useState<string[]>([]);
  const [judgeProfiles, setJudgeProfiles] = useState<any[]>([]);
  const [masterCategory, setMasterCategory] = useState<string>('OPEN');

  useEffect(() => {
    if (selectedEvent === 'festival') {
      setMasterCategory('NOVATOS');
    } else {
      setMasterCategory('OPEN');
    }
  }, [selectedEvent]);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [maximizedCategory, setMaximizedCategory] = useState<string | null>(null);
  const [nitroxSearchQuery, setNitroxSearchQuery] = useState('');

  // Wizard State
  const [activePilotIndex, setActivePilotIndex] = useState<number | null>(null);
  const [activeCategoryList, setActiveCategoryList] = useState<Registration[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isModalReadOnly, setIsModalReadOnly] = useState(false);
  const [isPodiumOpen, setIsPodiumOpen] = useState(false);
  const [isPodiumFullScreen, setIsPodiumFullScreen] = useState(false);
  const [isPodio2Open, setIsPodio2Open] = useState(false);
  const [isPodio2FullScreen, setIsPodio2FullScreen] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { rol: newRole });
      toast({ title: 'Rol actualizado', description: 'El rol ha sido cambiado exitosamente.' });
      fetchRegistrations();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo cambiar el rol.', variant: 'destructive' });
    }
  };

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
        setIsAdmin(isSuperAdmin);
        setIsOfficialJudge(data?.rol === 'juez');
        
        if (isSuperAdmin || interfaces.includes('jueces')) {
          setHasAccess(true);
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
    if (hasAccess) {
      fetchRegistrations();
    }
  }, [selectedEvent, hasAccess]);

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
      
      const getEventIdFromRegId = (regId: string) => {
        if (regId.startsWith('festival_')) return 'festival';
        if (regId.startsWith('nitrox_')) return 'nitrox';
        if (regId.startsWith('stuntday_')) return 'stuntday';
        return 'f2r';
      };

      regSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.uid && (data.estadoPago === 'aprobado' || data.estadoPago === 'pago_dia_evento')) {
          const regEvent = getEventIdFromRegId(docSnap.id);
          if (regEvent === selectedEvent) {
            const cleanUid = data.uid.replace(/^(f2r|stuntday|nitrox|festival)_/, '');
            const userData = usersMap.get(cleanUid) || {};
            fetched.push({
              id: docSnap.id,
              uid: cleanUid,
              categoria: data.categoria || 'N/A',
              motocicleta: data.motocicleta || { placa: 'N/A', marca: 'N/A', referencia: 'N/A' },
              registradoEl: data.registradoEl || new Date().toISOString(),
              estadoPago: data.estadoPago,
              nombres: userData.nombres || data.nombres || 'Desconocido',
              apellidos: userData.apellidos || data.apellidos || '',
              numeroIdentificacion: userData.numeroIdentificacion || data.numeroIdentificacion || 'N/A',
              seudonimo: userData.seudonimo || data.seudonimo || '',
              instagram: userData.instagram || data.instagram || '',
              documentos: data.documentos || {},
              calificaciones: califMap.get(docSnap.id) || {}
            });
          }
        }
      });
      
      // Orden fijo de pilotos (por número de identificación)
      fetched.sort((a, b) => a.numeroIdentificacion.localeCompare(b.numeroIdentificacion));

      // Inject Dummy Data if empty to ensure design is visible
      const openCount = fetched.filter(f => {
        const c = Array.isArray(f.categoria) ? f.categoria.join(' ') : String(f.categoria);
        return c.toUpperCase().includes('OPEN');
      }).length;
      const nitroxCount = fetched.filter(f => {
        const c = Array.isArray(f.categoria) ? f.categoria.join(' ') : String(f.categoria);
        return c.toUpperCase().includes('ALTO CILINDRAJE') || c.toUpperCase().includes('NITROX');
      }).length;
      
      if (openCount === 0 && selectedEvent === 'f2r') fetched.push(...dummyOpen);
      if (nitroxCount === 0 && selectedEvent === 'f2r') fetched.push(...dummyNitrox);

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
      if (selectedEvent === 'festival') {
        if (finalCat === 'OPEN' || finalCat === 'NOVATOS') finalCat = 'NOVATOS';
        else if (finalCat === '2T' || finalCat === '2 TIEMPOS' || finalCat === 'PREEXPERTOS') finalCat = 'PREEXPERTOS';
        else if (finalCat === '4T' || finalCat === '4 TIEMPOS' || finalCat === 'EXPERTOS') finalCat = 'EXPERTOS';
        else if (finalCat === 'ALTO' || finalCat === 'ALTO CILINDRAJE' || finalCat === 'NITROX' || finalCat === 'ÉLITE') finalCat = 'ÉLITE';
      } else {
        if (selectedEvent === 'nitrox') {
          if (finalCat.includes('ALTO') || finalCat === 'CATEGORIA NITROX' || finalCat === 'NITROX') finalCat = 'ALTO CILINDRAJE';
        } else {
          if (finalCat.includes('ALTO') || finalCat === 'CATEGORIA NITROX' || finalCat === 'NITROX') finalCat = 'NITROX';
        }
        if (finalCat === '2T') finalCat = '2 TIEMPOS';
        if (finalCat === '4T') finalCat = '4 TIEMPOS';
      }

      if (!acc[finalCat]) acc[finalCat] = [];
      if (!acc[finalCat].find(p => p.id === reg.id)) {
        acc[finalCat].push(reg);
      }
    });

    return acc;
  }, {} as Record<string, Registration[]>);

  // Forzar las categorías principales siempre por evento
  const getDisplayCategories = () => {
    if (selectedEvent === 'festival') {
      return ['NOVATOS', 'PREEXPERTOS', 'EXPERTOS', 'ÉLITE'];
    } else if (selectedEvent === 'nitrox') {
      return ['OPEN', '2 TIEMPOS', '4 TIEMPOS', 'ALTO CILINDRAJE', 'BIKELIFE'];
    } else {
      return ['OPEN', '2 TIEMPOS', '4 TIEMPOS', 'NITROX'];
    }
  };

  const displayCategories = getDisplayCategories();

  const handleStartSequential = (cat: string) => {
    if (!isOfficialJudge) {
      toast({ title: 'Solo Lectura', description: 'Solo los jueces oficiales pueden calificar.', variant: 'destructive' });
      return;
    }
    const pilots = groupedByCategory[cat] || [];
    if (pilots.length === 0) {
      toast({ title: 'Sin pilotos', description: `No hay pilotos inscritos en ${cat}.` });
      return;
    }
    setActiveCategoryList(pilots);
    setActiveCategory(cat);
    
    // Find first ungraded pilot
    const firstUngradedIndex = pilots.findIndex(p => !(currentUid && getScoreForCategory(p, currentUid, cat)));
    setActivePilotIndex(firstUngradedIndex !== -1 ? firstUngradedIndex : 0);
    setIsModalReadOnly(false);
  };

  const handleEvaluateSpecific = (cat: string, index: number) => {
    if (!isOfficialJudge) {
      toast({ title: 'Solo Lectura', description: 'Solo los jueces oficiales pueden calificar.', variant: 'destructive' });
      return;
    }
    const pilots = groupedByCategory[cat] || [];
    setActiveCategoryList(pilots);
    setActiveCategory(cat);
    setActivePilotIndex(index);
    const pilot = pilots[index];
    const isGraded = !!(currentUid && getScoreForCategory(pilot, currentUid, cat));
    setIsModalReadOnly(isGraded);
  };

  const handleAddNitrox = async (e: any, pilotId: string, currentCategories: string | string[]) => {
    e.stopPropagation();
    if (!isAdmin && !isOfficialJudge) return;
    
    let catsArray: string[] = [];
    if (Array.isArray(currentCategories)) {
      catsArray = [...currentCategories];
    } else {
      catsArray = String(currentCategories).split(',').map(c => c.trim());
    }
    
    const hasNitrox = catsArray.some(c => c.toUpperCase().includes('NITROX') || c.toUpperCase().includes('ALTO'));
    if (hasNitrox) return;

    catsArray.push('NITROX');
    
    try {
      await updateDoc(doc(db, 'event_registrations', pilotId), {
        categoria: catsArray
      });
      toast({ title: 'Añadido a NITROX', description: 'El piloto ahora participa en la categoría NITROX.' });
      fetchRegistrations();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'No se pudo agregar a NITROX.', variant: 'destructive' });
    }
  };

  const handleWizardNext = () => {
    if (activePilotIndex !== null && activePilotIndex < activeCategoryList.length - 1) {
      setActivePilotIndex(activePilotIndex + 1); // Salta al modal del siguiente piloto
    } else {
      setActivePilotIndex(null); // Termina
    }
  };

  const handleDownloadExcel = () => {
    try {
      const masterPilots = groupedByCategory[masterCategory] || [];
      if (masterPilots.length === 0) {
        toast({ title: 'Sin datos', description: 'No hay datos para exportar en esta categoría.' });
        return;
      }

      const gradedJudgeUids = Array.from(new Set(masterPilots.flatMap(p => Object.keys(p.calificaciones || {}).map(k => k.split('_')[0]))));
      let displayJudgeUids = Array.from(new Set([...allJudgeUids, ...gradedJudgeUids]));
      if (displayJudgeUids.length === 0) displayJudgeUids = ['juez_1', 'juez_2', 'juez_3'];

      const sortedMasterPilots = [...masterPilots].map(pilot => {
        const globalTotal = displayJudgeUids.reduce((sum, uid) => sum + (getScoreForCategory(pilot, uid, masterCategory)?.total || 0), 0);
        return { ...pilot, _globalTotal: globalTotal };
      }).sort((a, b) => b._globalTotal - a._globalTotal);

      const getJudgeNameStr = (uid: string) => {
        if (uid === 'juez_1') return 'Juez 1';
        if (uid === 'juez_2') return 'Juez 2';
        if (uid === 'juez_3') return 'Juez 3';
        return judgeNames[uid] || 'Jurado';
      };

      const exportData = sortedMasterPilots.map((pilot, index) => {
        const rowData: any = {
          'Posición': index + 1,
          '#': pilot.numeroIdentificacion.slice(-4),
          'Piloto': `${pilot.nombres} ${pilot.apellidos}`.trim(),
          'Documento': pilot.numeroIdentificacion,
        };

        const califs = pilot.calificaciones || {};

        const criteriaList = [
          { id: 'combos', label: 'Combos' },
          { id: 'drif', label: 'Drift' },
          { id: 'acro', label: 'Acro' },
          { id: 'endos', label: 'Endos' },
          { id: 'flow', label: 'Flow' },
          { id: 'agres', label: 'Agres' },
          { id: 'error', label: 'Error' },
        ];

        criteriaList.forEach(crit => {
          displayJudgeUids.forEach(uid => {
            const jName = getJudgeNameStr(uid).split(' ')[0];
            rowData[`${jName} - ${crit.label}`] = getScoreForCategory(pilot, uid, masterCategory)?.[crit.id as keyof Calificacion] || 0;
          });
          // Spacer column for visual separation in Excel
          rowData[` | ${crit.label} | `] = ''; 
        });

        displayJudgeUids.forEach(uid => {
          const jName = getJudgeNameStr(uid).split(' ')[0];
          rowData[`${jName} - SUBTOTAL`] = getScoreForCategory(pilot, uid, masterCategory)?.total || 0;
        });

        rowData['  | TOTAL |  '] = '';
        rowData['PUNTAJE TOTAL'] = pilot._globalTotal;

        return rowData;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Planilla_${masterCategory}`);
      XLSX.writeFile(workbook, `Planilla_Jueces_${masterCategory.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: 'Éxito', description: 'La planilla se descargó correctamente.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Hubo un error al exportar la planilla.', variant: 'destructive' });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const masterPilots = groupedByCategory[masterCategory] || [];
      if (masterPilots.length === 0) {
        toast({ title: 'Sin datos', description: 'No hay datos para exportar en esta categoría.' });
        return;
      }

      const gradedJudgeUids = Array.from(new Set(masterPilots.flatMap(p => Object.keys(p.calificaciones || {}).map(k => k.split('_')[0]))));
      let displayJudgeUids = Array.from(new Set([...allJudgeUids, ...gradedJudgeUids]));
      if (displayJudgeUids.length === 0) displayJudgeUids = ['juez_1', 'juez_2', 'juez_3'];

      const sortedMasterPilots = [...masterPilots].map(pilot => {
        const globalTotal = displayJudgeUids.reduce((sum, uid) => sum + (getScoreForCategory(pilot, uid, masterCategory)?.total || 0), 0);
        return { ...pilot, _globalTotal: globalTotal };
      }).sort((a, b) => b._globalTotal - a._globalTotal);

      const getJudgeNameStr = (uid: string) => {
        if (uid === 'juez_1') return 'Juez 1';
        if (uid === 'juez_2') return 'Juez 2';
        if (uid === 'juez_3') return 'Juez 3';
        return judgeNames[uid] || 'Jurado';
      };

      const doc = new jsPDF('landscape', 'mm', 'letter');
      const pdfWidth = doc.internal.pageSize.getWidth();
      let startY = 14;

      try {
        const dynamicMainLogo = { src: eventInfo.logo, alt: eventInfo.title, className: MAIN_LOGO.className };
        const allLogos = [dynamicMainLogo, ...SPONSOR_LOGOS];
        const loadedImages = await Promise.all(allLogos.map(async (logo) => {
          const img = new Image();
          img.src = logo.src;
          return new Promise<HTMLImageElement | null>((resolve) => {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          });
        }));

        const validImages = loadedImages.filter((img): img is HTMLImageElement => img !== null);
        
        if (validImages.length > 0) {
           const maxLogoHeight = 10;
           const spacing = 8;
           
           let totalWidth = 0;
           const dimensions = validImages.map(img => {
             const ratio = img.height / img.width;
             const h = maxLogoHeight;
             const w = h / ratio;
             totalWidth += w;
             return { img, w, h };
           });
           
           totalWidth += spacing * (validImages.length - 1);
           
           // Scale down if total width exceeds page width
           const maxAllowedWidth = pdfWidth - 16;
           let scale = 1;
           if (totalWidth > maxAllowedWidth) {
             scale = maxAllowedWidth / totalWidth;
             totalWidth = maxAllowedWidth;
           }

           const finalHeight = maxLogoHeight * scale;
           const headerHeight = finalHeight + 8; // 4mm padding top/bottom
           
           // Draw dark background for logos
           doc.setFillColor(26, 37, 64); // Dark slate/navy to match theme
           doc.roundedRect(8, startY, pdfWidth - 16, headerHeight, 2, 2, 'F');

           let currentX = pdfWidth / 2 - totalWidth / 2;
           const logoStartY = startY + 4;
           dimensions.forEach(({ img, w, h }) => {
             const finalW = w * scale;
             const finalH = h * scale;
             doc.addImage(img, 'PNG', currentX, logoStartY, finalW, finalH);
             currentX += finalW + (spacing * scale);
           });
           
           startY += headerHeight + 8;
        }

      } catch (err) {
        console.log("No se pudo cargar los logos", err);
      }

      doc.setFontSize(16);
      doc.text(`PLANILLA DE CALIFICACIONES - ${masterCategory}`, pdfWidth / 2, startY, { align: 'center' });
      startY += 10;

      const criteriaList = [
        { id: 'combos', label: 'Cmb' },
        { id: 'drif', label: 'Drf' },
        { id: 'acro', label: 'Acr' },
        { id: 'endos', label: 'End' },
        { id: 'flow', label: 'Flw' },
        { id: 'agres', label: 'Agr' },
        { id: 'error', label: 'Err' },
      ];

      const head = [
        [
          { content: 'Pos', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          { content: 'Piloto', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
          ...criteriaList.map(c => ({ content: c.label, colSpan: displayJudgeUids.length, styles: { halign: 'center' } })),
          { content: 'SUBTOTAL', colSpan: displayJudgeUids.length, styles: { halign: 'center' } },
          { content: 'TOTAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [0, 207, 255] } }
        ],
        [
          ...criteriaList.flatMap(() => displayJudgeUids.map(uid => getJudgeNameStr(uid).split(' ')[0])),
          ...displayJudgeUids.map(uid => getJudgeNameStr(uid).split(' ')[0])
        ]
      ];

      const body = sortedMasterPilots.map((pilot, index) => {
        const row = [index + 1, `${pilot.nombres} ${pilot.apellidos}`.trim()];

        criteriaList.forEach(crit => {
          displayJudgeUids.forEach(uid => {
            row.push(getScoreForCategory(pilot, uid, masterCategory)?.[crit.id as keyof Calificacion] || 0);
          });
        });

        displayJudgeUids.forEach(uid => {
          row.push(getScoreForCategory(pilot, uid, masterCategory)?.total || 0);
        });

        row.push(pilot._globalTotal);
        return row;
      });

      autoTable(doc, {
        head: head as any,
        body: body,
        startY: startY,
        theme: 'grid',
        margin: { left: 8, right: 8 },
        styles: { fontSize: 5, cellPadding: 0.8, halign: 'center' },
        headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255] },
        columnStyles: { 
          0: { cellWidth: 7 },
          1: { halign: 'left', cellWidth: 32 },
        },
      });

      doc.save(`Planilla_Jueces_${masterCategory.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'Éxito', description: 'El PDF se descargó correctamente.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Hubo un error al exportar el PDF.', variant: 'destructive' });
    }
  };

  const getCatColor = (cat: string) => {
    if (cat.includes('OPEN')) return 'border-[#E60000] text-[#E60000] shadow-[0_0_15px_rgba(230, 0, 0,0.2)]';
    if (cat.includes('TIEMPOS')) return 'border-[#ff6b00] text-[#ff6b00] shadow-[0_0_15px_rgba(255,107,0,0.2)]';
    if (cat.includes('NITROX') || cat.includes('ALTO CILINDRAJE')) return 'border-[#ffd700] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]';
    return 'border-[#00cfff] text-[#00cfff]';
  };

  const getCatGlow = (cat: string) => {
    if (cat.includes('OPEN')) return 'shadow-[0_0_15px_rgba(230, 0, 0,0.2)] shadow-[inset_0_0_15px_rgba(230, 0, 0,0.05)] border-[#E60000]';
    if (cat.includes('TIEMPOS')) return 'shadow-[0_0_15px_rgba(255,107,0,0.2)] shadow-[inset_0_0_15px_rgba(255,107,0,0.05)] border-[#ff6b00]';
    if (cat.includes('NITROX') || cat.includes('ALTO CILINDRAJE')) return 'shadow-[0_0_15px_rgba(255,215,0,0.2)] shadow-[inset_0_0_15px_rgba(255,215,0,0.05)] border-[#ffd700]';
    return 'border-[#00cfff]';
  };

  const getCatTextGlow = (cat: string) => {
    if (cat.includes('OPEN')) return 'text-[#E60000] drop-shadow-[0_0_8px_rgba(230, 0, 0,0.8)]';
    if (cat.includes('TIEMPOS')) return 'text-[#ff6b00] drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]';
    if (cat.includes('NITROX') || cat.includes('ALTO CILINDRAJE')) return 'text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]';
    return 'text-[#00cfff]';
  };

  const getCatTextColor = (cat: string) => {
    if (cat.includes('OPEN')) return 'text-[#E60000]';
    if (cat.includes('TIEMPOS')) return 'text-[#ff6b00]';
    if (cat.includes('NITROX') || cat.includes('ALTO CILINDRAJE')) return 'text-[#ffd700]';
    return 'text-[#00cfff]';
  };

  return (
    <>
    <div className="min-h-screen w-full flex flex-col bg-black font-sans text-[#E8E8E8] relative print:hidden">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* HEADER */}
      <header className="flex-none min-h-[90px] py-4 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between z-10 border-b border-[#1A2540] bg-black backdrop-blur-md gap-6">
          <div className="w-full md:w-[60%] flex items-center min-w-0 md:mr-4">
            <img src="/sponsors/patro.png" alt="Sponsors" className="w-full h-auto max-h-[120px] object-contain object-left" />
          </div>

        <div className="w-full md:w-[40%] flex flex-col items-center justify-center gap-2">
          <h1 className="text-lg md:text-xl font-black tracking-widest leading-none drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] text-center">
            PANEL DE JUECES
          </h1>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-[#00cfff]/50 text-[#00cfff] bg-[#00cfff]/5 hover:bg-[#00cfff]/20 hover:text-[#00cfff] font-bold uppercase tracking-widest h-9 px-4 text-xs shadow-[0_0_10px_rgba(0,207,255,0.2)]">
                  <span>Evento: {
                    selectedEvent === 'f2r' ? 'F2R' :
                    selectedEvent === 'nitrox' ? 'Nitrox' :
                    selectedEvent === 'festival' ? 'Festival' :
                    selectedEvent === 'stuntday' ? 'Stunt Day' :
                    'F2R'
                  }</span>
                  <ChevronRight className="w-4 h-4 rotate-90 ml-1.5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-950 border-zinc-800 text-white font-bold font-sans">
                <DropdownMenuItem onClick={() => setSelectedEvent('f2r')} className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-xs uppercase tracking-wider">
                  Copa Stunt F2R
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEvent('nitrox')} className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-xs uppercase tracking-wider">
                  Copa Stunt Nitrox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEvent('festival')} className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-xs uppercase tracking-wider">
                  Festival Stunt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedEvent('stuntday')} className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer text-xs uppercase tracking-wider">
                  Stunt Day 2026
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                    <li><strong className="text-[#E60000]">FLOW:</strong> 0 a 10 puntos</li>
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
                <Button variant="outline" className="border-[#E60000]/50 text-[#E60000] bg-[#E60000]/5 hover:bg-[#E60000]/20 hover:text-[#E60000] font-bold uppercase tracking-widest h-9 px-4 text-xs shadow-[0_0_10px_rgba(230, 0, 0,0.2)]">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Directorio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-[#0a1628] border-[#E60000] max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_0_30px_rgba(230, 0, 0,0.2)]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2 border-b border-[#1A2540] pb-4">
                    <ShieldAlert className="w-5 h-5 text-[#E60000]"/> Hoja de Vida de Jueces
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-2">
                  {judgeProfiles.length === 0 ? (
                     <p className="text-[#888888] text-center py-10 font-mono">No hay jueces registrados en el sistema.</p>
                  ) : (
                     judgeProfiles.map(juez => (
                        <div key={juez.id} className="p-4 rounded-lg bg-[#0d1b2e] border border-[#1A2540] flex flex-col gap-4 transition-colors hover:border-[#E60000]/50">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-[#050B14] border-2 border-[#E60000] flex items-center justify-center font-bold text-[#E60000] text-xl shadow-[0_0_10px_rgba(230, 0, 0,0.2)]">
                               {juez.nombres?.charAt(0)}
                             </div>
                             <div>
                               <h3 className="text-lg font-bold text-white uppercase tracking-wider">{juez.nombres} {juez.apellidos}</h3>
                               <div className="flex items-center gap-2 mt-1">
                                 <span className="text-[10px] text-yellow-500 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">CC: {juez.numeroIdentificacion}</span>
                                 <span className="text-[10px] text-purple-400 font-bold uppercase bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Juez Oficial</span>
                                 {isAdmin && (
                                   <select 
                                     value={juez.rol || 'juez'}
                                     onChange={(e) => handleRoleChange(juez.id, e.target.value)}
                                     className="bg-[#050B14] border border-[#E60000]/30 text-[#E60000] text-[10px] rounded px-2 py-0.5 outline-none font-bold uppercase cursor-pointer"
                                   >
                                     <option value="piloto">Piloto</option>
                                     <option value="staff">Staff</option>
                                     <option value="juez">Juez</option>
                                   </select>
                                 )}
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
              const graded = pilots.filter(p => currentUid && getScoreForCategory(p, currentUid, cat)).length;
              const progress = pilots.length > 0 ? (graded / pilots.length) * 100 : 0;
              const circumference = 2 * Math.PI * 18;
              const strokeDashoffset = circumference - (progress / 100) * circumference;

              return (
                <div key={cat} className={`bg-[#0d1b2e] border rounded-xl flex flex-col h-[280px] relative overflow-hidden ${getCatGlow(cat)}`}>
                  
                  {/* CARD HEADER */}
                  <div className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 w-2/3">
                        <h2 className={`text-xl font-black uppercase tracking-widest leading-none ${getCatTextGlow(cat)}`}>{cat}</h2>
                        <div className="flex gap-1 z-20 mt-1">
                           {cat === 'NITROX' && (isAdmin || isOfficialJudge) && (
                             <Dialog>
                               <DialogTrigger asChild>
                                 <div className="w-5 h-5 rounded-[4px] border-2 border-[#00ff44] flex items-center justify-center text-[#00ff44] cursor-pointer hover:bg-[#00ff44]/20 transition-colors" title="Añadir piloto a NITROX">
                                   <div className="text-sm font-black leading-none pb-[1px]">+</div>
                                 </div>
                               </DialogTrigger>
                               <DialogContent className="max-w-2xl bg-[#0d1b2e] border-[#00ff44] max-h-[80vh] flex flex-col p-0 shadow-[0_0_30px_rgba(0,255,68,0.3)]">
                                 <DialogHeader className="p-4 border-b border-[#1A2540]">
                                   <div className="flex justify-between items-center gap-4">
                                     <DialogTitle className="text-xl font-bold uppercase tracking-widest text-[#00ff44]">Añadir Piloto a NITROX</DialogTitle>
                                     <div className="relative">
                                       <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                                       <input 
                                         type="text" 
                                         placeholder="Buscar piloto o categoría..." 
                                         value={nitroxSearchQuery}
                                         onChange={(e) => setNitroxSearchQuery(e.target.value)}
                                         className="bg-[#1A2540] border border-[#334155] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#888] focus:outline-none focus:border-[#00ff44] transition-colors w-48 sm:w-64"
                                       />
                                     </div>
                                   </div>
                                 </DialogHeader>
                                 <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                   <table className="w-full text-left text-xs text-white">
                                     <thead className="bg-[#1A2540] sticky top-0 z-10">
                                        <tr>
                                          <th className="px-4 py-2 font-mono text-[#888888]">#</th>
                                          <th className="px-4 py-2 text-[#888888]">Piloto</th>
                                          <th className="px-4 py-2 text-[#888888]">Categoría Actual</th>
                                          <th className="px-4 py-2 text-right">Acción</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                       {registrations.filter(r => {
                                          let rCats = Array.isArray(r.categoria) ? r.categoria : String(r.categoria).split(',');
                                          const notInNitrox = !rCats.some(c => String(c).trim().toUpperCase().includes('NITROX') || String(c).trim().toUpperCase().includes('ALTO'));
                                          if (!notInNitrox) return false;
                                          if (!nitroxSearchQuery) return true;
                                          const searchLower = nitroxSearchQuery.toLowerCase();
                                          const fullName = `${r.nombres} ${r.apellidos}`.toLowerCase();
                                          const catsString = Array.isArray(r.categoria) ? r.categoria.join(' ').toLowerCase() : String(r.categoria).toLowerCase();
                                          return fullName.includes(searchLower) || catsString.includes(searchLower);
                                       }).map(r => (
                                         <tr key={`add-${r.id}`} className="border-b border-[#1A2540] hover:bg-[#1A2540]/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-[#888888]">{r.numeroIdentificacion.slice(-4)}</td>
                                            <td className="px-4 py-3 font-bold uppercase">{r.nombres} {r.apellidos}</td>
                                            <td className="px-4 py-3 text-[#888888] uppercase text-[10px]">{Array.isArray(r.categoria) ? r.categoria.join(', ') : r.categoria}</td>
                                            <td className="px-4 py-3 text-right">
                                              <button 
                                                onClick={(e) => handleAddNitrox(e, r.id, r.categoria)}
                                                className="bg-[#00ff44]/10 border border-[#00ff44]/50 text-[#00ff44] rounded px-3 py-1.5 text-[10px] hover:bg-[#00ff44] hover:text-black transition-colors shadow-[0_0_10px_rgba(0,255,68,0.2)] font-bold tracking-widest uppercase"
                                              >
                                                Agregar
                                              </button>
                                            </td>
                                         </tr>
                                       ))}
                                       {registrations.filter(r => {
                                          let rCats = Array.isArray(r.categoria) ? r.categoria : String(r.categoria).split(',');
                                          const notInNitrox = !rCats.some(c => String(c).trim().toUpperCase().includes('NITROX') || String(c).trim().toUpperCase().includes('ALTO'));
                                          if (!notInNitrox) return false;
                                          if (!nitroxSearchQuery) return true;
                                          const searchLower = nitroxSearchQuery.toLowerCase();
                                          const fullName = `${r.nombres} ${r.apellidos}`.toLowerCase();
                                          const catsString = Array.isArray(r.categoria) ? r.categoria.join(' ').toLowerCase() : String(r.categoria).toLowerCase();
                                          return fullName.includes(searchLower) || catsString.includes(searchLower);
                                       }).length === 0 && (
                                         <tr>
                                           <td colSpan={4} className="px-4 py-8 text-center text-[#888888] font-mono">
                                             {nitroxSearchQuery ? 'No se encontraron pilotos con esa búsqueda.' : 'Todos los pilotos ya están en NITROX.'}
                                           </td>
                                         </tr>
                                       )}
                                     </tbody>
                                   </table>
                                 </div>
                               </DialogContent>
                             </Dialog>
                           )}
                           <div className="w-5 h-5 rounded-[4px] border-2 border-[#ffd700] flex items-center justify-center text-[#ffd700] cursor-not-allowed opacity-50"><div className="w-2.5 h-0.5 bg-current"></div></div>
                           <Dialog>
                             <DialogTrigger asChild>
                               <div className="w-5 h-5 rounded-[4px] border-2 border-[#ff3333] flex items-center justify-center text-[#ff3333] cursor-pointer hover:bg-[#ff3333]/20 transition-colors" title="Maximizar en nueva ventana">
                                 <div className="w-2 h-2 border-[1.5px] border-current"></div>
                               </div>
                             </DialogTrigger>
                             <DialogContent className={`max-w-4xl h-[85vh] bg-[#0d1b2e] border p-0 flex flex-col overflow-hidden shadow-2xl ${getCatGlow(cat)}`}>
                               {/* Modal Category Content */}
                               <div className="p-6 pr-14 pb-2 border-b border-[#1A2540] flex-none">
                                  <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-2">
                                      <DialogTitle className={`text-3xl font-black uppercase tracking-widest leading-none ${getCatTextGlow(cat)}`}>{cat}</DialogTitle>
                                      <span className="text-[#888888] text-xs font-bold uppercase tracking-wider">VISTA DETALLADA</span>
                                    </div>
                                    <div className="relative w-16 h-16 flex-none">
                                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="18" fill="none" stroke="#1A2540" strokeWidth="3" />
                                        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" 
                                          className={`${getCatTextColor(cat)} transition-all duration-1000`}
                                          strokeDasharray={circumference}
                                          strokeDashoffset={strokeDashoffset}
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                                        {graded}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-end mt-2">
                                    <span className="text-[#888888] text-[10px] font-bold uppercase tracking-wider">Progreso de calificación</span>
                                    <span className="font-mono text-xs"><span className={`font-bold ${getCatTextColor(cat)}`}>{graded}</span> <span className="text-[#555]">/ {pilots.length}</span></span>
                                  </div>
                                  <div className="w-full bg-[#1A2540] h-[4px] mt-2 rounded-full overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                                    <div className={`h-full transition-all bg-current ${getCatTextColor(cat)}`} style={{ width: `${progress}%` }}></div>
                                  </div>
                               </div>

                               <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a1525]">
                                  <table className="w-full text-left table-fixed text-xs">
                                    <colgroup>
                                      <col className="w-16" />
                                      <col className="w-auto" />
                                      <col className="w-28" />
                                      <col className="w-20" />
                                    </colgroup>
                                    <thead className="text-[#888888] font-bold uppercase tracking-wider border-b border-[#1A2540] sticky top-0 bg-[#0a1525] z-30 shadow-md">
                                      <tr>
                                        <th className="px-6 py-4 font-mono">#</th>
                                        <th className="px-2 py-4">Piloto</th>
                                        <th className="px-2 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-right">Pts</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1A2540]">
                                      {pilots.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-[#555] gap-3">
                                              <ShieldAlert className="w-8 h-8 opacity-50" />
                                              <span className="font-bold uppercase tracking-widest text-xs">No hay inscritos aún en esta categoría</span>
                                            </div>
                                          </td>
                                        </tr>
                                      ) : (
                                        pilots.map((pilot, index) => {
                                          const isGraded = !!(currentUid && getScoreForCategory(pilot, currentUid, cat));
                                          const score = isGraded ? getScoreForCategory(pilot, currentUid, cat)!.total : null;
                                          const statusBg = isGraded ? 'bg-[#003320] text-[#E60000] border-[#E60000]/30' : 'bg-[#331800] text-[#ff6b00] border-[#ff6b00]/30';
                                          const statusLabel = isGraded ? 'CALIFICADO' : 'PENDIENTE';

                                          return (
                                            <tr 
                                              key={`modal-${pilot.id}`} 
                                              onClick={() => handleEvaluateSpecific(cat, index)}
                                              className={`transition-colors group ${isOfficialJudge ? 'cursor-pointer hover:bg-[#1A2540]' : 'cursor-default'}`}
                                            >
                                              <td className="px-6 py-4">
                                                <span className="font-mono text-[#888888] group-hover:text-white transition-colors text-sm">
                                                  {pilot.numeroIdentificacion.slice(-4)}
                                                </span>
                                              </td>
                                              <td className="px-2 py-4 truncate">
                                                <div className="text-[#E8E8E8] font-bold uppercase truncate group-hover:text-white transition-colors text-sm">
                                                  {pilot.nombres} {pilot.apellidos}
                                                </div>
                                              </td>
                                              <td className="px-2 py-4 text-center">
                                                <span className={`${statusBg} border text-[10px] font-bold px-2 py-1 rounded uppercase`}>
                                                  {statusLabel}
                                                </span>
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                {isGraded ? (
                                                  <span className={`font-bold font-mono text-sm ${getCatTextColor(cat)}`}>{score}</span>
                                                ) : (
                                                  <span className="text-[#555] font-bold font-mono text-sm">-</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                               </div>

                               <div className="p-4 bg-[#050B14]/80 border-t border-[#1A2540] flex-none">
                                 <button 
                                   onClick={() => handleStartSequential(cat)}
                                   disabled={pilots.length === 0 || !isOfficialJudge}
                                   className="w-full bg-[#E60000] hover:bg-[#CC0000] disabled:bg-[#1A2540] disabled:text-[#555] disabled:shadow-none text-[#050B14] font-black text-sm h-12 rounded-lg flex items-center justify-center uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(230, 0, 0,0.4)]"
                                 >
                                   <Play className="w-4 h-4 mr-2 fill-current" />
                                   {isOfficialJudge ? 'INICIAR CALIFICACIÓN' : 'SOLO LECTURA'}
                                 </button>
                               </div>
                             </DialogContent>
                           </Dialog>
                        </div>
                      </div>
                      
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
                            const isGraded = !!(currentUid && getScoreForCategory(pilot, currentUid, cat));
                            const score = isGraded ? getScoreForCategory(pilot, currentUid, cat)!.total : null;
                            const statusBg = isGraded ? 'bg-[#003320] text-[#E60000] border-[#E60000]/30' : 'bg-[#331800] text-[#ff6b00] border-[#ff6b00]/30';
                            const statusLabel = isGraded ? 'CAL.' : 'PEND.';

                            return (
                              <tr 
                                key={pilot.id} 
                                onClick={() => handleEvaluateSpecific(cat, index)}
                                className={`transition-colors group ${isOfficialJudge ? 'cursor-pointer hover:bg-[#1A2540]' : 'cursor-default'}`}
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
                      disabled={pilots.length === 0 || !isOfficialJudge}
                      className="w-full bg-[#E60000] hover:bg-[#CC0000] disabled:bg-[#1A2540] disabled:text-[#555] disabled:shadow-none text-[#050B14] font-black text-xs h-9 rounded-lg flex items-center justify-center uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(230, 0, 0,0.4)]"
                    >
                      <Play className="w-3 h-3 mr-2 fill-current" />
                      {isOfficialJudge ? 'INICIAR' : 'SOLO LECTURA'}
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
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${masterCategory === cat ? 'bg-[#E60000]/10 text-[#E60000] border border-[#E60000] shadow-[0_0_10px_rgba(230, 0, 0,0.2)]' : 'bg-transparent text-[#888888] border border-transparent hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
              <button 
                onClick={() => setIsPodiumOpen(true)}
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700] hover:bg-[#FFD700]/20 hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)] flex items-center gap-1.5 ml-2 shrink-0"
              >
                <Trophy className="w-3 h-3" /> PODIO
              </button>
              <button 
                onClick={() => setIsPodio2Open(true)}
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700] hover:bg-[#FFD700]/20 hover:scale-105 shadow-[0_0_15px_rgba(255,215,0,0.3)] flex items-center gap-1.5 ml-2 shrink-0"
              >
                <Trophy className="w-3 h-3" /> PODIO 2
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-[#E60000]/10 text-[#E60000] border border-[#E60000] hover:bg-[#E60000]/20 hover:scale-105 shadow-[0_0_15px_rgba(230, 0, 0,0.3)] flex items-center gap-1.5 ml-2 shrink-0">
                    <Download className="w-3 h-3" /> EXPORTAR
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0a1628] border-[#E60000]/30 text-white min-w-[150px]">
                  <DropdownMenuItem onClick={handleDownloadPDF} className="hover:bg-[#E60000]/20 hover:text-[#E60000] cursor-pointer font-bold font-mono text-xs focus:bg-[#E60000]/20 focus:text-[#E60000]">
                    <FileText className="w-4 h-4 mr-2" /> PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadExcel} className="hover:bg-[#E60000]/20 hover:text-[#E60000] cursor-pointer font-bold font-mono text-xs focus:bg-[#E60000]/20 focus:text-[#E60000]">
                    <Download className="w-4 h-4 mr-2" /> EXCEL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                masterPilots.flatMap(p => Object.keys(p.calificaciones || {}).map(k => k.split('_')[0]))
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
                { id: 'flow', label: 'FLOW', color: 'text-[#E60000]', border: 'border-[#E60000]' },
                { id: 'agres', label: 'AGRESSIVITY', color: 'text-[#ffd700]', border: 'border-[#ffd700]' },
                { id: 'error', label: 'ERROR', color: 'text-[#ff3333]', border: 'border-[#ff3333]' }
              ];

              const sortedMasterPilots = [...masterPilots].map(pilot => {
                const globalTotal = displayJudgeUids.reduce((sum, uid) => sum + (getScoreForCategory(pilot, uid, masterCategory)?.total || 0), 0);
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
                    {sortedMasterPilots.map((pilot, idx) => {
                      const globalTotal = pilot._globalTotal;

                      return (
                        <tr key={`master-${pilot.id}`} className="border-b border-[#1A2540] hover:bg-[#1A2540]/30 transition-colors group">
                          <td className="px-2 py-3 text-center text-[#888888] font-mono text-sm sticky left-0 z-20 bg-[#0a1628] group-hover:bg-[#111c2e]">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold uppercase truncate sticky left-[48px] z-20 bg-[#0a1628] shadow-[5px_0_15px_rgba(0,0,0,0.5)] group-hover:bg-[#111c2e]">
                            {pilot.nombres} {pilot.apellidos}
                            <div className="text-[9px] text-[#555] font-mono font-normal">#{pilot.numeroIdentificacion}</div>
                          </td>

                          {neonCriteria.map(c => (
                            <React.Fragment key={`${pilot.id}-${c.id}`}>
                              {displayJudgeUids.map((uid, jIdx) => {
                                const score = getScoreForCategory(pilot, uid, masterCategory)?.[c.id as keyof Calificacion] || 0;
                                const isError = c.id === 'error';
                                return (
                                  <td key={`val-${pilot.id}-${c.id}-${uid}`} className={`px-1 py-3 text-center ${c.color} border-x border-[#1A2540] ${jIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#1A2540]/10'} ${isError && Number(score) > 0 ? 'text-[#ff3333]' : ''}`}>
                                    {score}
                                  </td>
                                );
                              })}
                            </React.Fragment>
                          ))}
                          
                          {displayJudgeUids.map(uid => {
                            const subtotal = getScoreForCategory(pilot, uid, masterCategory)?.total || 0;
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
      {activePilotIndex !== null && currentUid && (
        <GradingModal 
          key={`${activeCategoryList[activePilotIndex].id}-${activeCategory}-${isModalReadOnly}`}
          pilot={activeCategoryList[activePilotIndex]}
          currentUid={currentUid}
          currentCategory={activeCategory}
          initialReadOnly={isModalReadOnly}
          onClose={() => setActivePilotIndex(null)}
          onSaveAndNext={handleWizardNext}
        />
      )}

      {/* RENDERIZADO DEL PODIO */}
      <Dialog open={isPodiumOpen} onOpenChange={(open) => {
        setIsPodiumOpen(open);
        if (!open) setIsPodiumFullScreen(false);
      }}>
        <DialogContent className={`${isPodiumFullScreen ? 'w-screen h-screen max-w-none rounded-none border-0' : 'max-w-4xl sm:rounded-[2rem] border border-[#00cfff]/30'} bg-[#0a0a0f] shadow-[0_0_80px_rgba(0,207,255,0.15)] p-0 overflow-hidden`}>
          <DialogTitle className="sr-only">Podio Oficial - Resultados</DialogTitle>
          <div className={`relative w-full flex flex-col items-center justify-between overflow-hidden ${isPodiumFullScreen ? 'h-screen p-4 sm:p-8' : 'min-h-[600px] sm:min-h-[700px] p-4 sm:p-6'}`}>
            
            {/* Full Screen Toggle */}
            <button 
              onClick={() => setIsPodiumFullScreen(!isPodiumFullScreen)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
            {/* Background Image - Provided by User */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-[#0e1014]">
                <img 
                  src="/sponsors/Fondo-Podio.jpg" 
                  alt="Fondo Podio" 
                  className="w-full h-full object-cover"
                />
            </div>

              {/* Zone 1: Main Logo (Top) */}
              <div className="relative w-full z-20 flex justify-center shrink-0">
              <div className={`flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isPodiumFullScreen ? 'scale-110 sm:scale-125 mt-4' : ''} relative`}>
                <div className="absolute inset-0 bg-cyan-400/40 blur-[50px] rounded-full scale-150 -z-10 animate-pulse mix-blend-screen pointer-events-none"></div>
                <img src={eventInfo.logo} alt={eventInfo.title} className={MAIN_LOGO.className} />
              </div>
              
              {/* Category Absolute Top Right (Below sponsors visually, fixed position) */}
              <div className={`absolute -bottom-4 right-0 sm:right-4 flex items-center bg-gradient-to-b from-[#3a3d44] to-[#1a1c22] rounded-md border-2 border-gray-600 shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPodiumFullScreen ? 'px-6 py-3 sm:px-10 sm:py-4 gap-3 sm:gap-4' : 'px-4 py-2 sm:px-6 sm:py-3 gap-2'}`}>
                 <span className={`text-white font-mono tracking-widest font-bold transition-all duration-500 ${isPodiumFullScreen ? 'text-sm sm:text-2xl' : 'text-xs sm:text-sm'}`}>PODIO OFICIAL</span>
                 <span className={`text-[#00cfff] font-black tracking-widest drop-shadow-[0_0_10px_rgba(0,207,255,1)] transition-all duration-500 ${isPodiumFullScreen ? 'text-sm sm:text-2xl' : 'text-xs sm:text-sm'}`}>/ {masterCategory}</span>
                 {/* Screws/Bolts */}
                 <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>
            {/* Spacer for Podium */}
            <div className="relative z-20 w-full flex-grow max-h-4 sm:max-h-8"></div>

            {(() => {
              // Calculate top 3
              const masterPilots = groupedByCategory[masterCategory] || [];
              const gradedJudgeUids = Array.from(new Set(
                masterPilots.flatMap(p => Object.keys(p.calificaciones || {}).map(k => k.split('_')[0]))
              ));
              const displayJudgeUids = Array.from(new Set([...allJudgeUids, ...gradedJudgeUids])).length > 0 ? Array.from(new Set([...allJudgeUids, ...gradedJudgeUids])) : ['juez_1', 'juez_2', 'juez_3'];

              const sortedForPodium = [...masterPilots].map(pilot => {
                const globalTotal = displayJudgeUids.reduce((sum, uid) => sum + (getScoreForCategory(pilot, uid, masterCategory)?.total || 0), 0);
                return { ...pilot, _globalTotal: globalTotal };
              }).sort((a, b) => b._globalTotal - a._globalTotal).slice(0, 3);

              if (sortedForPodium.length === 0 || sortedForPodium[0]._globalTotal === 0) {
                 return <div className="text-[#888888] font-mono py-16 relative z-10 text-center w-full">NO HAY RESULTADOS AÚN</div>;
              }

              const firstPlace = sortedForPodium[0];
              const secondPlace = sortedForPodium[1];
              const thirdPlace = sortedForPodium[2];

              // Helper for Pilot Avatar
              const PilotAvatar = ({ pilot, color, place }: { pilot: any, color: string, place: string }) => {
                 if (!pilot) return <div className="w-24 sm:w-40 flex flex-col items-center justify-end relative z-10"></div>;
                 
                 const getDecoratorColor = () => {
                   if (place === '1ST') return "text-[#FFD700]";
                   if (place === '2ND') return "text-[#00cfff]";
                   return "text-[#CD7F32]";
                 }
                 
                 const getOuterRingStyle = () => {
                    if (place === '1ST') return `bg-gradient-to-br from-[#FFD700] via-[#B8860B] to-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.6)] p-[8px] sm:p-[12px]`;
                    if (place === '2ND') return `bg-gradient-to-br from-[#00cfff] via-[#005f73] to-[#0a9396] shadow-[0_0_30px_rgba(0,207,255,0.4)] p-[6px] sm:p-[10px]`;
                    if (place === '3RD') return `bg-gradient-to-br from-[#CD7F32] via-[#8B4513] to-[#A0522D] shadow-[0_0_20px_rgba(205,127,50,0.4)] p-[6px] sm:p-[10px]`;
                 };
                 
                 const getInnerRingStyle = () => {
                    if (place === '1ST') return `border-[4px] border-[#333] border-dashed`;
                    if (place === '2ND') return `border-[4px] border-[#222] border-dotted`;
                    if (place === '3RD') return `border-[3px] border-[#444] border-dotted`;
                 };

                 return (
                   <div className="w-full flex flex-col items-center justify-end relative z-10 group">
                      {/* Photo Container */}
                      <div className="relative mb-3 sm:mb-4 flex justify-center items-center">
                         {/* Aura for 1st place */}
                         {place === '1ST' && <div className="absolute inset-0 bg-[#FFD700]/30 blur-[40px] rounded-full scale-150 animate-pulse pointer-events-none"></div>}
                         
                         {/* Brake Disc Outer */}
                         <div className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${getOuterRingStyle()} ${place === '1ST' ? 'animate-[spin_15s_linear_infinite]' : ''}`}>
                            {/* Brake Disc Holes Pattern (Simulated with absolute radial-gradient dots) */}
                            <div className="absolute inset-0 rounded-full opacity-30 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 3px)', backgroundSize: '15px 15px' }}></div>
                            
                            {/* Inner Photo Wrapper */}
                            <div className={`relative rounded-full overflow-hidden bg-[#050B14] z-20 transition-all duration-500 ${isPodiumFullScreen ? 'w-24 h-24 sm:w-48 sm:h-48' : 'w-20 h-20 sm:w-32 sm:h-32'} ${getInnerRingStyle()} ${place === '1ST' ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`}>
                                {pilot.documentos?.deportistaUrl ? (
                                  <img src={pilot.documentos.deportistaUrl} alt="Pilot" className="w-full h-full object-cover object-top" />
                                ) : (
                                  <User className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#555] transition-all duration-500 ${isPodiumFullScreen ? 'w-14 h-14 sm:w-24 sm:h-24' : 'w-12 h-12 sm:w-20 sm:h-20'}`} />
                                )}
                            </div>
                         </div>
                      </div>

                      {/* Info Container */}
                      <div className="text-center z-10 w-full px-1 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-auto mt-2 bg-black/40 px-3 py-1 rounded backdrop-blur-sm border border-white/5">
                           <span className={`text-[10px] sm:text-[12px] font-bold ${getDecoratorColor()}`}>|</span>
                           <span className={`font-black text-white uppercase truncate tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight transition-all duration-500 ${isPodiumFullScreen ? 'text-xs sm:text-lg' : 'text-[10px] sm:text-sm'}`}>{pilot.nombres.split(' ')[0]} {pilot.apellidos?.split(' ')[0]}</span>
                           <span className={`text-[10px] sm:text-[12px] font-bold ${getDecoratorColor()}`}>|</span>
                        </div>
                        
                        <div className={`mt-1.5 sm:mt-2 font-black font-mono drop-shadow-[0_0_10px_currentColor] transition-all duration-500 flex items-baseline gap-1 ${isPodiumFullScreen ? 'text-lg sm:text-3xl' : 'text-sm sm:text-xl'}`} style={{ color }}>
                           {pilot._globalTotal} <span className="text-[9px] sm:text-[12px] opacity-80">PTS</span>
                        </div>
                      </div>
                   </div>
                 );
              };

              // Zone 3: Podium Container using Grid for strict isolation
              return (
                <div className={`relative z-10 w-full flex-grow flex items-end justify-center transition-all duration-500 pb-2 sm:pb-6`}>
                  <div className={`w-full ${isPodiumFullScreen ? 'max-w-5xl gap-4 sm:gap-12' : 'max-w-3xl gap-2 sm:gap-4'} grid grid-cols-3 items-end`}>
                   
                   {/* 2nd Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-20">
                     <PilotAvatar pilot={secondPlace} color="#00cfff" place="2ND" />
                     {/* Smoke Effect */}
                     <div className="absolute bottom-[-10px] left-[-20%] w-full h-32 bg-gray-400/20 blur-[30px] rounded-full pointer-events-none mix-blend-screen opacity-50"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-[90%] sm:w-[85%] mx-auto relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#00cfff]/10 border-2 border-[#00cfff] shadow-[0_0_30px_rgba(0,207,255,0.4),inset_0_0_20px_rgba(0,207,255,0.2)] rounded-md ${isPodiumFullScreen ? 'h-[80px] sm:h-[110px]' : 'h-[60px] sm:h-[80px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00cfff] drop-shadow-[0_0_20px_rgba(0,207,255,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodiumFullScreen ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-7xl'}`}>2</span>
                     </div>
                   </div>

                   {/* 1st Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-30">
                     <PilotAvatar pilot={firstPlace} color="#FFD700" place="1ST" />
                     {/* Fire and Smoke Effects */}
                     <div className="absolute bottom-[-10px] w-[120%] h-40 bg-orange-500/20 blur-[40px] rounded-full pointer-events-none mix-blend-screen animate-pulse"></div>
                     <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-yellow-500/80 via-orange-600/50 to-transparent blur-[20px] rounded-t-full pointer-events-none mix-blend-screen animate-pulse z-40"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-full relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#FFD700]/10 border-2 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5),inset_0_0_30px_rgba(255,215,0,0.3)] rounded-md ${isPodiumFullScreen ? 'h-[120px] sm:h-[160px]' : 'h-[90px] sm:h-[120px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#FFD700] drop-shadow-[0_0_35px_rgba(255,215,0,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodiumFullScreen ? 'text-7xl sm:text-9xl' : 'text-6xl sm:text-8xl'}`}>1</span>
                     </div>
                   </div>

                   {/* 3rd Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-10">
                     <PilotAvatar pilot={thirdPlace} color="#CD7F32" place="3RD" />
                     {/* Smoke Effect */}
                     <div className="absolute bottom-[-10px] right-[-20%] w-full h-32 bg-gray-400/20 blur-[30px] rounded-full pointer-events-none mix-blend-screen opacity-50"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-[90%] sm:w-[85%] mx-auto relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#CD7F32]/10 border-2 border-[#CD7F32] shadow-[0_0_20px_rgba(205,127,50,0.4),inset_0_0_15px_rgba(205,127,50,0.2)] rounded-md ${isPodiumFullScreen ? 'h-[40px] sm:h-[55px]' : 'h-[30px] sm:h-[40px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#CD7F32] drop-shadow-[0_0_15px_rgba(205,127,50,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodiumFullScreen ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'}`}>3</span>
                      </div>
                    </div>
                  </div>
                   
                   {/* Floor Gradient Reflection */}
                   <div className="absolute bottom-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-t from-[#0e1014]/80 via-[#0e1014]/30 to-transparent z-40 pointer-events-none"></div>
                   
                   {/* Connecting Energy Lines */}
                   <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00cfff]/30 to-transparent z-0"></div>
                </div>
              );
            })()}

            {/* Zone 4: Sponsors (Below Podium) */}
            <div className={`relative z-30 w-full flex justify-center transition-all duration-500 shrink-0 pb-1 sm:pb-2`}>
              {/* Sponsors List - Overlay over the image's bottom grille */}
              <div className={`relative z-10 flex flex-nowrap items-center justify-center py-2 sm:py-4 px-2 sm:px-8 w-full overflow-hidden transition-all duration-500 ${isPodiumFullScreen ? 'gap-3 sm:gap-10 scale-90 sm:scale-100' : 'gap-2 sm:gap-6 scale-75 sm:scale-90'}`}>
                {SPONSOR_LOGOS.map((logo, idx) => (
                  <div key={idx} className="relative flex items-center justify-center transition-all duration-300 flex-shrink">
                    <img src={logo.src} alt={logo.alt} className={`${logo.className} drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] object-contain max-w-[60px] sm:max-w-full`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PODIO 2 DIALOG */}
      <Dialog open={isPodio2Open} onOpenChange={(open) => {
        setIsPodio2Open(open);
        if (!open) setIsPodio2FullScreen(false);
      }}>
        <DialogContent className={`${isPodio2FullScreen ? 'w-screen h-screen max-w-none rounded-none border-0' : 'max-w-4xl sm:rounded-[2rem] border border-[#00cfff]/30'} bg-[#0a0a0f] shadow-[0_0_80px_rgba(0,207,255,0.15)] p-0 overflow-hidden`}>
          <DialogTitle className="sr-only">Podio 2 Oficial - Resultados</DialogTitle>
          <div className={`relative w-full flex flex-col items-center justify-between overflow-hidden ${isPodio2FullScreen ? 'h-screen p-4 sm:p-8' : 'min-h-[600px] sm:min-h-[700px] p-4 sm:p-6'}`}>
            
            {/* Full Screen Toggle */}
            <button 
              onClick={() => setIsPodio2FullScreen(!isPodio2FullScreen)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
            {/* Background Image - Provided by User */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-[#0e1014]">
                <img 
                  src="/sponsors/Fondo-Podio.jpg" 
                  alt="Fondo Podio" 
                  className="w-full h-full object-cover"
                />
            </div>

              {/* Zone 1: Main Logo (Top) */}
              <div className="relative w-full z-20 flex justify-center shrink-0">
              <div className={`flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isPodio2FullScreen ? 'scale-110 sm:scale-125 mt-4' : ''} relative`}>
                <div className="absolute inset-0 bg-cyan-400/40 blur-[50px] rounded-full scale-150 -z-10 animate-pulse mix-blend-screen pointer-events-none"></div>
                <img src={eventInfo.logo} alt={eventInfo.title} className={MAIN_LOGO.className} />
              </div>
              
              {/* Category Absolute Top Right (Below sponsors visually, fixed position) */}
              <div className={`absolute -bottom-4 right-0 sm:right-4 flex items-center bg-gradient-to-b from-[#3a3d44] to-[#1a1c22] rounded-md border-2 border-gray-600 shadow-[0_5px_15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-500 ${isPodio2FullScreen ? 'px-6 py-3 sm:px-10 sm:py-4 gap-3 sm:gap-4' : 'px-4 py-2 sm:px-6 sm:py-3 gap-2'}`}>
                 <span className={`text-white font-mono tracking-widest font-bold transition-all duration-500 ${isPodio2FullScreen ? 'text-sm sm:text-2xl' : 'text-xs sm:text-sm'}`}>PODIO OFICIAL</span>
                 <span className={`text-[#00cfff] font-black tracking-widest drop-shadow-[0_0_10px_rgba(0,207,255,1)] transition-all duration-500 ${isPodio2FullScreen ? 'text-sm sm:text-2xl' : 'text-xs sm:text-sm'}`}>/ ALTO CILINDRAJE</span>
                 {/* Screws/Bolts */}
                 <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
                 <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 shadow-[inset_0_-1px_1px_rgba(0,0,0,0.8)]"></div>
              </div>
            </div>
            {/* Spacer for Podium */}
            <div className="relative z-20 w-full flex-grow max-h-4 sm:max-h-8"></div>

            {(() => {
              const getHardcodedPilot = (searchTerm: string) => {
                return registrations.find(p => (p.nombres || '').toUpperCase().includes(searchTerm) || (p.apellidos || '').toUpperCase().includes(searchTerm));
              };

              const firstPlaceOriginal = getHardcodedPilot("PABLO ZAPATA") || getHardcodedPilot("ZAPATA PARRA") || getHardcodedPilot("PABLO");
              const secondPlaceOriginal = getHardcodedPilot("JHOJAN");
              const thirdPlaceOriginal = getHardcodedPilot("GERSAIN");

              const firstPlace = { ...(firstPlaceOriginal || { nombres: 'PABLO ZAPATA', apellidos: 'PARRA', documentos: {} }), _globalTotal: 59 };
              const secondPlace = { ...(secondPlaceOriginal || { nombres: 'JHOJAN ESTEVEN', apellidos: 'ACEVEDO', documentos: {} }), _globalTotal: 54 };
              const thirdPlace = { ...(thirdPlaceOriginal || { nombres: 'GERSAIN', apellidos: 'LONDOÑO', documentos: {} }), _globalTotal: 36 };

              // Helper for Pilot Avatar
              const PilotAvatar = ({ pilot, color, place }: { pilot: any, color: string, place: string }) => {
                 if (!pilot) return <div className="w-24 sm:w-40 flex flex-col items-center justify-end relative z-10"></div>;
                 
                 const getDecoratorColor = () => {
                   if (place === '1ST') return "text-[#FFD700]";
                   if (place === '2ND') return "text-[#00cfff]";
                   return "text-[#CD7F32]";
                 }
                 
                 const getOuterRingStyle = () => {
                    if (place === '1ST') return `bg-gradient-to-br from-[#FFD700] via-[#B8860B] to-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.6)] p-[8px] sm:p-[12px]`;
                    if (place === '2ND') return `bg-gradient-to-br from-[#00cfff] via-[#005f73] to-[#0a9396] shadow-[0_0_30px_rgba(0,207,255,0.4)] p-[6px] sm:p-[10px]`;
                    if (place === '3RD') return `bg-gradient-to-br from-[#CD7F32] via-[#8B4513] to-[#A0522D] shadow-[0_0_20px_rgba(205,127,50,0.4)] p-[6px] sm:p-[10px]`;
                 };
                 
                 const getInnerRingStyle = () => {
                    if (place === '1ST') return `border-[4px] border-[#333] border-dashed`;
                    if (place === '2ND') return `border-[4px] border-[#222] border-dotted`;
                    if (place === '3RD') return `border-[3px] border-[#444] border-dotted`;
                 };

                 return (
                   <div className="w-full flex flex-col items-center justify-end relative z-10 group">
                      {/* Photo Container */}
                      <div className="relative mb-3 sm:mb-4 flex justify-center items-center">
                         {/* Aura for 1st place */}
                         {place === '1ST' && <div className="absolute inset-0 bg-[#FFD700]/30 blur-[40px] rounded-full scale-150 animate-pulse pointer-events-none"></div>}
                         
                         {/* Brake Disc Outer */}
                         <div className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${getOuterRingStyle()} ${place === '1ST' ? 'animate-[spin_15s_linear_infinite]' : ''}`}>
                            {/* Brake Disc Holes Pattern (Simulated with absolute radial-gradient dots) */}
                            <div className="absolute inset-0 rounded-full opacity-30 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 3px)', backgroundSize: '15px 15px' }}></div>
                            
                            {/* Inner Photo Wrapper */}
                            <div className={`relative rounded-full overflow-hidden bg-[#050B14] z-20 transition-all duration-500 ${isPodio2FullScreen ? 'w-24 h-24 sm:w-48 sm:h-48' : 'w-20 h-20 sm:w-32 sm:h-32'} ${getInnerRingStyle()} ${place === '1ST' ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`}>
                                {pilot.documentos?.deportistaUrl ? (
                                  <img src={pilot.documentos.deportistaUrl} alt="Pilot" className="w-full h-full object-cover object-top" />
                                ) : (
                                  <User className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#555] transition-all duration-500 ${isPodio2FullScreen ? 'w-14 h-14 sm:w-24 sm:h-24' : 'w-12 h-12 sm:w-20 sm:h-20'}`} />
                                )}
                            </div>
                         </div>
                      </div>

                      {/* Info Container */}
                      <div className="text-center z-10 w-full px-1 flex flex-col items-center">
                        <div className="flex items-center gap-1.5 sm:gap-2 justify-center w-auto mt-2 bg-black/40 px-3 py-1 rounded backdrop-blur-sm border border-white/5">
                           <span className={`text-[10px] sm:text-[12px] font-bold ${getDecoratorColor()}`}>|</span>
                           <span className={`font-black text-white uppercase truncate tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight transition-all duration-500 ${isPodio2FullScreen ? 'text-xs sm:text-lg' : 'text-[10px] sm:text-sm'}`}>{pilot.nombres.split(' ')[0]} {pilot.apellidos?.split(' ')[0]}</span>
                           <span className={`text-[10px] sm:text-[12px] font-bold ${getDecoratorColor()}`}>|</span>
                        </div>
                        
                        <div className={`mt-1.5 sm:mt-2 font-black font-mono drop-shadow-[0_0_10px_currentColor] transition-all duration-500 flex items-baseline gap-1 ${isPodio2FullScreen ? 'text-lg sm:text-3xl' : 'text-sm sm:text-xl'}`} style={{ color }}>
                           {pilot._globalTotal} <span className="text-[9px] sm:text-[12px] opacity-80">PTS</span>
                        </div>
                      </div>
                   </div>
                 );
              };

              // Zone 3: Podium Container using Grid for strict isolation
              return (
                <div className={`relative z-10 w-full flex-grow flex items-end justify-center transition-all duration-500 pb-2 sm:pb-6`}>
                  <div className={`w-full ${isPodio2FullScreen ? 'max-w-5xl gap-4 sm:gap-12' : 'max-w-3xl gap-2 sm:gap-4'} grid grid-cols-3 items-end`}>
                   
                   {/* 2nd Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-20">
                     <PilotAvatar pilot={secondPlace} color="#00cfff" place="2ND" />
                     {/* Smoke Effect */}
                     <div className="absolute bottom-[-10px] left-[-20%] w-full h-32 bg-gray-400/20 blur-[30px] rounded-full pointer-events-none mix-blend-screen opacity-50"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-[90%] sm:w-[85%] mx-auto relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#00cfff]/10 border-2 border-[#00cfff] shadow-[0_0_30px_rgba(0,207,255,0.4),inset_0_0_20px_rgba(0,207,255,0.2)] rounded-md ${isPodio2FullScreen ? 'h-[80px] sm:h-[110px]' : 'h-[60px] sm:h-[80px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00cfff] drop-shadow-[0_0_20px_rgba(0,207,255,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodio2FullScreen ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-7xl'}`}>2</span>
                     </div>
                   </div>

                   {/* 1st Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-30">
                     <PilotAvatar pilot={firstPlace} color="#FFD700" place="1ST" />
                     {/* Fire and Smoke Effects */}
                     <div className="absolute bottom-[-10px] w-[120%] h-40 bg-orange-500/20 blur-[40px] rounded-full pointer-events-none mix-blend-screen animate-pulse"></div>
                     <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-yellow-500/80 via-orange-600/50 to-transparent blur-[20px] rounded-t-full pointer-events-none mix-blend-screen animate-pulse z-40"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-full relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#FFD700]/10 border-2 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5),inset_0_0_30px_rgba(255,215,0,0.3)] rounded-md ${isPodio2FullScreen ? 'h-[120px] sm:h-[160px]' : 'h-[90px] sm:h-[120px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#FFD700] drop-shadow-[0_0_35px_rgba(255,215,0,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodio2FullScreen ? 'text-7xl sm:text-9xl' : 'text-6xl sm:text-8xl'}`}>1</span>
                     </div>
                   </div>

                   {/* 3rd Place Column */}
                   <div className="flex flex-col items-center justify-end w-full relative z-10">
                     <PilotAvatar pilot={thirdPlace} color="#CD7F32" place="3RD" />
                     {/* Smoke Effect */}
                     <div className="absolute bottom-[-10px] right-[-20%] w-full h-32 bg-gray-400/20 blur-[30px] rounded-full pointer-events-none mix-blend-screen opacity-50"></div>
                     
                     {/* Neon Platform */}
                     <div className={`mt-2 sm:mt-3 w-[90%] sm:w-[85%] mx-auto relative flex items-center justify-center overflow-visible group transition-all duration-500 bg-[#CD7F32]/10 border-2 border-[#CD7F32] shadow-[0_0_20px_rgba(205,127,50,0.4),inset_0_0_15px_rgba(205,127,50,0.2)] rounded-md ${isPodio2FullScreen ? 'h-[40px] sm:h-[55px]' : 'h-[30px] sm:h-[40px]'}`}>
                        <span className={`font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#CD7F32] drop-shadow-[0_0_15px_rgba(205,127,50,1)] brightness-125 relative z-10 transition-all duration-500 ${isPodio2FullScreen ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'}`}>3</span>
                      </div>
                    </div>
                  </div>
                   
                   {/* Floor Gradient Reflection */}
                   <div className="absolute bottom-0 left-0 w-full h-12 sm:h-16 bg-gradient-to-t from-[#0e1014]/80 via-[#0e1014]/30 to-transparent z-40 pointer-events-none"></div>
                   
                   {/* Connecting Energy Lines */}
                   <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00cfff]/30 to-transparent z-0"></div>
                </div>
              );
            })()}

            {/* Zone 4: Sponsors (Below Podium) */}
            <div className={`relative z-30 w-full flex justify-center transition-all duration-500 shrink-0 pb-1 sm:pb-2`}>
              {/* Sponsors List - Overlay over the image's bottom grille */}
              <div className={`relative z-10 flex flex-nowrap items-center justify-center py-2 sm:py-4 px-2 sm:px-8 w-full overflow-hidden transition-all duration-500 ${isPodio2FullScreen ? 'gap-3 sm:gap-10 scale-90 sm:scale-100' : 'gap-2 sm:gap-6 scale-75 sm:scale-90'}`}>
                {SPONSOR_LOGOS.map((logo, idx) => (
                  <div key={idx} className="relative flex items-center justify-center transition-all duration-300 flex-shrink">
                    <img src={logo.src} alt={logo.alt} className={`${logo.className} drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] object-contain max-w-[60px] sm:max-w-full`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

      {/* RENDERIZADO PARA IMPRESIÓN (PDF) */}
      <div className="hidden print:block w-full bg-white text-black font-sans">
        {/* ENCABEZADO OSCURO CON LOGOS */}
        <div className="flex flex-wrap items-center justify-center gap-6 bg-black p-6 border-b-4 border-gray-400" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          {[{ src: eventInfo.logo, alt: eventInfo.title }, ...SPONSOR_LOGOS].map((logo, idx) => (
            <img 
              key={`print-logo-${idx}`} 
              src={logo.src} 
              alt={logo.alt} 
              className="h-10 object-contain" 
            />
          ))}
        </div>
        
        <div className="p-8">
          {/* TÍTULO */}
          <h1 className="text-3xl font-black uppercase text-center mb-6">Listado de Pilotos - {masterCategory}</h1>
        
          {/* TABLA DE PILOTOS */}
          <table className="w-full text-left border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <th className="border border-gray-400 px-4 py-3 font-bold">#</th>
                <th className="border border-gray-400 px-4 py-3 font-bold">PILOTO</th>
                <th className="border border-gray-400 px-4 py-3 font-bold">SEUDÓNIMO</th>
                <th className="border border-gray-400 px-4 py-3 font-bold">INSTAGRAM</th>
                <th className="border border-gray-400 px-4 py-3 font-bold">CATEGORÍA</th>
              </tr>
            </thead>
            <tbody>
              {(groupedByCategory[masterCategory] || []).map((pilot: any) => (
                <tr key={`print-${pilot.id}`}>
                  <td className="border border-gray-400 px-4 py-3 font-mono font-bold text-gray-700">#{pilot.numeroIdentificacion?.slice(-4) || 'N/A'}</td>
                  <td className="border border-gray-400 px-4 py-3 font-bold uppercase">{pilot.nombres} {pilot.apellidos}</td>
                  <td className="border border-gray-400 px-4 py-3 capitalize">{pilot.seudonimo || 'N/A'}</td>
                  <td className="border border-gray-400 px-4 py-3">{pilot.instagram || 'N/A'}</td>
                  <td className="border border-gray-400 px-4 py-3 uppercase">{Array.isArray(pilot.categoria) ? pilot.categoria.join(', ') : pilot.categoria}</td>
                </tr>
              ))}
              {(groupedByCategory[masterCategory] || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-gray-400 px-4 py-8 text-center text-gray-500">
                    No hay pilotos registrados en esta categoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
