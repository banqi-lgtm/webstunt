'use client';

import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { Shield, Settings, Globe, MapPin, Calendar, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, Ticket, ScrollText, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoginState, setIsLoginState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      setIsLoginState(true);
    }
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#080808] text-zinc-200 selection:bg-[#00FF00] selection:text-black font-body flex flex-col">
      {/* Background Texture (Industrial Metal/Carbon vibe) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0A0A0A] to-[#050505] z-0"></div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M0 0h20v20H0z%22 fill=%22%23000%22 fill-opacity=%220.05%22/%3E%3Cpath d=%22M0 0l20 20M20 0L0 20%22 stroke=%22%23fff%22 stroke-opacity=%220.05%22 stroke-width=%221%22/%3E%3C/svg%3E")' }}></div>
      
      {/* Navigation Header */}
      <nav className="w-full relative z-50 px-6 py-3 flex items-center justify-between max-w-[1800px] mx-auto drop-shadow-2xl flex-shrink-0">
        <div className="flex items-center">
          <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-6 md:h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </a>
        </div>
        
        <div className="flex bg-[#111111]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <Button 
            onClick={() => { 
              setIsLoginState(false); 
              window.location.hash = ''; 
            }} 
            className={`rounded-lg px-6 h-9 font-bold transition-all duration-300 ${!isLoginState ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-[#2CE50F] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]' : 'bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            Inscripción
          </Button>
          <Button 
            onClick={() => { 
              setIsLoginState(true); 
              window.location.hash = '#login'; 
            }} 
            className={`rounded-lg px-6 h-9 font-bold transition-all duration-300 ${isLoginState ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-[#2CE50F] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]' : 'bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            Iniciar Sesión
          </Button>
        </div>
      </nav>

      {/* Main Layout Container: 3 Asymmetric Parts (Hero, Value, Form) */}
      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col lg:flex-row relative z-10 px-4 md:px-8 pb-10 lg:pb-12 gap-8 lg:gap-12 mt-4">
        
        {/* LEFT COLUMN: Hero & Value (Approx 60%) */}
        <div className="w-full lg:w-[60%] flex flex-col relative gap-8">
          
          {/* HERO IMAGE BACKGROUND (Absolute to left column) */}
          <div className="absolute top-[-5%] left-[-5%] w-[120%] h-[110%] z-[-1] opacity-40 pointer-events-none" 
               style={{ WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)', maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)' }}>
            <div className="w-full h-full" style={{ WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)' }}>
              <div 
                className="w-full h-full bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: "url('/sponsors/fondo.png')" }}
              ></div>
            </div>
          </div>

          {/* HERO CONTENT */}
          <div className="relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mt-2 lg:mt-6">
            <h1 className="flex flex-col font-headline font-black uppercase italic leading-[0.85] tracking-tighter drop-shadow-2xl">
              <span className="text-white text-6xl md:text-7xl lg:text-[6rem] drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]">COPA STUNT</span>
              <span className="text-[#39FF14] text-6xl md:text-7xl lg:text-[6rem] drop-shadow-[0_0_30px_rgba(57,255,20,0.4)]">F2R - NITROX</span>
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mt-6 ml-1">
              <p className="text-zinc-400 font-medium text-[10px] md:text-xs uppercase tracking-[0.2em] max-w-[250px]">
                El campeonato de stunt más importante del país
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-5 ml-1">
              <div className="flex items-center gap-2 text-[#00FF00]">
                <MapPin className="w-4 h-4" />
                <span className="text-white font-bold tracking-widest text-xs uppercase">MEDELLÍN</span>
              </div>
              <div className="h-4 w-px bg-zinc-700"></div>
              <div className="flex items-center gap-2 text-[#00FF00]">
                <Calendar className="w-4 h-4" />
                <span className="text-white font-bold tracking-widest text-xs uppercase">21 AL 24 DE MAYO</span>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-[#111] to-transparent border-l-4 border-[#00FF00] pl-5 py-3">
              <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-widest italic">
                AQUÍ SE DEFINE EL <span className="text-[#00FF00]">NIVEL</span> DEL STUNT EN COLOMBIA
              </h3>
            </div>
          </div>

          {/* VALUE MODULE (Cards Row) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Card 1: Precio */}
            <div className="bg-[#111111]/90 backdrop-blur-md border border-[#222] rounded-xl p-4 lg:p-5 relative overflow-hidden group hover:border-[#FFB700]/50 transition-all duration-300 flex flex-col justify-center">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFB700] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-2 mb-2 text-[#00FF00]">
                <Ticket className="w-4 h-4" strokeWidth={2} />
                <span className="font-bold text-[10px] uppercase tracking-widest">INSCRIPCIÓN</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                $280.000
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:gap-2">
                <span className="text-[#00FF00] font-bold text-xs lg:text-sm drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">$350.000</span>
                <span className="text-zinc-500 text-[8px] lg:text-[9px] uppercase tracking-widest font-bold">EXTEMPORÁNEO</span>
              </div>
            </div>

            {/* Card 2: Incluye */}
            <div className="bg-[#111111]/90 backdrop-blur-md border border-[#222] rounded-xl p-4 lg:p-5 relative overflow-hidden group hover:border-[#00FF00]/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3 text-[#00FF00]">
                <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                <span className="font-bold text-[10px] uppercase tracking-widest">INCLUYE</span>
              </div>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF00] shrink-0" strokeWidth={2} />
                  <span className="text-xs text-zinc-300 font-medium">Acceso VIP a la feria</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF00] shrink-0" strokeWidth={2} />
                  <span className="text-xs text-zinc-300 font-medium">Participación oficial</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF00] shrink-0" strokeWidth={2} />
                  <span className="text-xs text-zinc-300 font-medium">Kit de patrocinadores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF00] shrink-0" strokeWidth={2} />
                  <span className="text-xs text-zinc-300 font-medium">Póliza deportiva integral</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Reglamento */}
            <div className="bg-[#111111]/90 backdrop-blur-md border border-[#222] rounded-xl p-4 lg:p-5 flex flex-col relative overflow-hidden group hover:border-zinc-500 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2 text-[#00FF00]">
                <ScrollText className="w-4 h-4" strokeWidth={2} />
                <span className="font-bold text-[10px] uppercase tracking-widest">REGLAMENTO</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4 flex-grow">
                Consulta normativas técnicas y reglas de comportamiento.
              </p>
              <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white uppercase tracking-widest text-[10px] font-bold h-9 mt-auto">
                VER REGLAMENTO
              </Button>
            </div>

          </div>

          {/* SPONSORS STRIP */}
          <div className="relative z-10 pt-8 pb-4 mt-auto flex flex-col gap-6 md:gap-8">
            {/* Prioritized Sponsors */}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Copa Stunt Nitrox Blanco.png" alt="Copa Stunt" className="h-14 md:h-20 lg:h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Nitrox Blanco.png" alt="Nitrox" className="h-12 md:h-16 lg:h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Mobil Blanco.png" alt="Mobil Super" className="h-12 md:h-16 lg:h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
            
            {/* Secondary Sponsors */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/copa stunt nitrox f2r.png" alt="F2R" className="h-10 md:h-12 lg:h-14 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Trakku.png" alt="Trakku" className="h-9 md:h-11 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/IRC Blanco.png" alt="IRC" className="h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Fedemoto.png" alt="Fedemoto" className="h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
            </div>

            {/* Redes Sociales A Color */}
            <div className="flex justify-center items-center gap-6 mt-6 md:mt-8 pb-4">
              <a href="https://instagram.com/copastuntcolombia" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(225,48,108,0.4)]">
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433"/>
                      <stop offset="25%" stopColor="#e6683c"/>
                      <stop offset="50%" stopColor="#dc2743"/>
                      <stop offset="75%" stopColor="#cc2366"/>
                      <stop offset="100%" stopColor="#bc1888"/>
                    </linearGradient>
                  </defs>
                  <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="https://facebook.com/copastuntcolombia" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(24,119,242,0.4)]">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  <path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.822c0-.949.465-1.874 1.956-1.874h1.514V5.006s-1.375-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.633H7.078v3.469h3.047v8.385a12.09 12.09 0 003.875 0v-8.385h2.671z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* FOOTER */}
          <footer className="relative z-10 w-full py-4 mt-2 flex justify-center border-t border-zinc-800/30">
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-widest font-bold text-center">
              © 2026 COPA STUNT COLOMBIA. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </footer>

        </div>

        {/* RIGHT COLUMN: PREMIUM FORM (Approx 40%) */}
        <div id="auth-form-section" className="w-full lg:w-[40%] flex-shrink-0 relative z-20 h-full flex flex-col justify-center">
          <AuthForm externalIsLogin={isLoginState} onToggleAuthMode={setIsLoginState} />
        </div>

      </div>
    </main>
  );
}
