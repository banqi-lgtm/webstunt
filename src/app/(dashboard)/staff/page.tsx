'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Search, ChevronRight, Star, UserCheck, Phone, Mail, IdCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface StaffMember {
  id: string;
  uid: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  numeroIdentificacion: string;
  registradoEl: string;
  rol: string;
}

export default function StaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      const isSuperAdmin = user.email === 'wg12435@hotmail.com';
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        const interfaces = data?.interfaces || [];
        
        if (isSuperAdmin || interfaces.includes('pilotos')) {
          setHasAccess(true);
          fetchStaff();
        } else {
          setHasAccess(false);
          router.push('/profile');
        }
      } catch (e) {
        console.error(e);
        router.push('/profile');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchStaff = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetched: StaffMember[] = [];
      
      usersSnap.forEach(docSnap => {
        const userData = docSnap.data();
        
        // Excluir super admin si no tiene info completa (aunque sea admin)
        if (userData.email === 'wg12435@hotmail.com' && !userData.nombres) return;
        
        // Solo incluir a los que tengan explícitamente el rol de "staff"
        if (userData.rol === 'staff') {
          fetched.push({
            id: `f2r_${docSnap.id}`,
            uid: docSnap.id,
            nombres: userData.nombres || 'Desconocido',
            apellidos: userData.apellidos || '',
            email: userData.email || 'N/A',
            telefono: userData.telefono || 'N/A',
            numeroIdentificacion: userData.numeroIdentificacion || 'N/A',
            registradoEl: userData.createdAt || new Date().toISOString(),
            rol: userData.rol,
          });
        }
      });
      
      // Ordenar alfabéticamente
      fetched.sort((a, b) => a.nombres.localeCompare(b.nombres));
      
      setStaffList(fetched);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo cargar la lista del staff', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  if (hasAccess === null) return null;

  const filteredStaff = staffList.filter(s => {
    return s.nombres.toLowerCase().includes(search.toLowerCase()) || 
           s.apellidos.toLowerCase().includes(search.toLowerCase()) ||
           s.numeroIdentificacion.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen p-4 lg:p-10 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] mix-blend-screen pointer-events-none rounded-full"></div>
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Star className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Directorio de Staff</h1>
              <p className="text-zinc-400">Equipo de trabajo y organizadores de la Copa Stunt F2R.</p>
            </div>
          </div>
        </div>

        <Card className="bg-zinc-950/80 backdrop-blur-xl border-zinc-800/50 shadow-2xl">
          <CardHeader className="border-b border-zinc-800/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-white text-xl">Miembros del Staff</CardTitle>
                <CardDescription className="text-zinc-400">Total: {staffList.length} Miembros</CardDescription>
              </div>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Buscar por nombre o documento..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-700 text-white h-9" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Cargando base de datos del staff...</div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-900/50 text-zinc-300 uppercase font-semibold text-xs border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Miembro</th>
                    <th className="px-6 py-4">Documento</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Fecha Reg.</th>
                    <th className="px-6 py-4 text-right">Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 w-fit">
                          <Star className="w-4 h-4" /> <span className="font-bold text-xs uppercase">STAFF</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-base">{member.nombres} {member.apellidos}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-300 font-mono">{member.numeroIdentificacion}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-300">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs">{member.telefono}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-400">
                          {member.registradoEl ? new Date(member.registradoEl).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/pilotos/${member.id}`}>
                          <button className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors" title="Ver Perfil Completo">
                            <UserCheck className="w-4 h-4 mr-1 hidden sm:block" />
                            <ChevronRight className="w-4 h-4 sm:hidden" />
                            <span className="hidden sm:block text-xs font-semibold px-1">Ver Detalles</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">No hay miembros del staff registrados o que coincidan con la búsqueda.</td>
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
