'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const router = useRouter();
  const { toast } = useToast();

  const toggleAuthMode = () => {
    setIsLogin((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Sesión iniciada",
          description: "Bienvenido de nuevo. Redirigiendo...",
        });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: Firestore could be used here to save `name` user profile.
        toast({
          title: "Inscripción exitosa",
          description: "Tu cuenta ha sido creada. Redirigiendo...",
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message.includes('auth/invalid-credential') ? "Credenciales inválidas." : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
      {/* Glow effect behind the card */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/50 to-purple-600/50 blur-xl opacity-50 animate-pulse"></div>
      
      <Card className="relative bg-background/60 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden">
        {/* Subtle top reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        <CardHeader className="space-y-2 text-center pb-6 pt-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {isLogin
              ? 'Ingresa tus credenciales para acceder a tu panel.'
              : 'Únete hoy mismo a la plataforma.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`space-y-4 transition-all duration-300 ${!isLogin ? 'opacity-100' : 'hidden opacity-0'}`}>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="pl-10 bg-background/50 border-white/10 focus-visible:ring-primary/50" required={!isLogin} />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="pl-10 bg-background/50 border-white/10 focus-visible:ring-primary/50" required />
              </div>
            </div>
            
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                {isLogin && (
                  <button type="button" className="text-xs text-primary hover:underline transition-all">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 bg-background/50 border-white/10 focus-visible:ring-primary/50" required />
              </div>
            </div>

            
            <Button type="submit" className="w-full mt-6 h-12 text-md transition-all hover:scale-[1.02] shadow-lg shadow-primary/25" disabled={isLoading}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : isLogin ? (
                'Iniciar Sesión'
              ) : (
                'Completar Registro'
              )}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center justify-center space-y-4 pb-8 pt-4">
          <div className="text-sm text-muted-foreground">
            {isLogin ? "¿No tienes una cuenta aún?" : "¿Ya tienes una cuenta?"}
          </div>
          <Button 
            variant="outline" 
            className="w-full h-11 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:text-primary transition-all group"
            onClick={toggleAuthMode}
            type="button"
          >
            {isLogin ? (
              <span className="font-semibold tracking-wide">INSCRIPCION</span>
            ) : (
              <span>Volver al Login</span>
            )}
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
