'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SocialMediaCardProps {
  pilotId: string;
  pilotName: string;
  pilotPseudonym: string;
  pilotCategory: string;
  pilotPhotoUrl: string;
  initialConfig?: any;
  isAdmin?: boolean;
  onSaveSuccess?: () => void;
}

export default function SocialMediaCard({
  pilotName,
  pilotPseudonym,
  pilotCategory,
  pilotPhotoUrl,
}: SocialMediaCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const sponsorsImgRef = useRef<HTMLImageElement | null>(null);
  const [sponsorsLoaded, setSponsorsLoaded] = useState(false);

  useEffect(() => {
    // 1. Cargar tira de patrocinadores
    const sponsors = new Image();
    sponsors.crossOrigin = 'anonymous';
    sponsors.onload = () => {
      sponsorsImgRef.current = sponsors;
      setSponsorsLoaded(true);
    };
    sponsors.onerror = () => {
      console.error('Error loading sponsors strip');
    };
    sponsors.src = '/sponsors/patro.png';

    // 2. Cargar foto del piloto
    if (pilotPhotoUrl) {
      setPhotoLoaded(false);
      photoImgRef.current = null;

      const isExternal = pilotPhotoUrl.startsWith('http');
      const finalUrl = isExternal 
        ? `/api/proxy-image?url=${encodeURIComponent(pilotPhotoUrl)}&cb=${Date.now()}` 
        : pilotPhotoUrl;

      const photo = new Image();
      photo.crossOrigin = 'anonymous';
      
      photo.onload = () => {
        photoImgRef.current = photo;
        setPhotoLoaded(true);
      };
      
      photo.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => {
          photoImgRef.current = fallback;
          setPhotoLoaded(true);
        };
        fallback.src = pilotPhotoUrl;
      };
      
      photo.src = finalUrl;
    }
  }, [pilotPhotoUrl]);

  useEffect(() => {
    drawCanvas();
  }, [photoLoaded, sponsorsLoaded, pilotName, pilotPseudonym, pilotCategory]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = 1080;
    const ch = 1080;
    canvas.width = cw;
    canvas.height = ch;

    // 1. Black/Dark Racing Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, cw, ch);

    // Dynamic geometric neon green accents
    ctx.save();
    
    // Top-left triangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cw * 0.5, 0);
    ctx.lineTo(0, ch * 0.5);
    ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.fill();

    // Bottom-right triangle
    ctx.beginPath();
    ctx.moveTo(cw, ch);
    ctx.lineTo(cw * 0.5, ch);
    ctx.lineTo(cw, ch * 0.5);
    ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.fill();

    // Angled lines
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cw * 0.8, 0);
    ctx.lineTo(cw, ch * 0.3);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cw * 0.85, 0);
    ctx.lineTo(cw, ch * 0.25);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, ch * 0.7);
    ctx.lineTo(cw * 0.2, ch);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Frame & Photo
    const fw = cw * 0.65;
    const fh = ch * 0.45;
    const fx = (cw - fw) / 2;
    const fy = ch * 0.22; // Place it in the middle
    
    ctx.save();
    ctx.beginPath();
    const skew = 40; // pixels to skew
    ctx.moveTo(fx + skew, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.lineTo(fx + fw - skew, fy + fh);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    
    ctx.clip();
    
    // Fallback inner background
    ctx.fillStyle = '#111111';
    ctx.fill();

    const photo = photoImgRef.current;
    if (photo && photoLoaded) {
      // Auto-fill logic
      const scale = Math.max(fw / photo.width, fh / photo.height);
      const drawW = photo.width * scale;
      const drawH = photo.height * scale;
      const cx = fx + fw / 2;
      const cy = fy + fh / 2;
      ctx.translate(cx, cy);
      ctx.drawImage(photo, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cargando foto...', fx + fw / 2, fy + fh / 2);
    }
    ctx.restore();

    // Frame Border
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fx + skew, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.lineTo(fx + fw - skew, fy + fh);
    ctx.lineTo(fx, fy + fh);
    ctx.closePath();
    
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#39FF14';
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 25;
    ctx.stroke();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // 3. Texts
    ctx.save();
    ctx.textAlign = 'center';

    // Title 
    ctx.font = 'bold 30px "Orbitron", sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('COPA STUNT COLOMBIA F2R 2026', cw / 2, fy - 110);

    // Pilot Name
    ctx.font = '900 80px "Orbitron", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText(pilotName.toUpperCase(), cw / 2, fy - 30);

    // Pilot Pseudonym
    if (pilotPseudonym && pilotPseudonym !== 'N/A') {
      ctx.font = 'italic 900 55px "Orbitron", sans-serif';
      ctx.fillStyle = '#39FF14';
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, fy + fh + 60);
    }

    // Category Pill
    const catText = Array.isArray(pilotCategory) ? pilotCategory.join(' / ') : pilotCategory;
    ctx.font = 'bold 45px "Orbitron", sans-serif';
    
    const textMetrics = ctx.measureText(catText.toUpperCase());
    const pillWidth = Math.max(textMetrics.width + 100, 300);
    const pillHeight = 70;
    const pillX = (cw - pillWidth) / 2;
    const pillY = fy + fh + 100;

    // Outer glow for pill
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#39FF14';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 35);
    ctx.fill();

    // Inner black text
    ctx.fillStyle = '#000000';
    ctx.shadowBlur = 0;
    ctx.textBaseline = 'middle';
    ctx.fillText(catText.toUpperCase(), cw / 2, pillY + pillHeight / 2);
    
    ctx.restore();

    // 4. Sponsors
    const sponsors = sponsorsImgRef.current;
    if (sponsors && sponsorsLoaded) {
      ctx.save();
      const aspect = sponsors.width / sponsors.height;
      const drawW = cw * 0.90;
      const drawH = drawW / aspect;
      const drawX = (cw - drawW) / 2;
      const drawY = ch - drawH - 30;
      
      const gradient = ctx.createLinearGradient(0, ch - drawH - 80, 0, ch);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.3, 'rgba(0,0,0,0.9)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, ch - drawH - 80, cw, drawH + 80);
      
      ctx.shadowColor = '#39FF14';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(drawX, drawY, drawW, drawH);
      
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      ctx.drawImage(sponsors, drawX, drawY, drawW, drawH);
      ctx.restore();
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const filename = `F2R_2026_Piloto_${pilotPseudonym && pilotPseudonym !== 'N/A' ? pilotPseudonym.replace(/\s+/g, '_') : pilotName.replace(/\s+/g, '_')}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: '¡Tarjeta Descargada!',
        description: 'La tarjeta oficial ha sido guardada en tu dispositivo.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error de exportación',
        description: 'No se pudo generar la imagen.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800 overflow-hidden w-full max-w-3xl mx-auto border-t-2 border-t-[#39FF14]">
      <CardHeader className="border-b border-zinc-900 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#39FF14] animate-pulse" />
              Póster Oficial F2R
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Generador automático del póster de redes sociales.
            </CardDescription>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            className="bg-[#39FF14] hover:bg-[#32E210] text-black font-black uppercase tracking-wider gap-1.5"
          >
            <Download className="w-4 h-4" /> Descargar PNG
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 flex justify-center bg-zinc-950">
        <div className="relative w-full max-w-[600px] aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />
        </div>
      </CardContent>
    </Card>
  );
}
