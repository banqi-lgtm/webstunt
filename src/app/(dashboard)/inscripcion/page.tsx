'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, AlertTriangle, CheckCircle2, ChevronRight, Gift, Trophy, Star, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function InscripcionPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Form State
  const [categoria, setCategoria] = useState('');
  const [idPdf, setIdPdf] = useState<File | null>(null);
  const [participacionPrevia, setParticipacionPrevia] = useState('');
  const [patrocinadores, setPatrocinadores] = useState<boolean>(false);
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [referencia, setReferencia] = useState('');
  
  // Files
  const [fotoPlaca, setFotoPlaca] = useState<File | null>(null);
  const [fotoPropiedad, setFotoPropiedad] = useState<File | null>(null);
  const [fotoSoat, setFotoSoat] = useState<File | null>(null);
  const [fotoDeportista, setFotoDeportista] = useState<File | null>(null);
  
  const [inquietudes, setInquietudes] = useState('');

  useEffect(() => {
    // Window size for Confetti
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (typeof window !== 'undefined') {
      updateSize();
      window.addEventListener('resize', updateSize);
    }
    
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        
        // Verifica en tiempo real si el usuario ya envió sus documentos previamente.
        try {
          const docRef = doc(db, 'event_registrations', `f2r_${user.uid}`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             setIsSuccess(true);
          }
        } catch (e) {
          console.error("Error validando el registro anterior:", e);
        }

      } else {
        router.push('/');
      }
    });

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') window.removeEventListener('resize', () => {});
    };
  }, [router]);

  const handleFileUpload = async (file: File | null, pathPrefix: string): Promise<string | null> => {
    if (!file || !uid) return null;
    const storageRef = ref(storage, `events/f2r/${uid}/${pathPrefix}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const validateForm = () => {
    if (!categoria) return "Selecciona una categoría";
    if (!idPdf) return "Falta anexar el PDF/Foto de tu identificación";
    if (!participacionPrevia) return "Responde si has participado antes";
    if (!patrocinadores) return "Debes confirmar que sigues a los patrocinadores";
    if (!placa || !marca || !referencia) return "Completa los datos de la motocicleta";
    if (!fotoPlaca) return "Anexa fotografía de la placa";
    if (!fotoPropiedad) return "Anexa fotografía/PDF de la tarjeta de propiedad";
    if (!fotoSoat) return "Anexa fotografía del SOAT vigente";
    if (!fotoDeportista) return "Anexa tu foto en acción para la pantalla LED";
    return null; // OK
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    const errorMsg = validateForm();
    if (errorMsg) {
      toast({ title: "Formulario Incompleto", description: errorMsg, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Pushing 5 files parallel or sequential
      const urls = await Promise.all([
        handleFileUpload(idPdf, 'id'),
        handleFileUpload(fotoPlaca, 'placa'),
        handleFileUpload(fotoPropiedad, 'propiedad'),
        handleFileUpload(fotoSoat, 'soat'),
        handleFileUpload(fotoDeportista, 'deportista')
      ]);

      const formData = {
        uid,
        eventId: 'f2r_2026',
        categoria,
        participacionPrevia,
        patrocinadores,
        motocicleta: {
          placa,
          marca,
          referencia
        },
        documentos: {
          idUrl: urls[0],
          placaUrl: urls[1],
          propiedadUrl: urls[2],
          soatUrl: urls[3],
          deportistaUrl: urls[4]
        },
        inquietudes,
        registradoEl: new Date().toISOString()
      };

      await setDoc(doc(db, 'event_registrations', `f2r_${uid}`), formData);

      toast({
        title: "Inscripción Exitosa",
        description: "Tus datos y documentos han sido enviados. ¡Nos vemos en la F2R!",
      });
      setIsSuccess(true);
      
    } catch (error: any) {
      console.error("Firebase Registration Error:", error);
      toast({
        title: "Error al enviar",
        description: `Fallo en sistema: ${error.message || 'Hubo un error de base de datos.'}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {windowSize.width > 0 && (
        <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false} 
          numberOfPieces={600} 
          gravity={0.15} 
          className="z-50"
          style={{ position: 'fixed' }}
        />
      )}
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>

      <div className="flex flex-col p-4 lg:p-8 text-zinc-100 max-w-5xl mx-auto w-full relative z-10">
        
        {!isSuccess && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {/* Title replacement */}
        <div className="mb-6 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold tracking-widest uppercase text-sm">
            ¡Felicitaciones por crear tu cuenta!
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md mb-6 leading-tight">
            Adjunta tus Documentos
          </h1>
        </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* Categorías */}
          <Card className="bg-zinc-950/60 border-zinc-800 shadow-xl backdrop-blur-md overflow-hidden">
            <div className="h-1.5 w-full bg-green-600"></div>
            <CardHeader>
              <CardTitle className="text-white text-xl">1. Categorías</CardTitle>
              <div className="flex items-start gap-3 mt-2 bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-300 leading-relaxed">
                  <strong>IMPORTANTE:</strong> Recuerda que debes inscribirte en tu categoría real. Si no es así serás ascendido, lo que afecta planillas e imágenes en las pantallas LED.<br className="mb-2"/>
                  <em>Cupos limitados, en cuanto se complete una categoría solo se permitirá en la siguiente.</em>
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup value={categoria} onValueChange={setCategoria} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center space-x-3 border ${categoria === 'open' ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/40'} p-4 rounded-lg transition-all cursor-pointer hover:border-zinc-500`} onClick={() => setCategoria('open')}>
                  <RadioGroupItem value="open" id="cat-open" className="border-zinc-500 text-green-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="cat-open" className="text-base text-zinc-200 cursor-pointer">OPEN</Label>
                    <span className="text-xs text-zinc-500 font-bold tracking-widest">(20 CUPOS)</span>
                  </div>
                </div>
                <div className={`flex items-center space-x-3 border ${categoria === '2t' ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/40'} p-4 rounded-lg transition-all cursor-pointer hover:border-zinc-500`} onClick={() => setCategoria('2t')}>
                  <RadioGroupItem value="2t" id="cat-2t" className="border-zinc-500 text-green-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="cat-2t" className="text-base text-zinc-200 cursor-pointer">2 TIEMPOS</Label>
                    <span className="text-xs text-zinc-500 font-bold tracking-widest">(15 CUPOS)</span>
                  </div>
                </div>
                <div className={`flex items-center space-x-3 border ${categoria === '4t' ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/40'} p-4 rounded-lg transition-all cursor-pointer hover:border-zinc-500`} onClick={() => setCategoria('4t')}>
                  <RadioGroupItem value="4t" id="cat-4t" className="border-zinc-500 text-green-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="cat-4t" className="text-base text-zinc-200 cursor-pointer">4 TIEMPOS</Label>
                    <span className="text-xs text-zinc-500 font-bold tracking-widest">(15 CUPOS)</span>
                  </div>
                </div>
                <div className={`flex items-center space-x-3 border ${categoria === 'alto' ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/40'} p-4 rounded-lg transition-all cursor-pointer hover:border-zinc-500`} onClick={() => setCategoria('alto')}>
                  <RadioGroupItem value="alto" id="cat-alto" className="border-zinc-500 text-green-500" />
                  <div className="flex flex-col">
                    <Label htmlFor="cat-alto" className="text-base text-zinc-200 cursor-pointer">ALTO CILINDRAJE</Label>
                    <span className="text-xs text-zinc-500 font-bold tracking-widest">(15 CUPOS)</span>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          {/* Experiencia y Redes */}
          <Card className="bg-zinc-950/60 border-zinc-800 shadow-xl backdrop-blur-md">
            <CardHeader><CardTitle className="text-white text-xl">2. Experiencia y Compromiso</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <Label className="text-zinc-300 text-base">¿Haz participado en la Copa Stunt F2R en versiones anteriores?</Label>
                <RadioGroup value={participacionPrevia} onValueChange={setParticipacionPrevia} className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="part-si" className="border-zinc-600" />
                    <Label htmlFor="part-si" className="text-zinc-400">Sí, ya he participado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="part-no" className="border-zinc-600" />
                    <Label htmlFor="part-no" className="text-zinc-400">No, pero lo disfrutaré como nunca</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="patroc" 
                    checked={patrocinadores} 
                    onCheckedChange={(val) => setPatrocinadores(!!val)} 
                    className="border-zinc-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 mt-1" 
                  />
                  <div className="grid gap-1.5 opacity-90">
                    <Label htmlFor="patroc" className="font-semibold text-zinc-200 cursor-pointer">
                      Confirmo que he ido a Instagram a seguir a nuestros patrocinadores principales:
                    </Label>
                    <p className="text-sm text-zinc-400 font-medium tracking-wide">
                      @repuestos.auteco.certified @victorymotorcycles.co @feria2ruedasoficial @copastuntcolombia
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Datos Motocicleta */}
          <Card className="bg-zinc-950/60 border-zinc-800 shadow-xl backdrop-blur-md">
            <CardHeader><CardTitle className="text-white text-xl">3. Datos de la Motocicleta</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Placa Motocicleta</Label>
                  <Input value={placa} onChange={e => setPlaca(e.target.value)} placeholder="Ej. ABC000" className="bg-zinc-900/50 border-zinc-700 text-white uppercase" maxLength={6} />
                </div>
                
                <div className="space-y-2" translate="no">
                  <Label className="text-zinc-300">Marca de tú motocicleta</Label>
                  <Select value={marca} onValueChange={setMarca}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-zinc-300">
                      <SelectValue placeholder="Seleccione una marca" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-h-60">
                      {['YAMAHA','SUZUKI','HONDA','BAJAJ','AKT','TVS','VICTORY','BENELLI','KAWASAKI','FACTORY','YCF','HERO','KYMCO','KTM','KEEWAY','HUSQVARNA','DUCATI','JIALING MOTOS'].map(m => (
                        <SelectItem key={m} value={m}>
                          <span className="block">{m}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-zinc-300">Referencia motocicleta</Label>
                  <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej. MT-09, Duke 390..." className="bg-zinc-900/50 border-zinc-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card className="bg-zinc-950/60 border-zinc-800 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white text-xl">4. Archivos y Documentación Legal</CardTitle>
              <CardDescription className="text-zinc-400">Es indispensable subir estos documentos para asegurar el acceso a la Zona Franca.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Special Emphasis on ID PDF */}
              <div className="flex flex-col space-y-3 p-5 md:p-6 bg-zinc-900 border-2 border-green-500/30 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
                <Label className="text-white text-lg font-bold flex justify-between items-center pl-2">
                  <span>1. Anexa un PDF por ambos lados de tu identificación <span className="text-green-500">*</span></span>
                  {idPdf && <CheckCircle2 className="text-green-500 w-6 h-6" />}
                </Label>
                <p className="text-sm text-zinc-400 pl-2">Sube 1 solo archivo uniendo ambos lados (PDF o Imagen).</p>
                
                <div className="relative border-2 border-dashed border-zinc-700 bg-black/40 py-8 rounded-lg text-center hover:bg-zinc-800/80 transition-colors mt-2">
                  <Input type="file" onChange={(e) => setIdPdf(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                  <div className="flex flex-col items-center pointer-events-none px-4">
                    <UploadCloud className={`w-10 h-10 mb-3 ${idPdf ? 'text-green-500' : 'text-zinc-500'}`} />
                    <span className="text-sm font-semibold text-zinc-300">
                      {idPdf ? <span className="text-green-400 text-base">{idPdf.name}</span> : "Toca aquí para seleccionar, o toma una foto"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Other Files in Grid for better mobile flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {[
                  { state: fotoPlaca, setter: setFotoPlaca, title: "Foto de la placa (Tú motocicleta)", desc: "Obligatorio para la Zona Franca." },
                  { state: fotoPropiedad, setter: setFotoPropiedad, title: "Foto/PDF Tarjeta de propiedad", desc: "O envíalo al WhatsApp: 3044347740" },
                  { state: fotoSoat, setter: setFotoSoat, title: "Fotografía del SOAT vigente", desc: "O envíalo al WhatsApp: 3044347740" },
                  { state: fotoDeportista, setter: setFotoDeportista, title: "Foto tuya en acción", desc: "Pantalla LED gigante. ¡Lúcete!" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col space-y-2 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
                    <Label className="text-zinc-200 text-sm md:text-base font-semibold flex justify-between items-start gap-2">
                      <span className="leading-tight">{item.title}</span>
                      {item.state && <CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" />}
                    </Label>
                    <p className="text-xs text-zinc-500 mb-2">{item.desc}</p>
                    
                    <div className="relative border-2 border-dashed border-zinc-700 py-5 rounded-lg text-center hover:bg-zinc-800/40 transition-colors mt-auto">
                      <Input type="file" onChange={(e) => item.setter(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,image/*" />
                      <div className="flex flex-col items-center pointer-events-none px-2">
                        <UploadCloud className={`w-6 h-6 mb-2 ${item.state ? 'text-green-500' : 'text-zinc-500'}`} />
                        <span className="text-xs font-medium text-zinc-400 break-words w-full">
                          {item.state ? <span className="text-zinc-200">{item.state.name}</span> : "Toca aquí"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>
          </Card>

          {/* Inquietudes */}
          <Card className="bg-zinc-950/60 border-zinc-800 shadow-xl backdrop-blur-md">
            <CardHeader><CardTitle className="text-white text-xl">5. Comentarios e Inquietudes</CardTitle></CardHeader>
            <CardContent>
               <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Déjanos saber si tienes alguna pregunta o duda sobre el reglamento y el desarrollo del evento.
                  </p>
                  <Textarea 
                    value={inquietudes}
                    onChange={e => setInquietudes(e.target.value)}
                    placeholder="Escribe tus dudas aquí..." 
                    className="min-h-[100px] bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-600" 
                  />
               </div>
            </CardContent>
          </Card>

        </div>

        <div className="mt-10 mb-16 flex justify-end">
          <Button type="submit" disabled={isLoading} className="bg-green-600 text-white hover:bg-green-500 font-extrabold h-16 w-full md:w-auto px-12 text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all uppercase tracking-wider">
            {isLoading ? "PROCESANDO INSCRIPCIÓN..." : "CONFIRMAR E INSCRIBIRSE"}
          </Button>
        </div>

      </form>
      </div>
      )}

      {/* Pantalla Externa de Éxito / Pase QR */}
      {isSuccess && (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-xl border border-green-500/30 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto w-full mt-10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">¡Inscripción Confirmada!</h2>
          <p className="text-zinc-400 text-center mb-8">
            Presenta este código QR en el ingreso de la Zona Franca para validar tu identidad.
          </p>
          
          <div className="bg-white p-6 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] mb-8">
            <QRCode 
              value={`f2r_${uid}`} 
              size={220}
              level="H"
              fgColor="#09090b"
              bgColor="#ffffff"
            />
          </div>
          
          <div className="flex flex-col w-full gap-3">
             <Link href="/profile" className="w-full">
               <Button className="w-full bg-zinc-800 text-white hover:bg-zinc-700 h-12">
                 Ir a mi perfil
               </Button>
             </Link>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

