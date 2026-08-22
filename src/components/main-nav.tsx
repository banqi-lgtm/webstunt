'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, CalendarDays, LogOut, Shield, Users, Menu, Star, LayoutDashboard, Search, FileText, CheckCircle, XCircle, Clock, ShieldCheck, Flag, Settings, Smartphone, Bell, Video, ClipboardList, QrCode, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const profileLinks = [
  { href: '/profile?tab=inicio', label: 'Inicio', icon: LayoutDashboard },
  { href: '/profile?tab=cuentas', label: 'Mis cuentas de cobro', icon: FileText },
  { href: '/profile?tab=info', label: 'Mi información', icon: User },
];

const baseLinks = [
  { href: '/inscripcion', label: 'Inscripciones Pilotos', icon: CalendarDays },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPilotosAccess, setHasPilotosAccess] = useState(false);
  const [hasStaffAccess, setHasStaffAccess] = useState(false);
  const [hasWhatsAppAccess, setHasWhatsAppAccess] = useState(false);
  const [hasJuecesAccess, setHasJuecesAccess] = useState(false);
  const [hasQrAccess, setHasQrAccess] = useState(false);
  const [hasCodigosAccess, setHasCodigosAccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [userRol, setUserRol] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const interfaces = data.interfaces || [];
            setUserRol(data.rol || data.role || '');
            
            const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user?.email || '') || interfaces.includes('admin');
            setIsAdmin(isSuperAdmin);

            if (isSuperAdmin || interfaces.includes('pilotos')) {
              setHasPilotosAccess(true);
            } else {
              setHasPilotosAccess(false);
            }
            if (isSuperAdmin || interfaces.includes('staff')) {
              setHasStaffAccess(true);
            } else {
              setHasStaffAccess(false);
            }
            if (isSuperAdmin || interfaces.includes('jueces')) {
              setHasJuecesAccess(true);
            } else {
              setHasJuecesAccess(false);
            }
            if (isSuperAdmin || interfaces.includes('qr')) {
              setHasQrAccess(true);
            } else {
              setHasQrAccess(false);
            }
            if (isSuperAdmin || interfaces.includes('codigos')) {
              setHasCodigosAccess(true);
            } else {
              setHasCodigosAccess(false);
            }
          } else {
            const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user?.email || '');
            setIsAdmin(isSuperAdmin);
            if (isSuperAdmin) {
              setHasPilotosAccess(true);
              setHasStaffAccess(true);
              setHasJuecesAccess(true);
              setHasQrAccess(true);
              setHasCodigosAccess(true);
            }
          }
        } catch (e) {
          console.error("Error al obtener interfaces de usuario", e);
        }
      } else {
        setHasPilotosAccess(false);
        setHasStaffAccess(false);
        setHasJuecesAccess(false);
        setHasQrAccess(false);
        setHasCodigosAccess(false);
        setUserRol('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const adminLinks = [];
  if (hasPilotosAccess) {
    adminLinks.push({ href: '/pilotos', label: 'Pilotos', icon: Users });
  }
  if (hasStaffAccess) {
    adminLinks.push({ href: '/staff', label: 'Staff', icon: Star });
  }
  if (hasJuecesAccess) {
    adminLinks.push({ href: '/jueces', label: 'Jueces', icon: ClipboardList });
  }
  if (hasQrAccess) {
    adminLinks.push({ href: '/qr', label: 'QRs', icon: QrCode });
  }
  if (hasCodigosAccess) {
    adminLinks.push({ href: '/codigos', label: 'Códigos', icon: FileText });
  }
  if (isAdmin) {
    adminLinks.push({ href: '/admin', label: 'Panel Admin', icon: Shield });
  }

  const filteredProfileLinks = (userRol === 'staff' || userRol === 'admin')
    ? profileLinks
    : [
        { href: '/profile?tab=inicio', label: 'Inicio', icon: LayoutDashboard },
        { href: '/inscripcion', label: 'Mi información', icon: User },
      ];

  const finalBaseLinks = (userRol === 'staff' || userRol === 'admin') ? [] : [];
  const allLinks = [...filteredProfileLinks, ...finalBaseLinks, ...adminLinks];

  const isLinkActive = (href: string) => {
    if (href.startsWith('/inscripcion')) {
      return pathname === '/inscripcion';
    }
    if (href.startsWith('/profile')) {
      if (pathname !== '/profile') return false;
      const urlParams = new URLSearchParams(href.includes('?') ? href.split('?')[1] : '');
      const tabParam = urlParams.get('tab');
      const currentTab = searchParams?.get('tab') || 'inicio';
      return tabParam ? currentTab === tabParam : true;
    }
    return pathname === href;
  };

  const NavButton = ({ link, isActive }: { link: any, isActive: boolean }) => {
    const isPilotos = link.href === '/pilotos';
    const isAdminLink = link.href === '/admin';
    const isStaff = link.href === '/staff';
    const isJueces = link.href === '/jueces';
    const isQr = link.href === '/qr';
    const isCodigos = link.href === '/codigos';
    
    let activeClass = 'bg-zinc-800 text-white border border-transparent';
    let inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent';
    let iconClass = 'h-4 w-4';
    
    if (isPilotos) {
      activeClass = 'bg-zinc-800 text-white border border-blue-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-blue-500/10';
      iconClass = 'h-4 w-4 text-blue-500';
    } else if (isAdminLink) {
      activeClass = 'bg-zinc-800 text-white border border-red-600/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-red-600/10';
      iconClass = 'h-4 w-4 text-red-600';
    } else if (isStaff) {
      activeClass = 'bg-zinc-800 text-white border border-purple-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-purple-500/10';
      iconClass = 'h-4 w-4 text-purple-400';
    } else if (isJueces) {
      activeClass = 'bg-zinc-800 text-white border border-yellow-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-yellow-500/10';
      iconClass = 'h-4 w-4 text-yellow-500';
    } else if (isQr) {
      activeClass = 'bg-zinc-800 text-white border border-cyan-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-cyan-500/10';
      iconClass = 'h-4 w-4 text-cyan-400';
    } else if (isCodigos) {
      activeClass = 'bg-zinc-800 text-white border border-rose-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-rose-500/10';
      iconClass = 'h-4 w-4 text-rose-500';
    }

    return (
      <Link href={link.href}>
        <Button 
          variant={isActive ? "secondary" : "ghost"} 
          className={`gap-2 h-9 md:h-10 px-3 md:px-4 ${isActive ? activeClass : inactiveClass}`}
        >
          <link.icon className={iconClass} />
          <span className="font-semibold text-xs md:text-sm whitespace-nowrap">{link.label}</span>
        </Button>
      </Link>
    );
  };

  return (
    <>
      {/* MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="print:hidden" style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)'}}>
          <div style={{width: '280px', height: '100%', backgroundColor: '#111', borderRight: '1px solid #E60000', padding: '20px', display: 'flex', flexDirection: 'column', overflowX: 'hidden'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <img src="/sponsors/PKS Blanco.png" alt="PKS" style={{ height: '24px', objectFit: 'contain' }} />
                <span style={{color: '#3f3f46', fontSize: '0.9rem'}}>|</span>
                <img src="/sponsors/Mobil Blanco.png" alt="Mobil Super" style={{ height: '36px', objectFit: 'contain' }} />
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} style={{background:'none', border:'none', color:'white', fontSize:'1.5rem', cursor: 'pointer'}}>✕</button>
            </div>
            <div className="scrollbar-hide" style={{display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '1.2rem', fontFamily: 'Orbitron', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '20px'}}>
              
              {/* Seccion Mi Perfil */}
              <div>
                <div 
                  onClick={() => {
                    setIsProfileExpanded(!isProfileExpanded);
                    if (!isProfileExpanded) setIsAdminExpanded(false);
                  }}
                  style={{width: '100%', background: 'none', border: 'none', outline: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.2rem', fontFamily: 'Orbitron', cursor: 'pointer', padding: 0}}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <User style={{ width: '20px', height: '20px' }} />
                    Mi Perfil
                  </div>
                  <ChevronDown style={{ width: '20px', height: '20px', transform: isProfileExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </div>
                
                {isProfileExpanded && (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', paddingLeft: '30px', fontSize: '1.1rem'}}>
                    {filteredProfileLinks.map(link => {
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link key={link.href} href={link.href} style={{color: isActive ? '#E60000' : 'white', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.2s'}} onClick={() => setIsMobileMenuOpen(false)}>
                          <link.icon style={{ width: '18px', height: '18px' }} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seccion Base Links */}
              {finalBaseLinks.map(link => {
                const isActive = isLinkActive(link.href);
                return (
                  <Link key={link.href} href={link.href} style={{color: isActive ? '#E60000' : 'white', display: 'flex', alignItems: 'center', gap: '10px'}} onClick={() => setIsMobileMenuOpen(false)}>
                    <link.icon style={{ width: '20px', height: '20px' }} />
                    {link.label}
                  </Link>
                );
              })}

              {/* Seccion Herramientas (Admin) */}
              {adminLinks.length > 0 && (
                <div>
                  <div 
                    onClick={() => {
                      setIsAdminExpanded(!isAdminExpanded);
                      if (!isAdminExpanded) setIsProfileExpanded(false);
                    }}
                    style={{width: '100%', background: 'none', border: 'none', outline: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.2rem', fontFamily: 'Orbitron', cursor: 'pointer', padding: 0}}
                  >
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <Settings style={{ width: '20px', height: '20px' }} />
                      Herramientas
                    </div>
                    <ChevronDown style={{ width: '20px', height: '20px', transform: isAdminExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                  </div>
                  
                  {isAdminExpanded && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', paddingLeft: '30px', fontSize: '1.1rem'}}>
                      {adminLinks.map(link => {
                        const isActive = pathname === link.href;
                        return (
                          <Link key={link.href} href={link.href} style={{color: isActive ? '#E60000' : 'white', display: 'flex', alignItems: 'center', gap: '10px', transition: 'color 0.2s'}} onClick={() => setIsMobileMenuOpen(false)}>
                            <link.icon style={{ width: '18px', height: '18px' }} />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{marginTop: 'auto'}}>
              <button onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }} style={{background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid #ff4444', padding: '10px 20px', borderRadius: '8px', width: '100%', fontFamily: 'Orbitron', cursor: 'pointer'}}>CERRAR SESIÓN</button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md print:hidden">
      <div className="flex h-16 items-center justify-between px-3 md:px-8 w-full max-w-none">
        
        {/* Left side: Logo & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {/* UNIVERSAL NAV: Hamburger Drawer */}
          <div className="flex">
            <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#E60000', fontSize: '2.2rem', cursor: 'pointer', lineHeight: 1 }}>☰</button>
          </div>
          
          <Link href="/profile" className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-6 md:h-8 w-auto object-contain" />
            <span className="text-zinc-600 text-sm md:text-lg select-none">|</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/Mobil Blanco.png" alt="Mobil Super" className="h-10 md:h-[44px] w-auto object-contain" />
          </Link>
        </div>

        {/* Nav Moved to Drawer */}
      </div>
    </header>
    </>
  );
}
