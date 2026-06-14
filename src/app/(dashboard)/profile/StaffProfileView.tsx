'use client';

import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { useSearchParams } from 'next/navigation';
import { DashboardInicio } from '@/components/staff-portal/DashboardInicio';

interface Codigo {
  id: string;
  valor: number;
  descripcion: string;
  estado: 'disponible' | 'cobrado';
  cobradoEl?: string;
}

export function StaffProfileView({ userUid, userName, userDocument }: { userUid: string, userName: string, userDocument: string }) {
  const searchParams = useSearchParams();
  const tabQuery = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabQuery || 'inicio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);
  
  const [rutUrl, setRutUrl] = useState<string | null>(null);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [documentosRechazados, setDocumentosRechazados] = useState<string[]>([]);
  
  const [codigosDisponibles, setCodigosDisponibles] = useState<Codigo[]>([]);
  const [historial, setHistorial] = useState<Codigo[]>([]);

  const userEmail = auth.currentUser?.email || '';
  const [extractedDocNum, setExtractedDocNum] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, 'users', userUid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.rutUrl) setRutUrl(data.rutUrl);
        if (data.certUrl) setCertUrl(data.certUrl);
        if (data.numeroIdentificacion) setExtractedDocNum(data.numeroIdentificacion);
        if (data.documentosRechazados) setDocumentosRechazados(data.documentosRechazados);
      }
    } catch(e) {
      console.error("Error fetching user data", e);
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

  const totalCobrado = historial.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const saldoPorCobrar = codigosDisponibles.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const totalAcumulado = totalCobrado + saldoPorCobrar;

  const todasLasCuentas = [...codigosDisponibles, ...historial].sort((a, b) => {
    const timeA = a.cobradoEl ? new Date(a.cobradoEl).getTime() : 0;
    const timeB = b.cobradoEl ? new Date(b.cobradoEl).getTime() : 0;
    return timeB - timeA;
  });

  const finalDocNum = (userDocument === '00' || userDocument === '--' || !userDocument) && extractedDocNum 
    ? extractedDocNum 
    : userDocument;

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
      case 'cuentas':
      case 'pagos':
      case 'historial':
        return (
          <DashboardInicio 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            rutUrl={rutUrl}
            certUrl={certUrl}
            totalAcumulado={totalAcumulado}
            saldoPorCobrar={saldoPorCobrar}
            historial={todasLasCuentas}
            userName={userName}
            userDocument={finalDocNum}
            userEmail={userEmail}
            userUid={userUid}
            documentosRechazados={documentosRechazados}
            setDocumentosRechazados={setDocumentosRechazados}
          />
        );
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
    <div className="flex-1 w-full bg-[#0D0D0D] min-h-[calc(100vh-64px)] overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        {renderContent()}
      </div>
    </div>
  );
}
