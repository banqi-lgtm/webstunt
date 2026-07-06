'use client';

import { useState, useEffect } from 'react';
import { AnimatedStatsSection } from '@/components/pks/AnimatedStats';
import { AuthForm } from '@/components/auth-form';
import { Play, ArrowRight, ArrowUpRight, Check, X, Menu, Facebook, Instagram, Youtube, Twitter, ArrowDown, ChevronDown, Trophy, TrendingUp, Zap, Target, Users, ShieldCheck, PlayCircle, MapPin, Calendar, Star, Ticket, Activity, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
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
  "/sponsors/SPORNS/opt_DSC05598.JPG",
  "/sponsors/SPORNS/opt_DSC05616.JPG", "/sponsors/SPORNS/opt_DSC05624.JPG", "/sponsors/SPORNS/opt_DSC05641.JPG",
  "/sponsors/SPORNS/opt_DSC05644.JPG", "/sponsors/SPORNS/opt_DSC05654.JPG", "/sponsors/SPORNS/opt_DSC05659.JPG",
  "/sponsors/SPORNS/opt_DSC05692.JPG", "/sponsors/SPORNS/opt_DSC05699.JPG", "/sponsors/SPORNS/opt_DSC05763.JPG",
  "/sponsors/SPORNS/opt_DSC05791.JPG", "/sponsors/SPORNS/opt_DSC05806.JPG", "/sponsors/SPORNS/opt_DSC05809.JPG"
];

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInscripcionesOpen, setIsInscripcionesOpen] = useState(false);
  const [isEventosPropiosOpen, setIsEventosPropiosOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'default' | 'staff'>('default');
  const [authIsLogin, setAuthIsLogin] = useState(false);
  const [currentHeroImgIndex, setCurrentHeroImgIndex] = useState(0);
  
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [activePortfolioIndex, setActivePortfolioIndex] = useState<number>(1);

  const GALLERY_IMAGES = [
    "/sponsors/SPORNS/opt_DSC05598.JPG",
    "/sponsors/SPORNS/opt_DSC05616.JPG",
    "/sponsors/SPORNS/opt_DSC05624.JPG",
    "/sponsors/SPORNS/opt_DSC05641.JPG",
    "/sponsors/SPORNS/opt_DSC05644.JPG",
    "/sponsors/SPORNS/opt_DSC05654.JPG",
    "/sponsors/SPORNS/opt_DSC05659.JPG",
    "/sponsors/SPORNS/opt_DSC05692.JPG",
    "/sponsors/SPORNS/opt_DSC05699.JPG",
    "/sponsors/SPORNS/opt_DSC05763.JPG",
    "/sponsors/SPORNS/opt_DSC05791.JPG",
    "/sponsors/SPORNS/opt_DSC05806.JPG",
    "/sponsors/SPORNS/opt_DSC05809.JPG",
  ];

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
    <main className="min-h-screen bg-[#080808] text-white selection:bg-[#E60000] selection:text-black font-inter overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#080808] py-4 border-b border-[#1C1C1C]">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-8 md:h-10 object-contain drop-shadow-md shrink-0" />
          
          <div className="hidden lg:flex items-center justify-end gap-6 xl:gap-8 flex-1 px-4">
            {[
              { id: 'inicio', label: 'INICIO' },
              { id: 'nosotros', label: 'NOSOTROS' },
              { id: 'servicios', label: 'SERVICIOS' },
              { id: 'eventos-propios', label: 'EVENTOS PROPIOS', subItems: [
                { id: 'galeria', label: 'GALERÍA', isGallery: true }
              ] },
              { id: 'casos-de-exito', label: 'CASOS DE ÉXITO' },
              { id: 'contacto', label: 'CONTACTO' },
              { id: 'inscripcion', label: 'INSCRIPCIÓN', subItems: [
                { id: 'pilotos', label: 'PILOTOS', isAuth: true, authMode: 'default' },
                { id: 'proveedores', label: 'PROVEEDORES', isAuth: true, authMode: 'staff' }
              ] }
            ].map((item) => (
              <div key={item.id} className="relative group py-4">
                <a 
                  href={item.id === 'inscripcion' ? '#' : `#${item.id}`} 
                  onClick={(e) => { if(item.id === 'inscripcion') e.preventDefault(); }}
                  className={`text-white hover:text-[#E60000] text-[11px] xl:text-[12px] font-inter font-medium tracking-widest uppercase transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-[#E60000] after:transition-transform after:duration-300 ${item.id === 'inicio' ? 'after:scale-x-100' : 'after:scale-x-0 group-hover:after:scale-x-100'} whitespace-nowrap flex items-center gap-1.5 cursor-pointer`}
                >
                  {item.label}
                  {item.subItems && <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform duration-300" />}
                </a>

                {item.subItems && (
                  <div className="absolute top-full left-0 mt-0 w-48 bg-[#0D0D0D] border border-[#1C1C1C] rounded-md shadow-lg shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden z-50">
                    <div className="py-2">
                      {item.subItems.map((sub: any) => (
                        sub.isAuth ? (
                          <button
                            key={sub.id}
                            onClick={() => { setAuthIsLogin(false); setAuthMode(sub.authMode); setShowAuthModal(true); }}
                            className="w-full text-left px-5 py-3 text-[12px] xl:text-[13px] font-inter font-medium tracking-widest uppercase text-gray-300 hover:text-white hover:bg-[#E60000] transition-colors whitespace-nowrap block"
                          >
                            {sub.label}
                          </button>
                        ) : sub.isGallery ? (
                          <button
                            key={sub.id}
                            onClick={() => { setShowGalleryModal(true); setCurrentGalleryIndex(0); }}
                            className="w-full text-left px-5 py-3 text-[12px] xl:text-[13px] font-inter font-medium tracking-widest uppercase text-gray-300 hover:text-white hover:bg-[#E60000] transition-colors whitespace-nowrap block"
                          >
                            {sub.label}
                          </button>
                        ) : (
                          <a
                            key={sub.id}
                            href={`#${sub.id}`}
                            className="w-full text-left px-4 py-2.5 text-[11px] xl:text-[12px] font-inter font-medium tracking-widest uppercase text-gray-300 hover:text-white hover:bg-[#E60000] transition-colors whitespace-nowrap block"
                          >
                            {sub.label}
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => { setAuthIsLogin(true); setShowAuthModal(true); }}
              className="text-white bg-[#E60000] hover:bg-[#CC0000] px-5 py-2 rounded-sm text-[11px] xl:text-[12px] font-inter font-bold tracking-widest uppercase transition-all whitespace-nowrap shadow-lg shadow-black/20 hover:shadow-[#E60000]/20 ml-2"
            >
              INICIAR SESIÓN
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <button 
              onClick={() => { setAuthIsLogin(true); setShowAuthModal(true); }}
              className="text-white bg-[#E60000] hover:bg-[#CC0000] px-3.5 py-1.5 rounded-sm text-[10px] font-inter font-bold tracking-widest uppercase transition-all whitespace-nowrap shadow-lg shadow-black/20 hover:shadow-[#E60000]/20"
            >
              INICIAR SESIÓN
            </button>
            <button className="text-[#E60000] hover:text-[#CC0000] transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={32} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div 
        className={`fixed inset-0 z-[100] bg-[#080808]/75 backdrop-blur-md flex flex-col items-center justify-center px-8 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 w-full flex items-center justify-between p-6">
          <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-8 md:h-10 object-contain" />
          <button onClick={() => { setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); }} className="text-white hover:text-[#E60000] transition-colors">
            <X size={36} strokeWidth={1.5} />
          </button>
        </div>
        
        <div 
          className="flex flex-col items-center justify-center w-full max-w-md mx-auto -mt-8 transition-all duration-500 ease-out" 
          style={{ 
            transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-40px)',
            opacity: isMobileMenuOpen ? 1 : 0
          }}
        >
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 mb-5 text-white">
            <a href="#" className="hover:text-[#E60000] transition-colors"><Facebook size={22} /></a>
            <a href="https://www.instagram.com/paskinesstunt/" target="_blank" rel="noopener noreferrer" className="hover:text-[#E60000] transition-colors"><Instagram size={22} /></a>
            <a href="#" className="hover:text-[#E60000] transition-colors"><Youtube size={22} /></a>
            <a href="#" className="hover:text-[#E60000] transition-colors"><Twitter size={22} /></a>
          </div>

          {/* Nosotros & Servicios Horizontal Buttons */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <a 
              href="#nosotros" 
              onClick={() => { setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); }}
              className="font-bebas italic uppercase tracking-wider text-xl md:text-2xl text-white hover:text-[#E60000] transition-colors"
            >
              NOSOTROS
            </a>
            <span className="text-zinc-700 text-xs">|</span>
            <a 
              href="#servicios" 
              onClick={() => { setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); }}
              className="font-bebas italic uppercase tracking-wider text-xl md:text-2xl text-white hover:text-[#E60000] transition-colors"
            >
              SERVICIOS
            </a>
          </div>

          {/* Menu Items (Remaining items) */}
          <div className="flex flex-col items-center gap-5 w-full max-h-[50vh] overflow-y-auto py-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            
            {/* EVENTOS PROPIOS (Dropdown) */}
            <div className="flex flex-col items-center w-full">
              <button 
                onClick={() => { setIsEventosPropiosOpen(!isEventosPropiosOpen); setIsInscripcionesOpen(false); }}
                className={`font-bebas italic uppercase tracking-wider text-2xl md:text-3xl hover:text-[#E60000] outline-none focus:outline-none transition-colors flex items-center gap-2 text-center justify-center ${isEventosPropiosOpen ? 'text-[#E60000]' : 'text-white'}`}
              >
                EVENTOS PROPIOS
                <ArrowDown size={18} className={`opacity-70 mt-0.5 transition-transform duration-300 ${isEventosPropiosOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
              </button>
              
              <div 
                className={`flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out ${isEventosPropiosOpen ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}
              >
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); setIsEventosPropiosOpen(false); setShowGalleryModal(true); setCurrentGalleryIndex(0); }}
                  className="font-bebas text-xl md:text-2xl text-zinc-400 hover:text-white transition-colors py-1 tracking-widest uppercase outline-none focus:outline-none"
                >
                  GALERÍA
                </button>
              </div>
            </div>

            {/* CASOS DE ÉXITO */}
            <a 
              href="#casos-de-exito" 
              onClick={() => { setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); }}
              className="font-bebas italic uppercase tracking-wider text-2xl md:text-3xl text-white hover:text-[#E60000] transition-colors"
            >
              CASOS DE ÉXITO
            </a>

            {/* INSCRIPCIÓN (Dropdown) */}
            <div className="flex flex-col items-center w-full">
              <button 
                onClick={() => { setIsInscripcionesOpen(!isInscripcionesOpen); setIsEventosPropiosOpen(false); }}
                className={`font-bebas italic uppercase tracking-wider text-2xl md:text-3xl hover:text-[#E60000] outline-none focus:outline-none transition-colors flex items-center gap-2 text-center justify-center ${isInscripcionesOpen ? 'text-[#E60000]' : 'text-white'}`}
              >
                INSCRIPCIÓN
                <ArrowDown size={18} className={`opacity-70 mt-0.5 transition-transform duration-300 ${isInscripcionesOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
              </button>
              
              <div 
                className={`flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out ${isInscripcionesOpen ? 'max-h-40 opacity-100 mt-4 gap-3' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}
              >
                <button 
                  onClick={() => { setAuthIsLogin(false); setAuthMode('staff'); setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setShowAuthModal(true); }}
                  className="font-bebas text-xl md:text-2xl text-zinc-400 hover:text-white transition-colors py-1 tracking-wider uppercase outline-none focus:outline-none"
                >
                  STAFF - PROVEEDORES
                </button>
                <button 
                  onClick={() => { setAuthIsLogin(false); setAuthMode('default'); setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setShowAuthModal(true); }}
                  className="font-bebas text-xl md:text-2xl text-zinc-400 hover:text-white transition-colors py-1 tracking-wider uppercase outline-none focus:outline-none"
                >
                  PILOTOS
                </button>
              </div>
            </div>

            {/* INICIAR SESIÓN */}
            <button 
              onClick={() => { setAuthIsLogin(true); setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); setShowAuthModal(true); }}
              className="font-bebas italic uppercase tracking-wider text-2xl md:text-3xl text-[#E60000] hover:text-white transition-colors flex items-center gap-2 text-center justify-center"
            >
              INICIAR SESIÓN
            </button>

            {/* INSCRÍBETE AHORA (CTA) */}
            <button 
              onClick={() => { setAuthIsLogin(false); setAuthMode('default'); setIsMobileMenuOpen(false); setIsInscripcionesOpen(false); setIsEventosPropiosOpen(false); setShowAuthModal(true); }}
              className="mt-3 bg-[#E60000] text-white font-inter font-bold text-xs tracking-widest uppercase py-3 px-6 rounded-sm w-max hover:bg-[#CC0000] transition-colors flex items-center gap-2"
            >
              INSCRÍBETE AHORA <ArrowUpRight size={14} />
            </button>

          </div>
        </div>
      </div>

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
              className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#E60000] hover:text-black hover:border-[#E60000] transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentHeroImgIndex(prev => (prev + 1) % SPORNS_IMAGES.length)}
              className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-[#E60000] hover:text-black hover:border-[#E60000] transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <span className="text-white font-bebas italic text-3xl md:text-5xl uppercase tracking-tight mb-2 block drop-shadow-md">
            NO MONTAMOS EVENTOS.
          </span>
          <h1 className="flex flex-col max-w-5xl mb-6">
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-white uppercase tracking-tight leading-[0.85] drop-shadow-2xl">
              CREAMOS <span className="text-[#E60000]">MOMENTOS</span>
            </span>
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-white uppercase tracking-tight leading-[0.85] drop-shadow-2xl mt-1">
              QUE LA INDUSTRIA
            </span>
            <span className="font-bebas italic text-6xl md:text-8xl lg:text-[110px] text-[#E60000] uppercase tracking-tight leading-[0.85] drop-shadow-[0_0_30px_rgba(180,255,0,0.3)] mt-1">
              NUNCA OLVIDA.
            </span>
          </h1>
          
          <span className="text-[#888888] font-inter font-medium text-[10px] md:text-xs uppercase tracking-[0.12em] flex flex-wrap items-center gap-y-2 gap-x-3 mb-10">
            EXPERIENCIAS <span className="text-[#E60000]">●</span> BTL <span className="text-[#E60000]">●</span> PRODUCCIÓN <span className="text-[#E60000]">●</span> COMPETENCIA <span className="text-[#E60000]">●</span> TECNOLOGÍA
          </span>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button onClick={() => { setAuthIsLogin(false); setAuthMode('default'); setShowAuthModal(true); }} className="bg-[#E60000] hover:bg-[#CC0000] text-white font-inter font-bold text-[12px] px-8 py-4 tracking-widest uppercase flex items-center gap-3 transition-transform hover:-translate-y-1 rounded-sm">
              EXPLORA NUESTRO UNIVERSO <ArrowUpRight size={18} strokeWidth={2.5} />
            </button>
            <button className="bg-transparent text-white font-inter text-[11px] font-bold tracking-widest flex items-center gap-4 transition-all hover:text-[#E60000] uppercase group">
              <div className="w-12 h-12 rounded-full border border-white/30 group-hover:border-[#E60000] flex items-center justify-center transition-colors">
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
            <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-0 transition-opacity duration-500"></div>
              
              <div className="absolute inset-0 z-[5] flex flex-col justify-center gap-8 opacity-40 pointer-events-none -rotate-6 scale-125">
                <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_20px,_black_calc(100%-20px),transparent_100%)]">
                  <div className="flex items-center justify-center md:justify-start [&_img]:max-w-none animate-marquee gap-10 px-4">
                    {[...SPONSOR_LOGOS, ...SPONSOR_LOGOS].map((logo, idx) => (
                      <img key={`row1-${idx}`} src={logo.src} alt={logo.alt} className="h-10 md:h-14 object-contain" />
                    ))}
                  </div>
                </div>
                <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_20px,_black_calc(100%-20px),transparent_100%)]">
                  <div className="flex items-center justify-center md:justify-start [&_img]:max-w-none animate-marquee gap-10 px-4" style={{ animationDirection: 'reverse', animationDuration: '40s' }}>
                    {[...SPONSOR_LOGOS, ...SPONSOR_LOGOS].map((logo, idx) => (
                      <img key={`row2-${idx}`} src={logo.src} alt={logo.alt} className="h-10 md:h-14 object-contain blur-[3px] opacity-30" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-oswald text-4xl text-[#E60000]">01</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">PARA MARCAS</h3>
              </div>
              <p className="text-white text-[15px] leading-relaxed mb-4">Activaciones, lanzamientos y experiencias BTL que conectan tu marca con las personas correctas.</p>
              <button className="bg-transparent border border-[#E60000]/30 text-white hover:border-[#E60000] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm w-max transition-colors flex items-center gap-2">
                VER SERVICIOS <ArrowUpRight size={14} className="text-[#E60000]" />
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
                <span className="font-oswald text-4xl text-[#E60000]">02</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">CAMPEONATOS</h3>
              </div>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-4">Creamos y producimos los campeonatos de stunt más importantes de Colombia.</p>
              <div className="flex flex-col gap-2">
                <a href="#" className="flex items-center gap-2 text-white text-[12px] font-bold uppercase tracking-widest hover:text-[#E60000] transition-colors">
                  <ArrowUpRight size={16} className="text-[#E60000]" /> COPA STUNT COLOMBIA
                </a>
                <a href="#" className="flex items-center gap-2 text-white text-[12px] font-bold uppercase tracking-widest hover:text-[#E60000] transition-colors">
                  <ArrowUpRight size={16} className="text-[#E60000]" /> STUNT DAY
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
                <span className="font-oswald text-4xl text-[#E60000]">03</span>
                <h3 className="font-bebas text-4xl text-white tracking-wide leading-none">TECNOLOGÍA</h3>
              </div>
              <p className="text-[#888888] text-[15px] leading-relaxed mb-4">PKS es nuestro ecosistema digital que conecta pilotos, organización, marcas y audiencia en tiempo real.</p>
              <button className="bg-transparent border border-[#E60000]/30 text-white hover:border-[#E60000] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm w-max transition-colors flex items-center gap-2">
                CONOCE PKS <ArrowUpRight size={14} className="text-[#E60000]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEC 3: STATS BAR (ANIMATED) */}
      <AnimatedStatsSection />

      {/* SEC 4: LOGO STRIP */}
      <section className="py-10 overflow-hidden bg-[#080808]">
        <div className="max-w-[1400px] mx-auto px-6 mb-12 text-center">
          <span className="text-[#888888] font-inter font-medium text-[11px] uppercase tracking-[0.15em]">MARCAS QUE CONFÍAN EN NOSOTROS</span>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex items-center justify-center md:justify-start [&_img]:max-w-none animate-marquee gap-16 md:gap-24 px-8">
            {[...SPONSOR_LOGOS, ...SPONSOR_LOGOS].map((logo, idx) => (
              <img key={idx} src={logo.src} alt={logo.alt} className="h-8 md:h-12 object-contain transition-transform duration-300 hover:scale-105 cursor-pointer" />
            ))}
          </div>
        </div>
      </section>

      {/* SEC 5: PORTFOLIO - NUESTRO EVENTOS PROPIOS (REDiseñado) */}
      <section className="pt-10 pb-14 bg-[#0a0a0a]">
        <div className="text-center mb-10 px-6">
          <h2 className="font-bebas text-[48px] text-white tracking-wider uppercase">NUESTROS EVENTOS PROPIOS</h2>
        </div>
        
        {/* Full-width grid container with 3px gap and zero lateral margins */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-[3px] px-[3px]">
          {[
            { 
              title: 'COPA STUNT COLOMBIA', 
              desc: 'El campeonato de stunt más importante del país.', 
              img: '/sponsors/stunt2026negro.jpeg',
              label: 'EVENTO PROPIO'
            },
            { 
              title: 'STUNT DAY', 
              desc: 'El encuentro que reúne la cultura stunt.', 
              img: '/sponsors/stunt_day_nitrox.png',
              label: 'EVENTO PROPIO'
            },
            { 
              title: 'NUEVOS FORMATOS', 
              desc: 'Desarrollamos experiencias y competencias a la medida.', 
              img: '/sponsors/carrera_observaciones.png',
              label: 'EVENTO DE CLIENTES'
            },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="group relative w-full h-[320px] bg-[#0a0a0a] rounded-none overflow-hidden cursor-pointer transition-all duration-500 shadow-2xl flex flex-col justify-between p-[28px] sm:p-[32px] select-none"
            >
              {/* Left-side accent border - Glowing and vibrant */}
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-[#FF1E27] to-[#C8102E] shadow-[2px_0_15px_rgba(255,30,39,0.5)] z-30" />

              {/* Background action photo with zoom and custom gradient overlay */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <img 
                  src={item.img} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] filter blur-[1.5px]"
                />
                {/* Overlay: Stronger dark overlay on the left to guarantee 100% text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 to-black/25 opacity-95 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              </div>

              {/* Card Content - Top Area */}
              <div className="relative z-20">
                <span className="text-[#FF3A3A] font-inter font-bold text-[11px] uppercase tracking-[0.25em] block mb-3 drop-shadow-[0_0_6px_rgba(255,58,58,0.5)]">
                  {item.label}
                </span>
              </div>

              {/* Card Content - Middle Area */}
              <div className="relative z-20 my-auto">
                <h3 className="font-bebas text-[38px] sm:text-[42px] text-white tracking-wide leading-[1.0] uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
                  {item.title}
                </h3>
                <p className="text-[#e2e2e2] text-[14px] font-inter font-light mt-3 leading-relaxed max-w-[90%] drop-shadow-[0_2px_8px_rgba(0,0,0,1)] line-clamp-2">
                  {item.desc}
                </p>
              </div>
              
              {/* Card Content - Bottom Area */}
              <div className="relative z-20 mt-auto">
                <div className="inline-flex items-center justify-center bg-transparent border-[1.5px] border-white/60 text-white text-[12px] font-inter font-semibold tracking-widest px-6 py-2.5 rounded-none transition-all duration-300 group-hover:bg-[#FF1E27] group-hover:border-[#FF1E27] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,30,39,0.6)] w-fit">
                  CONOCE MÁS <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 6: ECOSYSTEM (PKS) */}
      <section className="py-14 bg-gradient-to-b from-[#080808] to-[#111111] border-y border-[#1C1C1C]">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center mb-4">
              <img src="/sponsors/PKS Blanco.png" alt="PKS" className="h-12 object-contain" />
            </div>
            <span className="text-[#E60000] font-inter font-bold text-[12px] uppercase tracking-widest block mb-6">NUESTRO ECOSISTEMA DIGITAL</span>
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
                  <feat.icon className="text-[#E60000] w-6 h-6 shrink-0" strokeWidth={2} />
                  <h4 className="font-inter text-[11px] font-bold text-white tracking-widest leading-[1.4] uppercase">{feat.title}</h4>
                </div>
              ))}
            </div>
            
            <button className="mt-14 bg-transparent border border-[#E60000] text-[#E60000] hover:bg-[#E60000] hover:text-white font-inter font-bold text-xs px-8 py-3 tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2 w-max">
              CONOCE PKS <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="relative mt-12 xl:mt-0 flex justify-center xl:justify-end">
            <div className="absolute inset-0 bg-[#E60000] opacity-[0.03] blur-[150px] rounded-full"></div>
            {/* Mockup Placeholder that mimics the laptop + phone layout */}
            <div className="relative z-10 w-full max-w-[700px] aspect-[16/10] bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
               <img src="/sponsors/fondo1.jpg" className="w-full h-full object-cover opacity-20 mix-blend-screen" alt="Mockup Laptop" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
               <div className="absolute text-center">
                 <p className="font-bebas text-4xl text-white tracking-wider mb-2">DASHBOARD CENTRAL</p>
                 <p className="text-[#E60000] text-xs font-bold tracking-widest">[ LAPTOP MOCKUP PLACEHOLDER ]</p>
               </div>
               {/* Phone overlay */}
               <div className="absolute -right-2 -bottom-2 md:-right-4 md:-bottom-4 w-[120px] h-[240px] md:w-[200px] md:h-[400px] bg-[#111] border-[3px] md:border-4 border-black rounded-[20px] md:rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden z-20 transform -rotate-6">
                 <img src="/sponsors/stunt2026negro.jpeg" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Mockup Phone" />
                 <div className="absolute text-center px-2 md:px-4">
                   <p className="font-bebas text-sm md:text-xl text-white tracking-wider mb-1 md:mb-2">RIDER PASS</p>
                   <p className="text-[#E60000] text-[8px] md:text-[10px] font-bold tracking-widest leading-tight">[ PHONE MOCKUP ]</p>
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
            { tag: '¿ERES PILOTO?', role: 'PORTAL DEL PILOTO', color: 'border-[#1C1C1C] hover:border-[#E60000]', items: ['Inscríbete a nuestros eventos', 'Gestiona tu información', 'Pagos y documentos', 'Tu QR y accesos'], btnText: 'IR AL PORTAL', btnColor: 'bg-transparent border border-[#E60000] text-white hover:bg-[#E60000] hover:text-white', onClick: () => { setAuthIsLogin(false); setAuthMode('default'); setShowAuthModal(true); } },
            { tag: '¿ERES PROVEEDOR O COLABORADOR?', role: 'PORTAL DE PROVEEDORES', color: 'border-[#1C1C1C] hover:border-[#E60000]', items: ['Radica tu cuenta de cobro', 'Sube tu factura', 'Consulta estado de pago', 'Descarga certificados', 'Historial de transacciones'], btnText: 'IR AL PORTAL', btnColor: 'border border-[#E60000] text-[#E60000] hover:bg-[#E60000] hover:text-black', onClick: () => { setAuthIsLogin(false); setAuthMode('staff'); setShowAuthModal(true); } },
            { tag: 'SISTEMA DE COBROS', role: 'TRABAJEMOS JUNTOS', color: 'border-[#1C1C1C] hover:border-[#E60000]', items: ['Colaboradores', 'Proveedores', 'Prestadores de servicios', 'Pagos seguros y rápidos'], btnText: 'CONTACTANOS', btnColor: 'bg-transparent border border-[#E60000] text-white hover:bg-[#E60000] hover:text-white', onClick: () => { window.open('https://www.instagram.com/paskinesstunt/', '_blank'); } },
          ].map((portal, i) => (
            <div key={i} className={`group bg-[#0A0A0A] border rounded-xl p-8 transition-colors ${portal.color} flex flex-col`}>
              <span className="text-[#888888] font-inter font-bold text-[10px] uppercase tracking-widest mb-2 block">{portal.tag}</span>
              <h3 className="font-bebas text-4xl text-white mb-8 tracking-wide">{portal.role}</h3>
              <ul className="space-y-4 mb-10 flex-1">
                {portal.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-3 text-[14px] text-[#A0A0A0] font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#E60000]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button className={`w-max font-inter font-bold text-[11px] uppercase tracking-widest py-3 px-6 rounded-sm transition-colors flex items-center gap-2 ${portal.btnColor}`} onClick={portal.onClick}>
                {portal.btnText} <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SEC 8: CTA FINAL */}
      <section className="py-24 border-t border-[#1C1C1C] px-6 relative overflow-hidden bg-[url('/sponsors/fondo1.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50"></div>
        <div className="relative z-10 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div>
            <h2 className="font-bebas text-5xl md:text-6xl text-white tracking-wide mb-2">
              ¿TIENES UN PROYECTO EN MENTE?
            </h2>
            <p className="text-[#A0A0A0] text-sm md:text-base font-medium tracking-wide uppercase">
              HABLEMOS Y CONSTRUYAMOS ALGO EXTRAORDINARIO.
            </p>
          </div>
          <button className="bg-[#E60000] hover:bg-[#CC0000] text-white font-inter font-bold text-[12px] uppercase tracking-widest px-10 py-4 rounded-sm flex items-center justify-center w-full md:w-max gap-2 transition-colors shrink-0">
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
                <a href="https://www.instagram.com/paskinesstunt/" target="_blank" rel="noopener noreferrer" className="text-[#888888] hover:text-white transition-colors"><Instagram size={20} /></a>
                <a href="#" className="text-[#888888] hover:text-white transition-colors"><Facebook size={20} /></a>
                <a href="#" className="text-[#888888] hover:text-white transition-colors"><PlayCircle size={20} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">EMPRESA</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Nosotros</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Servicios</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Clientes</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Trabaja con nosotros</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">PROPIEDADES</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Copa Stunt Colombia</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Stunt Day</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Reglamentos</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Resultados</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-inter text-[11px] font-bold text-[#888888] uppercase tracking-widest mb-6">PLATAFORMA</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">PKS</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Portal del Piloto</a></li>
                <li><a href="#" className="text-white hover:text-[#E60000] text-[14px] transition-colors">Portal de Proveedores</a></li>
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
              className="absolute top-4 right-4 text-[#E60000] hover:text-white transition-colors z-50 p-2"
            >
              <X size={24} />
            </button>
            <AuthForm 
              mode={authMode} 
              externalIsLogin={authIsLogin} 
              onToggleAuthMode={setAuthIsLogin} 
              onBackToMenu={() => {
                setShowAuthModal(false);
                setIsMobileMenuOpen(true);
                setIsInscripcionesOpen(true);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* GALLERY MODAL */}
      <Dialog open={showGalleryModal} onOpenChange={setShowGalleryModal}>
        <DialogContent className="max-w-[95vw] md:max-w-fit w-fit bg-black border border-[#1C1C1C] text-white p-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/95">
          <DialogTitle className="sr-only">Galería de Eventos</DialogTitle>
          
          {/* Photo Area */}
          <div className="relative w-fit h-fit max-w-full flex items-center justify-center bg-[#050505] overflow-hidden">
            <img 
              src={GALLERY_IMAGES[currentGalleryIndex]} 
              alt={`Gallery ${currentGalleryIndex + 1}`}
              className="h-[85vh] md:h-[90vh] max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] w-auto object-contain block mx-auto"
            />
            
            {/* Logos flotantes dentro de la foto (superior izquierda) - Sin fondo negro, integrados como marca de agua */}
            <div className="absolute left-4 top-4 flex items-center gap-3 z-20 pointer-events-none select-none">
              <img 
                src="/sponsors/PKS Blanco.png" 
                alt="PKS" 
                className="h-5 sm:h-7 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]" 
              />
              <div className="w-px h-4 sm:h-5 bg-white/30 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]" />
              <img 
                src="/sponsors/copa stunt nitrox f2r.png" 
                alt="Copa Stunt Nitrox F2R" 
                className="h-7 sm:h-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]" 
              />
            </div>

            {/* Contador flotante dentro de la foto (inferior derecha) */}
            <div className="absolute right-4 bottom-4 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg text-xs font-semibold tracking-widest text-white/90 shadow-lg z-20 uppercase">
              {currentGalleryIndex + 1} / {GALLERY_IMAGES.length}
            </div>

            <button 
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-[#E60000] text-white p-2.5 rounded-full transition-all z-10 hover:scale-110 backdrop-blur-sm shadow-md"
              onClick={() => setCurrentGalleryIndex((prev) => prev === 0 ? GALLERY_IMAGES.length - 1 : prev - 1)}
            >
              <ChevronLeft size={28} />
            </button>

            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-[#E60000] text-white p-2.5 rounded-full transition-all z-10 hover:scale-110 backdrop-blur-sm shadow-md"
              onClick={() => setCurrentGalleryIndex((prev) => prev === GALLERY_IMAGES.length - 1 ? 0 : prev + 1)}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
