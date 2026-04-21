'use client';

import { AuthForm } from '@/components/auth-form';
import { Button } from '@/components/ui/button';
import { LogIn, Star, Gift, ShieldAlert, MapPin, Calendar, Smartphone } from 'lucide-react';

export default function Home() {
  const triggerLogin = () => {
    window.location.hash = '#login';
    window.location.reload();
  };

  // Sponsor logos mapped to precise filenames
  const sponsors = [
    { name: "Copa Stunt Nitrox F2R", file: "copa stunt nitrox f2r.png" },
    { name: "Fedemoto Colombia", file: "Fedemoto.png" },
    { name: "Mobil", file: "Mobil Blanco.png" },
    { name: "IRC Tire", file: "IRC Blanco.png" },
    { name: "Copa Stunt", file: "Copa Stunt Nitrox Blanco.png" },
    { name: "Nitrox", file: "Nitrox Blanco.png" },
    { name: "Victory Motorcycles", file: "Victory Blanco.png" },
    { name: "Trakku", file: "Trakku.png" },
    { name: "PKS", file: "PKS Blanco.png" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black flex flex-col items-center selection:bg-green-500 selection:text-black">
      
      {/* Background Ambience */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-30 brightness-50 mix-blend-luminosity z-0 pointer-events-none"
        style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDzaVuxtCY_AusMRO-aMQj4FO9geAfOKi5Zg&s')" }}
      ></div>

      {/* Navigation Header */}
      <nav className="w-full relative z-50 px-4 md:px-8 py-4 flex justify-between items-center max-w-[1400px] mx-auto bg-black/60 backdrop-blur-xl border-b border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sponsors/PKS Blanco.png" alt="Paskines Stunt" className="h-6 md:h-8 w-auto object-contain" />
        </div>
        <Button onClick={triggerLogin} className="bg-green-500 text-black font-extrabold hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
          Iniciar Sesión <LogIn className="w-4 h-4 ml-2 text-black" />
        </Button>
      </nav>

      {/* Hero Mega-Section */}
      <section className="relative z-10 w-full flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 xl:gap-14 pt-8 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto">
        
        {/* Left Box: Event Info styled as Street Racing */}
        <div className="w-full xl:flex-1 bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
          
          {/* Internal Glow Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] pointer-events-none transition-all group-hover:bg-green-500/20"></div>

          <div className="relative text-left space-y-8 text-zinc-300">
            {/* Main Header */}
            <div>
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold tracking-widest uppercase text-xs md:text-sm">
                5ta Versión • 2026
              </div>
              <img 
                src="/sponsors/copa stunt nitrox f2r.png" 
                alt="Copa Stunt Nitrox F2R" 
                className="h-28 md:h-36 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] mb-2"
              />
              <h1 className="sr-only">Copa Stunt F2R Repuestos NITROX</h1>
            </div>

            <p className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl text-zinc-200">
              Vive una experiencia increíble. Tendremos muchas sorpresas para los asistentes y unos <strong className="text-white">premios increíbles</strong> para los competidores. Así que no te quedes por fuera, es un evento único, queremos que sea una experiencia inolvidable. <br className="hidden md:block"/>
              <span className="italic text-zinc-400 mt-2 block">Dirigido a Hombres y Mujeres deportistas que vibran por el stunt.</span>
            </p>

            {/* Essential Data Grid */}
            <div className="grid md:grid-cols-2 gap-4">
               <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-green-400 font-black tracking-wide uppercase"><Calendar className="w-5 h-5"/> Fechas y Costos</div>
                 <ul className="space-y-2 text-sm">
                   <li><strong className="text-white">Ordinarias:</strong> 16 abr al 10 may - $280.000</li>
                   <li><strong className="text-white">Extemporales:</strong> 10 al 15 may - $350.000</li>
                   <li className="text-zinc-500 italic pt-1">No se realizarán devoluciones de dinero.</li>
                 </ul>
               </div>

               <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-green-400 font-black tracking-wide uppercase"><Gift className="w-5 h-5"/> El Costo Incluye</div>
                 <ul className="space-y-1 text-sm list-disc list-inside">
                   <li>Escarapela 4 días (21-25 may '25)</li>
                   <li>Boleta para un acompañante</li>
                   <li>Póliza deportiva de competencia</li>
                   <li>Kit sorpresa de patrocinadores</li>
                   <li className="text-white font-bold tracking-wide pt-1">Rifa Moto 0Km a tu casa</li>
                 </ul>
               </div>
            </div>

            {/* Warning block */}
            <div className="flex items-start gap-4 p-5 bg-green-500/5 border border-green-500/20 rounded-2xl">
               <ShieldAlert className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
               <div className="text-sm font-medium space-y-1.5 text-zinc-400">
                 <strong className="text-green-500 block uppercase tracking-wider mb-2">Reglamento</strong>
                 <p>• Nos reservamos el derecho de admisión y permanencia.</p>
                 <p>• La organización solo se hará responsable por pilotos que cumplan el reglamento a cabalidad.</p>
                 <p>• Menores de edad deben estar acompañados por un adulto responsable (asumirá toda la responsabilidad).</p>
               </div>
            </div>

            {/* Footer Signoff */}
            <div className="pt-6 border-t border-zinc-800/80 flex flex-col items-start gap-2">
              <div className="flex items-center gap-3 bg-zinc-900 py-2 px-4 rounded-full border border-zinc-800">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Plaza Mayor - Medellín</span>
              </div>
              <p className="font-medium text-zinc-500 mt-2 text-sm uppercase tracking-widest">¡Conecta, Impulsa, Transforma! <br/> Organiza: Paskines Stunt S.A.S. & Feria 2 Ruedas</p>
            </div>

          </div>
        </div>

        {/* Right Box: The Form Header/Logic */}
        <div className="w-full xl:w-[500px] flex-shrink-0 relative mt-4 xl:mt-0 xl:sticky xl:top-24">
          <div className="flex flex-col items-center justify-center mb-8 xl:mb-10 text-center xl:hidden text-white">
            <h2 className="text-2xl font-black tracking-widest italic uppercase border-b-4 border-green-500 pb-2">Inscripciones</h2>
          </div>
          <AuthForm />
        </div>
      </section>

      {/* ====== SPONSOR BANNER WITH REAL LOGOS - Moved BELOW main form ====== */}
      <div className="w-full relative z-40 py-10 overflow-hidden"
        style={{ 
          backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDzaVuxtCY_AusMRO-aMQj4FO9geAfOKi5Zg&s')",
          backgroundSize: 'cover', 
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay on wood/dark texture */}
        <div className="absolute inset-0 bg-black/80"></div>

        {/* Fading Edges */}
        <div className="absolute top-0 left-0 w-16 md:w-32 h-full bg-gradient-to-r from-black via-black/80 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 md:w-32 h-full bg-gradient-to-l from-black via-black/80 to-transparent z-20 pointer-events-none"></div>

        {/* Marquee Track */}
        <div className="relative z-10 flex animate-marquee items-center" style={{ width: 'max-content' }}>
          {/* Repeat 3x for seamless loop */}
          {[0, 1, 2].map((setIdx) => (
            <div key={setIdx} className="flex items-center gap-0">
              {sponsors.map((sponsor, i) => (
                <div key={`${setIdx}-${i}`} className="flex justify-center items-center px-8 md:px-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/sponsors/${sponsor.file}`}
                    alt={sponsor.name}
                    className="h-16 md:h-24 w-auto object-contain brightness-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full relative z-10 py-8 border-t border-zinc-900/50 bg-black text-center text-xs text-zinc-600 backdrop-blur-xl">
        &copy; {new Date().getFullYear()} Paskines Stunt &middot; Copa Stunt Colombia. Todos los derechos reservados.
      </footer>
    </main>
  );
}

