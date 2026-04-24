'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Lock, Mail, User, Phone, MapPin, Map, Calendar, Image as ImageIcon, AtSign, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';

export function AuthForm({ externalIsLogin, onToggleAuthMode }: { externalIsLogin?: boolean; onToggleAuthMode?: (mode: boolean) => void } = {}) {
  const [internalIsLogin, setInternalIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHabeasData, setShowHabeasData] = useState(false);
  const [createdUserUid, setCreatedUserUid] = useState<string | null>(null);

  // Use external state if provided, otherwise fallback to internal
  const isLogin = externalIsLogin !== undefined ? externalIsLogin : internalIsLogin;
  
  const setIsLogin = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isLogin) : val;
    setInternalIsLogin(nextVal);
    if (onToggleAuthMode) onToggleAuthMode(nextVal);
  };

  useEffect(() => {
    // Check if URL has #login to switch to login mode automatically
    if (typeof window !== 'undefined' && window.location.hash === '#login') {
      setIsLogin(true);
    }
  }, []);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration additional fields
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [seudonimo, setSeudonimo] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [instagram, setInstagram] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  
  // Tutor fields for Minors (TI)
  const [nombreTutor, setNombreTutor] = useState('');
  const [cedulaTutor, setCedulaTutor] = useState('');
  const [telefonoTutor, setTelefonoTutor] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const toggleAuthMode = () => {
    setIsLogin((prev) => !prev);
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email,
        nombres,
        apellidos,
        seudonimo,
        tipoDocumento,
        numeroIdentificacion,
        instagram,
        telefono,
        ciudad,
        direccion,
        fechaNacimiento,
        nombreTutor: tipoDocumento === 'TI' ? nombreTutor : null,
        cedulaTutor: tipoDocumento === 'TI' ? cedulaTutor : null,
        telefonoTutor: tipoDocumento === 'TI' ? telefonoTutor : null,
        habeasDataAccepted: false,
        createdAt: new Date().toISOString()
      });

      setCreatedUserUid(user.uid);
      setShowHabeasData(true);
      setIsLoading(false);

    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Sesión iniciada",
        description: "Bienvenido de nuevo.",
      });
      router.push('/inscripcion');
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message.includes('auth/invalid-credential') ? "Credenciales inválidas." : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
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
      
      toast({
        title: "Inscripción exitosa",
        description: "Tu cuenta ha sido creada y configurada.",
      });
      setShowHabeasData(false);
      router.push('/inscripcion');
    } catch (error: any) {
      toast({
        title: "Error confirmando inscripción",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`w-full relative animate-in fade-in zoom-in-95 duration-500 ${isLogin ? 'max-w-md' : 'max-w-4xl'}`}>
        {/* Glow effect - Grayscale based */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-zinc-700/50 to-neutral-900/50 blur-xl opacity-60 animate-pulse"></div>
        
        <Card className="relative bg-zinc-950/80 backdrop-blur-2xl border-white/5 shadow-2xl overflow-hidden">
          {/* Subtle top reflection */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent"></div>
          
          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-2 ring-zinc-700/50 shadow-[0_0_15px_rgba(34,197,94,0.2)] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://media.tenor.com/4O9j9UByi7oAAAAj/motorcycle-tricks.gif" alt="Motorcycle Stunt" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="text-3xl font-headline uppercase font-bold tracking-widest text-white">
              {isLogin ? 'INICIAR SESIÓN' : 'INSCRIPCIÓN'}
            </CardTitle>

          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Registration Form (Scrollable Area includes email/pwd) */}
              {!isLogin && (
                <div className="py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombres y Apellidos */}
                    <div className="space-y-2">
                      <Label htmlFor="nombres" className="text-zinc-300">Nombres</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} placeholder="Ej. Juan Marcos" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos" className="text-zinc-300">Apellidos</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Ej. Pérez Gómez" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>

                    {/* Seudónimo y Fecha Nacimiento */}
                    <div className="space-y-2">
                      <Label htmlFor="seudonimo" className="text-zinc-300">Seudónimo</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="seudonimo" value={seudonimo} onChange={(e) => setSeudonimo(e.target.value)} placeholder="Nickname (Rider)" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fechaNacimiento" className="text-zinc-300">Fecha de Nacimiento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="fechaNacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 [color-scheme:dark]" required />
                      </div>
                    </div>

                    {/* Documento */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Tipo de Documento</Label>
                      <Select value={tipoDocumento} onValueChange={setTipoDocumento} required>
                        <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                          <SelectItem value="CC">Cédula de Ciudadanía (CC)</SelectItem>
                          <SelectItem value="TI">Tarjeta de Identidad (TI)</SelectItem>
                          <SelectItem value="CE">Cédula de Extranjería (CE)</SelectItem>
                          <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numeroIdentificacion" className="text-zinc-300">Número de Identificación</Label>
                      <div className="relative">
                        <Input id="numeroIdentificacion" type="text" value={numeroIdentificacion} onChange={(e) => setNumeroIdentificacion(e.target.value)} placeholder="1234567890" className="pl-4 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>

                    {tipoDocumento === 'TI' && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl mt-2">
                        <div className="md:col-span-3">
                          <p className="text-orange-400 font-bold text-sm flex items-center gap-2">
                            <User className="w-4 h-4" /> Datos del Adulto Responsable (Tutor)
                          </p>
                          <p className="text-zinc-400 text-xs mt-1">Obligatorio por ser menor de edad.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nombreTutor" className="text-zinc-300">Nombre Completo</Label>
                          <Input id="nombreTutor" value={nombreTutor} onChange={(e) => setNombreTutor(e.target.value)} placeholder="Ej. Carlos Pérez" className="bg-zinc-900/50 border-zinc-800 text-zinc-100" required={tipoDocumento === 'TI'} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cedulaTutor" className="text-zinc-300">Cédula</Label>
                          <Input id="cedulaTutor" value={cedulaTutor} onChange={(e) => setCedulaTutor(e.target.value)} placeholder="12345678" className="bg-zinc-900/50 border-zinc-800 text-zinc-100" required={tipoDocumento === 'TI'} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefonoTutor" className="text-zinc-300">Teléfono</Label>
                          <Input id="telefonoTutor" value={telefonoTutor} onChange={(e) => setTelefonoTutor(e.target.value)} placeholder="+57 300..." className="bg-zinc-900/50 border-zinc-800 text-zinc-100" required={tipoDocumento === 'TI'} />
                        </div>
                      </div>
                    )}

                    {/* Contacto */}
                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-zinc-300">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300 000 0000" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad" className="text-zinc-300">Ciudad</Label>
                      <div className="relative">
                        <Map className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ej. Bogotá" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="direccion" className="text-zinc-300">Dirección</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Cra. 12 # 34 - 56" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="instagram" className="text-zinc-300">Instagram</Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" />
                      </div>
                    </div>



                    {/* Email and Password inside the registration flow so it's grouped better */}
                    <div className="space-y-2 md:col-span-2 pt-4 border-t border-zinc-800">
                      <h4 className="text-zinc-400 uppercase text-xs font-bold tracking-wider mb-2">Credenciales de Acceso</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-reg" className="text-zinc-300">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="email-reg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password-reg" className="text-zinc-300">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input id="password-reg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100" required />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Login fields (Only visible when logging in) */}
              {isLogin && (
                <div className="grid grid-cols-1 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-600" required />
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                      <button type="button" className="text-xs text-zinc-400 hover:text-white hover:underline transition-all">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-600" required />
                    </div>
                  </div>
                </div>
              )}
              
              <Button type="submit" className="w-full mt-6 h-16 bg-black hover:bg-zinc-900 border border-green-500/30 text-white text-xl font-headline tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] flex items-center justify-center gap-4 group" disabled={isLoading}>
                {isLoading ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-b-2 border-white inline-block"></span>
                ) : (
                  <>
                    <img 
                      src="https://media.giphy.com/avatars/endurodelverano/7z0REJj5cv3R.gif" 
                      alt="Stunt" 
                      className="w-10 h-10 object-contain rounded-full animate-[spin_2.5s_linear_infinite]"
                      style={{ animationDirection: 'reverse' }}
                    />
                    <span className="text-white group-hover:text-green-400 transition-colors">{isLogin ? "INGRESAR" : "INSCRIPCIÓN"}</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          

        </Card>
      </div>

      {/* Habeas Data Dialog */}
      <Dialog open={showHabeasData} onOpenChange={setShowHabeasData}>
        <DialogContent className="sm:max-w-[600px] border-zinc-800 bg-zinc-950/95 backdrop-blur-md text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Autorización de Tratamiento de Datos Personales</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Por favor lee y acepta nuestra política de datos para continuar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] rounded-md border border-zinc-800 p-4 text-sm mt-4 bg-zinc-900/50">
            <h4 className="font-semibold mb-2">Habeas Data - Ley 1581 de 2012</h4>
            <p className="mb-4 text-zinc-400">
              De acuerdo con la Ley Estatutaria 1581 de 2012 de Protección de Datos y normas concordantes, 
              se le informa al usuario que los datos consignados en el presente formulario serán incorporados 
              en una base de datos responsabilidad de la organización del evento.
            </p>
            <p className="mb-4 text-zinc-400">
              Su información será tratada con las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1 text-zinc-400">
              <li>Gestión administrativa, organizativa y logística del evento.</li>
              <li>Envío de comunicaciones e información relacionada con el evento.</li>
              <li>Toma y uso de material audiovisual (fotografías y videos) durante el evento para fines publicitarios.</li>
              <li>Mantener el histórico de participantes para futuras ediciones.</li>
            </ul>
            <p className="mb-4 text-zinc-400">
              Usted puede ejercer sus derechos de conocer, actualizar, rectificar y suprimir sus datos personales, 
              así como revocar el consentimiento otorgado para el tratamiento de los mismos.
            </p>
            <p className="font-semibold mt-4 text-white">
              Al hacer clic en "Aceptar y Continuar", autorizo de manera expresa, informada y libre 
              el tratamiento de mis datos personales conforme a los términos aquí descritos.
            </p>
          </ScrollArea>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white" onClick={() => setShowHabeasData(false)}>Cancelar</Button>
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200" onClick={handleAcceptHabeasData} disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-zinc-950 mr-2"></div>
              ) : null}
              Aceptar y Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
