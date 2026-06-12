import sys
import re

file_path = "src/components/staff-portal/DashboardInicio.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for Firebase Storage and Firestore
content = content.replace(
    "import { doc, getDoc } from 'firebase/firestore';",
    "import { doc, getDoc, updateDoc } from 'firebase/firestore';\nimport { ref, uploadString, getDownloadURL } from 'firebase/storage';\nimport { useToast } from '@/hooks/use-toast';"
)

# We need useToast hook and file upload handler
hook_injection = """
  const { toast } = useToast();
  const [isUpdatingRut, setIsUpdatingRut] = useState(false);
  const [isUpdatingCert, setIsUpdatingCert] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpdateDocument = async (e: React.ChangeEvent<HTMLInputElement>, type: 'rut' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === 'rut') setIsUpdatingRut(true);
      if (type === 'cert') setIsUpdatingCert(true);

      const dataUrl = await fileToBase64(file);
      
      // Upload to Storage
      const storageRef = ref(storage, `users/${userUid}/${type}_${Date.now()}`);
      await uploadString(storageRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(storageRef);

      const body: any = {};
      if (type === 'rut') body.rutFile = { dataUrl, fileType: file.type };
      if (type === 'cert') body.certFile = { dataUrl, fileType: file.type };

      // Extract Data via AI
      toast({ title: "Procesando", description: `Analizando ${type.toUpperCase()} con IA...` });
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      // Update Firestore
      const userRef = doc(db, 'users', userUid);
      const updateData: any = {};
      if (type === 'rut') updateData.rutUrl = downloadUrl;
      if (type === 'cert') updateData.certUrl = downloadUrl;
      
      if (data.documentoIdentidad && type === 'rut') {
        updateData.numeroIdentificacion = data.documentoIdentidad;
        toast({ title: "Datos extraídos", description: `Se actualizó el NIT: ${data.documentoIdentidad}` });
      }
      if (data.banco) updateData.banco = data.banco;
      if (data.tipoCuenta) updateData.tipoCuenta = data.tipoCuenta;
      if (data.numeroCuenta) updateData.numeroCuenta = data.numeroCuenta;

      await updateDoc(userRef, updateData);
      
      toast({ title: "Documento actualizado", description: "Tus datos se guardaron correctamente. Recarga la página para ver los cambios." });
      
    } catch (error) {
      console.error("Error al actualizar documento", error);
      toast({ title: "Error", description: "No se pudo actualizar el documento.", variant: "destructive" });
    } finally {
      if (type === 'rut') setIsUpdatingRut(false);
      if (type === 'cert') setIsUpdatingCert(false);
    }
  };
"""

content = content.replace(
    "  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);",
    "  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);\n" + hook_injection
)

# Update the "Actualizar" buttons in the UI
rut_btn_replace = """
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingRut && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Actualizar</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'rut')} />
                  </label>
"""

cert_btn_replace = """
                  <label className="text-[10px] text-[#E60000] hover:text-red-400 cursor-pointer uppercase font-bold tracking-wider flex items-center gap-1">
                    {isUpdatingCert && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Actualizar</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpdateDocument(e, 'cert')} />
                  </label>
"""

# The original buttons:
# <button className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider">Actualizar</button>

# Since there are two exactly identical buttons, I'll replace them manually.
parts = content.split('<button className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider">Actualizar</button>')

if len(parts) == 3:
    content = parts[0] + rut_btn_replace.strip() + parts[1] + cert_btn_replace.strip() + parts[2]
else:
    print("Could not find exactly two Actualizar buttons.")
    sys.exit(1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch Update Buttons successful!")
