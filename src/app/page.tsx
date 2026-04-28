'use client';

import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { Shield, Settings, Globe, MapPin, Calendar, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, Ticket, ScrollText, Flag, Check, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SPONSOR_LOGOS = [
  { src: "/sponsors/Copa Stunt Nitrox Blanco.png", alt: "Copa Stunt", className: "h-12 md:h-16 lg:h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] shrink-0" },
  { src: "/sponsors/Nitrox Blanco.png", alt: "Nitrox", className: "h-10 md:h-12 lg:h-16 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0" },
  { src: "/sponsors/Mobil Blanco.png", alt: "Mobil Super", className: "h-10 md:h-12 lg:h-16 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0" },
  { src: "/sponsors/PKS Blanco.png", alt: "PKS", className: "h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/copa stunt nitrox f2r.png", alt: "F2R", className: "h-10 md:h-12 lg:h-14 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/Trakku.png", alt: "Trakku", className: "h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/IRC Blanco.png", alt: "IRC", className: "h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" },
  { src: "/sponsors/Fedemoto.png", alt: "Fedemoto", className: "h-8 md:h-10 lg:h-12 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] shrink-0" }
];

export default function Home() {
  const [isLoginState, setIsLoginState] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      setIsLoginState(true);
    }
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black text-zinc-200 selection:bg-[#00FF00] selection:text-black font-body flex flex-col">
      
      {/* Navigation Header */}
      <nav className="w-full relative z-50 px-4 md:px-6 py-3 flex items-center justify-between max-w-[1800px] mx-auto drop-shadow-2xl flex-shrink-0">
        <div className="flex items-center shrink-0 mr-2">
          <a href="/" className="cursor-pointer transition-opacity hover:opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-5 md:h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </a>
        </div>
        
        <div className="flex bg-[#111111]/90 backdrop-blur-md p-1 md:p-1.5 rounded-xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <Button 
            onClick={() => { 
              setIsLoginState(false); 
              window.location.hash = ''; 
              document.getElementById('auth-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className={`rounded-lg px-3 md:px-6 h-7 md:h-9 text-[10px] md:text-sm font-bold transition-all duration-300 ${!isLoginState ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-[#2CE50F] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]' : 'bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            Inscripción
          </Button>
          <Button 
            onClick={() => { 
              setIsLoginState(true); 
              window.location.hash = '#login'; 
              document.getElementById('auth-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }} 
            className={`rounded-lg px-3 md:px-6 h-7 md:h-9 text-[10px] md:text-sm font-bold transition-all duration-300 ${isLoginState ? 'bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-[#2CE50F] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]' : 'bg-transparent text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          >
            Iniciar Sesión
          </Button>
        </div>
      </nav>

      {/* Main Layout Container */}
      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col relative z-10 px-4 md:px-8 pb-10 lg:pb-12 gap-8 lg:gap-12 mt-4">
        
        {/* TOP ROW: Hero/Value (Left) & Form (Right) */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full">

          {/* LEFT COLUMN: Hero & Value (Approx 60%) */}
          <div className="w-full lg:w-[60%] flex flex-col relative gap-8">

          {/* HERO CONTENT — Title + Moto image */}
          <div className="relative z-10 mt-2 lg:mt-6">
            {/* BACKGROUND EFFECTS & MOTO */}
            {/* BACKGROUND EFFECTS & MOTO */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
              {/* Subtle Green Neon Glow acting as a separator/highlight */}
              <div className="absolute top-[80px] right-[100px] md:right-[250px] w-[150px] md:w-[250px] h-[200px] md:h-[300px] bg-[#39FF14] opacity-[0.12] blur-[80px] rounded-full mix-blend-screen"></div>
              
              {/* Background Screenshot image — heavily faded on the left to leave the logo area completely clean */}
              <div className="absolute top-0 md:top-[-40px] right-[-80px] md:right-[-80px] w-[500px] h-[500px] md:w-[900px] md:h-[800px] opacity-70 md:opacity-90"
                   style={{ 
                     WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,1) 85%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)', 
                     WebkitMaskComposite: 'destination-in',
                     maskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,1) 85%), linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
                     maskComposite: 'intersect'
                   }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sponsors/Screenshot 2026-04-24 175445.png" alt="Stunt Rider Background" className="w-full h-full object-contain object-right" />
              </div>
            </div>
            {/* Title Logo replacing text title */}
            <div className="relative z-10 w-[180px] md:w-[240px] lg:w-[280px] mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/copa stunt nitrox f2r.png" alt="Copa Stunt Colombia F2R 2026" className="w-full h-auto object-contain" />
            </div>
            
            {/* Subtitle */}
            <div className="relative z-10 flex flex-col gap-1 mt-2">
              <h2 className="text-white font-bold text-xl md:text-2xl uppercase tracking-wide">
                EL CAMPEONATO DE STUNT
              </h2>
              <h2 className="text-[#FFB700] font-bold text-xl md:text-2xl uppercase tracking-wide drop-shadow-[0_0_8px_rgba(255,183,0,0.5)]">
                MÁS IMPORTANTE DEL PAÍS
              </h2>
            </div>

            {/* Location and Date */}
            <div className="relative z-10 flex flex-wrap items-start gap-8 mt-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-[#39FF14] mt-0.5" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-white font-bold tracking-wide text-sm uppercase">MEDELLÍN, COLOMBIA</span>
                  <span className="text-zinc-400 font-medium text-xs uppercase">PLAZA MAYOR</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-[#39FF14] mt-0.5" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-white font-bold tracking-wide text-sm uppercase">21 AL 24</span>
                  <span className="text-zinc-400 font-medium text-xs uppercase">MAYO 2026</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="relative z-10 mt-8 mb-6">
              <Button 
                onClick={() => { window.location.hash = '#login'; document.getElementById('auth-form-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-gradient-to-r from-[#FFB700] to-[#FFD500] text-black font-black uppercase tracking-widest text-sm md:text-base px-8 py-6 rounded-md hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,183,0,0.4)] flex items-center gap-3 w-fit"
              >
                ¡INSCRÍBETE AHORA!
                <ChevronRight className="w-5 h-5" strokeWidth={3} />
              </Button>
            </div>

            {/* Feature Strip */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-t border-b border-white/10 mt-4 mb-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-[#39FF14] shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-white uppercase font-bold tracking-wide leading-snug">
                  EVENTO OFICIAL <br/>
                  <span className="text-[#39FF14]">EN EL MARCO DE LA<br/>FERIA 2 RUEDAS</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-[#39FF14] shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-white uppercase font-bold tracking-wide leading-snug">
                  RESPALDADO POR LA <br/>
                  <span className="text-[#39FF14]">FEDERACIÓN COLOMBIANA<br/>DE MOTOCICLISMO</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Globe className="w-8 h-8 text-[#39FF14] shrink-0" strokeWidth={1.5} />
                <p className="text-xs text-white uppercase font-bold tracking-wide leading-snug">
                  PILOTOS DE TODO <br/>
                  <span className="text-[#39FF14]">EL PAÍS EN UN<br/>ESCENARIO ÚNICO</span>
                </p>
              </div>
            </div>

          </div>

          <div className="relative z-10 w-full">
            {/* VALUE MODULE (Cards Row) - 3 Columns Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Fechas y Costos */}
              <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-2 mb-6 text-[#39FF14]">
                  <Calendar className="w-5 h-5" strokeWidth={2.5} />
                  <span className="font-black text-sm uppercase tracking-widest">FECHAS Y COSTOS</span>
                </div>
                
                <div className="flex flex-col gap-6 flex-grow">
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase mb-2">INSCRIPCIONES ORDINARIAS</h4>
                    <div className="flex justify-between items-center bg-white/5 rounded px-3 py-2 border border-white/10">
                      <span className="text-zinc-300 text-xs font-medium">16 ABR AL 10 MAY</span>
                      <span className="text-[#39FF14] font-black text-sm">$280.000</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase mb-2">INSCRIPCIONES EXTEMPORALES</h4>
                    <div className="flex justify-between items-center bg-white/5 rounded px-3 py-2 border border-white/10">
                      <span className="text-zinc-300 text-xs font-medium">11 AL 15 MAY</span>
                      <span className="text-[#39FF14] font-black text-sm">$350.000</span>
                    </div>
                  </div>
                </div>

                <p className="text-zinc-500 text-[10px] italic mt-6">
                  No se realizarán devoluciones de dinero.
                </p>
              </div>

              {/* Card 2: El Costo Incluye */}
              <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-2 mb-6 text-[#39FF14]">
                  <Gift className="w-5 h-5" strokeWidth={2.5} />
                  <span className="font-black text-sm uppercase tracking-widest">EL COSTO INCLUYE</span>
                </div>
                
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-zinc-300 font-medium">Ingreso escarapela feria (4 días)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-zinc-300 font-medium">Boleta para acompañante</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-zinc-300 font-medium">Póliza deportiva de competencia</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-zinc-300 font-medium">VIP BOX con sorpresas increíbles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-[#39FF14] text-xs font-bold">Participa por una moto MRX 200 0km</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Cómo Participar */}
              <div className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl p-5 lg:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col group">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-2 mb-6 text-[#39FF14]">
                  <Gift className="w-5 h-5" strokeWidth={2.5} />
                  <span className="font-black text-sm uppercase tracking-widest">¿CÓMO PARTICIPAR?</span>
                </div>
                
                <div className="space-y-4 mb-6 flex-grow relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-white/10 before:z-0">
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full border border-[#39FF14] bg-black flex items-center justify-center text-[#39FF14] text-[10px] font-bold shrink-0">1</div>
                    <span className="text-xs text-zinc-300 font-medium mt-0.5">Diligencia el formulario con tus datos</span>
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full border border-[#39FF14] bg-black flex items-center justify-center text-[#39FF14] text-[10px] font-bold shrink-0">2</div>
                    <span className="text-xs text-zinc-300 font-medium mt-0.5">Realiza el pago de la inscripción</span>
                  </div>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full border border-[#39FF14] bg-black flex items-center justify-center text-[#39FF14] text-[10px] font-bold shrink-0">3</div>
                    <span className="text-xs text-zinc-300 font-medium mt-0.5">Sube el comprobante de Pago</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full border-white/20 text-[#39FF14] hover:bg-[#39FF14] hover:text-black uppercase tracking-widest text-[10px] font-bold h-10 mt-auto transition-colors flex items-center justify-between px-4"
                >
                  MÉTODOS DE PAGO
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          </div> {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN: PREMIUM FORM (Approx 40%) */}
          <div id="auth-form-section" className="w-full lg:w-[40%] flex-shrink-0 relative z-20 h-full flex flex-col justify-center mt-8 lg:mt-0">
            <AuthForm externalIsLogin={isLoginState} onToggleAuthMode={setIsLoginState} />
          </div>

        </div> {/* END TOP ROW */}

        {/* BOTTOM FULL-WIDTH SECTION: SPONSORS & FOOTER */}
        <div className="w-full flex flex-col mt-4 lg:mt-8 pt-8 lg:pt-12 border-t border-white/5 relative z-10">

          {/* SPONSORS STRIP - Infinite Marquee */}
          <div className="flex flex-col gap-6 md:gap-8 overflow-hidden relative">
            {/* Fade effect gradients */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>

            {/* Marquee Container */}
            <div className="flex w-max animate-marquee [animation-duration:18s] items-center">
              {[...Array(3)].map((_, arrayIndex) => (
                <div key={arrayIndex} className="flex items-center justify-center gap-10 md:gap-16 px-5 md:px-8 shrink-0">
                  {SPONSOR_LOGOS.map((logo, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${arrayIndex}-${index}`} src={logo.src} alt={logo.alt} className={logo.className} />
                  ))}
                </div>
              ))}
            </div>

            {/* Redes Sociales A Color */}
            <div className="flex justify-center items-center gap-6 mt-4 md:mt-6 pb-4">
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

      </div>

      {/* Payment Details Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px] w-[95vw] bg-[#121212] border-2 border-[#00E676] shadow-[0_0_30px_rgba(0,230,118,0.3)] text-white p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 pb-2 border-b border-[#2A2A2A]/50 bg-black/40">
            <DialogTitle className="text-lg md:text-xl font-black uppercase text-[#00E676] tracking-wider flex items-center justify-center gap-2">
              <span className="text-xl md:text-2xl">💰</span> Detalles de Pago
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-4 max-h-[90vh] overflow-hidden">
            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-[#B0B0B0] font-medium uppercase tracking-wider">Costo (16 Abr - 10 May)</span>
                  <span className="text-lg text-[#00E676] font-black tracking-wider shadow-[#00E676]/20">$280.000</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#2A2A2A]">
                  <span className="text-[9px] text-[#424242] font-medium uppercase tracking-wider">Costo (11 May - 15 May)</span>
                  <span className="text-xs text-[#B0B0B0] font-bold tracking-wider">$350.000</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-[#121212] p-3 rounded-xl border border-[#2A2A2A] flex flex-row items-center gap-4 text-xs text-[#B0B0B0]">
                  <div className="shrink-0 bg-white p-1.5 rounded-lg shadow-[0_0_20px_rgba(0,230,118,0.15)]">
                    <img src="/sponsors/QR BANCOLOMBIA.jpg" alt="QR Bancolombia" className="w-20 h-20 object-contain rounded-md" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-white mb-1.5 text-[10px] md:text-xs uppercase tracking-widest border-b border-[#2A2A2A] pb-1.5">Ahorros Bancolombia</p>
                    <ul className="space-y-0.5 font-mono text-[#B0B0B0]">
                      <li className="text-sm md:text-base text-[#00E676] font-bold tracking-wider">316-376847-80</li>
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
                className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-black uppercase tracking-wider h-12 rounded-xl shadow-[0_0_15px_rgba(0,230,118,0.2)]"
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
