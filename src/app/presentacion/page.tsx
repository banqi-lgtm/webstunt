'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'lucide-react';

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
  numeroIdentificacion: string;
  seudonimo: string;
  instagram: string;
  documentos: {
    deportistaUrl?: string;
  };
}

const SPONSOR_LOGOS = [
  { src: "/sponsors/Nitrox Blanco.png", alt: "Nitrox" },
  { src: "/sponsors/Mobil Blanco.png", alt: "Mobil Super" },
  { src: "/sponsors/PKS Blanco.png", alt: "PKS" },
  { src: "/sponsors/Trakku.png", alt: "Trakku" },
  { src: "/sponsors/IRC Blanco.png", alt: "IRC" },
];

export default function PresentacionPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>('f2r');
  const [selectedCategory, setSelectedCategory] = useState<string>('OPEN');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const eventParam = params.get('event') || 'f2r';
      const categoryParam = params.get('category') || 'OPEN';
      setSelectedEvent(eventParam);
      setSelectedCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedEvent, selectedCategory]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      
      usersSnap.forEach(doc => {
        usersMap.set(doc.id, doc.data());
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
              documentos: data.documentos || {}
            });
          }
        }
      });
      
      fetched.sort((a, b) => a.numeroIdentificacion.localeCompare(b.numeroIdentificacion));
      setRegistrations(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Agrupamiento y normalización de categorías
  const getGroupedByCategory = () => {
    const acc: Record<string, Registration[]> = {};
    registrations.forEach(reg => {
      let cats: string[] = [];
      if (Array.isArray(reg.categoria)) {
        cats = reg.categoria.map(c => String(c).toUpperCase().trim());
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
    });
    return acc;
  };

  const groupedByCategory = getGroupedByCategory();
  const presentationPilots = groupedByCategory[selectedCategory.toUpperCase()] || [];
  const firstPilot = presentationPilots[0];

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white flex flex-col p-4 sm:p-6 font-sans overflow-hidden justify-between relative">
      {/* Background tech grid effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
      
      {/* HEADER: TITLE & ALL SPONSORS (TODOS LOS PATROCINADORES ARRIBA) */}
      <header className="z-10 flex-none flex flex-col md:flex-row justify-between items-center border-b border-zinc-900 pb-3 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#22c55e] animate-pulse"></span>
          <h1 className="text-lg sm:text-2xl font-black tracking-widest uppercase text-white">
            Pilotos en Pista
          </h1>
          <span className="text-[10px] sm:text-xs font-bold bg-[#22c55e]/15 border border-[#22c55e]/30 px-2.5 py-0.5 rounded text-[#22c55e] uppercase tracking-widest font-mono">
            {selectedEvent === 'festival' ? 'Festival Stunt' : selectedEvent === 'nitrox' ? 'Copa Stunt Nitrox' : 'Copa Stunt F2R'} - {selectedCategory}
          </span>
        </div>
        
        {/* SPONSOR LOGOS AT THE TOP */}
        <div className="flex items-center gap-4 sm:gap-6 bg-zinc-900/30 px-4 py-1.5 rounded-full border border-zinc-900/60 max-w-full overflow-x-auto custom-scrollbar">
          <img src="/sponsors/patro.png" alt="Sponsors" className="h-6 sm:h-8 object-contain shrink-0 pr-2 border-r border-zinc-800" />
          {SPONSOR_LOGOS.map((logo, idx) => (
            <img 
              key={`top-logo-${idx}`} 
              src={logo.src} 
              alt={logo.alt} 
              className="h-5 sm:h-7 object-contain opacity-80 hover:opacity-100 transition-opacity shrink-0" 
            />
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center z-10">
          <div className="w-10 h-10 border-3 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* TWO COLUMN GRID LAYOUT: LEFT (PILOTS), RIGHT (PHOTO & INFO) */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10 mb-2">
          
          {/* LEFT COLUMN: TURN QUEUE LIST (FIRST 10 PILOTS, NO SCROLL) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950/80 rounded-2xl border border-zinc-900 p-4 shadow-xl">
            <div className="flex justify-between items-center text-zinc-500 uppercase tracking-widest text-[9px] font-bold border-b border-zinc-900 pb-1.5 mb-2">
              <span>PILOTO / TURNO</span>
              <span>CATEGORÍA / ID</span>
            </div>

            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0">
              {presentationPilots.slice(0, 10).map((pilot, idx) => {
                const isFirst = idx === 0;
                if (isFirst) {
                  // Linea Grande (Active Pilot)
                  return (
                    <div 
                      key={`pres-list-${pilot.id}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#22c55e] bg-[#22c55e]/5 shadow-[0_0_15px_rgba(34,197,94,0.15)] flex-1 min-h-[50px] items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#22c55e] text-black font-black font-mono text-xs flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0">
                          #1
                        </span>
                        <div className="min-w-0">
                          <p className="font-black text-white uppercase text-sm sm:text-base truncate leading-tight">
                            {pilot.nombres} {pilot.apellidos}
                          </p>
                          {pilot.seudonimo && (
                            <p className="text-[10px] text-zinc-400 font-bold capitalize leading-none mt-0.5">
                              "{pilot.seudonimo}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] bg-zinc-950 border border-zinc-900 text-zinc-400 px-2 py-0.5 rounded font-mono">
                          ID: {pilot.numeroIdentificacion?.slice(-4) || 'N/A'}
                        </span>
                        <span className="text-[10px] bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] font-black px-2 py-0.5 rounded animate-pulse uppercase tracking-widest">
                          En Pista
                        </span>
                      </div>
                    </div>
                  );
                } else {
                  // Linea Delgadita (Positions 2 to 10)
                  return (
                    <div 
                      key={`pres-list-${pilot.id}`}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg border border-zinc-900/60 bg-zinc-950/20 flex-1 min-h-[36px] items-center"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-zinc-900 text-zinc-400 font-bold font-mono text-[10px] flex items-center justify-center border border-zinc-800 shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-bold text-zinc-300 uppercase text-xs truncate">
                            {pilot.nombres} {pilot.apellidos}
                          </p>
                          {pilot.seudonimo && (
                            <p className="text-[9px] text-zinc-500 font-semibold capitalize hidden sm:inline">
                              ({pilot.seudonimo})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] bg-zinc-950/60 border border-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                          ID: {pilot.numeroIdentificacion?.slice(-4) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                }
              })}
              
              {presentationPilots.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-sm py-12">
                  No hay pilotos registrados en esta categoría.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE PILOT'S PHOTO & INFO (DONDE ESTA LA X) */}
          <div className="lg:col-span-5 flex flex-col justify-center items-center bg-zinc-950/80 rounded-2xl border border-zinc-900 p-6 shadow-xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col justify-center items-center gap-5 w-full">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-3.5 py-1 rounded-full">
                🏍️ Siguiente en Pista
              </span>
              
              {/* Glowing Photo frame */}
              <div className="relative w-44 h-44 sm:w-60 sm:h-60 rounded-full overflow-hidden border-4 border-[#22c55e] shadow-[0_0_35px_rgba(34,197,94,0.4)] bg-zinc-900 flex items-center justify-center shrink-0">
                {firstPilot?.documentos?.deportistaUrl ? (
                  <img 
                    src={firstPilot.documentos.deportistaUrl} 
                    alt={firstPilot.nombres}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-700 gap-2">
                    <User className="w-16 h-16 text-zinc-800" />
                  </div>
                )}
                <div className="absolute bottom-2 bg-[#22c55e] text-black font-black uppercase text-[9px] tracking-widest px-2.5 py-0.5 rounded-full shadow-lg">
                  En Pista
                </div>
              </div>

              <div className="space-y-1 w-full px-2">
                <h2 className="text-xl sm:text-3xl font-black uppercase text-white tracking-wide leading-tight truncate">
                  {firstPilot ? `${firstPilot.nombres} ${firstPilot.apellidos}` : 'Sin pilotos en pista'}
                </h2>
                {firstPilot?.seudonimo && (
                  <p className="text-base sm:text-lg font-black text-[#22c55e] capitalize">
                    "{firstPilot.seudonimo}"
                  </p>
                )}
                {firstPilot?.motocicleta && (
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    Moto: {firstPilot.motocicleta.marca || 'N/A'} {firstPilot.motocicleta.referencia || ''} | Placa: {firstPilot.motocicleta.placa || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
