'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Mail, Phone, Calendar, AtSign, Globe, CheckCircle2, ShieldCheck, Flag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  nombres: string;
  apellidos: string;
  seudonimo: string;
  email: string;
  tipoDocumento: string;
  numeroIdentificacion: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  fechaNacimiento: string;
  instagram: string;
  redesSociales: string;
  photoURL: string;
  habeasDataAccepted: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-8 animate-pulse bg-zinc-950 min-h-[calc(100vh-4rem)]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px] bg-zinc-800" />
          <Skeleton className="h-4 w-[300px] bg-zinc-800" />
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Skeleton className="h-8 w-[150px] bg-zinc-800" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full bg-zinc-800" />
            <Skeleton className="h-4 w-[250px] bg-zinc-800" />
            <Skeleton className="h-4 w-[250px] bg-zinc-800" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="relative min-h-[calc(100vh)] flex flex-col p-6 lg:p-10 text-zinc-100 overflow-hidden">
      {/* Background Image requested by user */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-100 mix-blend-luminosity z-0"
        style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDAyJVy5FYI-QsMV4wdC-aFVpz9MgMdYb0yQ&s')" }}
      ></div>
      {/* Dark overlay to ensure text readability - made much lighter so image shows through */}
      <div className="absolute inset-0 bg-zinc-950/70 z-0"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Replaced PageHeader with inline to control dark colors strictly */}
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">Mi Perfil</h1>
          <p className="text-zinc-400">Gestiona tu información personal y datos de piloto.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Tarjeta Principal de Perfil */}
          <Card className="md:col-span-1 border-white/10 shadow-2xl relative overflow-hidden bg-zinc-950/60 backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-4">
             {profile.habeasDataAccepted && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-sm shadow-lg">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <Avatar className="w-32 h-32 mx-auto border-4 border-zinc-900 shadow-xl ring-2 ring-zinc-700">
                <AvatarImage src={profile.photoURL} alt={profile.nombres} className="object-cover" />
                <AvatarFallback className="text-4xl bg-zinc-800 text-zinc-300">{profile.nombres?.charAt(0)}{profile.apellidos?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-2xl font-bold text-white">{profile.nombres} {profile.apellidos}</CardTitle>
              <CardDescription className="text-lg text-zinc-400 font-medium flex items-center justify-center gap-1">
                <Flag className="w-4 h-4 text-zinc-500" />
                {profile.seudonimo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm mt-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{profile.telefono}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>{profile.ciudad} - {profile.direccion}</span>
              </div>
            </CardContent>
          </Card>

          {/* Detalles e Información Avanzada */}
          <Card className="md:col-span-2 shadow-2xl border-white/10 bg-zinc-950/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Información Detallada</CardTitle>
              <CardDescription className="text-zinc-400">Datos registrados durante la inscripción</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 text-zinc-100">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <User className="w-4 h-4" /> Tipo y Documento
                </p>
                <p className="font-semibold text-zinc-200">{profile.tipoDocumento} {profile.numeroIdentificacion}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Fecha de Nacimiento
                </p>
                <p className="font-semibold text-zinc-200">{profile.fechaNacimiento}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <AtSign className="w-4 h-4" /> Instagram
                </p>
                <p className="font-semibold text-zinc-200">{profile.instagram || 'No registrado'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Otras Redes
                </p>
                <p className="font-semibold text-zinc-200">{profile.redesSociales || 'No registrado'}</p>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-4 border-t border-zinc-800">
                <p className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500/70" /> Estado de Privacidad
                </p>
                <div className="bg-zinc-900/50 p-4 rounded-lg text-sm text-zinc-300 border border-zinc-800 shadow-inner">
                  El usuario ha aceptado los términos de tratamiento de datos personales (Habeas Data) en el marco de la Ley 1581 de 2012.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
