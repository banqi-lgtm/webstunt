import { MainNav } from '@/components/main-nav';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 relative">
      {/* Background Image for Dashboard */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none z-0"
        style={{ backgroundImage: "url('/sponsors/Diseño%20sin%20título.png')" }}
      />
      <div className="fixed inset-0 bg-zinc-950/70 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 w-full relative">
          {children}
        </main>
        
        {/* Dashboard Footer with Static Social Icons */}
        <footer className="w-full relative z-10 py-6 border-t border-zinc-900/50 bg-black/80 text-center text-xs text-zinc-600 backdrop-blur-md flex flex-col items-center mt-auto">
          <div className="flex flex-row gap-4 my-2">
            <a 
              href="https://facebook.com/copastuntcolombia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(24,119,242,0.4)]">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                <path fill="#fff" d="M16.671 15.542l.532-3.469h-3.328V9.822c0-.949.465-1.874 1.956-1.874h1.514V5.006s-1.375-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.633H7.078v3.469h3.047v8.385a12.09 12.09 0 003.875 0v-8.385h2.671z"/>
              </svg>
            </a>
            <a 
              href="https://instagram.com/copastuntcolombia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(225,48,108,0.4)]">
                <defs>
                  <linearGradient id="ig-grad-dashboard" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="25%" stopColor="#e6683c"/>
                    <stop offset="50%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <path fill="url(#ig-grad-dashboard)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          </div>
          <div className="mt-2 text-zinc-600">&copy; {new Date().getFullYear()} Paskines Stunt &middot; Copa Stunt Colombia</div>
        </footer>
      </div>
    </div>
  );
}
