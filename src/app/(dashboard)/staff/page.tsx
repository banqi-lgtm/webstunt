'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Search, ChevronRight, Star, UserCheck, Phone, Mail, IdCard, 
  Clock, Settings, X, CheckCircle2, AlertTriangle, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { HorarioLaboralStaff } from '@/lib/overtime-calculator';

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
  horarioLaboral?: HorarioLaboralStaff;
}

const DIAS_SEMANA_OPCIONES = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export default function StaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal para parametrizar horario del staff
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [selectedStaffForHorario, setSelectedStaffForHorario] = useState<StaffMember | null>(null);
  const [horarioDias, setHorarioDias] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [horarioEntrada, setHorarioEntrada] = useState('08:00');
  const [horarioSalida, setHorarioSalida] = useState('16:00');
  const [horarioDescanso, setHorarioDescanso] = useState(60);
  const [horarioJornadaHoras, setHorarioJornadaHoras] = useState(7);
  const [horarioValorHora, setHorarioValorHora] = useState<number | ''>('');
  const [isSavingHorario, setIsSavingHorario] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        const interfaces = data?.interfaces || [];
        
        const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '') || interfaces.includes('admin');
        
        if (isSuperAdmin || interfaces.includes('staff')) {
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
        if (['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(userData.email) && !userData.nombres) return;
        
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
            horarioLaboral: userData.horarioLaboral || undefined,
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

  const handleOpenHorarioModal = (staff: StaffMember) => {
    setSelectedStaffForHorario(staff);
    const h = staff.horarioLaboral;
    setHorarioDias(h?.diasLaborales && h.diasLaborales.length > 0 ? h.diasLaborales : [1, 2, 3, 4, 5, 6]);
    setHorarioEntrada(h?.horaEntradaDefecto || '08:00');
    setHorarioSalida(h?.horaSalidaDefecto || '16:00');
    setHorarioDescanso(h?.minutosDescansoDefecto ?? 60);
    setHorarioJornadaHoras(h?.jornadaDiariaHoras || 7);
    setHorarioValorHora(h?.valorHoraOrdinaria || '');
    setShowHorarioModal(true);
  };

  const handleSaveHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForHorario) return;

    setIsSavingHorario(true);
    try {
      const horarioData: HorarioLaboralStaff = {
        diasLaborales: horarioDias,
        horaEntradaDefecto: horarioEntrada,
        horaSalidaDefecto: horarioSalida,
        minutosDescansoDefecto: Number(horarioDescanso) || 0,
        jornadaDiariaHoras: Number(horarioJornadaHoras) || 7,
        horasSemanales: (Number(horarioJornadaHoras) || 7) * horarioDias.length,
        valorHoraOrdinaria: horarioValorHora ? Number(horarioValorHora) : undefined
      };

      await updateDoc(doc(db, 'users', selectedStaffForHorario.uid), {
        horarioLaboral: horarioData,
        actualizadoEl: new Date().toISOString()
      });

      toast({ 
        title: 'Horario parametrizado', 
        description: `Se actualizó la jornada oficial de ${selectedStaffForHorario.nombres}.` 
      });

      setShowHorarioModal(false);
      setSelectedStaffForHorario(null);
      await fetchStaff();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error al guardar horario', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingHorario(false);
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
              <h1 className="text-3xl font-bold text-white font-orbitron">Directorio de Staff</h1>
              <p className="text-zinc-400 text-sm">Equipo de trabajo y organizadores de la Copa Stunt F2R.</p>
            </div>
          </div>

          <Link href="/control-staff">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition">
              <Clock className="w-4 h-4" />
              <span>Ir a Control de Staff (Turnos)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
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
                    <th className="px-6 py-4">Horario Habitual</th>
                    <th className="px-6 py-4">Fecha Reg.</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredStaff.map((member) => {
                    const h = member.horarioLaboral;
                    const hasHorario = Boolean(h && h.horaEntradaDefecto);

                    return (
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
                          {hasHorario ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{h?.horaEntradaDefecto} a {h?.horaSalidaDefecto}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {h?.jornadaDiariaHoras}h/día {h?.valorHoraOrdinaria ? `• $${h.valorHoraOrdinaria.toLocaleString()}/h` : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                              <Clock className="w-3.5 h-3.5 text-zinc-600" />
                              <span>08:00 a 16:00 (7h Estándar)</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-400">
                            {member.registradoEl ? new Date(member.registradoEl).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenHorarioModal(member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-300 text-xs font-semibold transition"
                              title="Parametrizar Horario"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Horario</span>
                            </button>
                            <Link href={`/pilotos/${member.id}?view=staff`}>
                              <button className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors" title="Ver Perfil Completo">
                                <UserCheck className="w-4 h-4 mr-1 hidden sm:block" />
                                <ChevronRight className="w-4 h-4 sm:hidden" />
                                <span className="hidden sm:block text-xs font-semibold px-1">Ver Detalles</span>
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-zinc-500">No hay miembros del staff registrados o que coincidan con la búsqueda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* MODAL PARA PARAMETRIZAR HORARIO */}
        {showHorarioModal && selectedStaffForHorario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0E0E14] border border-[#1C1C28] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-[#1C1C28] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-950/70 border border-purple-500/40 rounded-xl text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider font-orbitron">
                      Parametrizar Horario Laboral
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {selectedStaffForHorario.nombres} {selectedStaffForHorario.apellidos} (CC: {selectedStaffForHorario.numeroIdentificacion})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHorarioModal(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveHorario} className="p-5 space-y-4">
                {/* Días laborales */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                    Días Laborales Habituales
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {DIAS_SEMANA_OPCIONES.map(dia => {
                      const isSelected = horarioDias.includes(dia.id);
                      return (
                        <button
                          key={dia.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setHorarioDias(horarioDias.filter(d => d !== dia.id));
                            } else {
                              setHorarioDias([...horarioDias, dia.id]);
                            }
                          }}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition text-center border ${
                            isSelected
                              ? 'bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-sm'
                              : 'bg-black/40 text-zinc-500 border-[#1C1C28] hover:text-white'
                          }`}
                        >
                          {dia.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hora Entrada y Salida Habitual */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Hora Entrada Habitual
                    </label>
                    <input
                      type="time"
                      required
                      value={horarioEntrada}
                      onChange={(e) => setHorarioEntrada(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-purple-500 rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Hora Salida Habitual
                    </label>
                    <input
                      type="time"
                      required
                      value={horarioSalida}
                      onChange={(e) => setHorarioSalida(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-purple-500 rounded-xl text-xs text-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Jornada 7h + descanso</span>
                  </div>
                </div>

                {/* Jornada diaria y descanso */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Jornada Diaria (Horas)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={horarioJornadaHoras}
                      onChange={(e) => setHorarioJornadaHoras(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-purple-500 rounded-xl text-xs text-white outline-none font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Estándar Legal: 7h/día (42h/semana)</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                      Descanso Almuerzo (Min)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={15}
                      value={horarioDescanso}
                      onChange={(e) => setHorarioDescanso(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-purple-500 rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Valor hora ordinaria (Opcional) */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                    Valor Hora Ordinaria COP (Opcional)
                  </label>
                  <div className="relative">
                    <span className="text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 text-xs">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder="Ej. 10000 para liquidar horas extras"
                      value={horarioValorHora}
                      onChange={(e) => setHorarioValorHora(e.target.value ? Number(e.target.value) : '')}
                      className="w-full pl-7 pr-3 py-2 bg-black/50 border border-[#1C1C28] focus:border-purple-500 rounded-xl text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="p-4 bg-black/60 border-t border-[#1C1C28] flex items-center justify-end gap-2 -mx-5 -mb-5">
                  <button
                    type="button"
                    onClick={() => setShowHorarioModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingHorario}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
                  >
                    {isSavingHorario && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Guardar Horario</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
