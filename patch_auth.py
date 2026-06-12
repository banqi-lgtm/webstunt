import sys

file_path = "src/components/auth-form.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';",
    "import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';\nimport { ref, uploadString, getDownloadURL } from 'firebase/storage';"
)
content = content.replace(
    "import { auth, db } from '@/lib/firebase';",
    "import { auth, db, storage } from '@/lib/firebase';\nimport { Loader2, Upload } from 'lucide-react';"
)

# 2. Add States and handleDocumentUpload
state_injection = """
  // Staff / Bank fields
  const [banco, setBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [rutBase64, setRutBase64] = useState('');
  const [certBase64, setCertBase64] = useState('');
  const [rutFileName, setRutFileName] = useState('');
  const [certFileName, setCertFileName] = useState('');
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'rut' | 'cert') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingDoc(true);
      const dataUrl = await fileToBase64(file);
      
      if (type === 'rut') {
        setRutFileName(file.name);
        setRutBase64(dataUrl);
      } else {
        setCertFileName(file.name);
        setCertBase64(dataUrl);
      }

      const body: any = {};
      if (type === 'rut') body.rutFile = { dataUrl, fileType: file.type };
      if (type === 'cert') body.certFile = { dataUrl, fileType: file.type };

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.documentoIdentidad) {
        setNumeroIdentificacion(data.documentoIdentidad);
        setTipoDocumento('NIT');
        toast({ title: "Datos extraídos", description: "Número de documento completado por IA." });
      }
      if (data.banco) setBanco(data.banco);
      if (data.tipoCuenta) setTipoCuenta(data.tipoCuenta);
      if (data.numeroCuenta) setNumeroCuenta(data.numeroCuenta);
      if (data.ciudad) setCiudad(data.ciudad);
      
    } catch (error) {
      console.error("Error extraindo documento", error);
      toast({ title: "Error", description: "No se pudieron extraer los datos automáticamente.", variant: "destructive" });
    } finally {
      setIsExtractingDoc(false);
    }
  };
"""

content = content.replace(
    "  const [tallaCamisa, setTallaCamisa] = useState('');",
    "  const [tallaCamisa, setTallaCamisa] = useState('');\n" + state_injection
)

# 3. Update handleRegister logic
db_injection = """
      let rutUrl = null;
      let certUrl = null;

      // Upload files if they exist
      if (mode === 'staff') {
        if (rutBase64) {
          const rutRef = ref(storage, `users/${user.uid}/rut_${Date.now()}`);
          await uploadString(rutRef, rutBase64, 'data_url');
          rutUrl = await getDownloadURL(rutRef);
        }
        if (certBase64) {
          const certRef = ref(storage, `users/${user.uid}/cert_${Date.now()}`);
          await uploadString(certRef, certBase64, 'data_url');
          certUrl = await getDownloadURL(certRef);
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        email, nombres, apellidos, seudonimo: mode === 'default' ? seudonimo : null, 
        tipoDocumento, numeroIdentificacion, dv: tipoDocumento === 'NIT' ? dv : null,
        instagram: mode === 'default' ? instagram : null, telefono, ciudad, direccion, 
        fechaNacimiento: mode === 'default' ? fechaNacimiento : null, 
        tallaCamisa: mode === 'default' ? tallaCamisa : null,
        role: mode,
        nombreTutor: requireTutor ? nombreTutor : null,
        cedulaTutor: requireTutor ? cedulaTutor : null,
        telefonoTutor: requireTutor ? telefonoTutor : null,
        correoTutor: requireTutor ? correoTutor : null,
        parentescoTutor: requireTutor ? parentescoTutor : null,
        banco: mode === 'staff' ? banco : null,
        tipoCuenta: mode === 'staff' ? tipoCuenta : null,
        numeroCuenta: mode === 'staff' ? numeroCuenta : null,
        rutUrl: mode === 'staff' ? rutUrl : null,
        certUrl: mode === 'staff' ? certUrl : null,
        habeasDataAccepted: false,
        createdAt: new Date().toISOString()
      });
"""

# Replace the existing setDoc block with our new one
import re
set_doc_pattern = re.compile(r"await setDoc\(doc\(db, 'users', user\.uid\), \{.*?createdAt: new Date\(\)\.toISOString\(\)\n\s+\}\);", re.DOTALL)
content = set_doc_pattern.sub(db_injection.strip(), content)

# 4. Add UI Fields for Staff Mode
ui_injection = """
                {mode === 'staff' && (
                  <div className="space-y-4 mt-4">
                    <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 space-y-3">
                      <h4 className="text-xs font-bold text-[#E60000] uppercase tracking-wider mb-2">Documentos requeridos (IA)</h4>
                      <p className="text-[10px] text-zinc-400 mb-3">Sube tu RUT y Certificación Bancaria. Nuestra IA extraerá tus datos automáticamente.</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">RUT (PDF o Imagen)</label>
                          <label className="flex items-center justify-center w-full h-10 px-4 transition bg-[#1A1A1A] border-2 border-zinc-800 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#E60000] focus:outline-none">
                            <span className="flex items-center space-x-2 text-xs text-zinc-400">
                              {isExtractingDoc ? <Loader2 className="w-4 h-4 animate-spin text-[#E60000]"/> : <Upload className="w-4 h-4 text-[#E60000]"/>}
                              <span>{rutFileName ? rutFileName : 'Seleccionar RUT'}</span>
                            </span>
                            <input type="file" name="file_upload" className="hidden" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'rut')} />
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">Certificación Bancaria</label>
                          <label className="flex items-center justify-center w-full h-10 px-4 transition bg-[#1A1A1A] border-2 border-zinc-800 border-dashed rounded-xl appearance-none cursor-pointer hover:border-[#E60000] focus:outline-none">
                            <span className="flex items-center space-x-2 text-xs text-zinc-400">
                              {isExtractingDoc ? <Loader2 className="w-4 h-4 animate-spin text-[#E60000]"/> : <Upload className="w-4 h-4 text-[#E60000]"/>}
                              <span>{certFileName ? certFileName : 'Seleccionar Certificación'}</span>
                            </span>
                            <input type="file" name="file_upload" className="hidden" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, 'cert')} />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#111] p-4 rounded-xl border border-zinc-800 space-y-3">
                      <h4 className="text-xs font-bold text-[#E60000] uppercase tracking-wider mb-2">Información Bancaria</h4>
                      <FloatingInput id="banco" label="Banco" value={banco} onChange={(e: any) => setBanco(e.target.value)} />
                      <FloatingInput id="tipoCuenta" label="Tipo de Cuenta" isSelect={true} options={[{value:'Ahorros',label:'Ahorros'},{value:'Corriente',label:'Corriente'},{value:'Nequi',label:'Nequi'},{value:'Daviplata',label:'Daviplata'}]} value={tipoCuenta} onChange={(e: any) => setTipoCuenta(e.target.value)} />
                      <FloatingInput id="numeroCuenta" label="Número de Cuenta" value={numeroCuenta} onChange={(e: any) => setNumeroCuenta(e.target.value)} />
                    </div>
                  </div>
                )}
"""

# Insert before "Si eres menor de edad" block or before the parentescoTutor inputs.
# Let's insert it right after the `tallaCamisa` or `direccion` block.
# I'll insert it right after:
# <FloatingInput id="direccion" label="Dirección de residencia" icon={MapPin} value={direccion} onChange={(e: any) => setDireccion(e.target.value)} required={true} />

content = content.replace(
    '<FloatingInput id="direccion" label="Dirección de residencia" icon={MapPin} value={direccion} onChange={(e: any) => setDireccion(e.target.value)} required={true} />',
    '<FloatingInput id="direccion" label="Dirección de residencia" icon={MapPin} value={direccion} onChange={(e: any) => setDireccion(e.target.value)} required={true} />\n' + ui_injection
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patch successful!")
