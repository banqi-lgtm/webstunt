import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add handleCobrar and confirmarCobro right before handleViewCuenta
injection = """
  const handleCobrar = async (item: any) => {
    try {
      setLoadingInvoiceId(item.id);
      const userDoc = await getDoc(doc(db, 'users', userUid));
      const userData = userDoc.data() || {};

      setInvoiceData({
        numero: item.cuentaCobroNum || `CC-${item.id.substring(0,6).toUpperCase()}`,
        fecha: item.creadoEl || new Date().toISOString(),
        cobradorNombre: userData.nombreCompleto || userData.nombres || userName || item.asignadoANombre,
        cobradorDocumento: userData.documentoIdentidad || userDocument || 'No registrado',
        valorTotal: item.valor,
        conceptos: [{
          item: 1,
          descripcion: item.descripcion || item.concepto || 'Servicios prestados',
          valor: item.valor,
          retencionMotivo: item.retencionMotivo || null,
          retencionPorcentaje: item.retencionPorcentaje || null
        }],
        banco: userData.banco || 'No registrado',
        tipoCuenta: userData.tipoCuenta || 'No registrado',
        numeroCuenta: userData.numeroCuenta || 'No registrado',
        ciudad: userData.ciudad || 'BELLO, ANTIOQUIA',
        isHistorical: false,
        itemId: item.id
      });
      setShowInvoiceModal(true);
    } catch (e) {
      toast({ title: 'Error', description: 'Error al preparar la cuenta de cobro', variant: 'destructive' });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const confirmarCobro = async (itemId: string, firma: string) => {
    try {
      const itemRef = doc(db, 'codigos', itemId);
      await updateDoc(itemRef, {
        estado: 'cobrado',
        firmaGenerada: firma,
        cobradoEl: new Date().toISOString()
      });
      toast({ title: 'Éxito', description: 'Cuenta de cobro firmada y generada correctamente.' });
      setShowInvoiceModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch(e) {
      toast({ title: 'Error', description: 'Error al confirmar la cuenta de cobro', variant: 'destructive' });
    }
  };

  const handleViewCuenta = async (item: any) => {
"""

content = content.replace("  const handleViewCuenta = async (item: any) => {", injection.strip())

# 2. Update Desktop table column rendering
old_desktop_col = """
                      ) : <span className="text-zinc-600">-</span>}
                    </td>
"""

new_desktop_col = """
                      ) : (item.estado === 'disponible' || item.estado === 'PENDIENTE DE PAGO') ? (
                        <button onClick={() => handleCobrar(item)} className="px-3 py-1.5 bg-[#E60000]/10 text-[#E60000] border border-[#E60000]/20 hover:bg-[#E60000] hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50" disabled={loadingInvoiceId === item.id}>
                          {loadingInvoiceId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Cobrar y Firmar'}
                        </button>
                      ) : <span className="text-zinc-600">-</span>}
                    </td>
"""
content = content.replace(old_desktop_col.strip(), new_desktop_col.strip())

# 3. Update Mobile card rendering
old_mobile_col = """
                    ) : <span className="text-zinc-600 text-xs">Sin cuenta de cobro</span>}
                </div>
"""

new_mobile_col = """
                    ) : (item.estado === 'disponible' || item.estado === 'PENDIENTE DE PAGO') ? (
                      <button onClick={() => handleCobrar(item)} className="flex items-center gap-1.5 text-[#E60000] text-xs font-bold uppercase hover:text-red-400 disabled:opacity-50" disabled={loadingInvoiceId === item.id}>
                        {loadingInvoiceId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} 
                        Cobrar y Firmar
                      </button>
                    ) : <span className="text-zinc-600 text-xs">Sin cuenta de cobro</span>}
                </div>
"""
content = content.replace(old_mobile_col.strip(), new_mobile_col.strip())

# 4. Update CuentaDeCobro onConfirm
old_modal = """
                <CuentaDeCobro 
                  {...invoiceData} 
                  onClose={() => setShowInvoiceModal(false)} 
                  onConfirm={() => {}}
                />
"""

new_modal = """
                <CuentaDeCobro 
                  {...invoiceData} 
                  onClose={() => setShowInvoiceModal(false)} 
                  onConfirm={(firma) => {
                    if (invoiceData && !invoiceData.isHistorical) {
                      confirmarCobro(invoiceData.itemId, firma);
                    }
                  }}
                />
"""
content = content.replace(old_modal.strip(), new_modal.strip())

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully!")
