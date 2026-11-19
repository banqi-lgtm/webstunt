'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { PersonalLogeoStaff } from '@/components/staff-portal/PersonalLogeoStaff';
import { Loader2 } from 'lucide-react';

export default function LogeoPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<{ uid: string; name: string; document: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        const data = uDoc.exists() ? uDoc.data() : {};
        const interfaces: string[] = data.interfaces || [];
        const isSuperAdmin = ['wg12435@hotmail.com', 'walter12345@hotmail.com'].includes(user.email || '') || interfaces.includes('admin');

        // Check if user has permission for logeo
        if (isSuperAdmin || interfaces.includes('logeo') || interfaces.includes('control-staff') || interfaces.includes('staff')) {
          const fullName = data.nombreCompleto || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.nombre || 'Colaborador';
          const cleanDoc = (data.numeroIdentificacion || '').replace(/^(C\.?\s*C\.?|NIT|C\.?\s*E\.?|T\.?\s*I\.?|PASAPORTE)[\s:\-_.]*/i, '').trim();

          setCurrentUser({
            uid: user.uid,
            name: fullName,
            document: cleanDoc
          });
          setHasAccess(true);
        } else {
          setHasAccess(false);
          router.push('/profile');
        }
      } catch (err) {
        console.error('Error verificando acceso a logeo', err);
        setHasAccess(false);
        router.push('/profile');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        <span className="font-orbitron text-xs uppercase tracking-widest">Verificando acceso a Logeo...</span>
      </div>
    );
  }

  if (!hasAccess || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <PersonalLogeoStaff
          userUid={currentUser.uid}
          userName={currentUser.name}
          userDocument={currentUser.document}
        />
      </div>
    </div>
  );
}
