'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
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
import { UploadCloud, AlertTriangle, CheckCircle2, ChevronRight, Gift, Trophy, Star, ShieldAlert, CreditCard, Clock, Image as ImageIcon, XCircle, ArrowLeft, CheckCircle, Smartphone, Phone, Lock, Camera } from 'lucide-react';
import Link from 'next/link';
import { CameraModal } from '@/components/camera-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import dynamic from 'next/dynamic';
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function InscripcionPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Form, 2: Payment, 3: Pending/Success
  const [estadoPago, setEstadoPago] = useState<'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'saldo_pendiente' | 'revision_saldo'>('pendiente');
  const [saldoFaltante, setSaldoFaltante] = useState('');
  const { toast } = useToast();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({ open: 0, '2t': 0, '4t': 0, alto: 0 });

  // Options Modal State
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [currentDocKey, setCurrentDocKey] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const openOptions = (docKey: string) => {
    setCurrentDocKey(docKey);
    setOptionsModalOpen(true);
  };

  const handleFileFromDialog = async (file: File) => {
    setOptionsModalOpen(false);
    if (!currentDocKey) return;
    
    if (currentDocKey === 'deportista') {
      await handleFotoDeportistaChange(file);
      return;
    }

    const url = await handleInstantUpload(file, currentDocKey);
    if (url) {
      const stateObj = { url, name: file.name };
      if (currentDocKey === 'id') setIdPdf(stateObj);
      else if (currentDocKey === 'placa') setFotoPlaca(stateObj);
      else if (currentDocKey === 'propiedad') setFotoPropiedad(stateObj);
      else if (currentDocKey === 'soat') setFotoSoat(stateObj);
      else if (currentDocKey === 'comprobante') setComprobantePago(stateObj);
    }
  };

  const handleInstantUpload = async (file: File, docKey: string): Promise<string | null> => {
    if (!uid) return null;
    toast({ title: 'Subiendo archivo...', description: 'Guardando documento...', duration: 2000 });
    try {
      // Guardar en la raíz de la carpeta del usuario para evitar restricciones de reglas de Storage (storage/unauthorized)
      const storageRef = ref(storage, `events/f2r/${uid}/${docKey}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const docRef = doc(db, 'event_registrations', `f2r_${uid}`);
      if (docKey === 'comprobante') {
         await setDoc(docRef, { comprobanteUrl: url, estadoPago: estadoPago === 'pendiente' ? 'borrador' : estadoPago }, { merge: true });
      } else {
         await setDoc(docRef, {
           documentos: {
             [`${docKey}Url`]: url
           },
           estadoPago: estadoPago === 'pendiente' ? 'borrador' : estadoPago
         }, { merge: true });
      }
      toast({ title: 'Guardado', description: 'El archivo se guardó automáticamente.', variant: 'default' });
      return url;
    } catch (e: any) {
      console.error('Error instant upload', e);
      toast({ title: 'Error', description: `No se pudo guardar: ${e.message}`, variant: 'destructive' });
      return null;
    }
  };

  // Form State
  const [categoria, setCategoria] = useState('');
  const [idPdf, setIdPdf] = useState<any>(null);
  const [participacionPrevia, setParticipacionPrevia] = useState('');
  const [patrocinadores, setPatrocinadores] = useState<boolean>(false);
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [referencia, setReferencia] = useState('');
  
  // Files
  const [fotoPlaca, setFotoPlaca] = useState<any>(null);
  const [fotoPropiedad, setFotoPropiedad] = useState<any>(null);
  const [fotoSoat, setFotoSoat] = useState<any>(null);
  const [fotoDeportista, setFotoDeportista] = useState<any>(null);
  
  // Payment Proof
  const [comprobantePago, setComprobantePago] = useState<any>(null);
  
  const [inquietudes, setInquietudes] = useState('');

  const [faceDetector, setFaceDetector] = useState<any>(null);
  const [isDetectingFace, setIsDetectingFace] = useState(false);

  useEffect(() => {
    // Window size for Confetti
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (typeof window !== 'undefined') {
      updateSize();
      window.addEventListener('resize', updateSize);
    }
    
    const fetchCounts = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'event_registrations'));
        const counts: { [key: string]: number } = { open: 0, '2t': 0, '4t': 0, alto: 0 };
        snapshot.forEach(d => {
          const cat = d.data().categoria;
          if (cat) counts[cat] = (counts[cat] || 0) + 1;
        });
        setCategoryCounts(counts);
      } catch (e) {
        console.error("Error fetching category counts", e);
      }
    };
    fetchCounts();

    const initDetector = async () => {
      try {
        const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "IMAGE"
        });
        setFaceDetector(detector);
      } catch (err) {
        console.error("No se pudo iniciar FaceDetector", err);
      }
    };
    initDetector();

    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        
        // Verifica en tiempo real si el usuario ya envió sus documentos previamente.
        try {
          const docRef = doc(db, 'event_registrations', `f2r_${user.uid}`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             if (data.documentos) {
               if (data.documentos.idUrl) setIdPdf({ url: data.documentos.idUrl, name: 'Identificación Guardada' });
               if (data.documentos.placaUrl) setFotoPlaca({ url: data.documentos.placaUrl, name: 'Foto Placa Guardada' });
               if (data.documentos.propiedadUrl) setFotoPropiedad({ url: data.documentos.propiedadUrl, name: 'Tarjeta Propiedad Guardada' });
               if (data.documentos.soatUrl) setFotoSoat({ url: data.documentos.soatUrl, name: 'SOAT Guardado' });
               if (data.documentos.deportistaUrl) setFotoDeportista({ url: data.documentos.deportistaUrl, name: 'Foto Deportista Guardada' });
             }
             if (data.comprobanteUrl) {
               setComprobantePago({ url: data.comprobanteUrl, name: 'Comprobante Guardado' });
             }
             setEstadoPago(data.estadoPago || 'pendiente');
             setSaldoFaltante(data.saldoFaltante || '');
             if (data.estadoPago === 'aprobado' || data.estadoPago === 'en_revision' || data.estadoPago === 'rechazado' || data.estadoPago === 'revision_saldo') {
                setStep(3);
             } else {
                setStep(1); // pendiente, saldo_pendiente, o borrador
             }
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

  const handleFotoDeportistaChange = async (file: File | null) => {
    if (!file) {
      setFotoDeportista(null);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
       toast({ title: 'Formato incorrecto', description: 'Debes subir una imagen.', variant: 'destructive' });
       return;
    }

    if (!faceDetector) {
      const url = await handleInstantUpload(file, 'deportista');
      if (url) setFotoDeportista({ url, name: file.name, file });
      return;
    }

    setIsDetectingFace(true);

    try {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const detections = faceDetector.detect(img);
      URL.revokeObjectURL(img.src);

      if (detections.detections.length === 0) {
        toast({ 
          title: "Rostro no detectado", 
          description: "No se logró detectar un rostro claro en la fotografía. Por favor intenta con una foto donde te veas mejor de frente.", 
          variant: "destructive" 
        });
        setFotoDeportista(null);
      } else {
        toast({ title: "Rostro validado", description: "¡Perfecto! Tu foto cumple con los parámetros." });
        const url = await handleInstantUpload(file, 'deportista');
        if (url) setFotoDeportista({ url, name: file.name, file });
      }
    } catch (error) {
      console.error("Face detection error:", error);
      const url = await handleInstantUpload(file, 'deportista');
      if (url) setFotoDeportista({ url, name: file.name, file });
    } finally {
      setIsDetectingFace(false);
    }
  };

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
    if (!comprobantePago) return "Anexa tu comprobante de pago";
    return null; // OK
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    const errorMsg = validateForm();
    if (errorMsg) {
      toast({ title: "Formulario Incompleto", description: errorMsg, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Validación estricta final de cupos antes de guardar
    const limits: { [key: string]: number } = { open: 20, '2t': 15, '4t': 15, alto: 15 };
    if (limits[categoria] !== undefined && categoryCounts[categoria] >= limits[categoria]) {
      toast({ title: "Cupos Llenos", description: "Lo sentimos, los cupos para esta categoría se acaban de llenar.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      // Pushing 6 files parallel
      const urls = await Promise.all([
        idPdf?.url ? Promise.resolve(idPdf.url) : handleFileUpload(idPdf?.file || null, 'id'),
        fotoPlaca?.url ? Promise.resolve(fotoPlaca.url) : handleFileUpload(fotoPlaca?.file || null, 'placa'),
        fotoPropiedad?.url ? Promise.resolve(fotoPropiedad.url) : handleFileUpload(fotoPropiedad?.file || null, 'propiedad'),
        fotoSoat?.url ? Promise.resolve(fotoSoat.url) : handleFileUpload(fotoSoat?.file || null, 'soat'),
        fotoDeportista?.url ? Promise.resolve(fotoDeportista.url) : handleFileUpload(fotoDeportista?.file || null, 'deportista'),
        comprobantePago?.url ? Promise.resolve(comprobantePago.url) : handleFileUpload(comprobantePago?.file || null, 'comprobante')
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
        comprobanteUrl: urls[5],
        inquietudes,
        registradoEl: new Date().toISOString(),
        estadoPago: 'en_revision'
      };

      await setDoc(doc(db, 'event_registrations', `f2r_${uid}`), formData);

      toast({
        title: "Inscripción Enviada",
        description: "Tus documentos y comprobante han sido enviados correctamente.",
      });
      setEstadoPago('en_revision');
      setStep(3);
      
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

  const handlePaymentSubmit = async () => {
    if (!comprobantePago) {
      toast({ title: "Comprobante Faltante", description: "Por favor anexa la imagen del comprobante de pago.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const isSaldo = estadoPago === 'saldo_pendiente';
      const pathPrefix = isSaldo ? 'comprobante_saldo' : 'comprobante';
      const url = await handleFileUpload(comprobantePago, pathPrefix);
      
      const docRef = doc(db, 'event_registrations', `f2r_${uid}`);
      
      if (isSaldo) {
        await updateDoc(docRef, {
          estadoPago: 'revision_saldo',
          comprobanteSaldoUrl: url
        });
        setEstadoPago('revision_saldo');
        toast({ title: "Comprobante de Saldo Enviado", description: "Tu pago del saldo está en validación." });
      } else {
        await updateDoc(docRef, {
          estadoPago: 'en_revision',
          comprobanteUrl: url
        });
        setEstadoPago('en_revision');
        toast({ title: "Comprobante Enviado", description: "Tu pago está en validación. Te notificaremos cuando sea aprobado." });
      }
      
      setStep(3);
      
    } catch (error: any) {
      console.error("Error uploading payment proof:", error);
      toast({
         title: "Error",
         description: "No se pudo subir el comprobante. Inténtalo de nuevo.",
         variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#121212]">
      {windowSize.width > 0 && estadoPago === 'aprobado' && (
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00E676]/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>

      <div className="flex flex-col p-4 lg:p-8 text-zinc-100 max-w-5xl mx-auto w-full relative z-10">
        
        {/* PASO 1: FORMULARIO SECUENCIAL */}
        {step === 1 && (
          <form onSubmit={handleFormSubmit} className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto w-full">
            
            {/* Header de Progreso */}
            <div className="flex flex-col mb-8 border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Link href="/profile" className="text-[#B0B0B0] hover:text-white transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
                  Adjunta tus Documentos
                </h1>
              </div>
              <div className="flex items-center justify-between text-xs font-bold tracking-widest text-[#B0B0B0] mb-2">
                <span className="text-[#00E676]">Paso 2 de 3</span>
                <span className="text-white">66%</span>
              </div>
              <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-[#2A2A2A]">
                <div className="h-full bg-[#00E676] w-[66%] rounded-full shadow-[0_0_15px_rgba(0,230,118,0.5)]"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Columna Izquierda: Datos y Documentos */}
              <div className="space-y-6">
              
              {/* Categorías */}
              <div className="space-y-3 bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A]">
                <Label className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
                  1. Categoría <span className="text-[#FF9800] text-[10px] bg-[#FF9800]/10 px-2 py-0.5 rounded border border-[#FF9800]/20 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Cupos limitados</span>
                </Label>
                <RadioGroup value={categoria} onValueChange={setCategoria} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categoria === 'open' ? 'border-[#00E676] bg-[#00E676]/5 shadow-[0_0_15px_rgba(0,230,118,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['open'] || 0) >= 20 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { if ((categoryCounts['open'] || 0) < 20) setCategoria('open'); }}>
                    <RadioGroupItem value="open" id="cat-open" className="sr-only" disabled={(categoryCounts['open'] || 0) >= 20} />
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🟢</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer notranslate" translate="no">OPEN</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 20 - (categoryCounts['open'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categoria === 'open' && <CheckCircle2 className="w-5 h-5 text-[#00E676] absolute top-2 right-2" />}
                  </div>
                  
                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categoria === '2t' ? 'border-[#00E676] bg-[#00E676]/5 shadow-[0_0_15px_rgba(0,230,118,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['2t'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { if ((categoryCounts['2t'] || 0) < 15) setCategoria('2t'); }}>
                    <RadioGroupItem value="2t" id="cat-2t" className="sr-only" disabled={(categoryCounts['2t'] || 0) >= 15} />
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🏍️</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">2 TIEMPOS</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['2t'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categoria === '2t' && <CheckCircle2 className="w-5 h-5 text-[#00E676] absolute top-2 right-2" />}
                  </div>

                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categoria === '4t' ? 'border-[#00E676] bg-[#00E676]/5 shadow-[0_0_15px_rgba(0,230,118,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['4t'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { if ((categoryCounts['4t'] || 0) < 15) setCategoria('4t'); }}>
                    <RadioGroupItem value="4t" id="cat-4t" className="sr-only" disabled={(categoryCounts['4t'] || 0) >= 15} />
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🛵</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">4 TIEMPOS</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['4t'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categoria === '4t' && <CheckCircle2 className="w-5 h-5 text-[#00E676] absolute top-2 right-2" />}
                  </div>

                  <div className={`relative flex items-center p-4 rounded-xl border transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] ${categoria === 'alto' ? 'border-[#00E676] bg-[#00E676]/5 shadow-[0_0_15px_rgba(0,230,118,0.15)]' : 'border-[#2A2A2A] bg-[#121212]'} ${(categoryCounts['alto'] || 0) >= 15 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#424242]'}`} onClick={() => { if ((categoryCounts['alto'] || 0) < 15) setCategoria('alto'); }}>
                    <RadioGroupItem value="alto" id="cat-alto" className="sr-only" disabled={(categoryCounts['alto'] || 0) >= 15} />
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center mr-3 border border-[#2A2A2A]">
                      <span className="text-xl">🔥</span>
                    </div>
                    <div className="flex-1">
                      <Label className="font-bold text-white text-sm cursor-pointer">ALTO CILINDRAJE</Label>
                      <p className="text-[10px] text-[#B0B0B0] mt-0.5 font-medium">{Math.max(0, 15 - (categoryCounts['alto'] || 0))} CUPOS RESTANTES</p>
                    </div>
                    {categoria === 'alto' && <CheckCircle2 className="w-5 h-5 text-[#00E676] absolute top-2 right-2" />}
                  </div>
                </RadioGroup>
              </div>
              
              {/* Experiencia y Compromiso */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <Label className="text-white text-sm font-bold uppercase tracking-wider block">2. Experiencia y Compromiso</Label>
                <p className="text-xs text-zinc-400 mb-2">¿Has participado en la Copa Stunt F2R en versiones anteriores?</p>
                <RadioGroup value={participacionPrevia} onValueChange={setParticipacionPrevia} className="grid grid-cols-2 gap-3">
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${participacionPrevia === 'si' ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/50'}`} onClick={() => setParticipacionPrevia('si')}>
                    <RadioGroupItem value="si" id="part-si" className="sr-only" />
                    <CheckCircle2 className={`w-6 h-6 mb-2 ${participacionPrevia === 'si' ? 'text-green-500' : 'text-zinc-600'}`} />
                    <Label className="text-center font-bold text-white text-xs cursor-pointer">Sí, ya he participado</Label>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${participacionPrevia === 'no' ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/50'}`} onClick={() => setParticipacionPrevia('no')}>
                    <RadioGroupItem value="no" id="part-no" className="sr-only" />
                    <div className="w-6 h-6 flex items-center justify-center mb-2">
                       <span className={`text-xl ${participacionPrevia === 'no' ? 'text-yellow-500' : 'text-zinc-600 grayscale'}`}>⭐</span>
                    </div>
                    <Label className="text-center font-bold text-zinc-300 text-xs cursor-pointer leading-tight">No, pero lo disfrutaré como nunca.</Label>
                  </div>
                </RadioGroup>
                
                <div className="mt-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors" onClick={() => setPatrocinadores(!patrocinadores)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${patrocinadores ? 'border-green-500 bg-green-500' : 'border-zinc-600'}`}>
                      {patrocinadores && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <Label className="text-xs text-zinc-300 font-medium cursor-pointer leading-tight">
                      Confirmo que fui a Instagram a seguir a nuestros patrocinadores principales
                    </Label>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </div>
              </div>

              {/* Datos Motocicleta */}
              <div className="space-y-4 pt-6 border-t border-[#2A2A2A]">
                <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2 mb-2">
                  <span className="text-[#00E676]">🏍️</span> 3. Datos de la Motocicleta
                </Label>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Placa Motocicleta</Label>
                  <Input value={placa} onChange={e => setPlaca(e.target.value)} placeholder="ABC123" className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 uppercase rounded-xl px-4 focus:border-[#00E676] focus:ring-[#00E676]" maxLength={6} />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Marca de tu motocicleta</Label>
                  <Select value={marca} onValueChange={setMarca}>
                    <SelectTrigger className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 rounded-xl px-4 focus:ring-[#00E676]">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-[#2A2A2A] text-white">
                      {['YAMAHA','SUZUKI','HONDA','BAJAJ','AKT','TVS','VICTORY','BENELLI','KAWASAKI','FACTORY','YCF','HERO','KYMCO','KTM','KEEWAY','HUSQVARNA','DUCATI','JIALING MOTOS'].map(m => (
                        <SelectItem key={m} value={m} className="hover:bg-[#1A1A1A] focus:bg-[#1A1A1A] cursor-pointer">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-[#B0B0B0] uppercase tracking-wider ml-1">Referencia motocicleta</Label>
                  <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej. MT-09" className="bg-[#1A1A1A] border-[#2A2A2A] text-white h-12 rounded-xl px-4 focus:border-[#00E676] focus:ring-[#00E676]" />
                </div>
              </div>

              {/* Documentos Legales */}
              <div className="space-y-3 pt-6 border-t border-[#2A2A2A] pb-6">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2">
                    <span className="text-[#00E676]">📄</span> 4. Archivos y Documentación Legal
                  </Label>
                </div>
                <p className="text-[10px] text-[#B0B0B0] mb-4 leading-relaxed">
                  Es indispensable subir estos documentos para asegurar el acceso a Plaza Mayor Medellín.
                </p>

                {[
                  { key: 'id', state: idPdf, title: "Anexa un PDF por ambos lados de tu identificación", desc: "PDF o Imagen" },
                  { key: 'placa', state: fotoPlaca, title: "Foto de la placa (Tu motocicleta)", desc: "Obligatorio" },
                  { key: 'propiedad', state: fotoPropiedad, title: "Foto/PDF Tarjeta de propiedad", desc: "Claro y legible" },
                  { key: 'soat', state: fotoSoat, title: "Fotografía del SOAT vigente", desc: "Vigente para la fecha" },
                  { key: 'deportista', state: fotoDeportista, title: "Foto tuya (Tipo Cédula o Carnet)", desc: "Fondo blanco o azul", isDeportista: true }
                ].map((item: any) => (
                  <div key={item.key} onClick={() => { if (!(item.isDeportista && isDetectingFace)) openOptions(item.key); }} className={`relative bg-[#1A1A1A] border ${item.state ? 'border-[#00E676] shadow-[0_0_15px_rgba(0,230,118,0.1)]' : 'border-[#2A2A2A]'} rounded-xl p-3 flex items-center gap-3 hover:border-[#424242] transition-all overflow-hidden ${item.isDeportista && isDetectingFace ? 'cursor-wait opacity-50' : 'cursor-pointer hover:bg-[#121212]'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${item.state ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#121212] border-[#2A2A2A]'}`}>
                      <ImageIcon className={`w-5 h-5 ${item.state ? 'text-[#00E676]' : 'text-[#00E676]/50'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <p className="text-xs text-white font-bold leading-tight truncate">{item.title}</p>
                      <p className="text-[10px] text-zinc-500">{item.state ? item.state.name : item.desc}</p>
                    </div>

                    <div className="shrink-0 z-20 pointer-events-none">
                      {item.state ? (
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-md">
                          <span className="text-green-500 text-[10px] font-bold uppercase">Subido</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-zinc-800/50 border border-zinc-700 px-2.5 py-1 rounded-md opacity-50">
                          <span className="text-zinc-400 text-[10px] font-bold uppercase">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              </div>

              {/* Columna Derecha: Pagos y Comprobante */}
              <div className="space-y-6">
                
                {/* Alerta Importante */}
                {/* Alerta Importante */}
                <div className="bg-[#1A1A1A] border border-[#FF9800]/50 rounded-2xl p-5 flex flex-col items-center text-center shadow-[0_0_20px_rgba(255,152,0,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF9800] to-transparent opacity-50"></div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#FF9800]" />
                    <span className="text-[#FF9800] font-black tracking-widest uppercase text-sm">Importante</span>
                  </div>
                  <p className="text-[#B0B0B0] text-sm leading-relaxed">Tu cupo <strong className="text-white">NO</strong> está asegurado<br/>hasta completar el pago.</p>
                </div>

                {/* Comprobante de Pago */}
                <div className="space-y-4 pt-4 lg:pt-0 pb-6">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-white text-sm font-bold uppercase tracking-wider block flex items-center gap-2">
                    <span className="text-[#00E676]">💰</span> 5. Comprobante de Pago
                  </Label>
                </div>
                
                <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#2A2A2A] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-[#B0B0B0] font-medium uppercase tracking-wider">Costo (16 Abr - 10 May)</span>
                      <span className="text-xl text-[#00E676] font-black tracking-wider shadow-[#00E676]/20">$280.000</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-[#2A2A2A]">
                      <span className="text-[10px] text-[#424242] font-medium uppercase tracking-wider">Costo (11 May - 15 May)</span>
                      <span className="text-sm text-[#B0B0B0] font-bold tracking-wider">$350.000</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="bg-[#121212] p-4 rounded-xl border border-[#2A2A2A] flex flex-col items-center gap-4 text-xs text-[#B0B0B0]">
                      <div className="shrink-0 bg-white p-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,230,118,0.15)]">
                        <img src="/sponsors/QR BANCOLOMBIA.jpg" alt="QR Bancolombia" className="w-36 h-36 md:w-40 md:h-40 object-contain rounded-xl" />
                      </div>
                      <div className="flex-1 text-center w-full">
                        <p className="font-black text-white mb-3 text-sm uppercase tracking-widest border-b border-[#2A2A2A] pb-3">Ahorros Bancolombia</p>
                        <ul className="space-y-1.5 font-mono text-[#B0B0B0] pt-1">
                          <li className="text-xl text-[#00E676] font-bold tracking-wider">316-376847-80</li>
                          <li className="text-[10px] text-[#424242] uppercase font-sans tracking-wide mt-2">Titular: <span className="text-[#B0B0B0]">Daniela Rojas Valencia</span></li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-[#121212] p-4 rounded-xl border border-[#2A2A2A] text-center">
                      <p className="font-bold text-[#424242] uppercase tracking-wide text-[10px] mb-1">Pago por LLAVE</p>
                      <p className="text-lg font-mono text-[#B0B0B0] font-bold tracking-wider">1214720768</p>
                    </div>
                  </div>

                  <Label className="text-white text-xs font-bold flex items-center gap-2 mb-3">
                    <UploadCloud className="text-[#00E676] w-4 h-4" /> Sube tu Comprobante <span className="text-[#00E676]">*</span>
                  </Label>
                  
                  <div onClick={() => openOptions('comprobante')} className={`border-2 border-dashed border-[#2A2A2A] bg-[#121212] py-6 rounded-xl text-center hover:border-[#00E676]/50 transition-all cursor-pointer hover:bg-[#1A1A1A] ${comprobantePago ? 'border-[#00E676] bg-[#00E676]/5 shadow-[0_0_15px_rgba(0,230,118,0.1)]' : ''}`}>
                    <div className="flex flex-col items-center px-4 pointer-events-none">
                      {comprobantePago ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 mb-2 text-[#00E676]" />
                          <span className="text-sm font-bold text-[#00E676] truncate w-full px-2">{comprobantePago.name}</span>
                          <span className="text-[10px] text-[#B0B0B0] mt-1 uppercase font-bold tracking-widest">Subido Exitosamente</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2 text-[#424242]" />
                          <span className="text-xs font-semibold text-[#B0B0B0]">Seleccionar imagen o PDF</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Ayuda WhatsApp */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <p className="text-white font-bold mb-1 text-sm">¿Problemas con el pago?</p>
                  <p className="text-[#B0B0B0] text-[10px] mb-4">Comunícate a nuestro canal oficial de WhatsApp</p>
                  <a href="https://wa.me/573044347740" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#121212] border border-[#00E676]/30 hover:bg-[#00E676]/10 transition-colors p-4 rounded-xl group cursor-pointer shadow-[0_0_10px_rgba(0,230,118,0.05)]">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6 text-[#00E676] group-hover:scale-110 transition-transform" />
                      <span className="text-[#00E676] font-bold text-lg tracking-wider">304 434 7740</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#00E676]/50 group-hover:text-[#00E676] transition-colors" />
                  </a>
                </div>

                {/* Graphic Footer */}
                <div className="relative rounded-2xl overflow-hidden border border-[#2A2A2A] bg-[#121212] shadow-2xl mt-0">
                  {/* Background Image Oscurecida */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity"
                    style={{ backgroundImage: "url('/sponsors/Screenshot 2026-04-24 175445.png')" }}
                  ></div>
                  {/* Gradient overlay to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
                  
                  <div className="relative z-10 p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 bg-[#FF9800]/10 rounded-full flex items-center justify-center border border-[#FF9800]/20 shadow-[0_0_30px_rgba(255,152,0,0.15)]">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <p className="text-[#B0B0B0] text-xs md:text-sm leading-relaxed mb-6 max-w-[280px]">
                      Gracias por ser parte de la <span className="text-white font-bold">Copa Stunt Colombia 2026</span>, el evento que impulsa el talento, la disciplina y la pasión por el stunt a nivel nacional e internacional.
                    </p>
                    <div className="inline-block bg-[#1A1A1A]/80 backdrop-blur-md border border-[#FF9800]/30 px-6 py-2 rounded-lg shadow-[0_0_15px_rgba(255,152,0,0.1)]">
                      <p className="text-[#FF9800] font-black tracking-widest text-sm uppercase">
                        🔥 Nos vemos en la pista. 🔥
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="mt-12 mb-16 max-w-2xl mx-auto">
              <Button type="submit" disabled={isLoading} className="bg-[#00E676] text-black hover:bg-[#00E676]/90 font-black h-16 w-full text-sm md:text-base shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all uppercase tracking-wider rounded-2xl">
                {isLoading ? "GUARDANDO..." : "CONFIRMACIÓN DE INSCRIPCIÓN Y VALIDACIÓN DE PAGO"}
                {!isLoading && <ChevronRight className="w-6 h-6 ml-2" />}
              </Button>
              <div className="flex items-center justify-center gap-2 mt-4 text-[#424242] text-[10px] uppercase font-bold tracking-widest mb-10">
                <Lock className="w-3 h-3" />
                Tu información está segura con nosotros.
              </div>
            </div>

          </form>
        )}

        {/* PASO 3: ÉXITO / ESTADOS FINALES */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 max-w-lg mx-auto w-full mt-10">
            
            {estadoPago === 'rechazado' && (
              <>
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Pago Rechazado</h2>
                <p className="text-zinc-400 text-center mb-8">
                  Lo sentimos, tu comprobante de pago no fue aceptado. Esto puede suceder si la imagen no es legible, el monto es incorrecto o si no corresponde a los datos bancarios.
                  <br/><br/>
                  Por favor, sube un comprobante válido para asegurar tu cupo.
                </p>
                <div className="flex flex-col w-full gap-3">
                  <Button 
                    onClick={() => setStep(2)} 
                    className="w-full bg-red-600 text-white hover:bg-red-500 h-12 font-bold"
                  >
                    Volver a subir comprobante
                  </Button>
                  <Link href="/profile" className="w-full">
                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12">
                      Salir por ahora
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {(estadoPago === 'en_revision' || estadoPago === 'revision_saldo') && (
              <>
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                  <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">
                  {estadoPago === 'revision_saldo' ? 'Saldo en Validación' : 'Pago en Validación'}
                </h2>
                <p className="text-zinc-400 text-center mb-8">
                  {estadoPago === 'revision_saldo' 
                    ? "Hemos recibido el comprobante de tu saldo faltante. Nuestro equipo lo revisará en breve." 
                    : "Hemos recibido tu comprobante de pago. Nuestro equipo lo revisará en breve."}
                  <br/><br/>
                  Vuelve a ingresar a esta sección más tarde para ver tu código QR de acceso oficial.
                </p>
                <Link href="/profile" className="w-full">
                  <Button className="w-full bg-zinc-800 text-white hover:bg-zinc-700 h-12">
                    Ir a mi perfil
                  </Button>
                </Link>
              </>
            )}

            {estadoPago === 'aprobado' && (
              <>
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] border border-green-500/30">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2 text-center">¡Inscripción Aprobada!</h2>
                <h3 className="text-xl font-bold text-green-400 mb-2 text-center">¡Gracias por ser parte de la Copa Stunt 2026!</h3>
                <p className="text-zinc-400 text-center mb-8">
                  Presenta este código QR en el ingreso de Plaza Mayor Medellín para validar tu identidad.
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
              </>
            )}
            
          </div>
        )}

      </div>

      {/* Modals para Cámara y Opciones de Archivo */}
      <CameraModal 
        isOpen={cameraOpen} 
        onClose={() => setCameraOpen(false)} 
        onCapture={(file) => {
          handleFileFromDialog(file);
        }} 
        title="Capturar Documento"
        isDeportista={currentDocKey === 'deportista'}
      />

      <Dialog open={optionsModalOpen} onOpenChange={setOptionsModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Subir Documento</DialogTitle>
            <DialogDescription className="text-zinc-400">
              ¿Cómo deseas adjuntar este archivo?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => { setOptionsModalOpen(false); setCameraOpen(true); }} className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white flex items-center justify-start gap-3 rounded-xl">
              <Camera className="w-5 h-5 text-green-500" />
              <span className="font-bold">Tomar Foto</span>
            </Button>
            <div className="relative">
              <Input type="file" id="dialog-file" onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : null;
                if (file) handleFileFromDialog(file);
              }} className="hidden" accept=".pdf,image/*" />
              <Label htmlFor="dialog-file" className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white flex items-center justify-start gap-3 rounded-xl cursor-pointer px-4">
                <UploadCloud className="w-5 h-5 text-green-500" />
                <span className="font-bold">Subir Archivo / PDF</span>
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
