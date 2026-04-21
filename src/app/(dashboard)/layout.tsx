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
      </div>
    </div>
  );
}
