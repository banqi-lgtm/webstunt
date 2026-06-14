'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, X, FileDown, Loader2, Printer } from 'lucide-react';
import { SignaturePad } from '@/components/SignaturePad';

interface Concepto {
  item: number;
  descripcion: string;
  valor: number;
  retencionMotivo?: string | null;
  retencionPorcentaje?: number | null;
}

interface CuentaDeCobroProps {
  numero: string;
  fecha: string;
  cobradorNombre: string;
  cobradorDocumento: string;
  valorTotal: number;
  conceptos: Concepto[];
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  ciudad?: string;
  firmaPrevia?: string;
  isHistorical?: boolean;
  onClose: () => void;
  onConfirm: (firmaData: string) => void;
}

export function CuentaDeCobro({
  numero,
  fecha,
  cobradorNombre,
  cobradorDocumento,
  valorTotal,
  conceptos,
  banco,
  tipoCuenta,
  numeroCuenta,
  ciudad,
  firmaPrevia,
  isHistorical,
  onClose,
  onConfirm
}: CuentaDeCobroProps) {
  const [firma, setFirma] = useState<string>(firmaPrevia || '');
  const [isSigned, setIsSigned] = useState<boolean>(!!firmaPrevia);
  
  // Si es histórica, mostramos de una vez la vista previa. Si no, pedimos la firma primero en el modal oscuro.
  const [showPreview, setShowPreview] = useState<boolean>(!!isHistorical);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Format date to: BELLO, ANTIOQUIA. 29 de mayo de 2026
  const dateObj = new Date(fecha);
  const formattedDate = dateObj.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  // Format ID for PDF: Extract consecutive from PKS-[Initials][Num] and prepend CC-
  const displayNumero = React.useMemo(() => {
    if (!numero) return '';
    const match = numero.match(/PKS-[A-Z]+(\d+)$/i);
    if (match) {
      return `CC-${match[1]}`;
    }
    return numero;
  }, [numero]);

  // Calculate retenciones
  const retencionesMap: Record<string, { porcentaje: number, totalBase: number, valorRetenido: number }> = {};
  conceptos.forEach(c => {
    if (c.retencionPorcentaje && c.retencionPorcentaje > 0) {
      const key = `${c.retencionMotivo || 'Retención'} (${c.retencionPorcentaje}%)`;
      if (!retencionesMap[key]) {
        retencionesMap[key] = { porcentaje: c.retencionPorcentaje, totalBase: 0, valorRetenido: 0 };
      }
      retencionesMap[key].totalBase += c.valor;
      retencionesMap[key].valorRetenido += c.valor * (c.retencionPorcentaje / 100);
    }
  });

  const totalRetenido = Object.values(retencionesMap).reduce((sum, r) => sum + r.valorRetenido, 0);
  const granTotal = valorTotal - totalRetenido;

  const handleConfirmAndPrint = () => {
    if (!firma && !isHistorical) {
      alert("Debes firmar el documento para continuar.");
      return;
    }
    
    setIsGenerating(true);
    setIsSigned(true);
    
    // Llamar a firebase
    if (!isHistorical) {
      onConfirm(firma);
    }
    
    // Mostrar la factura y mandar a imprimir automáticamente
    setShowPreview(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 500);
  };

  const handlePrintOnly = () => {
    window.print();
  };

  // --- ESTADO 1: MODAL OSCURO PARA FIRMAR ---
  if (!showPreview) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl w-full max-w-lg">
          <CardHeader className="border-b border-zinc-800/50 flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl text-white">Confirmar y Firmar</CardTitle>
              <CardDescription className="text-zinc-400">Revisa el valor y firma para generar tu cuenta de cobro.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-emerald-400/80 font-medium mb-1">Total a cobrar</p>
                <p className="text-2xl font-bold text-emerald-400">${valorTotal.toLocaleString('es-CO')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400 mb-1">Cuenta N°</p>
                <p className="font-mono text-white font-medium">{numero}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-rose-400">Dibuja tu firma para autorizar el documento:</p>
              <div className="bg-white rounded-lg p-1 overflow-hidden">
                <SignaturePad onSign={setFirma} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700 hover:text-white">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmAndPrint}
                disabled={isGenerating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando PDF...</>
                ) : (
                  <><FileDown className="w-4 h-4 mr-2" /> Confirmar y Descargar</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- ESTADO 2: VISTA PREVIA HTML (FACTURA GENERADA) ---
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          html, body {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0;
            padding: 0;
          }
          #print-wrapper {
            visibility: visible;
            position: absolute !important; 
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          #print-wrapper * {
            visibility: visible;
          }
          #printable-invoice {
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
          }
          .no-print, .no-print * { 
            visibility: hidden !important;
            display: none !important; 
          }
        }
      `}} />

      <div id="print-wrapper" className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto p-4 pt-16 md:pt-8 md:p-8 flex items-start justify-center">
        
        {/* Controls (Hidden in print) */}
        <div className="fixed top-4 right-4 flex gap-2 z-10 no-print">
          <Button onClick={handlePrintOnly} className="bg-[#0D1B3E] text-white hover:bg-[#0A0A0A] font-bold uppercase tracking-widest text-xs h-9 shadow-lg">
            <Printer className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Imprimir / PDF</span>
          </Button>
          <Button variant="outline" size="icon" onClick={onClose} className="h-9 w-9 bg-white text-black border-zinc-300 hover:bg-zinc-100 shadow-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Container */}
        <div id="printable-invoice" className="bg-white text-[#0A0A0A] w-full max-w-[850px] relative shadow-2xl font-sans shrink-0 border border-[#0A0A0A]/10">
          
          {/* GOOGLE FONTS IMPORT FOR PRINT/PDF */}
          <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@300;400;600&display=swap');
            .font-barlow { font-family: 'Barlow Condensed', sans-serif; }
            .font-inter { font-family: 'Inter', sans-serif; }
          `}} />

          <div className="flex flex-col font-inter justify-between" style={{ minHeight: '800px' }}>
            
            {/* FULL WIDTH HEADER */}
            <div className="bg-[#0D1B3E] text-white print:text-black p-6 md:p-8 print:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-barlow text-3xl md:text-4xl print:text-3xl uppercase tracking-wide font-bold">PASKINES STUNT S.A.S.</h1>
                <p className="text-xs md:text-sm print:text-xs font-light opacity-80 mt-1 tracking-wider">NIT: 902.028.450-5</p>
              </div>
              <div className="text-left sm:text-right border-t border-white/20 sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto">
                <h2 className="font-barlow text-xl md:text-2xl print:text-xl uppercase tracking-wider font-medium text-white/90 print:text-black">Cuenta de Cobro</h2>
                <p className="font-barlow text-2xl md:text-3xl print:text-2xl font-bold mt-1 text-white print:text-black">N° {displayNumero}</p>
              </div>
            </div>

            {/* BODY CONTAINER */}
            <div className="p-4 md:p-8 print:p-6 flex-1 flex flex-col justify-between space-y-6 print:space-y-4">
              
              <div className="space-y-6 print:space-y-4">
                {/* FECHA */}
                <div className="border-b border-[#0A0A0A]/20 pb-4 print:pb-2">
                  <p className="text-xs md:text-sm print:text-xs font-medium text-[#0A0A0A]">Ciudad y Fecha: {(ciudad || 'BELLO, ANTIOQUIA').toUpperCase()}. <span className="font-light">{formattedDate}</span></p>
                </div>

                {/* DATA GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-[#0A0A0A] bg-white print:grid-cols-2">
                  <div className="p-3 md:p-4 print:p-3 border-b sm:border-b-0 sm:border-r border-[#0A0A0A] print:border-b-0 print:border-r">
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[#0D1B3E] mb-1">Debe A:</p>
                    <p className="font-barlow text-lg md:text-xl uppercase font-bold text-[#0A0A0A]">{cobradorNombre}</p>
                    <p className="text-xs md:text-sm print:text-xs text-[#0A0A0A] font-light mt-1">C.C. {cobradorDocumento}</p>
                  </div>
                  <div className="p-3 md:p-4 print:p-3 flex flex-col justify-center bg-[#0D1B3E] text-white print:text-black">
                    <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-white/70 print:text-black mb-1">La Suma De:</p>
                    <p className="font-barlow text-3xl md:text-4xl print:text-3xl font-bold tracking-wide">${valorTotal.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                {/* CONCEPTOS TABLE */}
                <div>
                  <h3 className="font-barlow text-lg font-bold text-[#0D1B3E] uppercase tracking-wide mb-2 flex items-center">
                    <span className="w-4 h-0.5 bg-[#0D1B3E] mr-2"></span> Concepto
                  </h3>
                  <table className="w-full text-left text-sm print:text-xs border-collapse border border-[#0A0A0A]">
                    <thead>
                      <tr className="bg-[#0D1B3E] text-white print:text-black">
                        <th className="py-2 px-3 font-semibold border border-[#0A0A0A] w-12 text-center">N°</th>
                        <th className="py-2 px-3 font-semibold border border-[#0A0A0A]">Descripción del servicio prestado</th>
                        <th className="py-2 px-3 font-semibold border border-[#0A0A0A] w-32 text-right">Valor Bruto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conceptos.map((c, i) => (
                        <tr key={i} className="bg-white">
                          <td className="py-2.5 px-3 text-center border border-[#0A0A0A] font-light text-[#0A0A0A]">{c.item}</td>
                          <td className="py-2.5 px-3 border border-[#0A0A0A] font-light text-[#0A0A0A]">{c.descripcion}</td>
                          <td className="py-2.5 px-3 text-right border border-[#0A0A0A] font-semibold text-[#0A0A0A]">${c.valor.toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#0A0A0A]/5">
                        <td colSpan={2} className="py-2.5 px-4 text-right font-bold text-[#0A0A0A] border border-[#0A0A0A]">SUBTOTAL:</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#0A0A0A] border border-[#0A0A0A]">${valorTotal.toLocaleString('es-CO')}</td>
                      </tr>
                      
                      {Object.entries(retencionesMap).map(([motivoKey, data], idx) => (
                        <tr key={`ret-${idx}`} className="bg-white">
                          <td colSpan={2} className="py-2.5 px-4 text-right font-light text-[#0A0A0A] border border-[#0A0A0A]">
                            Retención en la Fuente <span className="font-semibold">{motivoKey}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-[#0A0A0A] border border-[#0A0A0A]">
                            -${data.valorRetenido.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}

                      {Object.keys(retencionesMap).length > 0 && (
                        <tr className="bg-[#0D1B3E] text-white print:text-black">
                          <td colSpan={2} className="py-3 px-4 text-right font-bold tracking-wider border border-[#0A0A0A]">TOTAL A PAGAR:</td>
                          <td className="py-3 px-4 text-right font-bold tracking-wider border border-[#0A0A0A]">${granTotal.toLocaleString('es-CO')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* LEGAL NOTE */}
                {totalRetenido === 0 && (
                  <div className="border-l-4 border-[#0D1B3E] bg-[#0A0A0A]/5 p-4 print:p-3 text-xs font-light text-justify text-[#0A0A0A] leading-relaxed">
                    <span className="font-semibold">Nota:</span> Solicito amablemente aplicar retención en la fuente de conformidad con el Art. 383 del Estatuto Tributario (retención en la fuente por honorarios/servicios para personas naturales), manifestando bajo la gravedad de juramento que no he contratado ni vinculado a dos (2) o más trabajadores asociados a la actividad por un término igual o superior a 90 días continuos o discontinuos dentro de un mismo periodo gravable.
                  </div>
                )}
              </div>

              {/* FOOTER - BIPARTITE */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-8 print:grid print:grid-cols-2 print:gap-4 mt-8 pt-4 border-t border-[#0A0A0A]/20" style={{ pageBreakInside: 'avoid' }}>
                {/* SIGNATURE */}
                <div>
                  <h3 className="font-barlow text-lg font-bold text-[#0D1B3E] uppercase tracking-wide mb-2">Firma de quien cobra</h3>
                  <div className="h-20 print:h-16 mb-2 relative border-b border-[#0A0A0A] flex items-end">
                    {firma ? (
                      <img src={firma} alt="Firma" className="absolute bottom-0 left-0 h-full max-w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span className="text-[#0A0A0A]/40 italic text-sm mb-2 font-light">Firma digital registrada en sistema</span>
                    )}
                  </div>
                  <p className="font-barlow text-xl print:text-lg uppercase font-bold text-[#0A0A0A]">{cobradorNombre}</p>
                  <p className="text-xs text-[#0A0A0A] font-light mt-0.5">C.C. {cobradorDocumento}</p>
                </div>

                {/* BANK INFO */}
                <div>
                  <h3 className="font-barlow text-lg font-bold text-[#0D1B3E] uppercase tracking-wide mb-2">Datos Bancarios</h3>
                  <div className="border border-[#0A0A0A] p-4 print:p-3 bg-white text-sm print:text-xs">
                    <div className="flex justify-between border-b border-[#0A0A0A]/10 pb-2 mb-2">
                      <span className="font-semibold text-[#0A0A0A]">Banco:</span>
                      <span className="font-light">{banco}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#0A0A0A]/10 pb-2 mb-2">
                      <span className="font-semibold text-[#0A0A0A]">Tipo:</span>
                      <span className="font-light">{tipoCuenta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-[#0A0A0A]">Número:</span>
                      <span className="font-light tracking-wider">{numeroCuenta}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
