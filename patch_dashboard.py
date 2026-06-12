import sys
import re

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { PlusCircle, FileUp, Search, MessageCircle, ChevronRight, FileText, CheckCircle2, AlertCircle, Building2, Download, Eye, Calendar, Loader2 } from 'lucide-react';",
    "import { PlusCircle, FileUp, Search, MessageCircle, ChevronRight, FileText, CheckCircle2, AlertCircle, Building2, Download, Eye, Calendar, Loader2, Sparkles } from 'lucide-react';"
)

# 2. Add States
state_injection = """
  const [concepto, setConcepto] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  
  const [retencionMotivo, setRetencionMotivo] = useState('');
  const [retencionPorcentaje, setRetencionPorcentaje] = useState<number | null>(null);
  const [isCalculatingRetencion, setIsCalculatingRetencion] = useState(false);

  const calcularRetencion = async () => {
    if (!concepto || !valorTotal) return;
    setIsCalculatingRetencion(true);
    try {
      const numericValue = valorTotal.replace(/\\D/g, '');
      const response = await fetch('/api/retencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: concepto, valor: numericValue })
      });
      const data = await response.json();
      if (data.motivo && data.porcentaje !== undefined) {
        setRetencionMotivo(data.motivo);
        setRetencionPorcentaje(data.porcentaje);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculatingRetencion(false);
    }
  };
"""

content = content.replace(
    "  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);",
    "  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);\n" + state_injection
)

# 3. Replace inputs
ui_injection = """
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Teléfono de contacto</label>
              <input type="text" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} placeholder="Ej: 300 123 4567" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Concepto de la cuenta de cobro</label>
              <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} onBlur={calcularRetencion} placeholder="Ej. Servicios de producción evento Copa Stunt" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2 relative">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-medium text-zinc-400">Valor total</label>
                {retencionMotivo && (
                  <div className="flex items-center gap-1 text-[10px] text-[#00ff00]">
                    <Sparkles className="w-3 h-3" />
                    <span>IA: {retencionMotivo} ({retencionPorcentaje}%)</span>
                  </div>
                )}
                {isCalculatingRetencion && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculando...</span>
                  </div>
                )}
              </div>
              <input type="text" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} onBlur={calcularRetencion} placeholder="$ 2.500.000" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all placeholder:text-zinc-600 font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Fecha de emisión</label>
              <div className="relative">
                <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none" />
                <Calendar className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
"""

# We'll use regex to replace the 4 divs for Telefono, Concepto, Valor, Fecha
pattern = re.compile(
    r'<div className="space-y-2">\s*<label className="text-\[11px\].*?Teléfono de contacto.*?</label>.*?</div>\s*</div>',
    re.DOTALL
)

# wait, the closing div is `</div>\s*</div>` because of the grid container.
# Let's find exactly the block to replace.

find_str = """            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Teléfono de contacto</label>
              <input type="text" placeholder="Ej: 300 123 4567" className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all" />
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
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#0A0A0A] border border-[#333333] rounded-md px-4 py-3 text-white text-sm hover:border-zinc-500 focus:border-[#E60000] focus:ring-1 focus:ring-[#E60000] outline-none transition-all appearance-none" />
                <Calendar className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>"""

if find_str in content:
    content = content.replace(find_str, ui_injection.strip())
else:
    print("Could not find the target string to replace in DashboardInicio.tsx")
    sys.exit(1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch DashboardInicio successful!")
