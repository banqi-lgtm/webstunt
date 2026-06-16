'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, updateDoc, orderBy } from 'firebase/firestore';
import { FileText, Plus, Trash2, CheckCircle, XCircle, Search, Sparkles, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CuentaDeCobro } from '../profile/CuentaDeCobro';

interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  creadoEl: string;
  asignadoAUid: string;
  asignadoANombre: string;
  cobradoPor?: string;
  cobradoPorUid?: string;
  cobradoEl?: string;
  centroCosto?: string;
  retencionMotivo?: string | null;
  retencionPorcentaje?: number | null;
  estadoAprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  cuentaCobroNum?: string;
  firma?: string;
  firmaGenerada?: string;
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

  // Invoice view state
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Detalles Modal State
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<Codigo | null>(null);
  const [editValor, setEditValor] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editRetencionMotivo, setEditRetencionMotivo] = useState('');
  const [editRetencionPorcentaje, setEditRetencionPorcentaje] = useState('');
  const [editCentroCosto, setEditCentroCosto] = useState('');

  const openDetalles = (codigo: Codigo) => {
    setSelectedCodigo(codigo);
    setEditValor(codigo.valor.toString());
    setEditDescripcion(codigo.descripcion);
    setEditRetencionMotivo(codigo.retencionMotivo || '');
    setEditRetencionPorcentaje(codigo.retencionPorcentaje?.toString() || '');
    setEditCentroCosto(codigo.centroCosto || '');
    setShowDetallesModal(true);
  };

  const handleUpdateAndAprobar = async () => {
    if (!selectedCodigo) return;
    try {
      await updateDoc(doc(db, 'codigos', selectedCodigo.id), {
        valor: Number(editValor),
        descripcion: editDescripcion,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        centroCosto: editCentroCosto,
        estadoAprobacion: 'aprobado'
      });
      setCodigos(codigos.map(c => c.id === selectedCodigo.id ? { 
        ...c, 
        valor: Number(editValor),
        descripcion: editDescripcion,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        centroCosto: editCentroCosto,
        estadoAprobacion: 'aprobado' 
      } : c));
      toast({ title: "Código aprobado" });
      setShowDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al aprobar", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCodigo) return;
    try {
      await updateDoc(doc(db, 'codigos', selectedCodigo.id), {
        valor: Number(editValor),
        descripcion: editDescripcion,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        centroCosto: editCentroCosto
      });
      setCodigos(codigos.map(c => c.id === selectedCodigo.id ? { 
        ...c, 
        valor: Number(editValor),
        descripcion: editDescripcion,
        retencionMotivo: editRetencionMotivo || null,
        retencionPorcentaje: editRetencionPorcentaje ? Number(editRetencionPorcentaje) : null,
        centroCosto: editCentroCosto
      } : c));
      toast({ title: "Cambios guardados" });
      setShowDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

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
      const snapshot = await getDocs(collection(db, 'codigos'));
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Codigo[];
      
      // Sort in JS to ensure documents without creadoEl aren't omitted by Firestore query
      data.sort((a, b) => {
        const timeA = a.creadoEl ? new Date(a.creadoEl).getTime() : 0;
        const timeB = b.creadoEl ? new Date(b.creadoEl).getTime() : 0;
        return timeB - timeA;
      });
      setCodigos(data);

      const [snapUsuarios, snapCC] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'centrosCosto'))
      ]);

      const fetchedCC: string[] = [];
      snapCC.forEach(docSnap => {
        fetchedCC.push(docSnap.data().nombre || docSnap.id);
      });
      setCentrosCostoList(fetchedCC);

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

  const handleAddCentroCosto = async () => {
    if (!newCCText.trim()) return;
    try {
      await setDoc(doc(db, 'centrosCosto', newCCText.trim().toUpperCase()), {
        nombre: newCCText.trim().toUpperCase()
      });
      setCentrosCostoList([...centrosCostoList, newCCText.trim().toUpperCase()]);
      setNewCentroCosto(newCCText.trim().toUpperCase());
      setIsAddingCC(false);
      setNewCCText('');
      toast({ title: "Centro de costo añadido" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleAprobar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'codigos', id), { estadoAprobacion: 'aprobado' });
      setCodigos(codigos.map(c => c.id === id ? { ...c, estadoAprobacion: 'aprobado' } : c));
      toast({ title: "Código aprobado" });
      setShowDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al aprobar", variant: "destructive" });
    }
  };

  const handleRechazar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'codigos', id), { estadoAprobacion: 'rechazado', estado: 'disponible', cobradoEl: null, cuentaCobroNum: null, firma: null });
      setCodigos(codigos.map(c => c.id === id ? { ...c, estadoAprobacion: 'rechazado', estado: 'disponible' } : c));
      toast({ title: "Código rechazado", description: "El código ha vuelto a estar disponible." });
      setShowDetallesModal(false);
    } catch (e) {
      toast({ title: "Error al rechazar", variant: "destructive" });
    }
  };

  const handleViewInvoice = async (codigo: Codigo) => {
    // Find the user who claimed it
    const userId = codigo.cobradoPorUid || codigo.asignadoAUid;
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    if (!userData) {
      toast({ title: "Error", description: "No se encontró la información del usuario.", variant: "destructive" });
      return;
    }

    setInvoiceData({
      numero: codigo.id,
      fecha: codigo.cobradoEl || codigo.creadoEl,
      cobradorNombre: userData.nombreCompleto || userData.nombre || codigo.cobradoPor || codigo.asignadoANombre,
      cobradorDocumento: userData.numeroIdentificacion || userData.documentoIdentidad || 'No registrado',
      valorTotal: codigo.valor,
      conceptos: [{
        item: 1,
        descripcion: codigo.descripcion,
        valor: codigo.valor,
        retencionMotivo: codigo.retencionMotivo || null,
        retencionPorcentaje: codigo.retencionPorcentaje || null
      }],
      banco: userData.banco || 'No registrado',
      tipoCuenta: userData.tipoCuenta || 'No registrado',
      numeroCuenta: userData.numeroCuenta || 'No registrado',
      ciudad: userData.ciudad || 'BELLO, ANTIOQUIA',
      firmaPrevia: codigo.firmaGenerada || codigo.firma,
      isHistorical: true
    });
    setShowInvoice(true);
    setShowDetallesModal(false);
  };

  if (hasAccess === null) return <div className="min-h-screen bg-[#050816] flex items-center justify-center text-white font-inter text-xl uppercase tracking-widest animate-pulse">VERIFICANDO_ACCESO...</div>;

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
      const prefix = `PKS-${initials}`;
      
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
      setShowDetallesModal(false);
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Fallo al purgar código.', variant: 'destructive'});
    }
  };


  const handleForceMigrate = async () => {
    try {
      toast({ title: 'Iniciando migración', description: 'Por favor espera...' });
      const getInitials = (name: string) => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'XX';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      };

      const q = query(collection(db, 'codigos'));
      const snapshot = await getDocs(q);
      const wrongCodigos: Codigo[] = [];
      const userMaxNum: Record<string, number> = {};
      
      snapshot.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data() as Codigo;
        if (!id.startsWith('PKS-')) {
          wrongCodigos.push({ ...data, id });
        } else {
          const uid = data.asignadoAUid;
          if (uid) {
            const name = data.asignadoANombre || 'XX';
            const prefix = `PKS-${getInitials(name)}`;
            if (id.startsWith(prefix)) {
              const numStr = id.replace(prefix, '');
              const num = parseInt(numStr, 10);
              if (!isNaN(num)) {
                if (!userMaxNum[uid] || num > userMaxNum[uid]) {
                  userMaxNum[uid] = num;
                }
              }
            }
          }
        }
      });

      if (wrongCodigos.length > 0) {
        wrongCodigos.sort((a, b) => new Date(a.creadoEl).getTime() - new Date(b.creadoEl).getTime());
        for (const item of wrongCodigos) {
          const uid = item.asignadoAUid;
          if (!uid) continue;
          const name = item.asignadoANombre || 'XX';
          const prefix = `PKS-${getInitials(name)}`;
          
          if (!userMaxNum[uid]) userMaxNum[uid] = 0;
          userMaxNum[uid]++;
          
          const nextNumStr = userMaxNum[uid].toString().padStart(3, '0');
          const newId = `${prefix}${nextNumStr}`;
          
          const { id, ...dataToSave } = item;
          
          await setDoc(doc(db, 'codigos', newId), dataToSave);
          await deleteDoc(doc(db, 'codigos', id));
        }
        await fetchData();
        toast({ title: 'Éxito', description: `Se migraron ${wrongCodigos.length} códigos al formato PKS-Iniciales-Consecutivo.` });
      } else {
        toast({ title: 'Listo', description: 'Todos los códigos ya tienen el formato correcto.' });
      }
    } catch (e) {
      console.error("Auto-migrate error:", e);
      toast({ title: 'Error', description: 'No se pudo migrar', variant: 'destructive' });
    }
  };

  if (hasAccess === null) return null;

  const filteredCodigos = codigos.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.asignadoANombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 lg:p-10 relative bg-[#0A0A0F] font-inter text-[#F5F5F7] overflow-hidden print:p-0 print:bg-transparent print:overflow-visible">
      {/* Dynamic Cyberpunk Lighting Effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#C8102E]/5 blur-[200px] mix-blend-screen pointer-events-none rounded-full print:hidden" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#1C1C28]/5 blur-[150px] mix-blend-screen pointer-events-none rounded-full print:hidden" />
      
      <div className="max-w-7xl mx-auto w-full relative z-10 space-y-8 print:hidden">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-5 mb-10"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff007f] to-[#00e5ff] rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative p-4 bg-[#12121A] rounded-lg border border-[#1C1C28]">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500 tracking-tight">
              CÓDIGOS
            </h1>
            <p className="text-white font-inter tracking-widest text-sm mt-2 opacity-80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1C1C28] animate-pulse"></span>
              SISTEMA DE ASIGNACIÓN Y COBRO
            </p>
          </div>
          <div className="ml-auto flex gap-4">
            <button 
              onClick={handleForceMigrate}
              className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 border border-purple-500/30 px-4 py-2 rounded-lg font-bold font-inter flex items-center gap-2 transition-all"
            >
              FORZAR REPARACIÓN DE CONSECUTIVOS
            </button>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-[#12121A] text-white hover:bg-[#1C1C28]/20 border border-[#1C1C28]/30 px-6 py-3 rounded-xl font-bold font-inter flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              NUEVO CÓDIGO
            </button>
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
            <div className="relative bg-[#12121A] backdrop-blur-2xl border border-[#1C1C28] rounded-xl overflow-hidden shadow-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#ff007f]/5 before:to-transparent before:pointer-events-none">
              {/* Top Accent Line */}
              <div className="h-1 w-full bg-gradient-to-r from-[#ff007f] to-[#00e5ff]"></div>
              
              <div className="p-6">
                <h2 className="text-2xl font-inter font-bold text-white mb-6 uppercase tracking-widest drop-shadow-none">Inicializar Código</h2>
                
                <form onSubmit={handleCreateCodigo} className="space-y-6">
                  {/* Select User */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-[#C8102E] font-inter uppercase tracking-wider">Entidad Objetivo</label>
                    <div className="relative">
                      <select
                        value={newAsignadoAUid}
                        onChange={(e) => setNewAsignadoAUid(e.target.value)}
                        className="w-full bg-[#0A0A0F] border border-[#1C1C28] text-[#F5F5F7] rounded-md h-12 px-4 text-sm focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#ff007f] transition-all appearance-none cursor-pointer group-hover:border-zinc-600"
                      >
                        <option value="">[ SELECCIONAR OBJETIVO ]</option>
                        {usuarios.map(u => (
                          <option key={u.uid} value={u.uid}>
                            {u.nombre} - {u.rol.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown arrow */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A9A] group-hover:text-[#C8102E] transition-colors">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-white font-inter uppercase tracking-wider">Valor del Crédito</label>
                    <input 
                      type="number"
                      placeholder="0.00" 
                      value={newValor}
                      onChange={(e) => setNewValor(e.target.value)}
                      className="w-full bg-[#0A0A0F] border border-[#1C1C28] text-white font-mono text-lg rounded-md h-12 px-4 focus:outline-none focus:border-[#1C1C28] focus:ring-1 focus:ring-[#00e5ff] transition-all group-hover:border-zinc-600"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-[#8A8A9A] font-inter uppercase tracking-wider">Parámetro / Concepto</label>
                    <input 
                      placeholder="Ingrese protocolo de descripción..." 
                      value={newDescripcion}
                      onChange={(e) => setNewDescripcion(e.target.value)}
                      className="w-full bg-[#0A0A0F] border border-[#1C1C28] text-[#F5F5F7] rounded-md h-12 px-4 focus:outline-none focus:border-zinc-500 transition-all group-hover:border-zinc-600"
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
                          <div className="flex flex-col gap-2 p-3 rounded-md bg-[#E60000]/5 border border-[#E60000]/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className={`w-4 h-4 text-[#E60000] ${isCalculatingRetencion ? 'animate-pulse' : ''}`} />
                              <span className="text-[10px] font-bold text-[#E60000] uppercase tracking-wider">
                                {isCalculatingRetencion ? 'Calculando con IA...' : 'Retención Sugerida (Editable)'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2 relative">
                                <select
                                  value={retencionMotivo}
                                  onChange={(e) => setRetencionMotivo(e.target.value)}
                                  className="w-full bg-[#0A0A0F] border border-[#E60000]/30 text-[#F5F5F7] rounded-md h-9 px-3 text-xs focus:outline-none focus:border-[#E60000] appearance-none"
                                >
                                  <option value="">[ SELECCIONAR MOTIVO ]</option>
                                  <option value="Servicios Generales">Servicios Generales</option>
                                  <option value="Honorarios y Comisiones">Honorarios y Comisiones</option>
                                  <option value="Compras">Compras</option>
                                  <option value="Arrendamientos">Arrendamientos</option>
                                  <option value="Transporte">Transporte</option>
                                  <option value="Ninguna">Ninguna</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#E60000]/50 text-[10px]">▼</div>
                              </div>
                              <div className="col-span-1 relative">
                                <input
                                  type="number"
                                  value={retencionPorcentaje}
                                  onChange={(e) => setRetencionPorcentaje(e.target.value)}
                                  className="w-full bg-[#0A0A0F] border border-[#E60000]/30 text-[#F5F5F7] rounded-md h-9 pl-3 pr-6 text-xs focus:outline-none focus:border-[#E60000]"
                                  placeholder="%"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E60000]/50 text-xs font-mono">%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Centro de Costo */}
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold text-[#8A8A9A] font-inter uppercase tracking-wider">Centro de Costo (Opcional)</label>
                    {isAddingCC ? (
                      <div className="flex gap-2">
                        <input 
                          placeholder="Nuevo Centro..." 
                          value={newCCText}
                          onChange={(e) => setNewCCText(e.target.value)}
                          className="w-full bg-[#0A0A0F] border border-[#1C1C28] text-[#F5F5F7] rounded-md h-12 px-4 focus:outline-none focus:border-[#C8102E] focus:ring-1 focus:ring-[#ff007f] transition-all"
                          autoFocus
                        />
                        <button type="button" onClick={handleAddCentroCosto} className="bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/50 px-4 rounded-md font-inter font-bold text-xs hover:bg-[#C8102E]/40 transition-all">
                          GUARDAR
                        </button>
                        <button type="button" onClick={() => {setIsAddingCC(false); setNewCCText('');}} className="bg-zinc-800 text-[#8A8A9A] px-4 rounded-md font-inter font-bold text-xs hover:bg-zinc-700 hover:text-white transition-all">
                          X
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 relative">
                        <div className="relative w-full">
                          <select
                            value={newCentroCosto}
                            onChange={(e) => setNewCentroCosto(e.target.value)}
                            className="w-full bg-[#0A0A0F] border border-[#1C1C28] text-[#F5F5F7] rounded-md h-12 px-4 text-sm focus:outline-none focus:border-zinc-500 transition-all appearance-none cursor-pointer group-hover:border-zinc-600"
                          >
                            <option value="">[ NINGUNO ]</option>
                            {centrosCostoList.map(cc => (
                              <option key={cc} value={cc}>{cc}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A9A]">▼</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingCC(true)}
                          className="bg-zinc-900 border border-[#1C1C28] text-[#8A8A9A] hover:text-[#C8102E] hover:border-[#C8102E]/50 w-12 rounded-md flex items-center justify-center transition-all"
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
                    className="w-full relative group mt-4 h-14 overflow-hidden rounded-md bg-zinc-900 border border-[#C8102E]/30"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff007f]/20 to-[#ff007f]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3 w-full h-full text-[#C8102E] group-hover:text-white transition-colors duration-300 font-inter font-bold tracking-widest uppercase">
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
            <div className="bg-[#12121A] backdrop-blur-2xl border border-[#1C1C28] rounded-xl overflow-hidden shadow-none flex-1 flex flex-col">
              
              {/* Toolbar */}
              <div className="p-5 border-b border-[#1C1C28] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0A0F]/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-inter font-bold text-white uppercase tracking-widest drop-shadow-none">Códigos Activos</h2>
                  <span className="bg-[#12121A] text-white text-xs font-mono px-2 py-0.5 rounded border border-[#1C1C28]/30">{codigos.length}</span>
                </div>
                
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input 
                    type="text" 
                    placeholder="Buscar consulta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-[#1C1C28]/30 text-white rounded-full h-10 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1C1C28] focus:ring-1 focus:ring-[#00e5ff] transition-all font-mono"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-[#C8102E]/20 border-t-[#ff007f] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#0A0A0F]/80 text-[#8A8A9A] font-inter text-xs uppercase tracking-widest border-b border-[#1C1C28]">
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
                            className="group hover:bg-[#1C1C28]/[0.02] transition-colors duration-300"
                          >
                            {/* Token ID */}
                            <td className="px-6 py-4">
                              <span className="text-white font-bold font-mono text-base tracking-widest group-hover:text-white transition-colors drop-shadow-none group-hover:drop-shadow-none">
                                {c.id}
                              </span>
                            </td>
                            
                            {/* Entity */}
                            <td className="px-6 py-4">
                              <span className="text-[#F5F5F7] font-inter font-semibold text-base">{c.asignadoANombre}</span>
                            </td>
                            
                            {/* Value / Desc */}
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-white font-mono font-bold tracking-wider">${Number(c.valor).toLocaleString()}</span>
                                <span className="text-xs text-[#8A8A9A] font-inter truncate max-w-[150px]">{c.descripcion}</span>
                                {c.centroCosto && <span className="text-[10px] text-zinc-600 font-mono mt-1">CC: {c.centroCosto}</span>}
                              </div>
                            </td>
                            
                            {/* Status */}
                            <td className="px-6 py-4">
                              {c.estado === 'disponible' ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8102E]"></span>
                                  </div>
                                  <span className="text-[#C8102E] font-inter text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,0,127,0.5)]">
                                    PENDIENTE
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  {c.estadoAprobacion === 'aprobado' ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex h-2.5 w-2.5">
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                                      </div>
                                      <span className="text-emerald-400 font-inter text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                                        APROBADO
                                      </span>
                                    </div>
                                  ) : c.estadoAprobacion === 'rechazado' ? (
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex h-2.5 w-2.5">
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></span>
                                      </div>
                                      <span className="text-rose-400 font-inter text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]">
                                        RECHAZADO
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="relative flex h-2.5 w-2.5">
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                                      </div>
                                      <span className="text-yellow-400 font-inter text-[10px] font-bold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                                        PENDIENTE APROBACIÓN
                                      </span>
                                    </div>
                                  )}
                                  {c.cobradoEl && <span className="text-[9px] font-mono text-zinc-600 uppercase ml-4">Por: {c.cobradoPor}</span>}
                                </div>
                              )}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openDetalles(c)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 border border-[#1C1C28] text-white hover:border-[#1C1C28]/50 hover:bg-[#12121A] transition-all font-mono text-[10px] tracking-widest uppercase"
                              >
                                Detalles
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {filteredCodigos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <div className="inline-flex flex-col items-center justify-center text-zinc-600">
                              <div className="w-16 h-16 border border-[#1C1C28] rounded-full flex items-center justify-center mb-4">
                                <Search className="w-6 h-6 opacity-50" />
                              </div>
                              <span className="font-inter tracking-widest uppercase text-sm">No se encontraron códigos</span>
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

      {/* --- DETALLES MODAL --- */}
      <AnimatePresence>
        {showDetallesModal && selectedCodigo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050816]/90 backdrop-blur-md flex items-center justify-center print:hidden p-4"
          >
            <div className="bg-[#0A0A0F] border border-[#1C1C28]/30 shadow-2xl w-full max-w-2xl rounded-lg overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-[#1C1C28]/20 bg-[#1C1C28]/5">
                <h3 className="font-inter font-bold text-white tracking-widest">DETALLES DE CÓDIGO</h3>
                <button onClick={() => setShowDetallesModal(false)} className="text-[#8A8A9A] hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">CÓDIGO ID</label>
                    <div className="font-mono text-white text-sm bg-zinc-900 px-3 py-2 border border-[#1C1C28] rounded">{selectedCodigo.id}</div>
                  </div>
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">ASIGNADO A</label>
                    <div className="font-inter text-white text-sm bg-zinc-900 px-3 py-2 border border-[#1C1C28] rounded">{selectedCodigo.asignadoANombre}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white tracking-widest block mb-1">VALOR ($)</label>
                  <input
                    type="number"
                    value={editValor}
                    onChange={e => setEditValor(e.target.value)}
                    className="w-full bg-[#050816] border border-[#1C1C28]/30 text-white rounded px-3 py-2 text-sm focus:border-[#1C1C28] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white tracking-widest block mb-1">DESCRIPCIÓN</label>
                  <input
                    type="text"
                    value={editDescripcion}
                    onChange={e => setEditDescripcion(e.target.value)}
                    className="w-full bg-[#050816] border border-[#1C1C28]/30 text-white rounded px-3 py-2 text-sm focus:border-[#1C1C28] outline-none font-inter"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">CENTRO COSTO</label>
                    <select
                      value={editCentroCosto}
                      onChange={e => setEditCentroCosto(e.target.value)}
                      className="w-full bg-[#050816] border border-[#1C1C28]/30 text-white rounded px-3 py-2 text-sm focus:border-[#1C1C28] outline-none font-mono"
                    >
                      <option value="">[ NINGUNO ]</option>
                      {centrosCostoList.map(cc => (
                        <option key={cc} value={cc}>{cc}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">ESTADO</label>
                    <div className="font-inter text-white text-[11px] bg-zinc-900 px-3 py-2 border border-[#1C1C28] rounded flex items-center h-[38px] uppercase">
                      {selectedCodigo.estado === 'disponible' ? 'DISPONIBLE' : (
                        selectedCodigo.estadoAprobacion === 'aprobado' ? 'APROBADO' :
                        selectedCodigo.estadoAprobacion === 'rechazado' ? 'RECHAZADO' : 'PENDIENTE APROBACIÓN'
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">MOTIVO RETENCIÓN</label>
                    <input
                      type="text"
                      value={editRetencionMotivo}
                      onChange={e => setEditRetencionMotivo(e.target.value)}
                      className="w-full bg-[#050816] border border-[#1C1C28]/30 text-white rounded px-3 py-2 text-sm focus:border-[#1C1C28] outline-none font-inter"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white tracking-widest block mb-1">% RETENCIÓN</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editRetencionPorcentaje}
                      onChange={e => setEditRetencionPorcentaje(e.target.value)}
                      className="w-full bg-[#050816] border border-[#1C1C28]/30 text-white rounded px-3 py-2 text-sm focus:border-[#1C1C28] outline-none font-mono"
                    />
                  </div>
                </div>
                
              </div>
              
              <div className="p-4 border-t border-[#1C1C28]/20 bg-zinc-950 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                {selectedCodigo.estado === 'cobrado' && selectedCodigo.estadoAprobacion !== 'aprobado' && selectedCodigo.estadoAprobacion !== 'rechazado' && (
                  <>
                    <button 
                      onClick={() => handleUpdateAndAprobar()}
                      className="col-span-2 sm:col-span-1 justify-center px-4 py-2 bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded font-inter text-[10px] font-bold tracking-widest transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> GUARDAR Y APROBAR
                    </button>
                    <button 
                      onClick={() => handleRechazar(selectedCodigo.id)}
                      className="col-span-1 justify-center px-4 py-2 bg-rose-500/10 border border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded font-inter text-[10px] font-bold tracking-widest transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> RECHAZAR
                    </button>
                  </>
                )}
                
                {selectedCodigo.estado === 'disponible' && (
                  <button 
                    onClick={handleUpdate}
                    className="col-span-2 sm:col-span-1 justify-center px-4 py-2 bg-[#12121A] border border-[#1C1C28] text-white hover:bg-[#1C1C28] hover:text-black rounded font-inter text-[10px] font-bold tracking-widest transition-colors flex items-center gap-2"
                  >
                    GUARDAR CAMBIOS
                  </button>
                )}

                {selectedCodigo.estado === 'cobrado' && (
                  <button 
                    onClick={() => handleViewInvoice(selectedCodigo)}
                    className="col-span-1 justify-center px-4 py-2 bg-purple-500/10 border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white rounded font-inter text-[10px] font-bold tracking-widest transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> VER CUENTA
                  </button>
                )}

                <button 
                  onClick={() => handleDeleteCodigo(selectedCodigo.id)}
                  className="col-span-2 sm:col-span-1 justify-center px-4 py-2 bg-zinc-800 border border-zinc-700 text-[#8A8A9A] hover:bg-[#C8102E] hover:border-[#C8102E] hover:text-white rounded font-inter text-[10px] font-bold tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> ELIMINAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- INVOICE VIEW MODAL --- */}
      <AnimatePresence>
        {showInvoice && invoiceData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#050816]/90 backdrop-blur-xl flex items-center justify-center print:static print:bg-transparent print:h-auto print:overflow-visible print:block"
          >
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#E6000015_1px,transparent_1px),linear-gradient(to_bottom,#E6000015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none print:hidden"></div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30 mix-blend-overlay z-0 print:hidden"></div>

            <div className="relative z-10 w-full max-w-4xl max-h-screen overflow-y-auto custom-scrollbar p-4 print:p-0 print:overflow-visible print:h-auto print:max-h-none">
              <CuentaDeCobro 
                {...invoiceData} 
                onClose={() => setShowInvoice(false)} 
                onConfirm={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
