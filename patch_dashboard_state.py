import sys

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We'll inject a local state for userDocument
state_injection = """
  const [concepto, setConcepto] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  
  const [localUserDocument, setLocalUserDocument] = useState(userDocument);
  useEffect(() => setLocalUserDocument(userDocument), [userDocument]);
"""

content = content.replace(
    "  const [concepto, setConcepto] = useState('');\n  const [valorTotal, setValorTotal] = useState('');\n  const [telefonoContacto, setTelefonoContacto] = useState('');\n  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);",
    state_injection.strip()
)

# And update the input field
content = content.replace(
    '<input type="text" defaultValue={userDocument || \'\'} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />',
    '<input type="text" value={localUserDocument || \'\'} disabled className="w-full bg-[#0A0A0A] border border-[#222222] rounded-md px-4 py-3 text-white text-sm focus:border-[#E60000] outline-none transition-all opacity-80 cursor-not-allowed" />'
)

# And in handleUpdateDocument
update_injection = """
      if (data.documentoIdentidad && type === 'rut') {
        updateData.numeroIdentificacion = data.documentoIdentidad;
        setLocalUserDocument(data.documentoIdentidad);
        toast({ title: "Datos extraídos", description: `Se actualizó el NIT: ${data.documentoIdentidad}` });
      }
"""

content = content.replace(
    """
      if (data.documentoIdentidad && type === 'rut') {
        updateData.numeroIdentificacion = data.documentoIdentidad;
        toast({ title: "Datos extraídos", description: `Se actualizó el NIT: ${data.documentoIdentidad}` });
      }
    """.strip(),
    update_injection.strip()
)

# And remove "Recarga la página" from the toast
content = content.replace(
    'toast({ title: "Documento actualizado", description: "Tus datos se guardaron correctamente. Recarga la página para ver los cambios." });',
    'toast({ title: "Documento actualizado", description: "Tus datos se han guardado y actualizado en pantalla correctamente." });'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch Dashboard Local State successful!")
