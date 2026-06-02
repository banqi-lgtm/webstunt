'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { FileText, Plus, Trash2, CheckCircle, XCircle, Search, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  creadoEl: string;
  asignadoAUid: string;
  asignadoANombre: string;
  cobradoPor?: string;
  cobradoEl?: string;
  centroCosto?: string;
  retencionMotivo?: string | null;
  retencionPorcentaje?: number | null;
}

interface Usuario {
  uid: string;
  nombre: string;
  rol: string;
}

export default function CodigosAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newValor, setNewValor] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newCentroCosto, setNewCentroCosto] = useState('');
  const [centrosCostoList, setCentrosCostoList] = useState<string[]>([]);
  const [isAddingCC, setIsAddingCC] = useState(false);
  const [newCCText, setNewCCText] = useState('');
  const [newAsignadoAUid, setNewAsignadoAUid] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // AI Retention State
  const [retencionMotivo, setRetencionMotivo] = useState<string>('');
  const [retencionPorcentaje, setRetencionPorcentaje] = useState<string>('');
  const [isCalculatingRetencion, setIsCalculatingRetencion] = useState(false);

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
        
        if (isSuperAdmin || interfaces.includes('codigos')) {
          setHasAccess(true);
          fetchData();
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

  // Debounce AI logic for retention calculation
  useEffect(() => {
    if (!newDescripcion.trim() || !newValor || Number(newValor) <= 0) {
      setRetencionMotivo('');
      setRetencionPorcentaje('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculatingRetencion(true);
      try {
        const res = await fetch('/api/retencion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descripcion: newDescripcion, valor: Number(newValor) })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.motivo && data.porcentaje !== undefined) {
            setRetencionMotivo(data.motivo);
            setRetencionPorcentaje(data.porcentaje.toString());
          }
        }
      } catch (err) {
        console.error("Error calculando retencion:", err);
      } finally {
        setIsCalculatingRetencion(false);
      }
    }, 1200); // Wait 1.2s after typing stops

    return () => clearTimeout(timer);
  }, [newDescripcion, newValor]);

  const fetchData = async () => {
    try {
      const [snapCodigos, snapUsuarios, snapCC] = await Promise.all([
        getDocs(collection(db, 'codigos')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'centrosCosto'))
      ]);

      const fetchedCC: string[] = [];
      snapCC.forEach(docSnap => {
        fetchedCC.push(docSnap.data().nombre || docSnap.id);
      });
      setCentrosCostoList(fetchedCC);

      const fetchedCodigos: Codigo[] = [];
      snapCodigos.forEach(docSnap => {
        fetchedCodigos.push({ id: docSnap.id, ...docSnap.data() } as Codigo);
      });
      fetchedCodigos.sort((a, b) => new Date(b.creadoEl).getTime() - new Date(a.creadoEl).getTime());
      setCodigos(fetchedCodigos);

      const fetchedUsuarios: Usuario[] = [];
      snapUsuarios.forEach(docSnap => {
        const d = docSnap.data();
        const nombre = `${d.nombres || ''} ${d.apellidos || ''}`.trim() || d.email || 'Usuario';
        fetchedUsuarios.push({ uid: docSnap.id, nombre, rol: d.rol || 'piloto' });
      });
      fetchedUsuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setUsuarios(fetchedUsuarios);

    } catch (e) {
      console.error(e);
      toast({ title: 'Error del Sistema', description: 'Fallo al cargar nodos de base de datos.', variant: 'destructive'});
    } finally {
      setLoading(false);
    }
  };

  const handleAddCC = async () => {
    if (!newCCText.trim()) return;
    try {
      const ccName = newCCText.trim();
      await setDoc(doc(db, 'centrosCosto', ccName), {
        nombre: ccName,
        creadoEl: new Date().toISOString()
      });
      setCentrosCostoList(prev => [...prev, ccName]);
      setNewCentroCosto(ccName);
      setNewCCText('');
      setIsAddingCC(false);
      toast({ title: 'Éxito', description: 'Centro de costo añadido.' });
    } catch(e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo guardar el centro de costo.', variant: 'destructive' });
    }
  };

  const handleCreateCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValor || !newDescripcion.trim() || !newAsignadoAUid) {
      toast({ title: 'Advertencia', description: 'Faltan parámetros requeridos.', variant: 'destructive'});
      return;
    }
    
    setIsCreating(true);
    try {
      const usuarioAsignado = usuarios.find(u => u.uid === newAsignadoAUid);
      if (!usuarioAsignado) throw new Error("Usuario no encontrado");

      // Función para obtener iniciales
      const getInitials = (name: string) => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'XX';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      };
      
      const initials = getInitials(usuarioAsignado.nombre);
      const prefix = `PASK-${initials}`;
      
      // Consultar todos los códigos asignados a este usuario
      const q = query(collection(db, 'codigos'), where('asignadoAUid', '==', newAsignadoAUid));
      const userCodigosSnap = await getDocs(q);
      
      let maxNum = 0;
      userCodigosSnap.forEach(docSnap => {
        const id = docSnap.id;
        if (id.startsWith(prefix)) {
          const numStr = id.replace(prefix, '');
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      
      const nextNumStr = (maxNum + 1).toString().padStart(3, '0');
      const generatedCodigoId = `${prefix}${nextNumStr}`;
      
      const codigoRef = doc(db, 'codigos', generatedCodigoId);
      const codigoSnap = await getDoc(codigoRef);
      if (codigoSnap.exists()) {
        toast({ title: 'Colisión', description: 'Llave duplicada detectada. Reintente.', variant: 'destructive'});
        setIsCreating(false);
        return;
      }

      const newCodigoData = {
        valor: Number(newValor),
        descripcion: newDescripcion.trim(),
        centroCosto: newCentroCosto.trim(),
        estado: 'disponible',
        creadoEl: new Date().toISOString(),
        asignadoAUid: newAsignadoAUid,
        asignadoANombre: usuarioAsignado.nombre,
        retencionMotivo: retencionMotivo || null,
        retencionPorcentaje: retencionPorcentaje ? Number(retencionPorcentaje) : null
      };

      await setDoc(codigoRef, newCodigoData);
      
      toast({ title: 'Éxito', description: `Código [${generatedCodigoId}] generado exitosamente.` });
      setNewValor('');
      setNewDescripcion('');
      setNewCentroCosto('');
      setRetencionMotivo('');
      setRetencionPorcentaje('');
      setNewAsignadoAUid('');
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Fallo al inicializar código.', variant: 'destructive'});
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCodigo = async (id: string) => {
    if (!window.confirm(`SOBREESCRITURA SEGURA: ¿Eliminar código ${id}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'codigos', id));
      toast({ title: 'Eliminado', description: 'Código purgado del sistema.' });
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Fallo al purgar código.', variant: 'destructive'});
    }
  };

  if (hasAccess === null) return null;

  const filteredCodigos = codigos.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.asignadoANombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 lg:p-10 relative bg-[#0b0b0f] font-exo text-zinc-300 overflow-hidden">
      {/* Dynamic Cyberpunk Lighting Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#ff007f]/5 blur-[200px] mix-blend-screen pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#00e5ff]/5 blur-[150px] mix-blend-screen pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-5 mb-10"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff007f] to-[#00e5ff] rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative p-4 bg-[#16161d] rounded-lg border border-zinc-800">
              <Sparkles className="w-8 h-8 text-[#00e5ff]" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white font-orbitron tracking-wider drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">SYS.ADMIN_CÓDIGOS</h1>
            <p className="text-zinc-500 font-rajdhani text-lg uppercase tracking-widest mt-1">Interfaz de Generación y Gestión de Códigos</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Panel: Form */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="xl:col-span-4"
          >
            <div className="relative bg-[#16161d]/80 backdrop-blur-2xl border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#ff007f]/5 before:to-transparent before:pointer-events-none">
              {/* Top Accent Line */}
              <div className="h-1 w-full bg-gradient-to-r from-[#ff007f] to-[#00e5ff]"></div>
              
              <div className="p-6">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,0,127,0.4)]">Inicializar Código</h2>
                
                <form onSubmit={handleCreateCodigo} className="space-y-6">
                  {/* Select User */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-[#ff007f] font-orbitron uppercase tracking-wider">Entidad Objetivo</label>
                    <div className="relative">
                      <select
                        value={newAsignadoAUid}
                        onChange={(e) => setNewAsignadoAUid(e.target.value)}
                        className="w-full bg-[#0b0b0f] border border-zinc-800 text-zinc-300 rounded-md h-12 px-4 text-sm focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all appearance-none cursor-pointer group-hover:border-zinc-600"
                      >
                        <option value="">[ SELECCIONAR OBJETIVO ]</option>
                        {usuarios.map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.nombre} - {u.rol.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-[#ff007f] transition-colors">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-[#00e5ff] font-orbitron uppercase tracking-wider">Valor del Crédito</label>
                    <input 
                      type="number"
                      placeholder="0.00" 
                      value={newValor}
                      onChange={(e) => setNewValor(e.target.value)}
                      className="w-full bg-[#0b0b0f] border border-zinc-800 text-white font-mono text-lg rounded-md h-12 px-4 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all group-hover:border-zinc-600"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-zinc-400 font-orbitron uppercase tracking-wider">Parámetro / Concepto</label>
                    <input 
                      placeholder="Ingrese protocolo de descripción..." 
                      value={newDescripcion}
                      onChange={(e) => setNewDescripcion(e.target.value)}
                      className="w-full bg-[#0b0b0f] border border-zinc-800 text-zinc-300 rounded-md h-12 px-4 focus:outline-none focus:border-zinc-500 transition-all group-hover:border-zinc-600"
                    />

                    {/* AI Retention Output */}
                    <AnimatePresence>
                      {(isCalculatingRetencion || retencionMotivo) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-2 p-3 rounded-md bg-[#00ff88]/5 border border-[#00ff88]/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className={`w-4 h-4 text-[#00ff88] ${isCalculatingRetencion ? 'animate-pulse' : ''}`} />
                              <span className="text-[10px] font-bold text-[#00ff88] uppercase tracking-wider">
                                {isCalculatingRetencion ? 'Calculando con IA...' : 'Retención Sugerida (Editable)'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2 relative">
                                <select
                                  value={retencionMotivo}
                                  onChange={(e) => setRetencionMotivo(e.target.value)}
                                  className="w-full bg-[#0b0b0f] border border-[#00ff88]/30 text-zinc-300 rounded-md h-9 px-3 text-xs focus:outline-none focus:border-[#00ff88] appearance-none"
                                >
                                  <option value="">[ SELECCIONAR MOTIVO ]</option>
                                  <option value="Servicios Generales">Servicios Generales</option>
                                  <option value="Honorarios y Comisiones">Honorarios y Comisiones</option>
                                  <option value="Compras">Compras</option>
                                  <option value="Arrendamientos">Arrendamientos</option>
                                  <option value="Transporte">Transporte</option>
                                  <option value="Ninguna">Ninguna</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#00ff88]/50 text-[10px]">▼</div>
                              </div>
                              <div className="col-span-1 relative">
                                <input
                                  type="number"
                                  value={retencionPorcentaje}
                                  onChange={(e) => setRetencionPorcentaje(e.target.value)}
                                  className="w-full bg-[#0b0b0f] border border-[#00ff88]/30 text-zinc-300 rounded-md h-9 pl-3 pr-6 text-xs focus:outline-none focus:border-[#00ff88]"
                                  placeholder="%"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00ff88]/50 text-xs font-mono">%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Centro de Costo */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-zinc-400 font-orbitron uppercase tracking-wider">Centro de Costo (Opcional)</label>
                    {isAddingCC ? (
                      <div className="flex gap-2">
                        <input 
                          placeholder="Nuevo Centro..." 
                          value={newCCText}
                          onChange={(e) => setNewCCText(e.target.value)}
                          className="w-full bg-[#0b0b0f] border border-zinc-800 text-zinc-300 rounded-md h-12 px-4 focus:outline-none focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] transition-all"
                          autoFocus
                        />
                        <button type="button" onClick={handleAddCC} className="bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/50 px-4 rounded-md font-orbitron font-bold text-xs hover:bg-[#ff007f]/40 transition-all">
                          GUARDAR
                        </button>
                        <button type="button" onClick={() => {setIsAddingCC(false); setNewCCText('');}} className="bg-zinc-800 text-zinc-400 px-4 rounded-md font-orbitron font-bold text-xs hover:bg-zinc-700 hover:text-white transition-all">
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 relative">
                        <div className="relative w-full">
                          <select
                            value={newCentroCosto}
                            onChange={(e) => setNewCentroCosto(e.target.value)}
                            className="w-full bg-[#0b0b0f] border border-zinc-800 text-zinc-300 rounded-md h-12 px-4 text-sm focus:outline-none focus:border-zinc-500 transition-all appearance-none cursor-pointer group-hover:border-zinc-600"
                          >
                            <option value="">[ NINGUNO ]</option>
                            {centrosCostoList.map(cc => (
                              <option key={cc} value={cc}>{cc}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingCC(true)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#ff007f] hover:border-[#ff007f]/50 w-12 rounded-md flex items-center justify-center transition-all"
                          title="Añadir nuevo Centro de Costo"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button 
                    whileHover={{ scale: 1.02, textShadow: "0px 0px 8px rgb(255,255,255)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={isCreating} 
                    className="w-full relative group mt-4 h-14 overflow-hidden rounded-md bg-zinc-900 border border-[#ff007f]/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff007f]/20 to-[#ff007f]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3 w-full h-full text-[#ff007f] group-hover:text-white transition-colors duration-300 font-orbitron font-bold tracking-widest uppercase">
                      <Plus className="w-5 h-5" />
                      {isCreating ? 'EJECUTANDO...' : 'GENERAR CÓDIGO'}
                    </div>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Table */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="xl:col-span-8 flex flex-col h-full"
          >
            <div className="bg-[#16161d]/80 backdrop-blur-2xl border border-zinc-800/80 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] flex-1 flex flex-col">
              
              {/* Toolbar */}
              <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0b0b0f]/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,229,255,0.4)]">Códigos Activos</h2>
                  <span className="bg-[#00e5ff]/10 text-[#00e5ff] text-xs font-mono px-2 py-0.5 rounded border border-[#00e5ff]/30">{codigos.length}</span>
                </div>
                
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00e5ff]/60" />
                  <input 
                    type="text" 
                    placeholder="Buscar consulta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0b0b0f] border border-[#00e5ff]/30 text-white rounded-full h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-[#ff007f]/20 border-t-[#ff007f] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#0b0b0f]/80 text-zinc-500 font-orbitron text-xs uppercase tracking-widest border-b border-zinc-800/80">
                      <tr>
                        <th className="px-6 py-4 font-semibold">ID del Código</th>
                        <th className="px-6 py-4 font-semibold">Entidad</th>
                        <th className="px-6 py-4 font-semibold">Datos de Crédito</th>
                        <th className="px-6 py-4 font-semibold">Estado</th>
                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      <AnimatePresence>
                        {filteredCodigos.map((c, idx) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            key={c.id} 
                            className="group hover:bg-[#00e5ff]/[0.02] transition-colors duration-300"
                          >
                            {/* Token ID */}
                            <td className="px-6 py-4">
                              <span className="text-white font-bold font-mono text-base tracking-widest group-hover:text-[#00e5ff] transition-colors drop-shadow-[0_0_8px_rgba(0,229,255,0)] group-hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                                {c.id}
                              </span>
                            </td>
                            
                            {/* Entity */}
                            <td className="px-6 py-4">
                              <span className="text-zinc-300 font-rajdhani font-semibold text-base">{c.asignadoANombre}</span>
                            </td>
                            
                            {/* Value / Desc */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-mono font-bold tracking-wider">${Number(c.valor).toLocaleString()}</span>
                                <span className="text-xs text-zinc-500 font-rajdhani truncate max-w-[150px]">{c.descripcion}</span>
                                {c.centroCosto && <span className="text-[10px] text-zinc-600 font-mono mt-1">CC: {c.centroCosto}</span>}
                              </div>
                            </td>
                            
                            {/* Status */}
                            <td className="px-6 py-4">
                              {c.estado === 'disponible' ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff007f] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff007f]"></span>
                                  </div>
                                  <span className="text-[#ff007f] font-orbitron text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                                    PENDIENTE
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex h-2.5 w-2.5">
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e5ff] shadow-[0_0_8px_rgba(0,229,255,0.8)]"></span>
                                    </div>
                                    <span className="text-[#00e5ff] font-orbitron text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                                      COBRADO
                                    </span>
                                  </div>
                                  {c.cobradoEl && <span className="text-[9px] font-mono text-zinc-600 uppercase ml-4">Por: {c.cobradoPor}</span>}
                                </div>
                              )}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <motion.button 
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteCodigo(c.id)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-[#ff007f] hover:border-[#ff007f]/50 hover:bg-[#ff007f]/10 transition-all shadow-[0_0_0_rgba(255,0,127,0)] hover:shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {filteredCodigos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="inline-flex flex-col items-center justify-center text-zinc-600">
                              <div className="w-16 h-16 border border-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 opacity-50" />
                              </div>
                              <span className="font-orbitron tracking-widest uppercase text-sm">No se encontraron códigos</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
