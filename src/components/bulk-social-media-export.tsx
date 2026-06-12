'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import SocialMediaCard from './social-media-card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';

interface BulkExportProps {
  pilots: any[];
}

export default function BulkSocialMediaExport({ pilots }: BulkExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [currentPilot, setCurrentPilot] = useState<any>(null);

  const startExport = () => {
    setIsExporting(true);
    setZip(new JSZip());
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (isExporting && currentIndex >= pilots.length && zip) {
      zip.generateAsync({ type: 'blob' }).then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `F2R_2026_Pilotos_Fotos.zip`;
        link.click();
        setIsExporting(false);
        setCurrentIndex(-1);
        setCurrentPilot(null);
        setZip(null);
      });
    } else if (isExporting && currentIndex < pilots.length && zip) {
      const pilot = pilots[currentIndex];
      const photoUrl = pilot.documentos?.deportistaUrl;
      
      setCurrentPilot(null); // Unmount card while loading

      if (photoUrl) {
        const isExternal = photoUrl.startsWith('http');
        const finalUrl = isExternal 
          ? `/api/proxy-image?url=${encodeURIComponent(photoUrl)}&cb=${Date.now()}` 
          : photoUrl;
          
        fetch(finalUrl)
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status}: ${text}`);
            }
            return res.blob();
          })
          .then(blob => {
            const objectUrl = URL.createObjectURL(blob);
            pilot._preloadedBlobUrl = objectUrl; // store it directly on the pilot object to pass it down
            setCurrentPilot(pilot);
          })
          .catch(e => {
            console.error("Bulk export failed to load image for", pilot.nombres, e);
            setCurrentPilot(pilot);
          });
      } else {
        setCurrentPilot(pilot);
      }
    }
  }, [currentIndex, isExporting, pilots, zip]);

  const handleRenderComplete = (dataUrl: string) => {
    if (!isExporting || !zip || currentIndex >= pilots.length) return;
    
    const pilot = pilots[currentIndex];
    const nameStr = `${pilot.seudonimo || pilot.nombres || 'Piloto'} ${pilot.apellidos || ''}`.trim();
    // Clean name first, then append .png so the dot isn't stripped by regex
    const cleanName = nameStr.replace(/[^a-zA-Z0-9_\u00C0-\u017F\s-]/g, '').replace(/\s+/g, '_');
    const filename = `${cleanName}.png`;
    
    const base64Data = dataUrl.split(',')[1];
    zip.file(filename, base64Data, { base64: true });
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 50); // slight delay to allow React to unmount/mount cleanly
  };

  return (
    <div className="inline-block relative">
      <Button
        onClick={startExport}
        disabled={isExporting || pilots.length === 0}
        className="bg-[#E60000] hover:bg-[#32E210] text-black gap-2 h-12 px-6 w-full sm:w-auto font-bold shadow-[0_0_20px_rgba(230, 0, 0,0.3)] border border-[#E60000]/50"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exportando {currentIndex + 1}/{pilots.length}
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Fotos
          </>
        )}
      </Button>

      {/* Hidden container to render one card at a time */}
      {isExporting && currentPilot && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0 }}>
          <SocialMediaCard
            key={currentPilot.id || currentIndex}
            pilotId={currentPilot.id || 'bulk'}
            pilotName={`${currentPilot.nombres || ''} ${currentPilot.apellidos || ''}`.trim()}
            pilotPseudonym={currentPilot.seudonimo || ''}
            pilotCategory={currentPilot.categoria || 'N/A'}
            pilotCity={currentPilot.ciudad || ''}
            pilotInstagram={currentPilot.instagram || ''}
            pilotPhotoUrl={currentPilot._preloadedBlobUrl || currentPilot.documentos?.deportistaUrl || ''}
            onRenderComplete={handleRenderComplete}
          />
        </div>
      )}
    </div>
  );
}
