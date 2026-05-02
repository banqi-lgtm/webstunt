'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
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
    if (newInterfaces.includes(targetInterface)) {
      newInterfaces = newInterfaces.filter(i => i !== targetInterface); // Remove
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
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/50">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Panel Super Administrador</h1>
            <p className="text-zinc-400">Gestiona permisos e interfaces (Eventos) de toda tu DB de pilotos.</p>
          </div>
        </div>

        <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle className="text-white text-xl">Directorio de Perfiles</CardTitle>
                <CardDescription className="text-zinc-400">Total: {users.length} Registros</CardDescription>
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
                    <th className="px-6 py-4">Piloto</th>
                    <th className="px-6 py-4">Identificación</th>
                    <th className="px-6 py-4">Permisos Habilitados (Interfaces)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-white font-medium">{user.nombres} {user.apellidos}</div>
                            <div className="text-zinc-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-zinc-300">{user.numeroIdentificacion}</span>
                      </td>
                      <td className="px-6 py-4 flex gap-4">
                        
                        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                          <Checkbox 
                            id={`f2r-${user.id}`} 
                            checked={user.interfaces.includes('f2r')} 
                            onCheckedChange={() => toggleInterface(user.id, 'f2r', user.interfaces)}
                          />
                          <label htmlFor={`f2r-${user.id}`} className="text-sm font-medium text-zinc-300 cursor-pointer">Copa Stunt F2R</label>
                        </div>

                        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                          <Checkbox 
                            id={`admin-${user.id}`} 
                            checked={user.interfaces.includes('admin')} 
                            onCheckedChange={() => toggleInterface(user.id, 'admin', user.interfaces)}
                          />
                          <label htmlFor={`admin-${user.id}`} className="text-sm font-medium text-amber-500 cursor-pointer">Admin</label>
                        </div>
                        
                        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                          <Checkbox 
                            id={`pilotos-${user.id}`} 
                            checked={user.interfaces.includes('pilotos')} 
                            onCheckedChange={() => toggleInterface(user.id, 'pilotos', user.interfaces)}
                          />
                          <label htmlFor={`pilotos-${user.id}`} className="text-sm font-medium text-blue-400 cursor-pointer">Pilotos</label>
                        </div>

                        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                          <Checkbox 
                            id={`staff-${user.id}`} 
                            checked={user.interfaces.includes('staff')} 
                            onCheckedChange={() => toggleInterface(user.id, 'staff', user.interfaces)}
                          />
                          <label htmlFor={`staff-${user.id}`} className="text-sm font-medium text-purple-400 cursor-pointer">Staff</label>
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
