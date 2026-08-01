'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lock, Mail, User, Phone, MapPin, Calendar, AtSign, Flame, ClipboardList, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Loader2, Upload } from 'lucide-react';

// Helper component for Standard Input with Icon
const FloatingInput = ({ id, label, type = "text", value, onChange, icon: Icon, required = false, isSelect = false, options = [] }: any) => {
  return (
    <div className="relative w-full mb-2">
      <label htmlFor={id} className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-1">
        {label} {required && <span className="text-[#E60000]">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3.5 h-4 w-4 text-[#E60000]" strokeWidth={1.5} />}
        
        {isSelect ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            className={`block w-full h-10 text-xs text-zinc-200 bg-[#111] border border-zinc-800 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#E60000] focus:border-[#E60000] transition-all ${Icon ? 'pl-9' : 'pl-3'}`}
          >
          <option value="" disabled hidden></option>
          {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>)}
        </select>
        ) : (
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={`Ej. ${label.split(' ')[0]}`}
            className={`block w-full h-10 text-xs text-zinc-200 bg-[#111] border border-zinc-800 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-[#E60000] focus:border-[#E60000] transition-all placeholder:text-zinc-600 ${Icon ? 'pl-9' : 'pl-3'} ${type === 'date' ? '[color-scheme:dark]' : ''}`}
          />
        )}
      </div>
    </div>
  );
};

export function AuthForm({ externalIsLogin, onToggleAuthMode, onBackToMenu, mode = 'default' }: { externalIsLogin?: boolean; onToggleAuthMode?: (mode: boolean) => void; onBackToMenu?: () => void; mode?: 'default' | 'staff' } = {}) {
  const [internalIsLogin, setInternalIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHabeasData, setShowHabeasData] = useState(false);
  const [createdUserUid, setCreatedUserUid] = useState<string | null>(null);
  const [duplicateIdDialogOpen, setDuplicateIdDialogOpen] = useState(false);
  const [duplicateIdValue, setDuplicateIdValue] = useState('');
  
  // Reset Password State
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const isLogin = externalIsLogin !== undefined ? externalIsLogin : internalIsLogin;
  
  const setIsLogin = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isLogin) : val;
    setInternalIsLogin(nextVal);
    if (onToggleAuthMode) onToggleAuthMode(nextVal);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      setIsLogin(true);
    }
  }, []);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [seudonimo, setSeudonimo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [dv, setDv] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [tallaCamisa, setTallaCamisa] = useState('');

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

  
  // Tutor fields for Minors (TI)
  const [nombreTutor, setNombreTutor] = useState('');
  const [cedulaTutor, setCedulaTutor] = useState('');
  const [telefonoTutor, setTelefonoTutor] = useState('');
  const [correoTutor, setCorreoTutor] = useState('');
  const [parentescoTutor, setParentescoTutor] = useState('');

  const isMinor = () => {
    if (!fechaNacimiento) return false;
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 18;
  };

  const requireTutor = tipoDocumento === 'TI' || isMinor();

  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async () => {
    let incomplete = false;
    if (!nombres || !apellidos || !tipoDocumento || !numeroIdentificacion || !telefono || !ciudad || !direccion || !email || !password) {
      incomplete = true;
    }
    if (mode === 'default' && (!seudonimo || !fechaNacimiento || !tallaCamisa)) {
      incomplete = true;
    }
    if (tipoDocumento === 'NIT' && !dv) {
      incomplete = true;
    }

    if (incomplete) {
      toast({ title: "Campos incompletos", description: "Por favor completa todos los campos obligatorios (*).", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (requireTutor && (!nombreTutor || !cedulaTutor || !telefonoTutor || !correoTutor || !parentescoTutor)) {
      toast({ title: "Datos del tutor faltantes", description: "Al ser menor de edad, todos los datos de tu adulto responsable (incluyendo parentesco) son obligatorios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      // 1. Verificar si el correo o la cédula ya existen en Firestore antes de crear el usuario (si las reglas de lectura lo permiten)
      let isIdDuplicate = false;
      let isEmailDuplicate = false;
      try {
        const usersRef = collection(db, 'users');
        
        // Consultar por numeroIdentificacion
        const qId = query(usersRef, where("numeroIdentificacion", "==", numeroIdentificacion));
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          isIdDuplicate = true;
        }

        // Consultar por email
        const qEmail = query(usersRef, where("email", "==", email.trim().toLowerCase()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          isEmailDuplicate = true;
        }
      } catch (queryErr) {
        console.warn("Aviso: No se pudo verificar duplicados preliminarmente por reglas de Firestore.", queryErr);
      }

      if (isIdDuplicate) {
        setDuplicateIdValue(numeroIdentificacion);
        setDuplicateIdDialogOpen(true);
        setIsLoading(false);
        return;
      }

      if (isEmailDuplicate) {
        toast({ 
          title: "Correo ya registrado", 
          description: "El correo electrónico ya se encuentra registrado. Por favor, inicia sesión.", 
          variant: "destructive" 
        });
        setIsLogin(true);
        setIsLoading(false);
        return;
      }

      // 2. Crear la cuenta en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Verificación de seguridad secundaria por si la verificación preliminar no pudo leer por falta de sesión
      let isDuplicateSec = false;
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("numeroIdentificacion", "==", numeroIdentificacion));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          isDuplicateSec = true;
        }
      } catch (queryErr) {
        console.warn("Aviso: No se pudo verificar duplicados secundaria por reglas de Firestore.", queryErr);
      }

      if (isDuplicateSec) {
        // Borrar la cuenta Auth recién creada porque la cédula ya estaba registrada
        await user.delete();
        setDuplicateIdValue(numeroIdentificacion);
        setDuplicateIdDialogOpen(true);
        setIsLoading(false);
        return;
      }
      
      // 4. Crear el documento del usuario en la base de datos
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
        rol: mode,
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

      setCreatedUserUid(user.uid);
      setShowHabeasData(true);
      setIsLoading(false);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use')) {
        toast({ 
          title: "Correo ya registrado", 
          description: "El correo electrónico ya se encuentra registrado. Por favor, inicia sesión.", 
          variant: "destructive" 
        });
        setIsLogin(true);
      } else {
        toast({ title: "Error de registro", description: error.message, variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Sesión iniciada", description: "Bienvenido de nuevo." });
      router.push('/inscripcion');
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message.includes('auth/invalid-credential') ? "Credenciales inválidas." : error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordEmail) {
      toast({ title: "Falta el correo", description: "Por favor ingresa tu correo electrónico.", variant: "destructive" });
      return;
    }
    
    setIsResetting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetPasswordEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido al enviar el correo');
      }

      toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada o spam para restablecer tu contraseña." });
      setResetPasswordDialogOpen(false);
      setResetPasswordEmail('');
    } catch (error: any) {
      console.error("Error enviando correo de recuperación:", error);
      toast({ 
        title: "Error", 
        description: error.message.includes('auth/user-not-found') || error.message.includes('user-not-found') 
          ? "No hay ninguna cuenta registrada con este correo." 
          : `No se pudo enviar el correo: ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  const handleAcceptHabeasData = async () => {
    if (!createdUserUid) return;
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'users', createdUserUid), {
        habeasDataAccepted: true,
        habeasDataAcceptedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({ title: "Inscripción exitosa", description: "Tu cuenta ha sido creada y configurada." });
      setShowHabeasData(false);
      router.push('/inscripcion');
    } catch (error: any) {
      toast({ title: "Error confirmando inscripción", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-h-[85vh] overflow-y-auto bg-[#0A0A0A]/95 backdrop-blur-xl border border-zinc-800/80 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] relative drop-shadow-[0_0_15px_rgba(0,0,0,1)] flex flex-col pb-8">
        
        {/* Support Alert Box */}
        <div className="bg-[#E60000]/10 border-b border-[#E60000]/20 py-2.5 px-4 text-center select-none relative z-20">
          <p className="text-[10px] sm:text-xs font-bold text-white tracking-wider flex items-center justify-center gap-1.5">
            <span className="text-[#E60000] animate-pulse">⚠️</span> ¿TIENES PROBLEMAS? COMUNÍCATE AL <a href="https://wa.me/573208185796" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E60000] font-black text-[#FFB700] transition-colors">3208185796</a>
          </p>
        </div>
        
        {/* Subtle Neon Glow behind form */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E60000]/[0.03] to-transparent pointer-events-none rounded-3xl"></div>

        {/* Header Block */}
        <div className="flex flex-col items-center justify-center pt-6 pb-4 px-6 relative z-10">
          <div className="flex flex-col items-center gap-2.5">

            <div className="text-center flex flex-col items-center">
              <ClipboardList className="w-4 h-4 text-[#E60000] mb-1.5 drop-shadow-[0_0_8px_rgba(230,0,0,0.8)]" strokeWidth={1.5} />
              <h2 className="text-xl md:text-2xl font-headline font-black text-white uppercase tracking-wider drop-shadow-lg">
                {isLogin ? 'INICIAR SESIÓN' : (mode === 'staff' ? 'REGISTRO OFICIAL' : 'INSCRIPCIÓN OFICIAL')}
              </h2>
              <p className="text-zinc-400 text-[10px] md:text-xs mt-0.5 mb-3">
                {isLogin ? 'Ingresa para gestionar tu registro' : (mode === 'staff' ? 'Completa tus datos para trabajar de la mejor manera' : 'Completa tus datos para asegurar tu cupo')}
              </p>
              <button 
                type="button" 
                onClick={() => {
                  if (isLogin && onBackToMenu) {
                    onBackToMenu();
                  } else {
                    setIsLogin(!isLogin);
                  }
                }}
                className="text-[10px] uppercase tracking-widest font-bold text-[#E60000] hover:text-white bg-transparent hover:bg-[#E60000] border border-[#E60000] px-4 py-1.5 rounded-full transition-all"
              >
                {isLogin ? '← VOLVER A INSCRIPCIÓN' : 'INICIAR SESIÓN'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 md:px-8 relative z-10 pb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FloatingInput id="nombres" label="Nombres" icon={User} value={nombres} onChange={(e: any) => setNombres(e.target.value)} required />
                  <FloatingInput id="apellidos" label="Apellidos" icon={User} value={apellidos} onChange={(e: any) => setApellidos(e.target.value)} required />
                  
                  {mode === 'default' && (
                    <>
                      <FloatingInput id="seudonimo" label="Seudónimo (@Apodo)" icon={AtSign} value={seudonimo} onChange={(e: any) => setSeudonimo(e.target.value)} required />
                      <FloatingInput id="fechaNacimiento" label="Fecha de Nacimiento" type="date" icon={Calendar} value={fechaNacimiento} onChange={(e: any) => setFechaNacimiento(e.target.value)} required />
                    </>
                  )}
                  
                  <FloatingInput 
                    id="tipoDocumento" 
                    label="Tipo de Documento" 
                    isSelect 
                    value={tipoDocumento} 
                    onChange={(e: any) => setTipoDocumento(e.target.value)} 
                    required 
                    options={[
                      { value: "CC", label: "Cédula de Ciudadanía" },
                      { value: "TI", label: "Tarjeta de Identidad" },
                      { value: "CE", label: "Cédula de Extranjería" },
                      { value: "Pasaporte", label: "Pasaporte" },
                      { value: "NIT", label: "NIT" }
                    ]}
                  />
                  {tipoDocumento === 'NIT' ? (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <FloatingInput id="numeroIdentificacion" label="Número de NIT" value={numeroIdentificacion} onChange={(e: any) => setNumeroIdentificacion(e.target.value)} required />
                      </div>
                      <div className="w-16">
                        <FloatingInput id="dv" label="DV" value={dv} onChange={(e: any) => setDv(e.target.value)} required />
                      </div>
                    </div>
                  ) : (
                    <FloatingInput id="numeroIdentificacion" label="Número de Identificación" value={numeroIdentificacion} onChange={(e: any) => setNumeroIdentificacion(e.target.value)} required />
                  )}

                  {/* TI / Minor (Tutor) Fields */}
                  {requireTutor && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl mt-1">
                      <div className="md:col-span-2">
                        <p className="text-orange-400 font-bold text-[10px] uppercase tracking-widest">Datos Adulto Responsable (Tutor)</p>
                      </div>
                      <FloatingInput id="nombreTutor" label="Nombre Completo" value={nombreTutor} onChange={(e: any) => setNombreTutor(e.target.value)} required={true} />
                      <FloatingInput id="cedulaTutor" label="Cédula" value={cedulaTutor} onChange={(e: any) => setCedulaTutor(e.target.value)} required={true} />
                      <FloatingInput id="parentescoTutor" label="Parentesco (Ej. Padre, Madre)" value={parentescoTutor} onChange={(e: any) => setParentescoTutor(e.target.value)} required={true} />
                      <FloatingInput id="telefonoTutor" label="Teléfono" type="tel" value={telefonoTutor} onChange={(e: any) => setTelefonoTutor(e.target.value)} required={true} />
                      <div className="md:col-span-2">
                        <FloatingInput id="correoTutor" label="Correo Electrónico" type="email" icon={Mail} value={correoTutor} onChange={(e: any) => setCorreoTutor(e.target.value)} required={true} />
                      </div>
                    </div>
                  )}

                  <FloatingInput id="telefono" label="Teléfono" icon={Phone} type="tel" value={telefono} onChange={(e: any) => setTelefono(e.target.value)} required />
                  <FloatingInput id="ciudad" label="Ciudad" icon={MapPin} value={ciudad} onChange={(e: any) => setCiudad(e.target.value)} required />

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FloatingInput id="direccion" label="Dirección" icon={MapPin} value={direccion} onChange={(e: any) => setDireccion(e.target.value)} required />
                    {mode === 'default' && (
                      <FloatingInput 
                        id="tallaCamisa" 
                        label="Talla de Camisa" 
                        isSelect 
                        value={tallaCamisa} 
                        onChange={(e: any) => setTallaCamisa(e.target.value)} 
                        required 
                        options={[
                          { value: "S", label: "S" },
                          { value: "M", label: "M" },
                          { value: "L", label: "L" },
                          { value: "XL", label: "XL" },
                          { value: "XXL", label: "XXL" }
                        ]}
                      />
                    )}
                  </div>

                  {mode === 'default' && (
                    <div className="md:col-span-2">
                      <FloatingInput id="instagram" label="Instagram (@usuario)" icon={AtSign} value={instagram} onChange={(e: any) => setInstagram(e.target.value)} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Credenciales Section */}
            <div className="mt-6 border-t border-zinc-800/50 pt-4">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Credenciales de Acceso</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FloatingInput id="email" label="Correo Electrónico" type="email" icon={Mail} value={email} onChange={(e: any) => setEmail(e.target.value)} required />
                <div>
                  <FloatingInput id="password" label="Contraseña" type="password" icon={Lock} value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => setResetPasswordDialogOpen(true)}
                      className="text-[10px] text-zinc-500 hover:text-[#E60000] mt-1.5 block w-full text-right transition-colors font-semibold"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#E60000] hover:bg-[#CC0000] text-white text-sm md:text-base font-black tracking-wider uppercase transition-all duration-300 shadow-[0_0_20px_rgba(230,0,0,0.3)] hover:shadow-[0_0_30px_rgba(230,0,0,0.6)] rounded-lg border-none flex items-center justify-center gap-2 group" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-black inline-block"></span>
                ) : (
                  <>
                    <span>{isLogin ? "INGRESAR" : (mode === 'staff' ? "REGISTRO COMPLETO" : "ASEGURAR MI CUPO")}</span>
                    <Flame className="w-5 h-5 group-hover:scale-110 transition-transform text-white" strokeWidth={2.5} />
                  </>
                )}
              </Button>
            </div>

            {/* Trust Indicators */}
            {!isLogin && (
              <div className="flex justify-between items-center px-2 pt-2">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span className="text-[9px] uppercase tracking-wider font-bold">Cupos Limitados</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span className="text-[9px] uppercase tracking-wider font-bold">Proceso Seguro</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span className="text-[9px] uppercase tracking-wider font-bold hidden sm:inline-block">Confirmación Inmediata</span>
                </div>
              </div>
            )}
            
            
          </form>
        </div>
      </div>

      {/* Habeas Data Dialog */}
      <Dialog open={showHabeasData} onOpenChange={setShowHabeasData}>
        <DialogContent className="sm:max-w-[600px] border-[#222] bg-[#0A0A0A] text-zinc-100 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-widest text-[#00FF00]">Tratamiento de Datos</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Por favor lee y acepta nuestra política para continuar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[250px] rounded-xl border border-zinc-800 p-5 mt-4 bg-[#111]">
            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">Habeas Data - Ley 1581 de 2012</h4>
            <p className="mb-4 text-zinc-400 text-sm">
              De acuerdo con la Ley Estatutaria 1581 de 2012 de Protección de Datos y normas concordantes, 
              se le informa al usuario que los datos consignados en el presente formulario serán incorporados 
              en una base de datos responsabilidad de la organización del evento.
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2 text-zinc-400 text-sm">
              <li>Gestión administrativa, organizativa y logística del evento.</li>
              <li>Envío de comunicaciones e información relacionada con el evento.</li>
              <li>Toma y uso de material audiovisual (fotografías y videos).</li>
            </ul>
            <p className="font-bold mt-4 text-[#FFB700] text-sm">
              Al hacer clic en "Aceptar", autorizo de manera expresa el tratamiento de mis datos personales.
            </p>
          </ScrollArea>
          <DialogFooter className="mt-4 gap-3 sm:gap-0">
            <Button variant="outline" className="border-[#222] text-zinc-300 hover:bg-[#111] hover:text-white rounded-xl" onClick={() => setShowHabeasData(false)}>Cancelar</Button>
            <Button className="bg-[#FFB700] text-white hover:bg-[#E5A400] font-bold rounded-xl" onClick={handleAcceptHabeasData} disabled={isLoading}>
              {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-black mr-2"></div> : null}
              Aceptar y Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialogo de Identificación Duplicada */}
      <Dialog open={duplicateIdDialogOpen} onOpenChange={setDuplicateIdDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-orange-500 flex flex-col items-center gap-2">
              <AlertCircle className="w-10 h-10" />
              Documento Ya Registrado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-zinc-300">
              El número de identificación <span className="font-bold text-white">{duplicateIdValue}</span> ya se encuentra registrado en nuestra base de datos.
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Si ya tienes una cuenta, por favor inicia sesión para continuar con tu proceso.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Button 
              variant="outline"
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 w-full sm:w-auto rounded-xl"
              onClick={() => setDuplicateIdDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button 
              className="bg-[#E60000] text-white hover:bg-[#CC0000] w-full sm:w-auto font-bold rounded-xl"
              onClick={() => {
                setDuplicateIdDialogOpen(false);
                setIsLogin(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Iniciar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialogo de Recuperación de Contraseña */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-[#E60000] flex flex-col items-center gap-2">
              <KeyRound className="w-10 h-10" />
              Recuperar Contraseña
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-zinc-300 text-sm mb-4">
              Ingresa el <strong className="text-white">correo electrónico</strong> asociado a tu cuenta para enviarte un enlace de recuperación segura.
            </p>
            <FloatingInput 
              id="resetEmail" 
              label="Correo Electrónico" 
              type="email" 
              icon={Mail} 
              value={resetPasswordEmail} 
              onChange={(e: any) => setResetPasswordEmail(e.target.value)} 
              required 
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-center mt-2">
            <Button 
              variant="outline"
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 w-full sm:w-auto rounded-xl"
              onClick={() => setResetPasswordDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-[#E60000] text-white hover:bg-[#CC0000] w-full sm:w-auto font-bold rounded-xl"
              onClick={handleResetPassword}
              disabled={isResetting || !resetPasswordEmail}
            >
              {isResetting ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-black mr-2"></div> : null}
              Enviar Enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

