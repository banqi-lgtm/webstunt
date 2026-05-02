'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, CalendarDays, LogOut, Shield, Users, Menu, ChevronDown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const isSuperAdmin = user?.email === 'wg12435@hotmail.com';
      setIsAdmin(isSuperAdmin);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const interfaces = data.interfaces || [];
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
          } else if (isSuperAdmin) {
            setHasPilotosAccess(true);
            setHasStaffAccess(true);
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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 md:px-8 w-full max-w-none">
        
        {/* Left side: Logo */}
        <div className="flex items-center">
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

          {/* MOBILE NAV: Agrupado en Dropdown */}
          <div className="flex xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-9 bg-zinc-900 border-zinc-700 text-zinc-300 px-3">
                  <Menu className="h-4 w-4" />
                  <span className="font-bold text-xs">Módulos</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 p-2 shadow-2xl">
                {dynamicLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <DropdownMenuItem key={link.href} asChild className={`cursor-pointer mb-1 rounded-md p-0 ${isActive ? 'bg-zinc-800/50' : ''}`}>
                      <Link href={link.href} className="flex items-center w-full px-3 py-2.5">
                        <link.icon className={`h-4 w-4 mr-3 ${link.href === '/pilotos' ? 'text-blue-500' : link.href === '/staff' ? 'text-purple-400' : link.href === '/admin' ? 'text-green-500' : 'text-zinc-400'}`} />
                        <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-zinc-300'}`}>{link.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
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
  );
}
