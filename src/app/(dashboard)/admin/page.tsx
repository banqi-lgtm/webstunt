'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Shield, Search, UserCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface AppUser {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  numeroIdentificacion: string;
  interfaces: string[];
}

const INTERFACES_CONFIG = [
  { id: 'f2r', label: 'Copa F2R', color: 'text-zinc-300', border: 'border-zinc-800' },
  { id: 'admin', label: 'Panel Admin', color: 'text-red-400 font-bold', border: 'border-red-500/30 bg-red-950/20' },
  { id: 'pilotos', label: 'Pilotos', color: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'staff', label: 'Staff', color: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'control-staff', label: 'Control Staff', color: 'text-emerald-400 font-medium', border: 'border-emerald-500/30' },
  { id: 'jueces', label: 'Jueces', color: 'text-yellow-400', border: 'border-yellow-500/30' },
  { id: 'qr', label: 'QRs', color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { id: 'codigos', label: 'Códigos', color: 'text-rose-400', border: 'border-rose-500/30' },
  { id: 'cuentas-de-cobro', label: 'Cuentas Cobro', color: 'text-teal-400', border: 'border-teal-500/30' },
  { id: 'centros-de-costo', label: 'Centros Costo', color: 'text-amber-400', border: 'border-amber-500/30' },
];

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      const isHardcodedAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user?.email || '');
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const interfaces = data.interfaces || [];
        
        if (isHardcodedAdmin || interfaces.includes('admin')) {
          setIsAdmin(true);
          fetchUsers();
        } else {
          setIsAdmin(false);
          router.push('/profile');
        }
      } catch (e) {
        console.error(e);
        router.push('/profile');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const fetched: AppUser[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          numeroIdentificacion: data.numeroIdentificacion || 'N/A',
          interfaces: data.interfaces || ['perfil', 'f2r'] // default fallback
        });
      });
      setUsers(fetched);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudieron cargar usuarios', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  const toggleInterface = async (userId: string, targetInterface: string, currentInterfaces: string[]) => {
    let newInterfaces = [...currentInterfaces];
    const isTargetPresent = newInterfaces.includes(targetInterface) || 
      (targetInterface === 'cuentas-de-cobro' && newInterfaces.includes('cuentas'));

    if (isTargetPresent) {
      newInterfaces = newInterfaces.filter(i => i !== targetInterface && !(targetInterface === 'cuentas-de-cobro' && i === 'cuentas')); // Remove
    } else {
      newInterfaces.push(targetInterface); // Add
    }

    // Optimistic UI
    setUsers(users.map(u => u.id === userId ? { ...u, interfaces: newInterfaces } : u));

    try {
      await setDoc(doc(db, 'users', userId), { interfaces: newInterfaces }, { merge: true });
      toast({ title: "Permisos actualizados", description: "Se han guardado los cambios." });
    } catch (error) {
      toast({ title: "Error", description: "Vuelve a intentarlo.", variant: "destructive" });
      // Revert optimism conceptually
      fetchUsers();
    }
  };

  if (isAdmin === null) return null; // Loading status

  const filteredUsers = users.filter(u => 
    u.nombres.toLowerCase().includes(search.toLowerCase()) || 
    u.numeroIdentificacion.includes(search) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/50">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Super Administrador</h1>
            <p className="text-zinc-400">Gestiona permisos e interfaces activas para cada usuario y colaborador del sistema.</p>
          </div>
        </div>

        <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle className="text-white text-xl">Directorio de Perfiles y Accesos</CardTitle>
                <CardDescription className="text-zinc-400">Total: {users.length} Registros ({filteredUsers.length} visibles)</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Buscar por cédula o nombre..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-700 text-white" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Cargando base de datos...</div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900/50 text-zinc-300 uppercase font-semibold text-xs border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-4 w-64">Usuario / Colaborador</th>
                    <th className="px-4 py-4 w-32">Identificación</th>
                    <th className="px-5 py-4">Permisos Habilitados (Interfaces)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div>
                          <div className="text-white font-medium">{user.nombres} {user.apellidos}</div>
                          <div className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="font-mono text-zinc-300 text-xs bg-zinc-900 px-2 py-1 rounded border border-zinc-800 block w-fit">
                          {user.numeroIdentificacion}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                          {INTERFACES_CONFIG.map((item) => {
                            const isChecked = user.interfaces.includes(item.id) || 
                              (item.id === 'cuentas-de-cobro' && user.interfaces.includes('cuentas'));
                            return (
                              <label
                                key={item.id}
                                htmlFor={`${item.id}-${user.id}`}
                                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer select-none transition-all ${
                                  isChecked 
                                    ? `bg-zinc-900 ${item.border} shadow-sm` 
                                    : 'bg-zinc-950/40 border-zinc-800/50 opacity-40 hover:opacity-80'
                                }`}
                              >
                                <Checkbox 
                                  id={`${item.id}-${user.id}`} 
                                  checked={isChecked} 
                                  onCheckedChange={() => toggleInterface(user.id, item.id, user.interfaces)}
                                />
                                <span className={`font-medium ${item.color} truncate`}>
                                  {item.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-zinc-500">Ningún usuario coincidió con tu búsqueda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
