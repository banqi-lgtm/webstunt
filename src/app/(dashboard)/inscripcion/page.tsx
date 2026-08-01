'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, getDocs, collection, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AlertTriangle, CheckCircle2, ChevronRight, ChevronDown, User, Gift, Trophy, Star, ShieldAlert, CreditCard, Clock, Image as ImageIcon, XCircle, ArrowLeft, CheckCircle, Smartphone, Phone, Lock, Camera, Instagram, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { CameraModal } from '@/components/camera-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';
import SocialMediaCard from '@/components/social-media-card';
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface EventCardProps {
  id: string;
  image: string;
  logo: string;
  logoClass?: string;
  bgPosition?: string;
  status: string;
  statusIcon: React.ComponentType<any>;
  statusColor: 'blue' | 'orange' | 'red' | 'emerald' | 'gold';
  title: string;
  titleAccent: string;
  description: string;
  ctaText: string;
  ctaVariant: 'active' | 'closed';
  userStatus?: string | null;
  onClick: () => void;
  renderStatusBadge: (status: string | null) => React.ReactNode;
}

function EventCard({
  id,
  image,
  logo,
  logoClass = '',
  bgPosition = 'bg-center',
  status,
  statusIcon: StatusIcon,
  statusColor,
  title,
  titleAccent,
  description,
  ctaText,
  ctaVariant,
  userStatus,
  onClick,
  renderStatusBadge
}: EventCardProps) {
  const theme = {
    gold: {
      border: 'border-[#D49E35]/50 hover:border-[#D49E35] group-hover:shadow-[0_0_35px_rgba(212,158,53,0.25)]',
      divider: 'bg-[#D49E35]',
      badge: 'border-[#D49E35]/40 text-[#D49E35] bg-[#D49E35]/10',
      titleAccent: 'text-[#D49E35]',
      btn: 'bg-[#D49E35] hover:bg-[#C38D24] text-white shadow-[0_4px_20px_rgba(212,158,53,0.3)]',
    },
    blue: {
      border: 'border-blue-600/50 hover:border-blue-500 group-hover:shadow-[0_0_35px_rgba(37,99,235,0.25)]',
      divider: 'bg-blue-600',
      badge: 'border-blue-500/40 text-blue-400 bg-blue-950/20',
      titleAccent: 'text-blue-400',
      btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)]',
    },
    orange: {
      border: 'border-orange-600/50 hover:border-orange-500 group-hover:shadow-[0_0_35px_rgba(234,88,12,0.25)]',
      divider: 'bg-orange-600',
      badge: 'border-orange-500/40 text-orange-400 bg-orange-950/20',
      titleAccent: 'text-orange-400',
      btn: 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_4px_20px_rgba(234,88,12,0.3)]',
    },
    red: {
      border: 'border-red-600/50 hover:border-red-500 group-hover:shadow-[0_0_35px_rgba(230,0,0,0.25)]',
      divider: 'bg-red-600',
      badge: 'border-red-500/40 text-red-500 bg-red-950/20',
      titleAccent: 'text-red-500',
      btn: 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800/80 text-zinc-400',
    },
    emerald: {
      border: 'border-emerald-600/50 hover:border-emerald-500 group-hover:shadow-[0_0_35px_rgba(16,185,129,0.25)]',
      divider: 'bg-emerald-600',
      badge: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20',
      titleAccent: 'text-emerald-400',
      btn: 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800/80 text-zinc-400',
    }
  }[statusColor] || {
    border: 'border-zinc-800 hover:border-zinc-700',
    divider: 'bg-zinc-700',
    badge: 'border-zinc-700 text-zinc-400 bg-zinc-950/20',
    titleAccent: 'text-zinc-400',
    btn: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
  };

  return (
    <article 
      onClick={onClick}
      className={`group relative bg-black rounded-[2.5rem] flex flex-col md:flex-row justify-start items-center cursor-pointer transition-all duration-500 overflow-hidden min-h-[460px] md:min-h-0 md:h-[305px] w-full border ${theme.border} shadow-[0_15px_40px_rgba(0,0,0,0.65)]`}
    >

      {/* Radial glow background in bottom right */}
      <div className={`absolute bottom-0 right-0 w-[180px] h-[180px] rounded-full blur-[80px] mix-blend-screen pointer-events-none opacity-[0.07] transition-opacity duration-500 group-hover:opacity-15 ${
        statusColor === 'gold' ? 'bg-[#D49E35]' :
        statusColor === 'blue' ? 'bg-blue-500' :
        statusColor === 'orange' ? 'bg-orange-500' :
        statusColor === 'red' ? 'bg-red-600' :
        'bg-emerald-500'
      }`} />

      {/* Visual Side Column (45% on desktop) - Displays the rider image */}
      <div 
        className={`w-full md:w-[45%] h-[180px] md:h-full bg-cover ${bgPosition} bg-no-repeat pointer-events-none relative overflow-hidden transition-transform duration-700 group-hover:scale-[1.03]`}
        style={{ backgroundImage: `url('${image}')` }}
      >
        {/* Smooth visual to solid card background transition */}
        <div className="absolute inset-y-0 right-[-1px] w-1/3 bg-gradient-to-l from-black via-black/70 to-transparent hidden md:block z-20"></div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent md:hidden"></div>
      </div>

      {/* Vertical solid separator accent line */}
      <div className={`absolute top-0 bottom-0 left-[45%] w-[1.5px] ${theme.divider} hidden md:block z-30 transition-colors duration-500`} />

      {/* Content Column (55% on desktop) */}
      <div className="w-full md:w-[55%] h-auto md:h-full p-5 md:p-6 flex flex-col justify-center items-center text-center z-10 relative gap-3 md:gap-3.5">
        {/* Top Row: Event Logo (centered) & User status badge (right absolute) */}
        <div className="w-full flex items-center justify-center h-10 md:h-12 relative overflow-visible shrink-0">
          <img 
            src={logo} 
            alt={`${title} Logo`} 
            className={`${logoClass} max-h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500`}
            loading="lazy"
          />
          {userStatus && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 scale-90 origin-right">
              {renderStatusBadge(userStatus)}
            </div>
          )}
        </div>

        {/* Event Status Badge */}
        <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${theme.badge} text-[9px] font-black tracking-widest uppercase w-fit shadow-[0_0_15px_rgba(0,0,0,0.4)] shrink-0`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status}</span>
        </div>

        {/* Event Title */}
        <h2 className="text-lg md:text-[20px] font-black text-white uppercase tracking-tight leading-tight shrink-0">
          {title} <span className={theme.titleAccent}>{titleAccent}</span>
        </h2>

        {/* Event Description */}
        <p className="text-zinc-400 text-[11px] font-medium leading-relaxed max-w-[280px] line-clamp-2 mx-auto shrink-0">
          {description}
        </p>

        {/* Bottom Row: CTA Button */}
        <div className="w-full max-w-[240px] shrink-0">
          <button 
            type="button"
            className={`relative overflow-hidden w-full py-2.5 rounded-full text-white font-extrabold tracking-widest uppercase shadow-lg text-[9px] md:text-[10px] flex items-center justify-center gap-1.5 transition-all duration-300 border border-transparent ${theme.btn}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {ctaText} <ChevronRight className="w-3.5 h-3.5 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
            {ctaVariant === 'active' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none skew-x-12" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function InscripcionPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Form, 2: Payment, 3: Pending/Success
  const [estadoPago, setEstadoPago] = useState<'pendiente' | 'en_revision' | 'aprobado' | 'pago_dia_evento' | 'rechazado' | 'saldo_pendiente' | 'revision_saldo' | 'rechazado_saldo'>('pendiente');
  const [saldoFaltante, setSaldoFaltante] = useState('');
  const [motivoSaldoFaltante, setMotivoSaldoFaltante] = useState('');
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<'f2r' | 'stuntday' | 'nitrox' | 'festival'>('nitrox');
  const [activeEvent, setActiveEvent] = useState<'f2r' | 'stuntday' | 'nitrox' | 'festival' | null>(null);
  const [showClosedEvents, setShowClosedEvents] = useState(false);
  const [isCustomMenuOpen, setIsCustomMenuOpen] = useState(false);
  const [f2rStatus, setF2rStatus] = useState<string | null>(null);
  const [stuntdayStatus, setStuntdayStatus] = useState<string | null>(null);
  const [nitroxStatus, setNitroxStatus] = useState<string | null>(null);
  const [festivalStatus, setFestivalStatus] = useState<string | null>(null);

  // Pilot and Card Template State
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [seudonimo, setSeudonimo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [templateConfig, setTemplateConfig] = useState<any>(null);

  const fetchEventStatuses = async (userId: string) => {
    try {
      const [f2rDoc, stuntdayDoc, nitroxDoc, festivalDoc] = await Promise.all([
        getDoc(doc(db, 'event_registrations', `f2r_${userId}`)),
        getDoc(doc(db, 'event_registrations', `stuntday_${userId}`)),
        getDoc(doc(db, 'event_registrations', `nitrox_${userId}`)),
        getDoc(doc(db, 'event_registrations', `festival_${userId}`))
      ]);
      setF2rStatus(f2rDoc.exists() ? (f2rDoc.data().estadoPago || 'pendiente') : 'no_inscrito');
      setStuntdayStatus(stuntdayDoc.exists() ? (stuntdayDoc.data().estadoPago || 'pendiente') : 'no_inscrito');
      setNitroxStatus(nitroxDoc.exists() ? (nitroxDoc.data().estadoPago || 'pendiente') : 'no_inscrito');
      setFestivalStatus(festivalDoc.exists() ? (festivalDoc.data().estadoPago || 'pendiente') : 'no_inscrito');
    } catch (e) {
      console.error("Error fetching event statuses:", e);
    }
  };

  const loadEventData = async (userId: string, eventKey: 'f2r' | 'stuntday' | 'nitrox' | 'festival') => {
    setIsCheckingStatus(true);
    try {
      // 1. Reset all state values first
      setCategorias([]);
      setIdPdf(null);
      setFotoPlaca(null);
      setFotoPropiedad(null);
      setFotoSoat(null);
      setFotoDeportista(null);
      setComprobantePago(null);
      setPlaca('');
      setMarca('');
      setReferencia('');
      setPatrocinadores(false);
      setParticipacionPrevia('');
      setInquietudes('');
      setEstadoPago('pendiente');
      setSaldoFaltante('');
      setMotivoSaldoFaltante('');
      setDocumentosRechazados([]);
      setTemplateConfig(null);
      setStep(1);

      // 2. Fetch specific doc Snap
      const docRef = doc(db, 'event_registrations', `${eventKey}_${userId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.documentos) {
          if (data.documentos.idUrl) setIdPdf({ url: data.documentos.idUrl, name: 'Identificación Guardada' });
          if (data.documentos.placaUrl) setFotoPlaca({ url: data.documentos.placaUrl, name: 'Foto Placa Guardada' });
          if (data.documentos.propiedadUrl) setFotoPropiedad({ url: data.documentos.propiedadUrl, name: 'Tarjeta Propiedad Guardada' });
          if (data.documentos.soatUrl) setFotoSoat({ url: data.documentos.soatUrl, name: 'SOAT Guardado' });
          if (data.documentos.deportistaUrl) setFotoDeportista({ url: data.documentos.deportistaUrl, name: 'Foto Deportista Guardada' });
        }
        if (data.categoria) {
          const cats = Array.isArray(data.categoria) ? data.categoria : [data.categoria];
          setCategorias(cats);
          setCategoriaStr(cats.join(' / ').toUpperCase());
        }
        if (data.motocicleta) {
          setPlaca(data.motocicleta.placa || '');
          setMarca(data.motocicleta.marca || '');
          setReferencia(data.motocicleta.referencia || '');
        }
        if (data.patrocinadores) setPatrocinadores(data.patrocinadores);
        if (data.participacionPrevia) setParticipacionPrevia(data.participacionPrevia);
        if (data.comprobanteUrl && data.estadoPago !== 'rechazado' && data.estadoPago !== 'saldo_pendiente' && data.estadoPago !== 'rechazado_saldo') {
          setComprobantePago({ url: data.comprobanteUrl, name: 'Comprobante Guardado' });
        }
        setEstadoPago(data.estadoPago || 'pendiente');
        setSaldoFaltante(data.saldoFaltante || '');
        setMotivoSaldoFaltante(data.motivoSaldoFaltante || '');
        setDocumentosRechazados(data.documentosRechazados || []);
        setTemplateConfig(data.templateConfig || null);
        if (data.estadoPago === 'aprobado' || data.estadoPago === 'pago_dia_evento' || data.estadoPago === 'en_revision' || data.estadoPago === 'rechazado' || data.estadoPago === 'revision_saldo' || data.estadoPago === 'saldo_pendiente' || data.estadoPago === 'rechazado_saldo') {
           setStep(3);
        } else {
           setStep(1); // pendiente o borrador
        }
      }
    } catch (e) {
      console.error("Error validando el registro del evento:", e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleEventSwitch = (eventKey: 'f2r' | 'stuntday' | 'nitrox' | 'festival') => {
    setSelectedEvent(eventKey);
    if (uid) {
      loadEventData(uid, eventKey);
    }
  };

  const renderStatusBadge = (status: string | null) => {
    if (!status || status === 'no_inscrito') return null;
    
    let text = '';
    let colorClass = '';
    
    if (status === 'aprobado' || status === 'pago_dia_evento') {
      text = 'APROBADO';
      colorClass = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400';
    } else if (status === 'en_revision' || status === 'revision_saldo') {
      text = 'EN REVISIÓN';
      colorClass = 'bg-amber-950/20 border-amber-500/30 text-amber-400';
    } else if (status === 'saldo_pendiente') {
      text = 'SALDO PENDIENTE';
      colorClass = 'bg-blue-950/20 border-blue-500/30 text-blue-400';
    } else if (status === 'rechazado' || status === 'rechazado_saldo') {
      text = 'RECHAZADO';
      colorClass = 'bg-rose-950/20 border-rose-500/30 text-rose-400';
    } else {
      return null;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border ${colorClass}`}>
        {text}
      </span>
    );
  };

  const refetchRegistrationData = async () => {
    if (!uid) return;
    try {
      const docSnap = await getDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`));
      if (docSnap.exists()) {
        setTemplateConfig(docSnap.data().templateConfig || null);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({ open: 0, '2t': 0, '4t': 0, alto: 0 });

  // Options Modal State
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [currentDocKey, setCurrentDocKey] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [sponsorsModalOpen, setSponsorsModalOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [staffNombre, setStaffNombre] = useState('');
  const [staffCedula, setStaffCedula] = useState('');
  const [staffCargo, setStaffCargo] = useState('');
  const [staffTelefono, setStaffTelefono] = useState('');

  // Invoice view state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Bypass states
  const [isPilotBypass, setIsPilotBypass] = useState(false);
  const [staffRegistered, setStaffRegistered] = useState(false);
  const [totalPilotos, setTotalPilotos] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [categoriaStr, setCategoriaStr] = useState('N/A');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [observacionesList, setObservacionesList] = useState<{ judgeId: string, text: string }[]>([]);
  const [isObservacionesOpen, setIsObservacionesOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [puesto, setPuesto] = useState(0);

  const fetchLeaderboard = async (uidStr: string, targetCat: string) => {
    try {
      if (!targetCat || targetCat === 'N/A') return;
      const [usersSnap, regSnap, califSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'event_registrations')),
        getDocs(collection(db, 'calificaciones'))
      ]);

      const usersMap = new Map();
      usersSnap.forEach(doc => usersMap.set(doc.id, doc.data()));

      const califMap = new Map();
      califSnap.forEach(doc => califMap.set(doc.id, doc.data()));

      const pilots: any[] = [];
      regSnap.forEach(docSnap => {
        if (!docSnap.id.startsWith(`${selectedEvent}_`)) return;
        const data = docSnap.data();
        if (data.uid && (data.estadoPago === 'aprobado' || data.estadoPago === 'pago_dia_evento')) {
          let regCats = Array.isArray(data.categoria) ? data.categoria.map(c => String(c).toUpperCase()) : [String(data.categoria || '').toUpperCase()];
          if (regCats.includes(targetCat)) {
            const userData = usersMap.get(data.uid) || {};
            const califs = califMap.get(docSnap.id) || {};
            let total = 0;
            const getMappedCategory = (c: string) => {
              let f = String(c).toUpperCase().trim();
              if (f.includes('ALTO') || f === 'CATEGORIA NITROX' || f === 'NITROX') return 'NITROX';
              if (f === '2T') return '2 TIEMPOS';
              if (f === '4T') return '4 TIEMPOS';
              return f;
            };
            Object.entries(califs).forEach(([key, c]: [string, any]) => {
              const safeCat = getMappedCategory(targetCat);
              const isNewFormat = key.toUpperCase().includes('_' + safeCat);
              const isOldFormat = !key.includes('_') && targetCat === String(regCats[0] || '').toUpperCase();

              if ((isNewFormat || isOldFormat) && c && typeof c.total === 'number') {
                total += c.total;
              }
            });
            let name = userData.nombres ? `${userData.nombres} ${userData.apellidos || ''}`.trim() : 'Piloto';
            if (data.seudonimo) name = data.seudonimo;
            else if (data.nombres || data.apellidos) name = `${data.nombres || ''} ${data.apellidos || ''}`.trim();

            pilots.push({ 
              uid: data.uid, 
              name,
              number: data.dorsal || userData.numeroIdentificacion || '--',
              photoUrl: data.documentos?.deportistaUrl || '',
              totalScore: total 
            });
          }
        }
      });

      pilots.sort((a, b) => b.totalScore - a.totalScore);
      setLeaderboard(pilots);
      const userIndex = pilots.findIndex(p => p.uid === uidStr);
      setPuesto(userIndex !== -1 ? userIndex + 1 : 0);
      setTotalPilotos(pilots.length);
    } catch (e) {
      console.error("Error fetching leaderboard in inscripcion", e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLeaderboardOpen) {
      setTimeout(() => {
        const el = document.getElementById(`pilot-${uid}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [isLeaderboardOpen, uid]);

  const openOptions = (docKey: string) => {
    setCurrentDocKey(docKey);
    if (docKey === 'id') {
      setCameraOpen(true);
    } else {
      setOptionsModalOpen(true);
    }
  };

  const handleFileFromDialog = async (file: File) => {
    setOptionsModalOpen(false);
    if (!currentDocKey) return;
    
    if (currentDocKey === 'deportista') {
      await handleFotoDeportistaChange(file);
      return;
    }

    const url = await handleInstantUpload(file, currentDocKey);
    if (url) {
      const stateObj = { url, name: file.name };
      if (currentDocKey === 'id') setIdPdf(stateObj);
      else if (currentDocKey === 'placa') setFotoPlaca(stateObj);
      else if (currentDocKey === 'propiedad') setFotoPropiedad(stateObj);
      else if (currentDocKey === 'soat') setFotoSoat(stateObj);
      else if (currentDocKey === 'comprobante') setComprobantePago(stateObj);
    }
  };

  const handleInstantUpload = async (file: File, docKey: string): Promise<string | null> => {
    if (!uid) return null;
    toast({ title: 'Subiendo archivo...', description: 'Guardando documento...', duration: 2000 });
    try {
      // Guardar en la raíz de la carpeta del usuario para evitar restricciones de reglas de Storage (storage/unauthorized)
      const storageRef = ref(storage, `events/${selectedEvent}/${uid}/${docKey}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const docRef = doc(db, 'event_registrations', `${selectedEvent}_${uid}`);
      if (docKey === 'comprobante') {
         await setDoc(docRef, { comprobanteUrl: url, estadoPago: estadoPago === 'pendiente' ? 'borrador' : estadoPago }, { merge: true });
      } else {
         await setDoc(docRef, {
           documentos: {
             [`${docKey}Url`]: url
           },
           estadoPago: estadoPago === 'pendiente' ? 'borrador' : estadoPago
         }, { merge: true });
         
         // Remove from rejected if it was there
         if (documentosRechazados.includes(docKey)) {
           const { arrayRemove } = await import('firebase/firestore');
           await updateDoc(docRef, { documentosRechazados: arrayRemove(docKey) });
           setDocumentosRechazados(prev => prev.filter(k => k !== docKey));
         }
      }
      toast({ title: 'Guardado', description: 'El archivo se guardó automáticamente.', variant: 'default' });
      return url;
    } catch (e: any) {
      console.error('Error instant upload', e);
      toast({ title: 'Error', description: `No se pudo guardar: ${e.message}`, variant: 'destructive' });
      return null;
    }
  };

  // Form State
  const [categorias, setCategorias] = useState<string[]>([]);
  const [idPdf, setIdPdf] = useState<any>(null);
  const [participacionPrevia, setParticipacionPrevia] = useState('');
  const [patrocinadores, setPatrocinadores] = useState<boolean>(false);
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [referencia, setReferencia] = useState('');
  
  // Files
  const [fotoPlaca, setFotoPlaca] = useState<any>(null);
  const [fotoPropiedad, setFotoPropiedad] = useState<any>(null);
  const [fotoSoat, setFotoSoat] = useState<any>(null);
  const [fotoDeportista, setFotoDeportista] = useState<any>(null);
  
  // Payment Proof
  const [comprobantePago, setComprobantePago] = useState<any>(null);
  
  const [inquietudes, setInquietudes] = useState('');

  const [documentosRechazados, setDocumentosRechazados] = useState<string[]>([]);

  const [faceDetector, setFaceDetector] = useState<any>(null);
  const [isDetectingFace, setIsDetectingFace] = useState(false);

  useEffect(() => {
    if (!uid || categorias.length === 0) return;
    
    const targetCat = String(categorias[activeCategoryIndex] || '').toUpperCase();
    if (!targetCat) return;

    setCategoriaStr(targetCat);

    const loadScores = async () => {
      try {
        const califDoc = await getDoc(doc(db, 'calificaciones', `f2r_${uid}`));
        let obsList: { judgeId: string, text: string }[] = [];
        if (califDoc.exists()) {
          const califs = califDoc.data();
          let total = 0;
          const getMappedCategory = (c: string) => {
            let f = String(c).toUpperCase().trim();
            if (f.includes('ALTO') || f === 'CATEGORIA NITROX' || f === 'NITROX') return 'NITROX';
            if (f === '2T') return '2 TIEMPOS';
            if (f === '4T') return '4 TIEMPOS';
            return f;
          };
          Object.entries(califs).forEach(([key, c]: [string, any]) => {
            const safeCat = getMappedCategory(targetCat);
            const isNewFormat = key.toUpperCase().includes('_' + safeCat);
            const isOldFormat = !key.includes('_') && targetCat === String(categorias[0] || '').toUpperCase();

            if (isNewFormat || isOldFormat) {
              if (c && typeof c.total === 'number') {
                total += c.total;
              }
              if (c && c.mejoras && String(c.mejoras).trim() !== '') {
                obsList.push({ judgeId: key.split('_')[0], text: c.mejoras });
              }
            }
          });
          setPuntaje(total);

          for (let i = 0; i < obsList.length; i++) {
            try {
              const jDoc = await getDoc(doc(db, 'users', obsList[i].judgeId));
              if (jDoc.exists()) {
                const jd = jDoc.data();
                const jname = `${jd.nombres || ''} ${jd.apellidos || ''}`.trim();
                if (jname) {
                  obsList[i].judgeId = jname;
                }
              }
            } catch (err) {}
          }
          setObservacionesList(obsList);
        } else {
          setPuntaje(0);
          setObservacionesList([]);
        }
        await fetchLeaderboard(uid, targetCat);
      } catch(e) {
        console.error("Error fetching score in inscripcion", e);
      }
    };
    loadScores();
  }, [uid, categorias, activeCategoryIndex]);

  useEffect(() => {
    // Window size for Confetti
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (typeof window !== 'undefined') {
      updateSize();
      window.addEventListener('resize', updateSize);
    }
    
    const fetchCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'event_registrations'));
        const counts: { [key: string]: number } = { open: 0, '2t': 0, '4t': 0, alto: 0 };
        snapshot.forEach(d => {
          const data = d.data();
          const cats = data.categoria || data.categorias;
          if (cats && (data.estadoPago === 'aprobado' || data.estadoPago === 'pago_dia_evento')) {
            if (Array.isArray(cats)) {
              cats.forEach(c => counts[c] = (counts[c] || 0) + 1);
            } else {
              counts[cats] = (counts[cats] || 0) + 1;
            }
          }
        });
        setCategoryCounts(counts);
      } catch (e) {
        console.error("Error fetching category counts", e);
      }
    };
    fetchCounts();

    const initDetector = async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "CPU"
          },
          runningMode: "IMAGE"
        });
        setFaceDetector(detector);
      } catch (err) {
        console.error("No se pudo iniciar FaceDetector", err);
      }
    };
    initDetector();

    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        
        try {
          // Fetch user profile info
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setNombres(userData.nombres || '');
            setApellidos(userData.apellidos || '');
            setSeudonimo(userData.seudonimo || '');
            setCiudad(userData.ciudad || '');
            setStaffNombre(`${userData.nombres || ''} ${userData.apellidos || ''}`.trim());
            setStaffCedula(userData.numeroIdentificacion || '');
            setStaffCargo(userData.cargo || '');
            setStaffTelefono(userData.telefono || '');
          }
          await fetchEventStatuses(user.uid);
        } catch (e) {
          console.error("Error loading user profile info:", e);
        }
      } else {
        setIsCheckingStatus(false);
        router.push('/');
      }
    });

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') window.removeEventListener('resize', () => {});
    };
  }, [router]);

  // Load Event Specific Registration Data
  useEffect(() => {
    if (uid) {
      loadEventData(uid, selectedEvent);
    } else {
      setIsCheckingStatus(false);
    }
  }, [uid, selectedEvent]);

  // FIX: Force remove pointer-events: none that Radix UI might leave behind on navigation or errors
  useEffect(() => {
    document.body.style.pointerEvents = '';
    return () => { document.body.style.pointerEvents = ''; };
  }, []);



  useEffect(() => {
    if (documentosRechazados.length === 0) {
      setCorrectionDialogOpen(false);
    }
  }, [documentosRechazados.length]);

  const handleFotoDeportistaChange = async (file: File | null) => {
    if (!file) {
      setFotoDeportista(null);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
       toast({ title: 'Formato incorrecto', description: 'Debes subir una imagen.', variant: 'destructive' });
       return;
    }

    if (!faceDetector) {
      const url = await handleInstantUpload(file, 'deportista');
      if (url) setFotoDeportista({ url, name: file.name, file });
      return;
    }

    setIsDetectingFace(true);

    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const detections = faceDetector.detect(img);
      URL.revokeObjectURL(img.src);

      if (detections.detections.length === 0) {
        toast({ 
          title: "Rostro no detectado", 
          description: "No se logró detectar un rostro claro en la fotografía. Por favor intenta con una foto donde te veas mejor de frente.", 
          variant: "destructive" 
        });
        setFotoDeportista(null);
      } else {
        toast({ title: "Rostro validado", description: "¡Perfecto! Tu foto cumple con los parámetros." });
        const url = await handleInstantUpload(file, 'deportista');
        if (url) setFotoDeportista({ url, name: file.name, file });
      }
    } catch (error) {
      console.error("Face detection error:", error);
      const url = await handleInstantUpload(file, 'deportista');
      if (url) setFotoDeportista({ url, name: file.name, file });
    } finally {
      setIsDetectingFace(false);
    }
  };

  const handleFileUpload = async (file: File | null, pathPrefix: string): Promise<string | null> => {
    if (!file || !uid) return null;
    const storageRef = ref(storage, `events/${selectedEvent}/${uid}/${pathPrefix}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const validateForm = () => {
    if (categorias.length === 0) return "Selecciona al menos una categoría";
    if (!idPdf) return "Falta anexar el PDF/Foto de tu identificación";
    if (!participacionPrevia) return "Responde si has participado antes";
    if (!patrocinadores) return "Debes confirmar que sigues a los patrocinadores";
    if (!placa || !marca || !referencia) return "Completa los datos de la motocicleta";
    if (!fotoPlaca) return "Anexa fotografía de la placa";
    if (!fotoPropiedad) return "Anexa fotografía/PDF de la tarjeta de propiedad";
    if (!fotoSoat) return "Anexa fotografía del SOAT vigente";
    if (!fotoDeportista) return "Anexa tu foto en acción para la pantalla LED";
    if (!comprobantePago) return "Anexa tu comprobante de pago";
    return null; // OK
  };

  const saveCategoriasToDB = async (newCats: string[]) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`), { uid, categoria: newCats }, { merge: true });
    } catch (e) {
      console.error("Error auto-saving categorias:", e);
    }
  };

  const saveMotocicletaToDB = async (field: 'placa'|'marca'|'referencia', val: string) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`), { 
        uid,
        motocicleta: { placa, marca, referencia, [field]: val } 
      }, { merge: true });
    } catch (e) {
      console.error("Error auto-saving motocicleta:", e);
    }
  };

  const saveParticipacionToDB = async (val: string) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`), { uid, participacionPrevia: val }, { merge: true });
    } catch (e) {
      console.error("Error auto-saving participacion:", e);
    }
  };

  const savePatrocinadoresToDB = async () => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`), { uid, patrocinadores }, { merge: true });
    } catch (e) {
      console.error("Error auto-saving patrocinadores:", e);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    const errorMsg = validateForm();
    if (errorMsg) {
      toast({ title: "Formulario Incompleto", description: errorMsg, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Validación estricta final de cupos antes de guardar
    const limits: { [key: string]: number } = { open: 30, '2t': 15, '4t': 15, alto: 15 };
    for (const cat of categorias) {
      if (limits[cat] !== undefined && categoryCounts[cat] >= limits[cat]) {
        toast({ title: "Cupos Llenos", description: `Lo sentimos, los cupos para la categoría ${cat === '2t' ? '2 TIEMPOS' : cat === '4t' ? '4 TIEMPOS' : cat === 'alto' ? 'ALTO CILINDRAJE' : 'OPEN'} se acaban de llenar.`, variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Pushing 6 files parallel
      const urls = await Promise.all([
        idPdf?.url ? Promise.resolve(idPdf.url) : handleFileUpload(idPdf?.file || null, 'id'),
        fotoPlaca?.url ? Promise.resolve(fotoPlaca.url) : handleFileUpload(fotoPlaca?.file || null, 'placa'),
        fotoPropiedad?.url ? Promise.resolve(fotoPropiedad.url) : handleFileUpload(fotoPropiedad?.file || null, 'propiedad'),
        fotoSoat?.url ? Promise.resolve(fotoSoat.url) : handleFileUpload(fotoSoat?.file || null, 'soat'),
        fotoDeportista?.url ? Promise.resolve(fotoDeportista.url) : handleFileUpload(fotoDeportista?.file || null, 'deportista'),
        comprobantePago?.url ? Promise.resolve(comprobantePago.url) : handleFileUpload(comprobantePago?.file || null, 'comprobante')
      ]);

      const formData = {
        uid,
        eventId: `${selectedEvent}_2026`,
        categoria: categorias,
        participacionPrevia,
        patrocinadores,
        motocicleta: {
          placa,
          marca,
          referencia
        },
        documentos: {
          idUrl: urls[0],
          placaUrl: urls[1],
          propiedadUrl: urls[2],
          soatUrl: urls[3],
          deportistaUrl: urls[4]
        },
        comprobanteUrl: urls[5],
        inquietudes,
        registradoEl: new Date().toISOString(),
        estadoPago: 'en_revision'
      };

      await setDoc(doc(db, 'event_registrations', `${selectedEvent}_${uid}`), formData);

      toast({
        title: "Inscripción Enviada",
        description: "Tus documentos y comprobante han sido enviados correctamente.",
      });
      setEstadoPago('en_revision');
      setStep(3);
      
    } catch (error: any) {
      console.error("Firebase Registration Error:", error);
      toast({
        title: "Error al enviar",
        description: `Fallo en sistema: ${error.message || 'Hubo un error de base de datos.'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!comprobantePago) {
      toast({ title: "Comprobante Faltante", description: "Por favor anexa la imagen del comprobante de pago.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const isSaldo = estadoPago === 'saldo_pendiente' || estadoPago === 'rechazado_saldo';
      const pathPrefix = isSaldo ? 'comprobante_saldo' : 'comprobante';
      
      let url = comprobantePago.url;
      if (!url && comprobantePago instanceof File) {
         url = await handleFileUpload(comprobantePago, pathPrefix);
      } else if (!url && comprobantePago.file) {
         url = await handleFileUpload(comprobantePago.file, pathPrefix);
      }
      
      const docRef = doc(db, 'event_registrations', `${selectedEvent}_${uid}`);
      
      if (isSaldo) {
        const docSnap = await getDoc(docRef);
        const updates: any = {
          estadoPago: 'revision_saldo',
          comprobanteSaldoUrl: url
        };

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.comprobanteSaldoUrl && (!data.historialSaldos || data.historialSaldos.length === 0)) {
            // Migrar el comprobante anterior al historial
            updates.historialSaldos = [data.comprobanteSaldoUrl, url];
          } else {
            updates.historialSaldos = arrayUnion(url);
          }
        } else {
          updates.historialSaldos = arrayUnion(url);
        }

        await updateDoc(docRef, updates);
        setEstadoPago('revision_saldo');
        toast({ title: "Comprobante de Saldo Enviado", description: "Tu pago del saldo está en validación." });
      } else {
        await updateDoc(docRef, {
          estadoPago: 'en_revision',
          comprobanteUrl: url,
          prioridadRechazado: estadoPago === 'rechazado'
        });
        setEstadoPago('en_revision');
        toast({ title: "Comprobante Enviado", description: "Tu pago está en validación. Te notificaremos cuando sea aprobado." });
      }
      
      setStep(3);
      
    } catch (error: any) {
      console.error("Error uploading payment proof:", error);
      toast({
         title: "Error",
         description: "No se pudo subir el comprobante. Inténtalo de nuevo.",
         variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickAssignRole = async (role: 'staff' | 'piloto') => {
    if (!uid) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        rol: role
      });
      toast({ title: role === 'staff' ? 'Staff Asignado' : 'Piloto Asignado', description: `Tu rol ha sido actualizado a ${role.toUpperCase()}.` });
      setStaffRegistered(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus || !mounted) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-[#E60000] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-400 font-bold tracking-widest uppercase text-sm">Verificando estado...</p>
      </div>
    );
  }

  if (staffRegistered) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#121212] flex items-center justify-center p-4">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E60000]/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
        <Card className="max-w-md w-full bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl relative z-10 text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Registro Exitoso</h2>
          <p className="text-zinc-400 mb-8">
            Tu rol ha sido actualizado en el sistema correctamente.
          </p>
          <Button 
            onClick={() => router.push('/profile')}
            className="w-full bg-[#E60000] hover:bg-[#CC0000] text-black font-bold"
          >
            VER MI PERFIL
          </Button>
        </Card>
      </div>
    );
  }
  // Array definition and handler for premium event cards selection view
  const eventsData = [
    {
      id: 'nitrox' as const,
      title: 'COPA STUNT',
      titleAccent: 'NITROX',
      subtitle: 'El campeonato de stunt definitivo.',
      bgImage: '/sponsors/stunt_hero_bg.png',
      logo: '/sponsors/Copa Stunt Nitrox Blanco.png',
      logoClass: 'h-16 sm:h-20 md:h-22 -my-2 md:-my-3 object-contain scale-[1.15] origin-left',
      bgPosition: 'bg-[position:center_8%]',
      theme: {
        border: 'border-blue-500/30 hover:border-blue-500/70',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.06)] hover:shadow-[0_0_50px_rgba(59,130,246,0.18)]',
        badgeText: 'text-[#E60000]',
        titleAccentColor: 'text-blue-400',
        btnGradient: 'bg-blue-600 hover:bg-blue-500 text-white border-none shadow-blue-950/40',
      },
      statusText: '30 DÍAS PARA EL CIERRE',
      statusIcon: Calendar,
      userStatus: nitroxStatus,
      ctaText: nitroxStatus === 'no_inscrito' || !nitroxStatus ? 'REGISTRARSE AHORA' : 'CONSULTAR ESTADO',
      isClosed: false,
    },
    {
      id: 'festival' as const,
      title: 'FESTIVAL STUNT',
      titleAccent: '30 DE AGOSTO',
      subtitle: 'El mayor show y adrenalina de la temporada.',
      bgImage: '/sponsors/moto-stunt.png',
      logo: '/sponsors/PKS Blanco.png',
      logoClass: 'h-14 sm:h-16 md:h-18 -my-2 md:-my-3 object-contain scale-[1.1] origin-left',
      bgPosition: 'bg-[position:center_8%]',
      theme: {
        border: 'border-orange-500/30 hover:border-orange-500/70',
        glow: 'shadow-[0_0_30px_rgba(249,115,22,0.06)] hover:shadow-[0_0_50px_rgba(249,115,22,0.18)]',
        badgeText: 'text-[#E60000]',
        titleAccentColor: 'text-orange-400',
        btnGradient: 'bg-orange-600 hover:bg-orange-500 text-white border-none shadow-orange-950/40',
      },
      statusText: '30 DÍAS PARA EL CIERRE',
      statusIcon: Calendar,
      userStatus: festivalStatus,
      ctaText: festivalStatus === 'no_inscrito' || !festivalStatus ? 'REGISTRARSE AHORA' : 'CONSULTAR ESTADO',
      isClosed: false,
    },
    {
      id: 'stuntday' as const,
      title: 'STUNT DAY',
      titleAccent: '2026',
      subtitle: 'El encuentro que reúne la cultura stunt nacional.',
      bgImage: '/sponsors/stuntday_bg_card.png',
      logo: '/sponsors/stuntday3.png',
      logoClass: 'h-16 sm:h-20 md:h-22 -my-2 md:-my-3 object-contain scale-[1.18] origin-left',
      bgPosition: 'bg-[position:-40px_8%]',
      theme: {
        border: 'border-[#E60000]/30 hover:border-[#E60000]/70',
        glow: 'shadow-[0_0_30px_rgba(230,0,0,0.1)] hover:shadow-[0_0_50px_rgba(230,0,0,0.25)]',
        badgeText: 'text-[#E60000]',
        titleAccentColor: 'text-[#E60000]',
        btnGradient: 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-650',
      },
      statusText: 'EVENTO CERRADO',
      statusIcon: Lock,
      userStatus: stuntdayStatus,
      ctaText: 'CONSULTAR ESTADO',
      isClosed: true,
    },
    {
      id: 'f2r' as const,
      title: 'COPA STUNT',
      titleAccent: 'F2R 2026',
      subtitle: 'El campeonato de stunt más importante del país.',
      bgImage: '/sponsors/f2r_bg_card.png',
      logo: '/sponsors/copa stunt nitrox f2r.png',
      logoClass: 'h-14 sm:h-16 md:h-18 -my-2 md:-my-3 object-contain scale-[1.1] origin-left',
      bgPosition: 'bg-[position:left_8%]',
      theme: {
        border: 'border-emerald-500/30 hover:border-emerald-500/70',
        glow: 'shadow-[0_0_30px_rgba(16,185,129,0.06)] hover:shadow-[0_0_50px_rgba(16,185,129,0.18)]',
        badgeText: 'text-[#E60000]',
        titleAccentColor: 'text-emerald-400',
        btnGradient: 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-650',
      },
      statusText: 'EVENTO CERRADO',
      statusIcon: Lock,
      userStatus: f2rStatus,
      ctaText: 'CONSULTAR ESTADO',
      isClosed: true,
    }
  ];

  const visibleEvents = eventsData.filter(event => !event.isClosed || showClosedEvents);
  const activeEventObj = eventsData.find(e => e.id === selectedEvent) || eventsData[0];

  const handleCardClick = (event: typeof eventsData[0]) => {
    if (event.id === 'f2r' && f2rStatus === 'no_inscrito') {
      toast({
        title: "Inscripciones Cerradas",
        description: "El periodo de registro para la Copa Stunt F2R 2026 ha finalizado.",
        variant: "destructive"
      });
      return;
    }
    if (event.id === 'stuntday' && stuntdayStatus === 'no_inscrito') {
      toast({
        title: "Inscripciones Cerradas",
        description: "El periodo de registro para Stunt Day 2026 ha finalizado.",
        variant: "destructive"
      });
      return;
    }
    handleEventSwitch(event.id);
    setActiveEvent(event.id);
  };

  return (
    <div className="min-h-screen relative overflow-y-auto overflow-x-hidden bg-[#09090b] flex flex-col">
      {mounted && windowSize.width > 0 && (estadoPago === 'aprobado' || estadoPago === 'pago_dia_evento') && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false} 
          numberOfPieces={500} 
          gravity={0.15} 
          className="z-50"
          style={{ position: 'fixed' }}
        />
      )}
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E60000]/5 blur-[180px] mix-blend-screen pointer-events-none rounded-full"></div>



      <div className={activeEvent === null ? "flex flex-col text-zinc-100 w-full relative z-10 min-h-[calc(100vh-80px)] justify-start items-center p-4 sm:p-6 md:p-12" : "flex flex-col p-4 lg:p-8 text-zinc-100 max-w-5xl mx-auto w-full relative z-10"}>
        
        {isCheckingStatus ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-6 text-red-600 font-bold uppercase tracking-widest text-sm animate-pulse">Sincronizando perfil...</p>
          </div>
        ) : activeEvent === null ? (
          /* PANTALLA DE SELECCIÓN DE EVENTOS */
          <div className="relative w-full flex flex-col justify-start items-center h-full z-10 text-center max-w-7xl px-4 py-8 animate-in fade-in zoom-in-95 duration-500">


            {/* Fullscreen Backdrop specific to the selection view */}
            <div 
              className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0" 
              style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.95)), url('/sponsors/Diseño sin título.png')" }}
            />
            


            <div className="relative z-10 flex flex-col items-center w-full">
              {/* Event Cards Grid: 4 columns on desktop, 2 on tablet, 1 on mobile */}
              <div className={`grid grid-cols-1 ${visibleEvents.length > 1 ? 'lg:grid-cols-2' : 'max-w-3xl'} gap-8 w-full max-w-6xl justify-center items-stretch mb-12`}>
                {visibleEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    image={event.bgImage}
                    logo={event.logo}
                    logoClass={event.logoClass}
                    bgPosition={event.bgPosition}
                    status={event.statusText}
                    statusIcon={event.statusIcon}
                    statusColor={event.id === 'nitrox' ? 'gold' : event.id === 'festival' ? 'orange' : event.id === 'stuntday' ? 'red' : 'emerald'}
                    title={event.title}
                    titleAccent={event.titleAccent}
                    description={event.subtitle}
                    ctaText={event.ctaText}
                    ctaVariant={event.isClosed ? 'closed' : 'active'}
                    userStatus={event.userStatus}
                    onClick={() => handleCardClick(event)}
                    renderStatusBadge={renderStatusBadge}
                  />
                ))}
              </div>

              {/* Toggle closed events button */}
              {eventsData.some(e => e.isClosed) && (
                <button
                  type="button"
                  onClick={() => setShowClosedEvents(!showClosedEvents)}
                  className="px-6 py-3 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-[0_0_15px_rgba(230,0,0,0.1)] mb-4"
                >
                  {showClosedEvents ? 'OCULTAR EVENTOS CERRADOS' : 'VER MÁS EVENTOS'}
                  <ChevronDown className={`w-4 h-4 text-[#E60000] transition-transform duration-300 ${showClosedEvents ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Extra Branding Footer */}
              <div className="flex flex-col items-center justify-center gap-1.5 mt-8 border-t border-zinc-900/40 pt-8 w-full max-w-md z-10">
                <p className="text-zinc-600 text-[10px] sm:text-xs font-black tracking-[0.4em] uppercase text-center">
                  PASIÓN &bull; EQUILIBRIO &bull; ADRENALINA
                </p>
                <div className="text-[#E60000] text-sm animate-pulse">
                  ⚡
                </div>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Botón Volver a Eventos */}
            <button 
              type="button" 
              onClick={() => {
                setActiveEvent(null);
                if (uid) fetchEventStatuses(uid);
              }} 
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 text-xs sm:text-sm font-bold uppercase tracking-widest bg-[#121212] hover:bg-[#1C1C1C] border border-zinc-800 px-4 py-2.5 rounded-2xl w-fit shadow-md"
            >
              <ArrowLeft className="w-4 h-4 text-[#E60000]" /> VOLVER A EVENTOS
            </button>

            {/* PASO 1: FORMULARIO SECUENCIAL */}
            {step === 1 && (
              <form onSubmit={handleFormSubmit} className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto w-full">
            
            {/* Header de Progreso */}
            <div className="flex flex-col mb-8 border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Link href="/profile" className="text-[#B0B0B0] hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                  Inscripción {activeEventObj ? `${activeEventObj.title} ${activeEventObj.titleAccent}` : ''}
                </h1>
              </div>
              <div className="flex items-center justify-between text-xs font-bold tracking-widest text-[#B0B0B0] mb-2">
                <span className="text-[#E60000]">Paso 2 de 3</span>
                <span className="text-white">66%</span>
              </div>
              <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#2A2A2A]">
                <div className="h-full bg-[#E60000] w-[66%] rounded-full shadow-[0_0_15px_rgba(230, 0, 0,0.5)]"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Columna Izquierda: Datos y Documentos */}
              <div className="space-y-6">
              
              {/* Categorías */}
              <div className="space-y-3 bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A]">
                <Label className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                  1. Categoría <span className="text-[#FF9800] text-[10px] bg-[#FF9800]/10 px-2 py-0.5 rounded border border-[#FF9800]/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Cupos limitados</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categorias.includes('open') ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['open'] || 0) >= 30 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { 
                    if ((categoryCounts['open'] || 0) >= 30) return;
                    if (categorias.includes('open')) {
                      setCategorias([]);
                      saveCategoriasToDB([]);
                    } else {
                      setCategorias(['open']);
                      saveCategoriasToDB(['open']);
                    }
                  }}>
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🟢</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer notranslate" translate="no">OPEN</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 30 - (categoryCounts['open'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categorias.includes('open') && <CheckCircle2 className="w-5 h-5 text-[#E60000] absolute top-2 right-2" />}
                  </div>
                  
                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categorias.includes('2t') ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['2t'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { 
                    if ((categoryCounts['2t'] || 0) >= 15) return;
                    if (categorias.includes('open')) {
                      toast({ title: "Categoría exclusiva", description: "La categoría OPEN no se puede combinar con otras.", variant: "default" });
                      return;
                    }
                    if (categorias.includes('2t')) {
                      const newCats = categorias.filter(c => c !== '2t');
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    } else {
                      const newCats = [...categorias, '2t'];
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    }
                  }}>
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🏍️</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">2 TIEMPOS</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['2t'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categorias.includes('2t') && <CheckCircle2 className="w-5 h-5 text-[#E60000] absolute top-2 right-2" />}
                  </div>

                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categorias.includes('4t') ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['4t'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { 
                    if ((categoryCounts['4t'] || 0) >= 15) return;
                    if (categorias.includes('open')) {
                      toast({ title: "Categoría exclusiva", description: "La categoría OPEN no se puede combinar con otras.", variant: "default" });
                      return;
                    }
                    if (categorias.includes('4t')) {
                      const newCats = categorias.filter(c => c !== '4t');
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    } else {
                      const newCats = [...categorias, '4t'];
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    }
                  }}>
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🛵</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">4 TIEMPOS</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['4t'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categorias.includes('4t') && <CheckCircle2 className="w-5 h-5 text-[#E60000] absolute top-2 right-2" />}
                  </div>

                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categorias.includes('alto') ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['alto'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { 
                    if ((categoryCounts['alto'] || 0) >= 15) return;
                    if (categorias.includes('open')) {
                      toast({ title: "Categoría exclusiva", description: "La categoría OPEN no se puede combinar con otras.", variant: "default" });
                      return;
                    }
                    if (categorias.includes('alto')) {
                      const newCats = categorias.filter(c => c !== 'alto');
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    } else {
                      const newCats = [...categorias, 'alto'];
                      setCategorias(newCats);
                      saveCategoriasToDB(newCats);
                    }
                  }}>
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🔥</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">ALTO CILINDRAJE</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['alto'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categorias.includes('alto') && <CheckCircle2 className="w-5 h-5 text-[#E60000] absolute top-2 right-2" />}
                  </div>
                </div>
              </div>
              
              {/* Experiencia y Compromiso */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <Label className="text-white text-sm font-bold uppercase tracking-wider block">2. Experiencia y Compromiso</Label>
                <p className="text-xs text-zinc-400 mb-2">¿Has participado en la Copa Stunt F2R en versiones anteriores?</p>
                <RadioGroup value={participacionPrevia} onValueChange={(val) => { setParticipacionPrevia(val); saveParticipacionToDB(val); }} className="grid grid-cols-2 gap-3">
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${participacionPrevia === 'si' ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-zinc-900/50'}`} onClick={() => setParticipacionPrevia('si')}>
                    <RadioGroupItem value="si" id="part-si" className="sr-only" />
                    <CheckCircle2 className={`w-6 h-6 mb-2 ${participacionPrevia === 'si' ? 'text-red-600' : 'text-zinc-600'}`} />
                    <Label className="text-center font-bold text-white text-xs cursor-pointer">Sí, ya he participado</Label>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${participacionPrevia === 'no' ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-zinc-900/50'}`} onClick={() => setParticipacionPrevia('no')}>
                    <RadioGroupItem value="no" id="part-no" className="sr-only" />
                    <div className="w-6 h-6 flex items-center justify-center mb-2">
                       <span className={`text-xl ${participacionPrevia === 'no' ? 'text-yellow-500' : 'text-zinc-600 grayscale'}`}>⭐</span>
                    </div>
                    <Label className="text-center font-bold text-zinc-300 text-xs cursor-pointer leading-tight">No, pero lo disfrutaré como nunca.</Label>
                  </div>
                </RadioGroup>
                
                <div className="mt-3 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors" onClick={() => { if (!patrocinadores) setSponsorsModalOpen(true); else setPatrocinadores(false); }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${patrocinadores ? 'border-[#E60000] bg-[#E60000]' : 'border-zinc-600'}`}>
                        {patrocinadores && <CheckCircle className="w-4 h-4 text-black" />}
                      </div>
                      <Label className="text-xs text-zinc-300 font-medium cursor-pointer leading-tight">
                        Confirmo que fui a Instagram a seguir a nuestros patrocinadores principales
                      </Label>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </div>
              </div>

              {/* Datos Motocicleta */}
              <div className="space-y-4 pt-6 border-t border-[#2A2A2A]">
                <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2 mb-2">
                  <span className="text-[#E60000]">🏍️</span> 3. Datos de la Motocicleta
                </Label>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Placa Motocicleta</Label>
                  <Input value={placa} onChange={e => { setPlaca(e.target.value.toUpperCase()); }} onBlur={() => saveMotocicletaToDB('placa', placa)} placeholder="ABC123" className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 uppercase rounded-xl px-4 focus:border-[#E60000] focus:ring-[#E60000]" maxLength={6} />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Marca de tu motocicleta</Label>
                  <Select value={marca} onValueChange={(val) => { setMarca(val); saveMotocicletaToDB('marca', val); }}>
                    <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 rounded-xl px-4 focus:ring-[#E60000]">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-[#2A2A2A] text-white">
                      {['YAMAHA','SUZUKI','HONDA','BAJAJ','AKT','TVS','VICTORY','BENELLI','KAWASAKI','FACTORY','YCF','HERO','KYMCO','KTM','KEEWAY','HUSQVARNA','DUCATI','JIALING MOTOS'].map(m => (
                        <SelectItem key={m} value={m} className="hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] cursor-pointer">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Referencia motocicleta</Label>
                  <Input value={referencia} onChange={e => setReferencia(e.target.value)} onBlur={() => saveMotocicletaToDB('referencia', referencia)} placeholder="Ej. MT-09" className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 rounded-xl px-4 focus:border-[#E60000] focus:ring-[#E60000]" />
                </div>
              </div>

              {/* Documentos Legales */}
              <div className="space-y-3 pt-6 border-t border-[#2A2A2A] pb-6">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2">
                    <span className="text-[#E60000]">📄</span> 4. Archivos y Documentación Legal
                  </Label>
                </div>
                <p className="text-[10px] text-[#B0B0B0] mb-4 leading-relaxed">
                  Es indispensable subir estos documentos para asegurar el acceso a Plaza Mayor Medellín.
                </p>

                {[
                  { key: 'id', state: idPdf, title: "Documento de identificación por ambos lados", desc: "Solo Foto (Frente y Reverso)" },
                  { key: 'placa', state: fotoPlaca, title: "Foto de la placa (Tu motocicleta)", desc: "Obligatorio" },
                  { key: 'propiedad', state: fotoPropiedad, title: "Foto/PDF Tarjeta de propiedad", desc: "Claro y legible" },
                  { key: 'soat', state: fotoSoat, title: "Fotografía del SOAT vigente", desc: "Vigente para la fecha" },
                  { key: 'deportista', state: fotoDeportista, title: "Foto tuya (Tipo Cédula o Carnet)", desc: "Fondo blanco o azul", isDeportista: true }
                ].map((item: any) => (
                  <div key={item.key} onClick={() => { if (!(item.isDeportista && isDetectingFace)) openOptions(item.key); }} className={`relative bg-[#1A1A1A] border ${item.state ? 'border-[#E60000] shadow-[0_0_15px_rgba(230, 0, 0,0.1)]' : 'border-[#2A2A2A]'} rounded-xl p-3 flex items-center gap-3 hover:border-[#424242] transition-all overflow-hidden ${item.isDeportista && isDetectingFace ? 'cursor-wait opacity-50' : 'cursor-pointer hover:bg-[#121212]'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${item.state ? 'bg-[#E60000]/10 border-[#E60000]/30' : 'bg-[#121212] border-[#2A2A2A]'}`}>
                      <ImageIcon className={`w-5 h-5 ${item.state ? 'text-[#E60000]' : 'text-[#E60000]/50'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <p className="text-xs text-white font-bold leading-tight truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-500">{item.state ? item.state.name : item.desc}</p>
                    </div>

                    <div className="shrink-0 z-20 pointer-events-none">
                      {item.state ? (
                        <div className="flex items-center gap-1.5 bg-red-600/10 border border-red-600/30 px-2.5 py-1 rounded-md">
                          <span className="text-red-600 text-[10px] font-bold uppercase">Subido</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700 px-2.5 py-1 rounded-md opacity-50">
                          <span className="text-zinc-400 text-[10px] font-bold uppercase">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              </div>

              {/* Columna Derecha: Pagos y Comprobante */}
              <div className="space-y-6">
                
                {/* Alerta Importante */}
                {/* Alerta Importante */}
                <div className="bg-[#1A1A1A] border border-[#FF9800]/50 rounded-2xl p-5 flex flex-col items-center text-center shadow-[0_0_20px_rgba(255,152,0,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF9800] to-transparent opacity-50"></div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#FF9800]" />
                    <span className="text-[#FF9800] font-black tracking-widest uppercase text-sm">Importante</span>
                  </div>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed">Tu cupo <strong className="text-white">NO</strong> está asegurado<br/>hasta completar el pago.</p>
                </div>

                {/* Comprobante de Pago */}
                <div className="space-y-4 pt-4 lg:pt-0 pb-6">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2">
                    <span className="text-[#E60000]">💰</span> 5. Comprobante de Pago
                  </Label>
                </div>
                
                <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-[#B0B0B0] font-medium uppercase tracking-wider">Costo (11 May - 15 May)</span>
                      <span className="text-xl text-[#E60000] font-black tracking-wider shadow-[#E60000]/20">$350.000</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="bg-[#121212] p-4 rounded-xl border border-[#2A2A2A] flex flex-col items-center gap-4 text-xs text-[#B0B0B0]">
                      <div className="shrink-0 bg-white p-2.5 rounded-2xl shadow-[0_0_20px_rgba(230, 0, 0,0.15)]">
                        <img src="/sponsors/QR BANCOLOMBIA.jpg" alt="QR Bancolombia" className="w-36 h-36 md:w-40 md:h-40 object-contain rounded-xl" />
                      </div>
                      <div className="flex-1 text-center w-full">
                        <p className="font-black text-white mb-3 text-sm uppercase tracking-widest border-b border-[#2A2A2A] pb-3">Ahorros Bancolombia</p>
                        <ul className="space-y-1.5 font-mono text-[#B0B0B0] pt-1">
                          <li className="text-xl text-[#E60000] font-bold tracking-wider">316-376847-80</li>
                          <li className="text-[10px] text-[#424242] uppercase font-sans tracking-wide mt-2">Titular: <span className="text-[#B0B0B0]">Daniela Rojas Valencia</span></li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-[#121212] p-4 rounded-xl border border-[#2A2A2A] text-center">
                      <p className="font-bold text-[#424242] uppercase tracking-wide text-[10px] mb-1">Pago por LLAVE</p>
                      <p className="text-lg font-mono text-[#B0B0B0] font-bold tracking-wider">1214720768</p>
                    </div>
                  </div>

                  <Label className="text-white text-xs font-bold flex items-center gap-2 mb-3">
                    <UploadCloud className="text-[#E60000] w-4 h-4" /> Sube tu Comprobante <span className="text-[#E60000]">*</span>
                  </Label>
                  
                  <div onClick={() => openOptions('comprobante')} className={`border-2 border-dashed border-[#2A2A2A] bg-[#121212] py-6 rounded-xl text-center hover:border-[#E60000]/50 transition-all cursor-pointer hover:bg-[#1A1A1A] ${comprobantePago ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.1)]' : ''}`}>
                    <div className="flex flex-col items-center px-4 pointer-events-none">
                      {comprobantePago ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-[#E60000]" />
                          <span className="text-sm font-bold text-[#E60000] truncate w-full px-2">{comprobantePago.name}</span>
                          <span className="text-[10px] text-[#B0B0B0] mt-1 uppercase font-bold tracking-widest">Subido Exitosamente</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-[#424242]" />
                          <span className="text-xs font-semibold text-[#B0B0B0]">Seleccionar imagen o PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Ayuda WhatsApp */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <p className="text-white font-bold mb-1 text-sm">¿Problemas con el pago?</p>
                  <p className="text-[#B0B0B0] text-[10px] mb-4">Comunícate a nuestro canal oficial de WhatsApp</p>
                  <a href="https://wa.me/573044347740" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#121212] border border-[#E60000]/30 hover:bg-[#E60000]/10 transition-colors p-4 rounded-xl group cursor-pointer shadow-[0_0_10px_rgba(230, 0, 0,0.05)]">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6 text-[#E60000] group-hover:scale-110 transition-transform" />
                      <span className="text-[#E60000] font-bold text-lg tracking-wider">304 434 7740</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#E60000]/50 group-hover:text-[#E60000] transition-colors" />
                  </a>
                </div>

                {/* Graphic Footer */}
                <div className="relative rounded-2xl overflow-hidden border border-[#2A2A2A] bg-[#121212] shadow-2xl mt-0">
                  {/* Background Image Oscurecida */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity"
                    style={{ backgroundImage: "url('/sponsors/Screenshot 2026-04-24 175445.png')" }}
                  ></div>
                  {/* Gradient overlay to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
                  
                  <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 bg-[#FF9800]/10 rounded-full flex items-center justify-center border border-[#FF9800]/20 shadow-[0_0_30px_rgba(255,152,0,0.15)]">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <p className="text-[#B0B0B0] text-xs md:text-sm leading-relaxed mb-6 max-w-[280px]">
                      Gracias por ser parte de la <span className="text-white font-bold">Copa Stunt Colombia 2026</span>, el evento que impulsa el talento, la disciplina y la pasión por el stunt a nivel nacional e internacional.
                    </p>
                    <div className="inline-block bg-[#1A1A1A]/80 backdrop-blur-md border border-[#FF9800]/30 px-6 py-2 rounded-lg shadow-[0_0_15px_rgba(255,152,0,0.1)]">
                      <p className="text-[#FF9800] font-black tracking-widest text-sm uppercase">
                        🔥 Nos vemos en la pista. 🔥
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="mt-12 mb-16 max-w-2xl mx-auto">
              <Button type="submit" disabled={isLoading} className="bg-[#E60000] text-black hover:bg-[#E60000]/90 font-black h-16 w-full text-sm md:text-base shadow-[0_0_20px_rgba(230, 0, 0,0.4)] transition-all uppercase tracking-wider rounded-2xl">
                {isLoading ? "GUARDANDO..." : "CONFIRMACIÓN"}
                {!isLoading && <ChevronRight className="w-6 h-6 ml-2" />}
              </Button>
              <div className="flex items-center justify-center gap-2 mt-4 text-[#424242] text-[10px] uppercase font-bold tracking-widest mb-10">
                <Lock className="w-3 h-3" />
                Tu información está segura con nosotros.
              </div>
            </div>

          </form>
        )}

        {/* PASO 3: ÉXITO / ESTADOS FINALES */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center p-5 sm:p-8 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto w-full mt-4 sm:mt-8">
            
            {documentosRechazados.length > 0 && estadoPago !== 'rechazado' && (
              <div className="w-full bg-red-500/10 border border-red-500/60 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col items-center text-center shadow-[0_0_30px_rgba(239,68,68,0.25)] relative overflow-hidden">
                {/* Glow sutil de fondo */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <h3 className="text-base sm:text-lg font-black text-red-500 uppercase tracking-widest mb-1">Documentos por Corregir</h3>
                <p className="text-zinc-300 text-[11px] sm:text-sm mb-4">
                  Tienes documentos pendientes por corregir. Debes volver a subirlos para validarlos.
                </p>
                <Button 
                  onClick={() => setCorrectionDialogOpen(true)} 
                  className="bg-red-600 text-white hover:bg-red-500 font-bold uppercase tracking-widest w-full shadow-[0_0_15px_rgba(239,68,68,0.4)] h-10 sm:h-11 text-xs sm:text-sm"
                >
                  Ir a corregirlos
                </Button>
              </div>
            )}

            {estadoPago === 'rechazado' && (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Pago Rechazado</h2>
                <p className="text-zinc-400 text-center mb-6">
                  Lo sentimos, tu comprobante de pago no fue aceptado. Esto puede suceder si la imagen no es legible, el monto es incorrecto o si no corresponde a los datos bancarios.
                  <br/><br/>
                  Por favor, sube un comprobante válido para asegurar tu cupo.
                </p>

                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full border-[#E60000]/50 text-[#E60000] hover:bg-[#E60000] hover:text-black uppercase tracking-widest text-xs font-bold h-12 transition-colors flex items-center justify-between px-4 mb-4"
                >
                  MÉTODOS DE PAGO
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="w-full bg-[#1A1A1A] p-5 rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] mb-6">
                  <Label className="text-white text-xs font-bold flex items-center gap-2 mb-3">
                    <UploadCloud className="text-[#E60000] w-4 h-4" /> Nuevo Comprobante <span className="text-[#E60000]">*</span>
                  </Label>
                  <div onClick={() => { setComprobantePago(null); openOptions('comprobante'); }} className={`border-2 border-dashed border-[#2A2A2A] bg-[#121212] py-6 rounded-xl text-center hover:border-[#E60000]/50 transition-all cursor-pointer hover:bg-[#1A1A1A] ${comprobantePago ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.1)]' : ''}`}>
                    <div className="flex flex-col items-center px-4 pointer-events-none">
                      {comprobantePago ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-[#E60000]" />
                          <span className="text-sm font-bold text-[#E60000] truncate w-full px-2">{comprobantePago.name}</span>
                          <span className="text-[10px] text-[#B0B0B0] mt-1 uppercase font-bold tracking-widest">Listo para enviar</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-[#424242]" />
                          <span className="text-xs font-semibold text-[#B0B0B0]">Seleccionar imagen o PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                  {comprobantePago && comprobantePago.name !== 'Comprobante Guardado' && (
                    <Button 
                      onClick={handlePaymentSubmit} 
                      disabled={isLoading}
                      className="w-full bg-[#E60000] text-black hover:bg-[#E60000]/90 h-12 font-bold mt-4 uppercase tracking-wider rounded-xl"
                    >
                      {isLoading ? "Enviando..." : "Enviar Comprobante"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Link href="/profile" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12">
                      Salir por ahora
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {estadoPago === 'saldo_pendiente' && (
              <>
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                  <AlertCircle className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Saldo Pendiente</h2>
                <p className="text-zinc-400 text-center mb-4">
                  Tu inscripción tiene un saldo pendiente de pago. 
                  Para completar tu inscripción y asegurar tu cupo, debes realizar el pago por el monto restante.
                </p>
                {saldoFaltante && (
                  <div className="w-full bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6 flex flex-col items-center">
                    <span className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-1">Valor Reportado</span>
                    <span className="text-2xl text-white font-black">
                      {isNaN(parseInt(saldoFaltante.replace(/\D/g, ''))) 
                        ? saldoFaltante 
                        : `$ ${parseInt(saldoFaltante.replace(/\D/g, '')).toLocaleString('es-CO')}`}
                    </span>
                    {motivoSaldoFaltante && (
                      <div className="mt-3 pt-3 border-t border-orange-500/20 w-full text-center">
                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block mb-1">Motivo / Observación</span>
                        <p className="text-sm text-zinc-300 italic">"{motivoSaldoFaltante}"</p>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full border-[#E60000]/50 text-[#E60000] hover:bg-[#E60000] hover:text-black uppercase tracking-widest text-xs font-bold h-12 transition-colors flex items-center justify-between px-4 mb-4"
                >
                  MÉTODOS DE PAGO
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="w-full bg-[#1A1A1A] p-5 rounded-2xl border border-orange-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] mb-6">
                  <Label className="text-white text-xs font-bold flex items-center gap-2 mb-3">
                    <UploadCloud className="text-[#E60000] w-4 h-4" /> Comprobante de Saldo <span className="text-[#E60000]">*</span>
                  </Label>
                  <div onClick={() => { setComprobantePago(null); openOptions('comprobante'); }} className={`border-2 border-dashed border-[#2A2A2A] bg-[#121212] py-6 rounded-xl text-center hover:border-[#E60000]/50 transition-all cursor-pointer hover:bg-[#1A1A1A] ${comprobantePago ? 'border-[#E60000] bg-[#E60000]/5 shadow-[0_0_15px_rgba(230, 0, 0,0.1)]' : ''}`}>
                    <div className="flex flex-col items-center px-4 pointer-events-none">
                      {comprobantePago ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-[#E60000]" />
                          <span className="text-sm font-bold text-[#E60000] truncate w-full px-2">{comprobantePago.name}</span>
                          <span className="text-[10px] text-[#B0B0B0] mt-1 uppercase font-bold tracking-widest">Listo para enviar</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-[#424242]" />
                          <span className="text-xs font-semibold text-[#B0B0B0]">Seleccionar imagen o PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                  {comprobantePago && comprobantePago.name !== 'Comprobante Guardado' && (
                    <Button 
                      onClick={handlePaymentSubmit} 
                      disabled={isLoading}
                      className="w-full bg-[#E60000] text-black hover:bg-[#E60000]/90 h-12 font-bold mt-4 uppercase tracking-wider rounded-xl"
                    >
                      {isLoading ? "Enviando..." : "Enviar Comprobante"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Link href="/profile" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12">
                      Salir por ahora
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {estadoPago === 'rechazado_saldo' && (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Saldo Rechazado</h2>
                <p className="text-zinc-400 text-center mb-4">
                  El comprobante de saldo que subiste fue rechazado.
                </p>
                
                {saldoFaltante && (
                  <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex flex-col items-center">
                    <span className="text-xs text-red-500 font-bold uppercase tracking-widest mb-1">Pago Requerido</span>
                    <span className="text-2xl text-white font-black">
                      {isNaN(parseInt(saldoFaltante.replace(/\D/g, ''))) 
                        ? saldoFaltante 
                        : `$ ${parseInt(saldoFaltante.replace(/\D/g, '')).toLocaleString('es-CO')}`}
                    </span>
                    {motivoSaldoFaltante && (
                      <div className="mt-3 pt-3 border-t border-red-500/20 w-full text-center">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest block mb-1">Motivo del Rechazo</span>
                        <p className="text-sm text-zinc-300 italic">"{motivoSaldoFaltante}"</p>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full border-[#E60000]/50 text-[#E60000] hover:bg-[#E60000] hover:text-black uppercase tracking-widest text-xs font-bold h-12 transition-colors flex items-center justify-between px-4 mb-4"
                >
                  MÉTODOS DE PAGO
                  <ChevronRight className="w-5 h-5" />
                </Button>

                <div className="w-full bg-[#1A1A1A] p-5 rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] mb-6">
                  <Label className="text-white text-xs font-bold flex items-center gap-2 mb-3">
                    <UploadCloud className="text-red-500 w-4 h-4" /> Nuevo Comprobante <span className="text-red-500">*</span>
                  </Label>
                  <div onClick={() => { setComprobantePago(null); openOptions('comprobante'); }} className={`border-2 border-dashed border-[#2A2A2A] bg-[#121212] py-6 rounded-xl text-center hover:border-red-500/50 transition-all cursor-pointer hover:bg-[#1A1A1A] ${comprobantePago ? 'border-red-500 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''}`}>
                    <div className="flex flex-col items-center px-4 pointer-events-none">
                      {comprobantePago ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-[#E60000]" />
                          <span className="text-sm font-bold text-[#E60000] truncate w-full px-2">{comprobantePago.name}</span>
                          <span className="text-[10px] text-[#B0B0B0] mt-1 uppercase font-bold tracking-widest">Listo para enviar</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-[#424242]" />
                          <span className="text-xs font-semibold text-[#B0B0B0]">Seleccionar imagen o PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                  {comprobantePago && comprobantePago.name !== 'Comprobante Guardado' && (
                    <Button 
                      onClick={handlePaymentSubmit} 
                      disabled={isLoading}
                      className="w-full bg-red-600 text-white hover:bg-red-500 h-12 font-bold mt-4 uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      {isLoading ? "Enviando..." : "Reenviar Comprobante"}
                    </Button>
                  )}
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Link href="/profile" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12">
                      Salir por ahora
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {(estadoPago === 'en_revision' || estadoPago === 'revision_saldo') && (
              <>
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                  <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
                  {estadoPago === 'revision_saldo' ? 'Saldo en Validación' : 'Pago en Validación'}
                </h2>
                <p className="text-zinc-400 text-center mb-8">
                  {estadoPago === 'revision_saldo' 
                    ? "Hemos recibido el comprobante de tu saldo faltante. Nuestro equipo lo revisará en breve." 
                    : "Hemos recibido tu comprobante de pago. Nuestro equipo lo revisará en breve."}
                  <br/><br/>
                  Vuelve a ingresar a esta sección más tarde para ver tu código QR de acceso oficial.
                </p>
                <Link href="/profile" className="w-full">
                  <Button className="w-full bg-zinc-800 text-white hover:bg-zinc-700 h-12">
                    Ir a mi perfil
                  </Button>
                </Link>
              </>
            )}

            {(estadoPago === 'aprobado' || estadoPago === 'pago_dia_evento') && (
              <>
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl mb-8 flex flex-col items-center" style={{ transform: 'scale(1.15)', transformOrigin: 'top center', margin: '20px auto 60px auto', maxWidth: '400px', width: '100%' }}>
                  <div className="panel-header font-display w-full" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 10px', borderBottom: 'none' }}>
                    <img 
                      src={activeEventObj?.logo || "/sponsors/stuntday3.png"} 
                      alt={activeEventObj ? `${activeEventObj.title} Logo` : "Event Logo"} 
                      style={{ height: '90px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' }} 
                    />
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '100%' }}>
                    <div style={{ width: '100%', padding: '0 10px' }}>
                      <div style={{ fontSize: '0.9rem', color: '#00cfff', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, textAlign: 'center', marginBottom: '10px' }}>
                        PUNTAJE VÁLIDA {activeEventObj ? activeEventObj.title : ''} {(() => {
                          const getMappedCategory = (c: string) => {
                            let f = String(c).toUpperCase().trim();
                            if (f.includes('ALTO') || f === 'CATEGORIA NITROX' || f === 'NITROX') return 'NITROX';
                            if (f === '2T') return '2 TIEMPOS';
                            if (f === '4T') return '4 TIEMPOS';
                            return f;
                          };
                          return getMappedCategory(categorias[activeCategoryIndex] || 'N/A');
                        })()}
                      </div>
                      
                      {categorias.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                          {categorias.map((cat, idx) => {
                            const getMappedCategory = (c: string) => {
                              let f = String(c).toUpperCase().trim();
                              if (f.includes('ALTO') || f === 'CATEGORIA NITROX' || f === 'NITROX') return 'NITROX';
                              if (f === '2T') return '2 TIEMPOS';
                              if (f === '4T') return '4 TIEMPOS';
                              return f;
                            };
                            return (
                              <button
                                key={cat}
                                onClick={() => setActiveCategoryIndex(idx)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategoryIndex === idx ? 'bg-[#E60000]/10 text-[#E60000] border border-[#E60000] shadow-[0_0_10px_rgba(230, 0, 0,0.2)]' : 'bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a] hover:text-white hover:border-[#444]'}`}
                              >
                                {getMappedCategory(cat)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {totalPilotos > 0 && (
                          <span style={{ color: '#00cfff', textShadow: '0 0 10px rgba(0,207,255,0.5)', fontWeight: 900, fontSize: '1.2rem' }}>
                            POSICIÓN: {puesto}/{totalPilotos}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--accent-green)', textShadow: '0 0 20px var(--accent-green-glow)', fontFamily: 'Orbitron, sans-serif', textAlign: 'center', lineHeight: '1' }}>
                      {puntaje} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>PTS</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setIsLeaderboardOpen(true)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(0, 207, 255, 0.1)',
                          border: '1px solid #00cfff',
                          color: '#00cfff',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          textShadow: '0 0 5px rgba(0, 207, 255, 0.5)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 207, 255, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 207, 255, 0.1)'}
                      >
                        🏆 TABLA
                      </button>

                      {observacionesList.length > 0 && (
                        <button 
                          onClick={() => setIsObservacionesOpen(true)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(230, 0, 0, 0.1)',
                            border: '1px solid var(--accent-green)',
                            color: 'var(--accent-green)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(230, 0, 0, 0.2)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(230, 0, 0, 0.1)'}
                        >
                          👁️ OBSERVACIONES
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
                  <DialogContent className="bg-[#121212] border border-[#2A2A2A] sm:max-w-md rounded-2xl p-6 custom-scrollbar overflow-x-hidden" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black text-white text-center mb-4 font-display flex items-center justify-center gap-2">
                        <Trophy className="text-[#00cfff] w-8 h-8" />
                        TABLA DE POSICIONES
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                      {leaderboard.map((pilot, idx) => (
                        <div 
                          key={pilot.uid}
                          id={`pilot-${pilot.uid}`}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${pilot.uid === uid ? 'border-[#E60000] bg-[#E60000]/10' : 'border-[#2A2A2A] bg-[#1A1A1A]'} relative`}
                        >
                          <div className="font-black text-xl text-white w-8 text-center shrink-0">{idx + 1}</div>
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0">
                            {pilot.photoUrl ? (
                              <img src={pilot.photoUrl} alt={pilot.name} className="w-full h-full object-cover shrink-0" />
                            ) : (
                              <div className="w-full h-full bg-zinc-800 flex items-center justify-center shrink-0">👤</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-bold text-white truncate text-sm">{pilot.name}</div>
                            <div className="text-xs text-zinc-400">#{pilot.number}</div>
                          </div>
                          <div className="font-black text-lg text-[#E60000] shrink-0">{pilot.totalScore}</div>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <div className="text-center text-zinc-500 py-8">Aún no hay pilotos en esta categoría</div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isObservacionesOpen} onOpenChange={setIsObservacionesOpen}>
                  <DialogContent className="bg-[#121212] border border-[#2A2A2A] sm:max-w-md rounded-2xl p-6 custom-scrollbar overflow-x-hidden" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black text-white text-center mb-4 font-display flex items-center justify-center gap-2">
                        👁️ OBSERVACIONES
                      </DialogTitle>
                      <DialogDescription className="text-center text-zinc-400 mb-4">
                        Comentarios y sugerencias de los jueces sobre tu presentación.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                      {observacionesList.map((obs, idx) => (
                        <div key={idx} className="bg-[#1A1A1A] border border-zinc-800 p-4 rounded-xl">
                          <div className="font-bold text-[#00cfff] text-xs mb-2 uppercase flex items-center gap-2">
                            <Star className="w-4 h-4" /> Juez: {obs.judgeId}
                          </div>
                          <p className="text-zinc-300 text-sm whitespace-pre-wrap">{obs.text}</p>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
          </div>
        )}

        {step === 3 && (estadoPago === 'aprobado' || estadoPago === 'pago_dia_evento') && (
          <div className="mt-8 w-full max-w-5xl mx-auto">
            <SocialMediaCard 
              pilotId={`${selectedEvent}_${uid}`}
              pilotName={`${nombres} ${apellidos}`}
              pilotPseudonym={seudonimo}
              pilotCategory={categorias.join(' / ')}
              pilotCity={ciudad}
              pilotPhotoUrl={fotoDeportista?.url || ''}
              initialConfig={templateConfig}
              isAdmin={true}
              onSaveSuccess={refetchRegistrationData}
            />
            <div className="flex justify-center mt-6">
              <Button 
                onClick={() => openOptions('deportista')}
                className="bg-zinc-800 text-white hover:bg-zinc-700 font-bold px-8 h-12"
              >
                Editar Foto
              </Button>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Modals para Cámara y Opciones de Archivo */}
      <CameraModal 
        isOpen={cameraOpen} 
        onClose={() => setCameraOpen(false)} 
        onCapture={(file) => {
          handleFileFromDialog(file);
        }} 
        title={currentDocKey === 'id' ? 'Documento (Doble Cara)' : 'Capturar Documento'}
        isDeportista={currentDocKey === 'deportista'}
        mode={currentDocKey === 'id' ? 'double' : 'single'}
      />

      <Dialog open={optionsModalOpen} onOpenChange={setOptionsModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Subir Documento</DialogTitle>
            <DialogDescription className="text-zinc-400">
              ¿Cómo deseas adjuntar este archivo?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => { 
              setOptionsModalOpen(false); 
              setTimeout(() => setCameraOpen(true), 100); 
            }} className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white flex items-center justify-start gap-3 rounded-xl">
              <Camera className="w-5 h-5 text-red-600" />
              <span className="font-bold">Tomar Foto</span>
            </Button>
            <div className="relative">
              <Input type="file" id="dialog-file" onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file) handleFileFromDialog(file);
              }} className="hidden" accept=".pdf,image/*" />
              <Label htmlFor="dialog-file" className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white flex items-center justify-start gap-3 rounded-xl cursor-pointer px-4">
                <UploadCloud className="w-5 h-5 text-red-600" />
                <span className="font-bold">Subir Archivo / PDF</span>
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sponsors Modal */}
      <Dialog open={sponsorsModalOpen} onOpenChange={setSponsorsModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#050505] border border-zinc-800 p-5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-white text-base font-black uppercase tracking-wider text-center flex flex-col items-center gap-1">
              <Instagram className="w-8 h-8 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
              SÍGUENOS EN INSTAGRAM
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-center text-[11px] mt-1 font-medium">
              Para asegurar tu cupo es obligatorio seguir a nuestros patrocinadores oficiales. Haz clic en cada uno para apoyarlos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2 my-2">
            <a href="https://www.instagram.com/nitrox.repuestos/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-600">
              <div className="w-10 h-10 bg-black rounded-lg border border-[#222] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/Nitrox Blanco.png" alt="Nitrox" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">@nitrox.repuestos</span>
            </a>
            
            <a href="https://www.instagram.com/paskinesstunt/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-600">
              <div className="w-10 h-10 bg-black rounded-lg border border-[#222] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">@paskinesstunt</span>
            </a>
            
            <a href="https://www.instagram.com/autecotrakku/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-600">
              <div className="w-10 h-10 bg-black rounded-lg border border-[#222] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/Trakku.png" alt="Auteco Trakku" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">@autecotrakku</span>
            </a>
            
            <a href="https://www.instagram.com/copastuntcolombia/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-600">
              <div className="w-10 h-10 bg-black rounded-lg border border-[#222] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/Copa Stunt Nitrox Blanco.png" alt="Copa Stunt" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">@copastuntcolombia</span>
            </a>
            
            <a href="https://www.instagram.com/feria2ruedasoficial/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 transition-colors border border-zinc-800 hover:border-zinc-600">
              <div className="w-10 h-10 bg-black rounded-lg border border-[#222] flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/stunt2026negro.jpeg" alt="Feria 2 Ruedas" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-white font-bold tracking-wide">@feria2ruedasoficial</span>
            </a>
          </div>

          <Button 
            className="w-full bg-[#E60000] text-black hover:bg-[#2CE50F] hover:scale-[1.02] transition-all font-black uppercase tracking-wider h-12 mt-1 rounded-xl text-xs shadow-[0_0_15px_rgba(230, 0, 0,0.3)]"
            onClick={() => {
              setPatrocinadores(true);
              setSponsorsModalOpen(false);
            }}
          >
            CONFIRMO QUE YA LOS SIGO
          </Button>
        </DialogContent>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-zinc-950 border border-red-500/30 p-4 sm:p-5 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.15)] text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-white text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Documentos por Corregir
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2 sm:mt-4">
            {[
              { key: 'id', state: idPdf, title: "Documento de identificación por ambos lados", desc: "Solo Foto (Frente y Reverso)" },
              { key: 'placa', state: fotoPlaca, title: "Foto de la placa (Tu motocicleta)", desc: "Obligatorio" },
              { key: 'propiedad', state: fotoPropiedad, title: "Foto/PDF Tarjeta de propiedad", desc: "Claro y legible" },
              { key: 'soat', state: fotoSoat, title: "Fotografía del SOAT vigente", desc: "Vigente para la fecha" },
              { key: 'deportista', state: fotoDeportista, title: "Foto tuya (Tipo Cédula o Carnet)", desc: "Fondo blanco o azul", isDeportista: true }
            ].filter(item => documentosRechazados.includes(item.key)).map((item: any) => (
              <div key={item.key} onClick={() => { if (!(item.isDeportista && isDetectingFace)) { setCorrectionDialogOpen(false); setTimeout(() => openOptions(item.key), 350); } }} className={`relative bg-[#1A1A1A] border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:border-red-400 transition-all overflow-hidden cursor-pointer hover:bg-[#121212]`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 border bg-red-500/10 border-red-500/30">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0 pointer-events-none">
                  <p className="text-[11px] sm:text-xs font-bold leading-tight truncate text-red-400">{item.title}</p>
                  <p className="text-[9px] sm:text-[10px] text-red-500 font-bold">RECHAZADO - Subir de nuevo</p>
                </div>
                <div className="shrink-0 z-20 pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-md">
                    <span className="text-red-500 text-[9px] sm:text-[10px] font-bold uppercase hidden sm:inline-block">Corregir</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] bg-[#121212] border-2 border-[#E60000] shadow-[0_0_30px_rgba(230, 0, 0,0.3)] text-white p-0 overflow-hidden rounded-2xl z-[100]">
          <DialogHeader className="p-4 pb-2 border-b border-[#2A2A2A]/50 bg-black/40">
            <DialogTitle className="text-lg md:text-xl font-black uppercase text-[#E60000] tracking-wider flex items-center justify-center gap-2">
              <span className="text-xl md:text-2xl">💰</span> Detalles de Pago
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-4 max-h-[90vh] overflow-hidden">
            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-[#B0B0B0] font-medium uppercase tracking-wider">Costo (11 May - 15 May)</span>
                  <span className="text-lg text-[#E60000] font-black tracking-wider shadow-[#E60000]/20">$350.000</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-[#121212] p-3 rounded-xl border border-[#2A2A2A] flex flex-row items-center gap-4 text-xs text-[#B0B0B0]">
                  <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-[0_0_20px_rgba(230, 0, 0,0.15)]">
                    <img src="/sponsors/QR BANCOLOMBIA.jpg" alt="QR Bancolombia" className="w-20 h-20 object-contain rounded-md" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-white mb-1.5 text-[10px] md:text-xs uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5">Ahorros Bancolombia</p>
                    <ul className="space-y-0.5 font-mono text-[#B0B0B0]">
                      <li className="text-sm md:text-base text-[#E60000] font-bold tracking-wider">316-376847-80</li>
                      <li className="text-[8px] md:text-[9px] text-[#424242] uppercase font-sans tracking-wide">Titular: <span className="text-[#B0B0B0]">Daniela Rojas Valencia</span></li>
                    </ul>
                  </div>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#2A2A2A] flex items-center justify-between px-4">
                  <p className="font-bold text-[#424242] uppercase tracking-wide text-[10px]">Pago por LLAVE</p>
                  <p className="text-sm md:text-base font-mono text-[#B0B0B0] font-bold tracking-wider">1214720768</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="w-full bg-[#E60000] hover:bg-[#00C853] text-black font-black uppercase tracking-wider h-12 rounded-xl shadow-[0_0_15px_rgba(230, 0, 0,0.2)]"
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
