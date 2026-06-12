'use client';

import React, { useState } from 'react';
import { Home, FileText, CheckCircle, Clock, HelpCircle, Bell, ChevronRight, UserCircle, Plus, Menu, X } from 'lucide-react';
import Image from 'next/image';

interface StaffPortalLayoutProps {
  userName: string;
  userDocument: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  saldoPorCobrar: number;
}

export function StaffPortalLayout({
  userName,
  userDocument,
  activeTab,
  setActiveTab,
  children,
  saldoPorCobrar
}: StaffPortalLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { type: 'header', label: 'GESTIÓN' },
    { id: 'cuentas', label: 'Mis cuentas de cobro', icon: FileText },
    { id: 'pagos', label: 'Pagos y comprobantes', icon: CheckCircle },
    { id: 'certificaciones', label: 'Certificaciones', icon: FileText },
    { id: 'historial', label: 'Historial', icon: Clock },
    { type: 'header', label: 'DOCUMENTOS' },
    { id: 'info', label: 'Mi información', icon: UserCircle },
    { id: 'rut', label: 'RUT', icon: FileText },
    { id: 'banco', label: 'Certificación bancaria', icon: FileText },
    { type: 'header', label: 'COMUNICACIÓN' },
    { id: 'avisos', label: 'Avisos y notificaciones', icon: Bell, badge: 3 },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0D0D0D] text-zinc-300 font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-[280px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* MOBILE HEADER INSIDE SIDEBAR */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Image src="/sponsors/pks.png" alt="PKS Logo" width={100} height={30} />
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* LOGO DESKTOP */}
        <div className="hidden lg:block p-6 border-b border-[#1A1A1A]/50">
          <Image src="/sponsors/pks.png" alt="PKS Logo" width={120} height={40} />
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'header') {
              return (
                <div key={idx} className="px-4 pt-6 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                  {item.label}
                </div>
              );
            }
            
            const isActive = activeTab === item.id;
            const Icon = item.icon!;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id!)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all rounded-md ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#E60000]/10 to-transparent text-[#E60000] border-l-[3px] border-[#E60000]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-l-[3px] border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#E60000]' : 'text-zinc-500'}`} />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="bg-[#E60000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="px-2 pt-6">
            <button className="w-full bg-[#E60000] hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-between transition-colors shadow-lg shadow-red-900/20">
              <span className="text-sm text-left leading-tight">Realiza tu cuenta<br/>de cobro</span>
              <Plus className="w-5 h-5 opacity-70" />
            </button>
          </div>
        </nav>

        <div className="p-4 m-4 bg-[#111111] border border-[#222222] rounded-xl relative overflow-hidden flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-[#E60000] flex-shrink-0 mt-0.5" />
          <div className="relative z-10">
            <h4 className="text-white font-bold text-sm mb-1">¿Necesitas ayuda?</h4>
            <p className="text-[11px] text-zinc-500 mb-2 leading-tight">
              Nuestro equipo está para apoyarte.
            </p>
            <a href="https://wa.me/message" target="_blank" rel="noreferrer" className="text-[#E60000] hover:text-red-400 text-xs font-semibold hover:underline">
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Image inside Main */}
        <div 
          className="absolute inset-0 bg-cover bg-top pointer-events-none z-0 mix-blend-luminosity opacity-10"
          style={{ backgroundImage: "url('/sponsors/Diseño sin título.png')" }}
        />
        
        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          
          {/* MOBILE HEADER */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-[#1A1A1A] sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1">
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-white font-bold text-sm">PROVEEDORES</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer">
                <Bell className="w-5 h-5 text-zinc-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E60000] rounded-full border-2 border-[#0A0A0A]"></span>
              </div>
              <UserCircle className="w-7 h-7 text-zinc-500" />
            </div>
          </div>

          {/* TOP HEADER */}
          <header className="flex flex-col lg:flex-row items-start lg:items-end justify-between px-6 lg:px-10 pt-8 lg:pt-12 pb-6 lg:pb-10 gap-6">
            <div>
              <h1 className="text-3xl lg:text-[40px] font-black text-white uppercase tracking-wider leading-none mb-4">
                PORTAL DE <br />
                <span className="text-[#E60000]">PROVEEDORES</span>
              </h1>
              <p className="text-zinc-400 text-sm">
                <span className="text-white font-medium">Bienvenido, {userName}</span><br className="hidden lg:block"/>
                <span className="lg:inline hidden">Administra tus documentos, cuentas de cobro y consulta el estado de tus pagos.</span>
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-6 w-full lg:w-auto">
              <div className="hidden lg:flex items-center gap-5 text-sm font-medium text-zinc-400">
                <button className="flex items-center gap-2 hover:text-white transition-colors">
                  <HelpCircle className="w-4 h-4" /> Ayuda
                </button>
                <div className="relative cursor-pointer">
                  <Bell className="w-5 h-5 hover:text-white transition-colors" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E60000] rounded-full border-2 border-[#0D0D0D]"></span>
                </div>
                <div className="flex items-center gap-3 pl-5 border-l border-zinc-800 cursor-pointer">
                  <UserCircle className="w-9 h-9 text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold">{userName}</span>
                    <span className="text-zinc-500 text-xs">Proveedor</span>
                  </div>
                </div>
              </div>
              
              {/* SALDO BOX */}
              <div className="bg-[#111111]/80 backdrop-blur-md border border-[#222222] rounded-xl p-5 w-full lg:w-72 shadow-2xl">
                <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Saldo por cobrar</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">$ {saldoPorCobrar.toLocaleString('es-CO')}</span>
                  <span className="text-xs text-zinc-500 font-medium">COP</span>
                </div>
                <button 
                  onClick={() => setActiveTab('historial')}
                  className="text-[#E60000] text-xs font-semibold hover:text-red-400 flex items-center gap-1 group"
                >
                  Ver detalle <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          {/* DYNAMIC CONTENT CONTAINER */}
          <div className="px-4 lg:px-10 pb-10">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="px-4 lg:px-10 pb-6 mt-10 border-t border-[#1A1A1A] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
            <p>© 2024 Paskines Stunt S.A.S. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Términos y condiciones</a>
              <span className="text-zinc-800">|</span>
              <a href="#" className="hover:text-white transition-colors">Política de privacidad</a>
              <span className="text-zinc-800">|</span>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
          </footer>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0A0A0A; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}} />
    </div>
  );
}
