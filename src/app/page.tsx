'use client';

import { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth-form';
import { Play, ArrowRight, ArrowUpRight, Check, X, Menu, Facebook, Instagram, Trophy, TrendingUp, Zap, Target, Users, ShieldCheck, PlayCircle, MapPin, Calendar, Star, Ticket, Activity, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SPONSOR_LOGOS = [
  { src: "/sponsors/Copa Stunt Nitrox Blanco.png", alt: "Copa Stunt" },
  { src: "/sponsors/Nitrox Blanco.png", alt: "Nitrox" },
  { src: "/sponsors/Mobil Blanco.png", alt: "Mobil Super" },
  { src: "/sponsors/PKS Blanco.png", alt: "PKS" },
  { src: "/sponsors/copa stunt nitrox f2r.png", alt: "F2R" },
  { src: "/sponsors/Trakku.png", alt: "Trakku" },
  { src: "/sponsors/IRC Blanco.png", alt: "IRC" },
  { src: "/sponsors/Fedemoto.png", alt: "Fedemoto" }
];

const SPORNS_IMAGES = [
  "/sponsors/SPORNS/DSC05568.JPG", "/sponsors/SPORNS/DSC05571.JPG", "/sponsors/SPORNS/DSC05598.JPG",
  "/sponsors/SPORNS/DSC05616.JPG", "/sponsors/SPORNS/DSC05624.JPG", "/sponsors/SPORNS/DSC05641.JPG",
  "/sponsors/SPORNS/DSC05644.JPG", "/sponsors/SPORNS/DSC05654.JPG", "/sponsors/SPORNS/DSC05659.JPG",
  "/sponsors/SPORNS/DSC05692.JPG", "/sponsors/SPORNS/DSC05699.JPG", "/sponsors/SPORNS/DSC05763.JPG",
  "/sponsors/SPORNS/DSC05791.JPG", "/sponsors/SPORNS/DSC05806.JPG", "/sponsors/SPORNS/DSC05809.JPG"
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentHeroImgIndex, setCurrentHeroImgIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImgIndex(prev => (prev + 1) % SPORNS_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#080808] text-white selection:bg-[#B4FF00] selection:text-black font-inter overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0D0D0D]/95 backdrop-blur-md py-4 shadow-lg shadow-black/50 border-b border-[#1C1C1C]' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-8 md:h-10 object-contain drop-shadow-md" />
          
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {['Inscripción Pilotos', 'Contáctanos', 'Galería', 'Podios'].map(item => (
              <a key={item} href="#" className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#888888] hover:text-white transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#B4FF00] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="hidden lg:flex">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-[#FF3B1F] hover:bg-[#FF553D] text-white font-bebas text-xl px-6 py-2 tracking-wide transition-colors"
            >
              INSCRÍBETE AHORA
            </button>
          </div>

          <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#080808] flex flex-col justify-center items-center">
          <div className="absolute top-0 left-0 w-full flex items-center justify-between p-6">
            <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-10" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#FF3B1F] hover:text-[#FF553D] transition-colors">
              <X size={36} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-8 mt-12 w-full px-6 text-center">
            {['Inscripción Pilotos', 'Contáctanos', 'Galería', 'Podios'].map(item => (
              <button key={item} className="font-bebas text-5xl uppercase tracking-tight text-white hover:text-[#B4FF00] transition-colors w-full border-b border-[#1C1C1C] pb-4">
                {item}
              </button>
            ))}
            <button 
              onClick={() => { setIsMobileMenuOpen(false); setShowAuthModal(true); }}
              className="mt-6 bg-[#FF3B1F] text-white font-bebas text-3xl py-4 w-full"
            >
              INSCRÍBETE AHORA
            </button>
          </div>
        </div>
      )}

      {/* SEC 1: HERO */}
      <section className="relative w-full min-h-[95vh] flex flex-col justify-center px-6 overflow-hidden bg-[#080808] pt-24" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 92%, 0 100%)' }}>
        {/* BACKGROUND SLIDER (RIGHT SIDE ONLY) */}
        <div 
          className="absolute right-0 top-0 w-full lg:w-[65%] h-full pointer-events-none z-0 overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 30%)'
          }}
        >
          {SPORNS_IMAGES.map((img, idx) => (
            <div 
              key={img}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === currentHeroImgIndex ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                backgroundImage: `url('${img}')`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                transform: 'scaleX(-1)'
              }}
            ></div>
          ))}
        </div>
        
        {/* Extra text shadow gradient for mobile readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent pointer-events-none z-0 lg:hidden"></div>

        <div className="relative z-10 max-w-[1280px] mx-auto w-full pt-16 pb-32">
          {/* SLIDER CONTROLS */}
          <div className="absolute right-0 bottom-32 hidden md:flex gap-4 pr-6 z-20 pointer-events-auto">
            <button 
              onClick={() => setCurrentHeroImgIndex(prev => prev === 0 ? SPORNS_IMAGES.length - 1 : prev - 1)}
              className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#B4FF00] hover:text-black hover:border-[#B4FF00] transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentHeroImgIndex(prev => (prev + 1) % SPORNS_IMAGES.length)}
              className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#B4FF00] hover:text-black hover:border-[#B4FF00] transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <span className="text-[#FF3B1F] font-bebas italic text-3xl md:text-5xl uppercase tracking-tight mb-2 block drop-shadow-md">
            NO MONTAMOS EVENTOS.
          </span>
          <h1 className="flex flex-col max-w-5xl mb-6">
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-white uppercase tracking-tight leading-[0.85] drop-shadow-2xl">
              CREAMOS <span className="text-[#B4FF00]">MOMENTOS</span>
            </span>
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-white uppercase tracking-tight leading-[0.85] drop-shadow-2xl mt-1">
              QUE LA INDUSTRIA
            </span>
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-[#B4FF00] uppercase tracking-tight leading-[0.85] drop-shadow-[0_0_30px_rgba(180,255,0,0.3)] mt-1">
              NUNCA OLVIDA.
            </span>
          </h1>
          
          <span className="text-[#888888] font-inter font-medium text-[10px] md:text-xs uppercase tracking-[0.12em] flex items-center gap-3 mb-10">
            EXPERIENCIAS <span className="text-[#B4FF00]">●</span> PRODUCCIÓN <span className="text-[#B4FF00]">●</span> COMPETENCIA <span className="text-[#B4FF00]">●</span> TECNOLOGÍA
          </span>
          
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <button onClick={() => setShowAuthModal(true)} className="bg-[#B4FF00] hover:bg-[#9fe000] text-black font-inter font-bold text-[12px] px-8 py-4 tracking-widest uppercase flex items-center gap-3 transition-transform hover:-translate-y-1">
              EXPLORA NUESTRO UNIVERSO <ArrowUpRight size={18} strokeWidth={2.5} />
            </button>
            <button className="bg-transparent text-white font-inter text-[11px] font-bold tracking-widest flex items-center gap-4 transition-all hover:text-[#B4FF00] uppercase group">
              <div className="w-12 h-12 rounded-full border border-white/30 group-hover:border-[#B4FF00] flex items-center justify-center transition-colors">
                <Play fill="currentColor" size={16} className="ml-1" />
              </div>
              <div className="flex flex-col text-left">
                <span>VER SHOWREEL</span>
                <span className="text-[#888888] font-medium text-[9px] mt-0.5 group-hover:text-white transition-colors">PLAY VIDEO</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* SEC 2: VALUE PROP (3 CARDS) */}
      <section className="py-16 px-6 max-w-[1400px] mx-auto -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Marcas */}
          <div className="group relative bg-[#111111] rounded-xl overflow-hidden border border-[#1C1C1C] min-h-[380px] flex flex-col justify-end p-8 transition-all hover:border-[#333] shadow-2xl">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent z-10 transition-opacity duration-500"></div>
              <div className="w-full h-full bg-cover bg-center transform group-hover:scale-[1.04] transition-transform duration-700" style={{ backgroundImage: `url('/sponsors/fondo1.jpg')`, opacity: 0.5 }}></div>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-oswald text-4xl text-[#FF3B1F]">01</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">PARA MARCAS</h3>
              </div>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-4">Activaciones, lanzamientos y experiencias BTL que conectan tu marca con las personas correctas.</p>
              <button className="bg-transparent border border-[#FF3B1F]/30 text-white hover:border-[#FF3B1F] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm w-max transition-colors flex items-center gap-2">
                VER SERVICIOS <ArrowUpRight size={14} className="text-[#FF3B1F]" />
              </button>
            </div>
          </div>

          {/* Card 2: Campeonatos */}
          <div className="group relative bg-[#111111] rounded-xl overflow-hidden border border-[#1C1C1C] min-h-[380px] flex flex-col justify-end p-8 transition-all hover:border-[#333] shadow-2xl">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent z-10 transition-opacity duration-500"></div>
              <div className="w-full h-full bg-cover bg-center transform group-hover:scale-[1.04] transition-transform duration-700" style={{ backgroundImage: `url('/sponsors/stunt2026negro.jpeg')`, opacity: 0.4 }}></div>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-oswald text-4xl text-[#B4FF00]">02</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">CAMPEONATOS</h3>
              </div>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-4">Creamos y producimos los campeonatos de stunt más importantes de Colombia.</p>
              <div className="flex flex-col gap-2">
                <a href="#" className="flex items-center gap-2 text-white text-[12px] font-bold uppercase tracking-widest hover:text-[#B4FF00] transition-colors">
                  <ArrowUpRight size={16} className="text-[#B4FF00]" /> COPA STUNT COLOMBIA
                </a>
                <a href="#" className="flex items-center gap-2 text-white text-[12px] font-bold uppercase tracking-widest hover:text-[#B4FF00] transition-colors">
                  <ArrowUpRight size={16} className="text-[#B4FF00]" /> STUNT DAY
                </a>
              </div>
            </div>
          </div>

          {/* Card 3: Tecnología */}
          <div className="group relative bg-[#111111] rounded-xl overflow-hidden border border-[#1C1C1C] min-h-[380px] flex flex-col justify-end p-8 transition-all hover:border-[#333] shadow-2xl">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent z-10 transition-opacity duration-500"></div>
              <div className="w-full h-full bg-cover bg-center transform group-hover:scale-[1.04] transition-transform duration-700" style={{ backgroundImage: `url('/sponsors/fondo1.jpg')`, opacity: 0.3 }}></div>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-oswald text-4xl text-[#FFD200]">03</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">TECNOLOGÍA</h3>
              </div>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-4">PKNX es nuestro ecosistema digital que conecta pilotos, organización, marcas y audiencia en tiempo real.</p>
              <button className="bg-transparent border border-[#FFD200]/30 text-white hover:border-[#FFD200] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm w-max transition-colors flex items-center gap-2">
                CONOCE PKNX <ArrowUpRight size={14} className="text-[#FFD200]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEC 3: STATS BAR (5 COLUMNS) */}
      <section className="bg-transparent border-y border-[#1C1C1C] py-12 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-0 divide-x-0 lg:divide-x divide-[#1C1C1C]">
          {[
            { icon: Calendar, val: '200+', label: 'EVENTOS REALIZADOS', label2: 'EVENTOS', label3: 'REALIZADOS' },
            { icon: Users, val: '150K+', label: 'ASISTENTES IMPACTADOS', label2: 'ASISTENTES', label3: 'IMPACTADOS' },
            { icon: Star, val: '20+', label: 'MARCAS ALIADAS', label2: 'MARCAS', label3: 'ALIADAS' },
            { icon: MapPin, val: '12', label: 'CIUDADES', label2: 'CIUDADES', label3: '' },
            { icon: Trophy, val: '8', label: 'AÑOS DE EXPERIENCIA', label2: 'AÑOS DE', label3: 'EXPERIENCIA' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-center gap-6 px-4">
              <stat.icon className="w-10 h-10 text-[#B4FF00] shrink-0" strokeWidth={1.5} />
              <div className="flex flex-col text-left">
                <span className="font-inter font-bold text-3xl text-white leading-none mb-1">{stat.val}</span>
                <span className="font-inter font-medium text-[10px] uppercase tracking-wider text-[#888888] leading-[1.2]">
                  {stat.label2}<br/>{stat.label3}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 4: LOGO STRIP */}
      <section className="py-20 overflow-hidden bg-[#080808]">
        <div className="max-w-[1400px] mx-auto px-6 mb-12 text-center">
          <span className="text-[#888888] font-inter font-medium text-[11px] uppercase tracking-[0.15em]">MARCAS QUE CONFÍAN EN NOSOTROS</span>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex items-center justify-center md:justify-start [&_img]:max-w-none animate-marquee gap-16 md:gap-24 px-8">
            {[...SPONSOR_LOGOS, ...SPONSOR_LOGOS].map((logo, idx) => (
              <img key={idx} src={logo.src} alt={logo.alt} className="h-8 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer" />
            ))}
          </div>
        </div>
      </section>

      {/* SEC 5: PORTFOLIO (5 CARDS HORIZONTAL) */}
      <section className="py-10 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-10">
          <span className="text-[#888888] font-inter font-medium text-[11px] uppercase tracking-[0.15em]">CASOS DE ÉXITO</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { title: 'COPA STUNT COLOMBIA', img: '/sponsors/fondo1.jpg', s1: '+450 PILOTOS', s2: '+15K ASISTENTES' },
            { title: 'STUNT DAY MEDELLÍN', img: '/sponsors/stunt2026negro.jpeg', s1: '+120 PILOTOS', s2: '+5K ASISTENTES' },
            { title: 'AUTECO MOBILITY', img: '/sponsors/fondo1.jpg', s1: 'ACTIVACIÓN', s2: 'BTL' },
            { title: 'SUZUKI LAUNCH EXPERIENCE', img: '/sponsors/stunt2026negro.jpeg', s1: 'LANZAMIENTO', s2: 'NACIONAL' },
            { title: 'MRX FOX CAMP', img: '/sponsors/fondo1.jpg', s1: 'EXPERIENCIA', s2: 'OFFROAD' },
          ].map((item, idx) => (
            <div key={idx} className="group relative bg-[#111] border border-[#1C1C1C] rounded-lg overflow-hidden h-[300px] lg:h-[400px] flex flex-col justify-between p-6 cursor-pointer hover:border-[#444] transition-colors">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50" style={{ backgroundImage: `url('${item.img}')` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>
              
              <div className="relative z-10">
                <h3 className="font-bebas text-3xl text-white tracking-wide leading-[1.1] shadow-black drop-shadow-md">
                  {item.title.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                </h3>
              </div>
              
              <div className="relative z-10 w-full flex items-end justify-between mt-auto">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#888888] text-[10px] font-bold tracking-wider"><Users size={12} className="text-white" /> {item.s1}</div>
                  <div className="flex items-center gap-2 text-[#888888] text-[10px] font-bold tracking-wider"><Target size={12} className="text-white" /> {item.s2}</div>
                </div>
                <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 6: ECOSYSTEM (PKNX) */}
      <section className="py-24 mt-10 bg-gradient-to-b from-[#080808] to-[#111111] border-y border-[#1C1C1C]">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center mb-4 gap-1">
              <span className="font-inter font-black text-5xl text-white italic tracking-tighter">PKN</span>
              <span className="font-inter font-black text-5xl text-[#FF3B1F] italic tracking-tighter">X</span>
            </div>
            <span className="text-[#B4FF00] font-inter font-bold text-[12px] uppercase tracking-widest block mb-6">NUESTRO ECOSISTEMA DIGITAL</span>
            <p className="text-[#888888] text-[15px] leading-relaxed mb-12 max-w-lg">El centro de control que hace posible cada experiencia. Conecta pilotos, organización, marcas y audiencia en un solo lugar.</p>
            
            <div className="grid grid-cols-2 gap-y-10 gap-x-6">
              {[
                { icon: Users, title: 'REGISTRO DE PILOTOS' },
                { icon: Ticket, title: 'QR Y ACCESOS EN TIEMPO REAL' },
                { icon: Activity, title: 'COMUNICACIÓN OFICIAL' },
                { icon: TrendingUp, title: 'DASHBOARDS Y ESTADÍSTICAS' },
                { icon: ShieldCheck, title: 'PAGOS Y COBROS' },
                { icon: Check, title: 'VALIDACIÓN AUTOMÁTICA' },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <feat.icon className="text-[#B4FF00] w-6 h-6 shrink-0" strokeWidth={2} />
                  <h4 className="font-inter text-[11px] font-bold text-white tracking-widest leading-[1.4] uppercase">{feat.title}</h4>
                </div>
              ))}
            </div>
            
            <button className="mt-14 bg-transparent border border-[#B4FF00] text-[#B4FF00] hover:bg-[#B4FF00] hover:text-black font-inter font-bold text-xs px-8 py-3 tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2 w-max">
              CONOCE PKNX <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="relative mt-12 xl:mt-0 flex justify-center xl:justify-end">
            <div className="absolute inset-0 bg-[#B4FF00] opacity-[0.03] blur-[150px] rounded-full"></div>
            {/* Mockup Placeholder that mimics the laptop + phone layout */}
            <div className="relative z-10 w-full max-w-[700px] aspect-[16/10] bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
               <img src="/sponsors/fondo1.jpg" className="w-full h-full object-cover opacity-20 mix-blend-screen" alt="Mockup Laptop" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
               <div className="absolute text-center">
                 <p className="font-bebas text-4xl text-white tracking-wider mb-2">DASHBOARD CENTRAL</p>
                 <p className="text-[#B4FF00] text-xs font-bold tracking-widest">[ LAPTOP MOCKUP PLACEHOLDER ]</p>
               </div>
               {/* Phone overlay */}
               <div className="absolute -right-4 -bottom-4 w-[200px] h-[400px] bg-[#111] border-4 border-black rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden z-20 transform -rotate-6">
                 <img src="/sponsors/stunt2026negro.jpeg" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Mockup Phone" />
                 <div className="absolute text-center px-4">
                   <p className="font-bebas text-xl text-white tracking-wider mb-2">RIDER PASS</p>
                   <p className="text-[#FF3B1F] text-[10px] font-bold tracking-widest">[ PHONE MOCKUP ]</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEC 7: PORTALS */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { tag: '¿ERES PILOTO?', role: 'PORTAL DEL PILOTO', color: 'border-[#1C1C1C] hover:border-[#B4FF00]', items: ['Inscríbete a nuestros eventos', 'Gestiona tu información', 'Pagos y documentos', 'Tu QR y accesos'], btnText: 'IR AL PORTAL', btnColor: 'border-[#B4FF00] text-[#B4FF00] hover:bg-[#B4FF00] hover:text-black', onClick: () => setShowAuthModal(true) },
            { tag: '¿ERES PROVEEDOR O COLABORADOR?', role: 'PORTAL DE PROVEEDORES', color: 'border-[#1C1C1C] hover:border-[#FFD200]', items: ['Sube tu factura', 'Consulta estado de pago', 'Descarga certificados', 'Historial de transacciones'], btnText: 'IR AL PORTAL', btnColor: 'border-[#FFD200] text-[#FFD200] hover:bg-[#FFD200] hover:text-black', onClick: undefined },
            { tag: 'SISTEMA DE COBROS', role: 'PARA PERSONAS NATURALES', color: 'border-[#1C1C1C] hover:border-[#B4FF00]', items: ['Colaboradores', 'Proveedores', 'Prestadores de servicios', 'Pagos seguros y rápidos'], btnText: 'IR AL SISTEMA', btnColor: 'border-[#B4FF00] text-[#B4FF00] hover:bg-[#B4FF00] hover:text-black', onClick: undefined },
          ].map((portal, i) => (
            <div key={i} className={`group bg-[#0A0A0A] border rounded-xl p-8 transition-colors ${portal.color} flex flex-col`}>
              <span className="text-[#888888] font-inter font-bold text-[10px] uppercase tracking-widest mb-2 block">{portal.tag}</span>
              <h3 className="font-bebas text-4xl text-white mb-8 tracking-wide">{portal.role}</h3>
              <ul className="space-y-4 mb-10 flex-1">
                {portal.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-[14px] text-[#A0A0A0] font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#B4FF00]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className={`w-max font-inter font-bold text-[11px] uppercase tracking-widest border py-3 px-6 rounded-sm transition-colors flex items-center gap-2 ${portal.btnColor}`} onClick={portal.onClick}>
                {portal.btnText} <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 8: CTA FINAL */}
      <section className="py-24 border-t border-[#1C1C1C] px-6 relative overflow-hidden bg-[url('/sponsors/fondo1.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50"></div>
        <div className="relative z-10 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="font-bebas text-5xl md:text-6xl text-white tracking-wide mb-2">
              ¿TIENES UN PROYECTO EN MENTE?
            </h2>
            <p className="text-[#A0A0A0] text-sm md:text-base font-medium tracking-wide uppercase">
              HABLEMOS Y CONSTRUYAMOS ALGO EXTRAORDINARIO.
            </p>
          </div>
          <button className="bg-[#FF3B1F] hover:bg-[#FF553D] text-white font-inter font-bold text-[12px] uppercase tracking-widest px-10 py-4 rounded-sm flex items-center gap-2 transition-colors shrink-0">
            CONTÁCTANOS <ArrowUpRight size={16} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#080808] border-t border-[#1C1C1C] pt-20 pb-8 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-10 mb-6 opacity-90" />
              <p className="text-[#888888] text-[13px] leading-relaxed mb-6 max-w-sm">Empresa BTL y productora de eventos especializada en experiencias para la industria de las motocicletas.</p>
              <div className="flex gap-4">
                <a href="#" className="text-[#888888] hover:text-white transition-colors"><Instagram size={20} /></a>
                <a href="#" className="text-[#888888] hover:text-white transition-colors"><Facebook size={20} /></a>
                <a href="#" className="text-[#888888] hover:text-white transition-colors"><PlayCircle size={20} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">EMPRESA</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Nosotros</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Servicios</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Clientes</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Trabaja con nosotros</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">PROPIEDADES</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Copa Stunt Colombia</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Stunt Day</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Reglamentos</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Resultados</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">PLATAFORMA</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">PKNX</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Portal del Piloto</a></li>
                <li><a href="#" className="text-white hover:text-[#B4FF00] text-[14px] transition-colors">Portal de Proveedores</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#1C1C1C] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[#666666] font-inter text-[11px] uppercase tracking-wider">© 2026 Paskines Stunt S.A.S. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <span className="text-[#666666] font-inter text-[11px] uppercase tracking-wider flex items-center gap-2">DISEÑADO CON PASIÓN POR EL STUNT.</span>
              <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-3 opacity-50" />
            </div>
          </div>
        </div>
      </footer>

      {/* AUTH DIALOG OVERLAY */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-[480px] p-0 bg-transparent border-none shadow-none [&>button]:hidden">
          <DialogTitle className="sr-only">Inscripción Oficial</DialogTitle>
          <div className="relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#FF3B1F] transition-colors z-50 bg-[#111] p-2 rounded-full border border-[#1C1C1C]"
            >
              <X size={24} />
            </button>
            <AuthForm />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
