'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, CalendarDays, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

const links = [
  { href: '/profile', label: 'Mi Perfil', icon: User },
  { href: '/inscripcion', label: 'Inscripción F2R', icon: CalendarDays },
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === 'wg12435@hotmail.com');
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/50 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 w-full max-w-none">
        
        {/* Left side: Logo & Navigation */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/profile" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-6 md:h-8 w-auto object-contain" />
          </Link>
          
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    className={`gap-2 h-10 ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="font-semibold">{link.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            {isAdmin && (
              <Link href="/admin">
                <Button 
                  variant={pathname === '/admin' ? "secondary" : "ghost"} 
                  className={`gap-2 h-10 border border-green-500/20 ${pathname === '/admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                >
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-400">Panel Admin</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>

        {/* Right side: Log out button */}
        <Button 
          onClick={handleSignOut} 
          variant="outline" 
          className="h-9 gap-2 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-950/40 bg-zinc-900/50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline font-semibold">Cerrar Sesión</span>
        </Button>
      </div>
    </header>
  );
}
