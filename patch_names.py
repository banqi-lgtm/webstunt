import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix RUT hardcoded name
old_rut_html = """
                    <div>
                      <a href={rutUrl || '#'} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-[#E60000] hover:underline block truncate max-w-[150px]">
                        RUT_JuanPerez.pdf
                      </a>
                      <span className="text-[10px] text-zinc-500">245 KB • 12/05/2024</span>
                    </div>
"""

new_rut_html = """
                    <div>
                      <a href={rutUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                        <Eye className="w-4 h-4 text-[#E60000]" />
                        <span>Ver Documento</span>
                      </a>
                    </div>
"""
content = content.replace(old_rut_html.strip(), new_rut_html.strip())


# Fix CERT hardcoded name
old_cert_html = """
                    <div>
                      <a href={certUrl || '#'} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-[#E60000] hover:underline block truncate max-w-[150px]">
                        Cert_Bancaria.pdf
                      </a>
                      <span className="text-[10px] text-zinc-500">312 KB • 12/05/2024</span>
                    </div>
"""

new_cert_html = """
                    <div>
                      <a href={certUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white transition-colors">
                        <Eye className="w-4 h-4 text-[#E60000]" />
                        <span>Ver Documento</span>
                      </a>
                    </div>
"""
content = content.replace(old_cert_html.strip(), new_cert_html.strip())

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Names updated successfully!")
