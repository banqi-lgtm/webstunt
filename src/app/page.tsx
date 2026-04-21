import { AuthForm } from '@/components/auth-form';

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex flex-col items-center justify-center p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      
      {/* Animated glowing orbs */}
      <div className="absolute top-1/4 -left-10 md:left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse opacity-50"></div>
      <div className="absolute bottom-1/4 -right-10 md:right-1/4 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse opacity-40" style={{ animationDelay: '4s' }}></div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Brand/Logo Area */}
        <div className="mb-8 text-center animate-in slide-in-from-top-10 fade-in duration-700">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-2">
            Circuito<span className="text-primary">Control</span>
          </h1>
          <p className="text-zinc-400 font-medium tracking-wide">
            Gestión integral de eventos
          </p>
        </div>

        {/* Auth Form Component */}
        <AuthForm />
        
        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-zinc-500 animate-in fade-in duration-1000 delay-500">
          &copy; {new Date().getFullYear()} Circuito Control. Todos los derechos reservados.
        </div>
      </div>
    </main>
  );
}
