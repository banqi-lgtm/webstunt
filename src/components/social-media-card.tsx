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
  pilotCity?: string;
  pilotInstagram?: string;
}

export default function SocialMediaCard({
  pilotName,
  pilotPseudonym,
  pilotCategory,
  pilotPhotoUrl,
  pilotCity = '',
  pilotInstagram = '',
}: SocialMediaCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  
  // Sponsors Array
  const [sponsorsLoaded, setSponsorsLoaded] = useState(false);
  const sponsorsRefs = useRef<HTMLImageElement[]>([]);

  const [mainLogoLoaded, setMainLogoLoaded] = useState(false);
  const mainLogoRef = useRef<HTMLImageElement | null>(null);

  const [igLogoLoaded, setIgLogoLoaded] = useState(false);
  const igLogoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Load main logo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      mainLogoRef.current = img;
      setMainLogoLoaded(true);
    };
    img.src = '/sponsors/main-logo.png';

    // Load IG logo
    const igImg = new Image();
    igImg.onload = () => {
      igLogoRef.current = igImg;
      setIgLogoLoaded(true);
    };
    igImg.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='url(%23igGrad)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cdefs%3E%3ClinearGradient id='igGrad' x1='0%25' y1='100%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23f09433' /%3E%3Cstop offset='25%25' stop-color='%23e6683c' /%3E%3Cstop offset='50%25' stop-color='%23dc2743' /%3E%3Cstop offset='75%25' stop-color='%23cc2366' /%3E%3Cstop offset='100%25' stop-color='%23bc1888' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='2' y='2' width='20' height='20' rx='5' ry='5'/%3E%3Cpath d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/%3E%3Cline x1='17.5' y1='6.5' x2='17.51' y2='6.5'/%3E%3C/svg%3E";
  }, []);

  useEffect(() => {
    // 1. Cargar logos individuales de patrocinadores
    const sponsorPaths = [
      '/sponsors/Nitrox Blanco.png',
      '/sponsors/Mobil Blanco.png',
      '/sponsors/PKS Blanco.png',
      '/sponsors/copa stunt nitrox f2r.png',
      '/sponsors/Trakku.png',
      '/sponsors/IRC Blanco.png',
      '/sponsors/Fedemoto.png',
      '/sponsors/Victory Blanco.png'
    ];

    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    sponsorPaths.forEach((path, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedCount++;
        loadedImages[index] = img;
        if (loadedCount === sponsorPaths.length) {
          sponsorsRefs.current = loadedImages;
          setSponsorsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++; // Ignore errors but continue counting
        if (loadedCount === sponsorPaths.length) {
          sponsorsRefs.current = loadedImages;
          setSponsorsLoaded(true);
        }
      };
      img.src = path;
    });

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
  }, [photoLoaded, sponsorsLoaded, mainLogoLoaded, igLogoLoaded, pilotName, pilotPseudonym, pilotCategory, pilotCity, pilotInstagram]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = 1080;
    const ch = 1080;
    canvas.width = cw;
    canvas.height = ch;

    // 1. Black/Dark Racing Background with Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, ch);
    bgGradient.addColorStop(0, '#0a0a0a');
    bgGradient.addColorStop(1, '#051005'); // Dark military green tint at the bottom
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, cw, ch);

    // Dynamic geometric neon green accents
    ctx.save();
    
    // Top-left triangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cw * 0.5, 0);
    ctx.lineTo(0, ch * 0.5);
    ctx.fillStyle = 'rgba(57, 255, 20, 0.03)';
    ctx.fill();

    // Bottom-right triangle
    ctx.beginPath();
    ctx.moveTo(cw, ch);
    ctx.lineTo(cw * 0.5, ch);
    ctx.lineTo(cw, ch * 0.5);
    ctx.fillStyle = 'rgba(57, 255, 20, 0.03)';
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
    const fw = cw * 0.70;
    const fh = ch * 0.45;
    const fx = (cw - fw) / 2;
    const fy = ch * 0.23; // Place it in the middle
    
    ctx.save();
    ctx.beginPath();
    const skew = 30; // pixels to skew
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
      // Auto-fill logic with 8% zoom
      const baseScale = Math.max(fw / photo.width, fh / photo.height);
      const scale = baseScale * 1.08;
      const drawW = photo.width * scale;
      const drawH = photo.height * scale;
      const cx = fx + fw / 2;
      const cy = fy + fh / 2;
      ctx.translate(cx, cy);
      
      // Offset vertical center to focus more on face/upper torso
      // Shift up very slightly to center the face/torso and avoid cutting off hats
      let offsetY = 0;
      if (drawH > fh) {
        offsetY = -(drawH - fh) * 0.08; 
      }
      
      ctx.drawImage(photo, -drawW / 2, -drawH / 2 + offsetY, drawW, drawH);
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
    
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#39FF14';
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 20;
    ctx.stroke();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // Instagram handle (Top Left of the entire card)
    if (igLogoLoaded && igLogoRef.current) {
      ctx.save();
      const igLogo = igLogoRef.current;
      const igX = 40; // Top left of the card
      const igY = 40;
      const iconSize = 28;

      // Draw IG Icon (original colors)
      ctx.shadowBlur = 0; // No shadow so original colors are clean
      ctx.drawImage(igLogo, igX, igY, iconSize, iconSize);

      // Draw IG Handle
      ctx.font = 'bold 22px "Orbitron", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const fallbackIg = pilotPseudonym !== 'N/A' && pilotPseudonym ? pilotPseudonym.replace(/\s+/g, '') : pilotName.split(' ')[0];
      const displayIg = pilotInstagram && pilotInstagram !== 'N/A' ? pilotInstagram : fallbackIg;
      const igText = displayIg.startsWith('@') ? displayIg : `@${displayIg}`;
      
      // Contorno azul neon
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 4;
      ctx.strokeText(igText, igX + iconSize + 12, igY + iconSize / 2);
      
      // Letra blanca
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fillText(igText, igX + iconSize + 12, igY + iconSize / 2);
      
      ctx.restore();
    }

    // 3. Texts and Main Logo
    ctx.save();
    ctx.textAlign = 'center';

    // Title / Main Logo
    if (mainLogoLoaded && mainLogoRef.current) {
      const mainLogo = mainLogoRef.current;
      const aspect = mainLogo.width / mainLogo.height;
      const logoH = 110;
      const logoW = logoH * aspect;
      
      // Add a nice drop shadow to make it pop
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      
      ctx.drawImage(mainLogo, (cw - logoW) / 2, fy - 190, logoW, logoH);
      
      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // Pilot Name (Auto-scaling)
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 15;
    
    let nameSize = 60;
    ctx.font = `900 ${nameSize}px "Orbitron", sans-serif`;
    let nameWidth = ctx.measureText(pilotName.toUpperCase()).width;
    const maxNameWidth = cw * 0.9;
    
    while (nameWidth > maxNameWidth && nameSize > 30) {
      nameSize -= 2;
      ctx.font = `900 ${nameSize}px "Orbitron", sans-serif`;
      nameWidth = ctx.measureText(pilotName.toUpperCase()).width;
    }
    
    ctx.fillText(pilotName.toUpperCase(), cw / 2, fy - 25);

    // Pilot Pseudonym
    if (pilotPseudonym && pilotPseudonym !== 'N/A') {
      ctx.font = 'italic 900 55px "Orbitron", sans-serif';
      
      // Add strong dark background shadow for legibility
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 25;
      
      // Draw shadow multiple times for stronger effect
      ctx.fillStyle = 'black';
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, fy + fh + 65);
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, fy + fh + 65);
      
      ctx.fillStyle = '#39FF14';
      ctx.shadowBlur = 0;
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, fy + fh + 65);
    }

    // 3. Sponsors Background & Logos
    if (sponsorsLoaded && sponsorsRefs.current.length > 0) {
      ctx.save();
      
      const gradient = ctx.createLinearGradient(0, ch - 220, 0, ch);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.3, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, ch - 220, cw, 220);
      
      const totalAvailableWidth = cw * 0.90;
      const validSponsors = sponsorsRefs.current.filter(img => img);
      
      const drawSponsorRow = (rowSponsors: HTMLImageElement[], yOffset: number, sHeight: number) => {
        const numSponsors = rowSponsors.length;
        if (numSponsors === 0) return;
        
        const spacing = 15; // reduced spacing to fit more logos
        const individualMaxWidth = (totalAvailableWidth - (spacing * (numSponsors - 1))) / numSponsors;
        
        let totalUsedWidth = 0;
        const dimensions = rowSponsors.map(img => {
          const aspect = img.width / img.height;
          let drawW = sHeight * aspect;
          if (drawW > individualMaxWidth) {
            drawW = individualMaxWidth;
          }
          totalUsedWidth += drawW;
          return { drawW, drawH: drawW / aspect };
        });
        
        totalUsedWidth += spacing * (numSponsors - 1);
        let currentX = (cw - totalUsedWidth) / 2;

        rowSponsors.forEach((img, index) => {
          const dims = dimensions[index];
          
          ctx.shadowColor = '#39FF14';
          ctx.shadowBlur = 15;
          ctx.globalAlpha = 0.05;
          ctx.fillRect(currentX, yOffset + (sHeight - dims.drawH) / 2, dims.drawW, dims.drawH);
          
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
          ctx.drawImage(img, currentX, yOffset + (sHeight - dims.drawH) / 2, dims.drawW, dims.drawH);
          
          currentX += dims.drawW + spacing;
        });
      };

      // Always draw in a single row as requested
      drawSponsorRow(validSponsors, ch - 80, 50); // Single row, pushed down to ch - 80 to fit city text
      
      ctx.restore();
    }

    // 4. Category Pill
    const catText = Array.isArray(pilotCategory) ? pilotCategory.join(' / ') : pilotCategory;
    const displayCatText = `CATEGORÍA: ${catText.toUpperCase()}`;
    
    ctx.font = 'bold 35px "Orbitron", sans-serif';
    
    const textMetrics = ctx.measureText(displayCatText);
    const pillWidth = Math.max(textMetrics.width + 80, 250);
    const pillHeight = 60;
    const pillX = (cw - pillWidth) / 2;
    const pillY = fy + fh + 105; // Placed below pseudonym

    // Outer glow for pill
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#051005';
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 30);
    ctx.fill();
    ctx.stroke();

    // Inner text
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 0;
    ctx.textBaseline = 'middle';
    ctx.fillText(displayCatText, cw / 2, pillY + pillHeight / 2);
    
    ctx.restore();

    // 5. City Badge (Below Category)
    if (pilotCity && pilotCity !== 'N/A') {
      ctx.save();
      ctx.font = 'bold 22px "Orbitron", sans-serif';
      const cityText = pilotCity.toUpperCase();
      const cityMetrics = ctx.measureText(cityText);
      const cityWidth = Math.max(cityMetrics.width + 40, 150);
      const cityHeight = 45;
      
      const cityX = (cw - cityWidth) / 2; 
      const cityY = pillY + pillHeight + 15; // Placed below category pill
      
      // Neon green pill matching category
      ctx.shadowColor = '#39FF14';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#051005';
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 3; // Match category lineWidth
      
      ctx.beginPath();
      ctx.roundRect(cityX, cityY, cityWidth, cityHeight, cityHeight / 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF'; // Letra blanca
      ctx.shadowBlur = 0; // Disable shadow for clean text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cityText, cityX + cityWidth / 2, cityY + cityHeight / 2);
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
