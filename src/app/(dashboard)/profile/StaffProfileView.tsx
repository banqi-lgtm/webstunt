'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { StaffPortalLayout } from '@/components/staff-portal/StaffPortalLayout';
import { DashboardInicio } from '@/components/staff-portal/DashboardInicio';

interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  cobradoEl?: string;
}

export function StaffProfileView({ userUid, userName, userDocument }: { userUid: string, userName: string, userDocument: string }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [loading, setLoading] = useState(true);
  
  const [rutUrl, setRutUrl] = useState<string | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  
  const [codigosDisponibles, setCodigosDisponibles] = useState<Codigo[]>([]);
  const [historial, setHistorial] = useState<Codigo[]>([]);

  const fetchUserData = async () => {
    try {
      const docsRef = ref(storage, `documents/${userUid}`);
      const res = await listAll(docsRef);
      let latestRut = null;
      let latestCert = null;
      const items = res.items.sort((a, b) => b.name.localeCompare(a.name));
      for (const item of items) {
        if (!latestRut && item.name.includes('rut_')) latestRut = item;
        if (!latestCert && item.name.includes('certificacion_')) latestCert = item;
      }
      if (latestRut) setRutUrl(await getDownloadURL(latestRut));
      if (latestCert) setCertUrl(await getDownloadURL(latestCert));
    } catch(e) {
      console.error("Error fetching documents from storage", e);
    }
  };

  const fetchCodigos = async () => {
    try {
      const q = query(collection(db, 'codigos'), where('asignadoAUid', '==', userUid));
      const snap = await getDocs(q);
      const disponibles: Codigo[] = [];
      const cobrados: Codigo[] = [];
      
      snap.forEach(d => {
        const data = { id: d.id, ...d.data() } as Codigo;
        if (data.estado === 'disponible') disponibles.push(data);
        else cobrados.push(data);
      });
      
      disponibles.sort((a, b) => b.valor - a.valor);
      cobrados.sort((a, b) => {
        if (!a.cobradoEl || !b.cobradoEl) return 0;
        return new Date(b.cobradoEl).getTime() - new Date(a.cobradoEl).getTime();
      });
      
      setCodigosDisponibles(disponibles);
      setHistorial(cobrados);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userUid) {
      fetchUserData();
      fetchCodigos();
    }
  }, [userUid]);

  const totalAcumulado = historial.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const saldoPorCobrar = codigosDisponibles.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <DashboardInicio 
            setActiveTab={setActiveTab}
            rutUrl={rutUrl}
            certUrl={certUrl}
            totalAcumulado={totalAcumulado}
            saldoPorCobrar={saldoPorCobrar}
            historial={historial}
          />
        );
      case 'cuentas':
        return <div className="text-white p-6">Contenido de Mis cuentas de cobro...</div>;
      case 'pagos':
        return <div className="text-white p-6">Contenido de Pagos y comprobantes...</div>;
      // You can add more cases here for other tabs later
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <p className="mb-4 text-xl">Sección en construcción</p>
            <button onClick={() => setActiveTab('inicio')} className="px-4 py-2 bg-[#E60000] text-white rounded">Volver al Inicio</button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E60000] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <StaffPortalLayout 
      userName={userName} 
      userDocument={userDocument}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      saldoPorCobrar={saldoPorCobrar}
    >
      {renderContent()}
    </StaffPortalLayout>
  );
}
