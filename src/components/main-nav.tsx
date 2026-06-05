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

const baseLinks = [
  { href: '/profile', label: 'Mi Perfil', icon: User },
  { href: '/inscripcion', label: 'Inscripción F2R', icon: CalendarDays },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPilotosAccess, setHasPilotosAccess] = useState(false);
  const [hasStaffAccess, setHasStaffAccess] = useState(false);
  const [hasWhatsAppAccess, setHasWhatsAppAccess] = useState(false);
  const [hasJuecesAccess, setHasJuecesAccess] = useState(false);
  const [hasQrAccess, setHasQrAccess] = useState(false);
  const [hasCodigosAccess, setHasCodigosAccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const interfaces = data.interfaces || [];
            
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

  const allLinks = [...baseLinks, ...adminLinks];

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
      activeClass = 'bg-zinc-800 text-white border border-green-500/20';
      inactiveClass = 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-green-500/10';
      iconClass = 'h-4 w-4 text-green-500';
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
          <div style={{width: '280px', height: '100%', backgroundColor: '#111', borderRight: '1px solid #39FF14', padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
              <img src="/sponsors/PKS Blanco.png" alt="PKS" style={{ height: '30px' }} />
              <button onClick={() => setIsMobileMenuOpen(false)} style={{background:'none', border:'none', color:'white', fontSize:'1.5rem', cursor: 'pointer'}}>✕</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '1.2rem', fontFamily: 'Orbitron'}}>
              {allLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} style={{color: isActive ? '#39FF14' : 'white', display: 'flex', alignItems: 'center', gap: '10px'}} onClick={() => setIsMobileMenuOpen(false)}>
                    <link.icon style={{ width: '20px', height: '20px' }} />
                    {link.label}
                  </Link>
                );
              })}
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
          {/* MOBILE NAV: Hamburger Drawer (Visible only on mobile) */}
          <div className="flex xl:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#39FF14', fontSize: '2.2rem', cursor: 'pointer', lineHeight: 1 }}>☰</button>
          </div>
          
          <Link href="/profile" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-6 md:h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Center/Right: Navigation */}
        <div className="flex items-center gap-2 overflow-hidden ml-4">
          
          {/* DESKTOP NAV */}
          <nav className="hidden xl:flex items-center gap-1.5 md:gap-2">
            {baseLinks.map((link) => (
              <NavButton key={link.href} link={link} isActive={pathname === link.href} />
            ))}
            
            {adminLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-9 md:h-10 px-3 md:px-4 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent">
                    <Settings className="h-4 w-4 text-[#00ff88]" />
                    <span className="font-semibold text-xs md:text-sm whitespace-nowrap">Herramientas</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#050816] border-[#00ff88]/30 min-w-[200px]" align="start">
                  {adminLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <DropdownMenuItem key={link.href} asChild className="focus:bg-[#00ff88]/10 cursor-pointer">
                        <Link 
                          href={link.href} 
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-zinc-300 hover:text-white'}`}
                        >
                          <link.icon className={`h-4 w-4 ${isActive ? 'text-[#00ff88]' : 'text-zinc-400'}`} />
                          <span className="font-semibold">{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          <div className="h-6 w-px bg-zinc-800 mx-1 md:mx-2 hidden sm:block"></div>

          {/* Log out button */}
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="h-9 w-9 p-0 md:w-auto md:px-4 md:gap-2 text-red-400 hover:text-red-300 hover:bg-red-950/40 shrink-0"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline font-semibold">Cerrar</span>
          </Button>
          
        </div>
      </div>
    </header>
    </>
  );
}
