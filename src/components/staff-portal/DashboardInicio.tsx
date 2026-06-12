import React from 'react';
import { PlusCircle, FileUp, Search, MessageCircle, ChevronRight, FileText, CheckCircle2, AlertCircle, Building2, Download, Eye, Calendar } from 'lucide-react';

interface DashboardInicioProps {
  setActiveTab: (tab: string) => void;
  rutUrl: string | null;
  certUrl: string | null;
  totalAcumulado: number;
  saldoPorCobrar: number;
  historial: any[];
}

export function DashboardInicio({ setActiveTab, rutUrl, certUrl, totalAcumulado, saldoPorCobrar, historial }: DashboardInicioProps) {
  
  // Fake data if history is empty
  const mockHistorial = historial.length > 0 ? historial : [
    { id: 1, fecha: '15/05/2024', concepto: 'Servicios de producción - Copa Stunt #2', valor: 2500000, estado: 'PENDIENTE DE PAGO' },
    { id: 2, fecha: '28/04/2024', concepto: 'Servicios de logística - Stunt Day', valor: 1800000, estado: 'PAGADO' },
    { id: 3, fecha: '10/04/2024', concepto: 'Alquiler de equipos - Evento especial', valor: 950000, estado: 'PAGADO' },
  ];

  const totalPagado = totalAcumulado - saldoPorCobrar > 0 ? totalAcumulado - saldoPorCobrar : 1800000;
  const tAcumuladoDisplay = totalAcumulado || 5250000;
  const tSaldoDisplay = saldoPorCobrar || 3450000;

  return (
    <div className="space-y-6">
      
      {/* ACCIONES RÁPIDAS */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 lg:p-6 shadow-lg">
        <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-5">Acciones rápidas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          
          <button onClick={() => setActiveTab('cuentas')} className="bg-[#0D0D0D] border border-[#222222] hover:border-[#E60000] rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 text-left transition-all duration-200 group">
            <div className="p-2.5 rounded-full border border-[#222222] group-hover:bg-[#E60000]/10 group-hover:border-[#E60000] group-hover:text-[#E60000] text-zinc-400 transition-colors">
              <PlusCircle className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-white text-xs lg:text-sm font-bold mb-0.5 leading-tight group-hover:text-[#E60000] transition-colors">Realiza tu cuenta <br className="hidden lg:block"/>de cobro</h4>
              <p className="text-[10px] lg:text-[11px] text-zinc-500 hidden lg:block">Crea y envía tu cuenta de cobro fácilmente.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E60000] hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => setActiveTab('rut')} className="bg-[#0D0D0D] border border-[#222222] hover:border-[#E60000] rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 text-left transition-all duration-200 group">
            <div className="p-2.5 rounded-full border border-[#222222] group-hover:bg-[#E60000]/10 group-hover:border-[#E60000] group-hover:text-[#E60000] text-zinc-400 transition-colors">
              <FileUp className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-white text-xs lg:text-sm font-bold mb-0.5 leading-tight group-hover:text-[#E60000] transition-colors">Sube tus <br className="hidden lg:block"/>documentos</h4>
              <p className="text-[10px] lg:text-[11px] text-zinc-500 hidden lg:block">Adjunta o actualiza tu RUT y cert. bancaria.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E60000] hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => setActiveTab('pagos')} className="bg-[#0D0D0D] border border-[#222222] hover:border-[#E60000] rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 text-left transition-all duration-200 group">
            <div className="p-2.5 rounded-full border border-[#222222] group-hover:bg-[#E60000]/10 group-hover:border-[#E60000] group-hover:text-[#E60000] text-zinc-400 transition-colors">
              <Search className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-white text-xs lg:text-sm font-bold mb-0.5 leading-tight group-hover:text-[#E60000] transition-colors">Consulta tus <br className="hidden lg:block"/>pagos</h4>
              <p className="text-[10px] lg:text-[11px] text-zinc-500 hidden lg:block">Revisa el estado y detalle de tus pagos.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E60000] hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </button>

          <button onClick={() => setActiveTab('avisos')} className="bg-[#0D0D0D] border border-[#222222] hover:border-[#E60000] rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 text-left transition-all duration-200 group relative">
            <div className="p-2.5 rounded-full border border-[#222222] group-hover:bg-[#E60000]/10 group-hover:border-[#E60000] group-hover:text-[#E60000] text-zinc-400 transition-colors relative">
              <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6" />
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#E60000] rounded-full border-2 border-[#0D0D0D]"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-white text-xs lg:text-sm font-bold mb-0.5 leading-tight group-hover:text-[#E60000] transition-colors">Avisos y <br className="hidden lg:block"/>notificaciones</h4>
              <p className="text-[10px] lg:text-[11px] text-zinc-500 hidden lg:block">Mantente al día con info. importante.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#E60000] hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </button>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* FORMULARIO CUENTA DE COBRO */}
        <div className="xl:col-span-7 bg-[#111111] border border-[#222222] rounded-xl p-6 shadow-lg">
          <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase mb-6">Realiza tu cuenta de cobro</h3>
          
          {/* STEPPER */}
          <div className="flex items-center justify-between mb-8 relative px-2">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#222222] -z-10"></div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] pr-2">
              <div className="w-7 h-7 rounded-full bg-[#E60000] shadow-[0_0_10px_rgba(230,0,0,0.4)] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">1</div>
              <span className="text-white text-[11px] font-bold mt-1 sm:mt-0 uppercase tracking-wide">Información</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] px-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">2</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Documentos</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] px-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">3</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Resumen</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#111111] pl-2">
              <div className="w-7 h-7 rounded-full border border-[#333] bg-[#1A1A1A] text-zinc-500 flex items-center justify-center text-xs font-bold ring-4 ring-[#111111]">4</div>
              <span className="text-zinc-500 text-[11px] font-medium mt-1 sm:mt-0 uppercase tracking-wide">Enviado</span>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Tipo de documento</label>
              <select disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none opacity-80 cursor-not-allowed">
                <option>Cédula de ciudadanía</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Número de documento</label>
              <input type="text" value="1.234.567.890" disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Nombre completo</label>
              <input type="text" value="Juan Pérez" disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Correo electrónico</label>
              <input type="email" value="juanperez@gmail.com" disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Teléfono de contacto</label>
              <input type="text" value="300 123 4567" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Concepto de la cuenta de cobro</label>
              <input type="text" placeholder="Ej. Servicios de producción evento Copa Stunt" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Valor total</label>
              <input type="text" placeholder="$ 2.500.000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Fecha de emisión</label>
              <div className="relative">
                <input type="date" defaultValue="2024-05-15" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none" />
                <Calendar className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1A1A1A]">
            <button className="w-full sm:w-auto bg-[#E60000] hover:bg-red-700 text-white font-bold text-sm px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95">
              Continuar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOCUMENTOS REQUERIDOS */}
        <div className="xl:col-span-5 bg-[#111111] border border-[#222222] rounded-xl p-6 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase">Documentos requeridos</h3>
            <span className="bg-[#00ff00]/10 text-[#00ff00] text-[10px] font-bold px-2 py-1 rounded">PERFIL 100%</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            
            {/* RUT BOX */}
            <div className="bg-[#0D0D0D] border border-[#222222] hover:border-[#333] transition-colors rounded-xl p-4 flex gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg h-fit border border-[#222]">
                <FileText className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">RUT</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight">Adjunta tu RUT actualizado.</p>
                  </div>
                </div>
                
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                    <div>
                      <a href={rutUrl || '#'} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-[#E60000] hover:underline block truncate max-w-[150px]">
                        RUT_JuanPerez.pdf
                      </a>
                      <span className="text-[10px] text-zinc-500">245 KB • 12/05/2024</span>
                    </div>
                  </div>
                  <button className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider">Actualizar</button>
                </div>
              </div>
            </div>

            {/* CERTIFICACION BOX */}
            <div className="bg-[#0D0D0D] border border-[#222222] hover:border-[#333] transition-colors rounded-xl p-4 flex gap-4">
              <div className="p-3 bg-zinc-900 rounded-lg h-fit border border-[#222]">
                <Building2 className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-0.5">Certificación bancaria</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight">Adjunta tu certificación<br className="hidden sm:block"/>bancaria actualizada.</p>
                  </div>
                </div>
                
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                    <div>
                      <a href={certUrl || '#'} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-[#E60000] hover:underline block truncate max-w-[150px]">
                        Cert_Bancaria.pdf
                      </a>
                      <span className="text-[10px] text-zinc-500">312 KB • 12/05/2024</span>
                    </div>
                  </div>
                  <button className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider">Actualizar</button>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-4 flex gap-3 text-zinc-500 items-start bg-[#1A1A1A]/30 p-3 rounded-lg border border-[#222]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-zinc-300 font-semibold mr-1">Importante:</strong>
                El RUT y la certificación bancaria son necesarios para validar tu información y garantizar el correcto proceso de pago.
              </p>
            </div>

          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* MIS CUENTAS DE COBRO */}
        <div className="xl:col-span-8 bg-[#111111] border border-[#222222] rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase">Mis cuentas de cobro</h3>
            <button onClick={() => setActiveTab('cuentas')} className="text-[#E60000] text-xs font-semibold hover:text-red-400 flex items-center gap-1 group">
              Ver todas <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* TABLE FOR DESKTOP */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500 border-b border-[#222222] text-[11px] tracking-wider uppercase">
                <tr>
                  <th className="pb-4 font-semibold px-2">#</th>
                  <th className="pb-4 font-semibold">Fecha</th>
                  <th className="pb-4 font-semibold">Concepto</th>
                  <th className="pb-4 font-semibold">Valor</th>
                  <th className="pb-4 font-semibold">Estado</th>
                  <th className="pb-4 font-semibold">Comprobante</th>
                  <th className="pb-4 font-semibold text-center">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {mockHistorial.map((item: any, i) => (
                  <tr key={item.id} className="text-zinc-300 hover:bg-[#1A1A1A]/50 transition-colors group">
                    <td className="py-4 px-2 text-zinc-500 text-xs font-mono">{i + 1}</td>
                    <td className="py-4 text-xs">{item.fecha || (item.cobradoEl ? new Date(item.cobradoEl).toLocaleDateString() : '')}</td>
                    <td className="py-4 truncate max-w-[200px] text-xs" title={item.descripcion || item.concepto}>{item.descripcion || item.concepto}</td>
                    <td className="py-4 font-mono text-white">${Number(item.valor).toLocaleString('es-CO')}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        item.estado === 'PENDIENTE DE PAGO' ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' : 
                        item.estado === 'PAGADO' ? 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00]' : 
                        'border-zinc-700 bg-zinc-800 text-zinc-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.estado === 'PENDIENTE DE PAGO' ? 'bg-orange-500' : 
                          item.estado === 'PAGADO' ? 'bg-[#00ff00]' : 'bg-zinc-500'
                        }`} />
                        {item.estado === 'cobrado' ? 'PENDIENTE DE PAGO' : (item.estado || 'DESCONOCIDO')}
                      </span>
                    </td>
                    <td className="py-4 text-xs">
                      {item.estado === 'PAGADO' ? (
                        <a href="#" className="flex items-center gap-1.5 text-[#E60000] hover:text-red-400 hover:underline">
                          <FileText className="w-3 h-3" />
                          Comp_00{i+1}.pdf 
                          <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </a>
                      ) : <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="py-4 text-center">
                      <button className="p-2 bg-[#222] hover:bg-[#E60000] rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS FOR MOBILE */}
          <div className="md:hidden flex flex-col gap-4">
            {mockHistorial.map((item: any, i) => (
              <div key={item.id} className="bg-[#0A0A0A] border border-[#222] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-md text-[10px] font-bold tracking-wide uppercase ${
                    item.estado === 'PENDIENTE DE PAGO' ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' : 
                    item.estado === 'PAGADO' ? 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00]' : 
                    'border-zinc-700 bg-zinc-800 text-zinc-400'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      item.estado === 'PENDIENTE DE PAGO' ? 'bg-orange-500' : 
                      item.estado === 'PAGADO' ? 'bg-[#00ff00]' : 'bg-zinc-500'
                    }`} />
                    {item.estado === 'cobrado' ? 'PENDIENTE DE PAGO' : (item.estado || 'DESCONOCIDO')}
                  </span>
                  <span className="text-xs text-zinc-500">{item.fecha}</span>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-semibold">{item.descripcion || item.concepto}</h4>
                  <p className="text-[#E60000] font-mono font-bold text-base mt-1">${Number(item.valor).toLocaleString('es-CO')}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]">
                   {item.estado === 'PAGADO' ? (
                      <a href="#" className="flex items-center gap-1.5 text-zinc-400 text-xs hover:text-white">
                        <Download className="w-3.5 h-3.5" /> Descargar comprobante
                      </a>
                    ) : <span className="text-zinc-600 text-xs">Sin comprobante</span>}
                    <button className="text-white bg-[#222] p-2 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
          
        </div>

        {/* RESUMEN DE PAGOS */}
        <div className="xl:col-span-4 bg-[#111111] border border-[#222222] rounded-xl p-6 flex flex-col shadow-lg">
          <h3 className="text-[#E60000] font-bold text-xs tracking-wider uppercase mb-6">Resumen de pagos</h3>
          
          <div className="flex-1 flex flex-col gap-6 justify-center">
            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-zinc-700 rounded-full"></div>
                <span className="text-zinc-400 text-xs lg:text-sm font-medium">Total cuentas de cobro</span>
              </div>
              <span className="text-white font-mono font-bold text-base lg:text-lg">$ {tAcumuladoDisplay.toLocaleString('es-CO')}</span>
            </div>

            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-[#00ff00] rounded-full"></div>
                <span className="text-zinc-400 text-xs lg:text-sm font-medium">Total pagado</span>
              </div>
              <span className="text-[#00ff00] font-mono font-bold text-base lg:text-lg">$ {totalPagado.toLocaleString('es-CO')}</span>
            </div>

            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-10 bg-orange-500 rounded-full"></div>
                <span className="text-zinc-400 text-xs lg:text-sm font-medium">Total pendiente</span>
              </div>
              <span className="text-orange-500 font-mono font-bold text-base lg:text-lg">$ {tSaldoDisplay.toLocaleString('es-CO')}</span>
            </div>

            <div className="mt-4">
              <button className="w-full px-4 py-3.5 border border-[#333] hover:border-[#E60000] hover:bg-[#E60000]/5 text-white text-xs uppercase font-bold tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 group">
                Ver detalle completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
