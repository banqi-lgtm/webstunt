import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix Document Number input
old_doc_input = """
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Número de documento</label>
              <input type="text" value={localUserDocument || ''} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
"""
new_doc_input = """
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-zinc-400">Número de documento</label>
              <input type="text" value={localRutUrl ? (localUserDocument || '') : ''} placeholder="Se extraerá de tu RUT" disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />
            </div>
"""
content = content.replace(old_doc_input.strip(), new_doc_input.strip())

# Fix RUT Box UI
old_rut_box = """
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                    <div>
                      <a href={localRutUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                        <Eye className="w-4 h-4 text-[#E60000]" />
                        <span>Ver Documento</span>
                      </a>
                    </div>
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingRut && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Actualizar</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'rut')} />
                  </label>
                </div>
"""
new_rut_box = """
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {localRutUrl ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                        <div>
                          <a href={localRutUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                            <Eye className="w-4 h-4 text-[#E60000]" />
                            <span>Ver Documento</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-xs text-amber-500 font-medium">Documento pendiente</span>
                        </div>
                      </>
                    )}
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingRut && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{localRutUrl ? 'Actualizar' : 'Subir'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'rut')} />
                  </label>
                </div>
"""
content = content.replace(old_rut_box.strip(), new_rut_box.strip())

# Fix CERT Box UI
old_cert_box = """
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                    <div>
                      <a href={localCertUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                        <Eye className="w-4 h-4 text-[#E60000]" />
                        <span>Ver Documento</span>
                      </a>
                    </div>
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingCert && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Actualizar</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'cert')} />
                  </label>
                </div>
"""
new_cert_box = """
                <div className="bg-[#111] border border-[#222] rounded p-2.5 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {localCertUrl ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#00ff00]" />
                        <div>
                          <a href={localCertUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                            <Eye className="w-4 h-4 text-[#E60000]" />
                            <span>Ver Documento</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <div>
                          <span className="text-xs text-amber-500 font-medium">Documento pendiente</span>
                        </div>
                      </>
                    )}
                  </div>
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingCert && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{localCertUrl ? 'Actualizar' : 'Subir'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'cert')} />
                  </label>
                </div>
"""
content = content.replace(old_cert_box.strip(), new_cert_box.strip())

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch missing docs successful!")
