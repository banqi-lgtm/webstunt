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
        style={{ backgroundImage: "url('https://img1.wallspic.com/previews/6/0/3/8/28306/28306-motocicleta-stunt_artista_interprete_o_ejecutante-deporte_extremo-las_carreras_de_motos-automovilismo-x750.jpg')" }}
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
              href="https://www.facebook.com/copasstuntcolombia" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:scale-110 overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/facebook.png" alt="Facebook" className="w-full h-full object-cover" />
            </a>
            <a 
              href="https://www.instagram.com/copastuntcolombia/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all hover:scale-110 overflow-hidden bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/sponsors/Logo instagram.jpg" alt="Instagram" className="w-full h-full object-cover" />
            </a>
          </div>
          <div className="mt-2 text-zinc-600">&copy; {new Date().getFullYear()} Paskines Stunt &middot; Copa Stunt Colombia</div>
        </footer>
      </div>
    </div>
  );
}
