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
    { type: 'header', label: 'DOCUMENTOS' },
    { id: 'info', label: 'Mi información', icon: UserCircle },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0D0D0D] text-zinc-300 font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative top-[64px] lg:top-0 bottom-0 left-0 w-[280px] bg-[#0A0A0A] border-r border-[#1A1A1A] flex flex-col z-40 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* MOBILE HEADER INSIDE SIDEBAR */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <span className="text-white font-bold text-sm tracking-widest">MENÚ</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'header') {
              return (
                <div key={idx} className="px-6 pt-6 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
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
                className={`w-full flex items-center justify-between px-6 py-3.5 text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#E60000]/10 to-transparent text-[#E60000] border-l-[4px] border-[#E60000]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-l-[4px] border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#E60000]' : 'text-zinc-500'}`} />
                  {item.label}
                </div>
                {(item as any).badge && (
                  <span className="bg-[#E60000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {(item as any).badge}
                  </span>
                )}
              </button>
            );
          })}

        </nav>

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
          <header className="flex flex-col lg:flex-row items-start lg:items-end justify-between px-6 lg:px-10 pt-4 lg:pt-6 pb-6 lg:pb-10 gap-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-wider leading-none mb-4">
                PORTAL DE <br />
                <span className="text-[#E60000]">PROVEEDORES</span>
              </h1>
              <div className="text-zinc-400 text-sm">
                <span className="text-white font-bold text-2xl lg:text-3xl block mb-2">Bienvenido, {userName}</span>
                <span className="lg:inline hidden">Administra tus documentos, cuentas de cobro y consulta el estado de tus pagos.</span>
              </div>
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
