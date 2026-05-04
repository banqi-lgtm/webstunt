'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, CalendarDays, LogOut, Shield, Users, Menu, Star, LayoutDashboard, Search, FileText, CheckCircle, XCircle, Clock, ShieldCheck, Flag, Settings, Smartphone, Bell, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          } else {
            const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user?.email || '');
            setIsAdmin(isSuperAdmin);
            if (isSuperAdmin) {
              setHasPilotosAccess(true);
              setHasStaffAccess(true);
            }
          }
        } catch (e) {
          console.error("Error al obtener interfaces de usuario", e);
        }
      } else {
        setHasPilotosAccess(false);
        setHasStaffAccess(false);
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

  const dynamicLinks = [...baseLinks];
  if (hasPilotosAccess) {
    dynamicLinks.push({ href: '/pilotos', label: 'Pilotos', icon: Users });
  }
  if (hasStaffAccess) {
    dynamicLinks.push({ href: '/staff', label: 'Staff', icon: Star });
  }
  if (isAdmin) {
    dynamicLinks.push({ href: '/admin', label: 'Panel Admin', icon: Shield });
  }

  const hasMoreThanTwo = dynamicLinks.length > 2;

  const NavButton = ({ link, isActive }: { link: any, isActive: boolean }) => {
    const isPilotos = link.href === '/pilotos';
    const isAdminLink = link.href === '/admin';
    const isStaff = link.href === '/staff';
    
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
        <div style={{position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, backdropFilter: 'blur(5px)'}}>
          <div style={{width: '280px', height: '100%', backgroundColor: '#111', borderRight: '1px solid #39FF14', padding: '20px', display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
              <img src="/sponsors/PKS Blanco.png" alt="PKS" style={{ height: '30px' }} />
              <button onClick={() => setIsMobileMenuOpen(false)} style={{background:'none', border:'none', color:'white', fontSize:'1.5rem', cursor: 'pointer'}}>✕</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '1.2rem', fontFamily: 'Orbitron'}}>
              {dynamicLinks.map(link => {
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

      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
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
            {dynamicLinks.map((link) => (
              <NavButton key={link.href} link={link} isActive={pathname === link.href} />
            ))}
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
