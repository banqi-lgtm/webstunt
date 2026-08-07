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
  onRenderComplete?: (dataUrl: string) => void;
}

export default function SocialMediaCard({
  pilotId = '',
  pilotName,
  pilotPseudonym,
  pilotCategory,
  pilotPhotoUrl,
  pilotCity = '',
  pilotInstagram = '',
  onRenderComplete,
}: SocialMediaCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Drag states for photo adjustment
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    const isFestival = pilotId.startsWith('festival_');
    const isNitrox = pilotId.startsWith('nitrox_');
    img.src = isFestival ? '/sponsors/IMG_4313.PNG' :
              isNitrox ? '/sponsors/Copa Stunt Nitrox Blanco.png' :
              '/sponsors/main-logo.png';

    // Load IG logo
    const igImg = new Image();
    igImg.onload = () => {
      igLogoRef.current = igImg;
      setIgLogoLoaded(true);
    };
    igImg.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='url(%23igGrad)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cdefs%3E%3ClinearGradient id='igGrad' x1='0%25' y1='100%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' stop-color='%23f09433' /%3E%3Cstop offset='25%25' stop-color='%23e6683c' /%3E%3Cstop offset='50%25' stop-color='%23dc2743' /%3E%3Cstop offset='75%25' stop-color='%23cc2366' /%3E%3Cstop offset='100%25' stop-color='%23bc1888' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='2' y='2' width='20' height='20' rx='5' ry='5'/%3E%3Cpath d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'/%3E%3Cline x1='17.5' y1='6.5' x2='17.51' y2='6.5'/%3E%3C/svg%3E";
  }, [pilotId]);

  useEffect(() => {
    // 1. Cargar logos individuales de patrocinadores
    const isFestival = pilotId.startsWith('festival_');
    const sponsorPaths = isFestival 
      ? [
          '/sponsors/PKS Blanco.png',
          '/sponsors/img65.jpeg',
          '/sponsors/maxi.jpeg',
          '/sponsors/Stunt Festival 9.png'
        ]
      : [
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

      const isBlob = pilotPhotoUrl.startsWith('blob:');
      const isExternal = !isBlob && pilotPhotoUrl.startsWith('http');
      const finalUrl = isExternal 
        ? `/api/proxy-image?url=${encodeURIComponent(pilotPhotoUrl)}&cb=${Date.now()}` 
        : pilotPhotoUrl;

      const photo = new Image();
      if (!isBlob) {
        photo.crossOrigin = 'anonymous';
      }
      
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
        fallback.onerror = () => {
          setPhotoLoaded(true);
        };
        fallback.src = pilotPhotoUrl;
      };
      
      photo.src = finalUrl;
    } else {
      setPhotoLoaded(true);
    }
  }, [pilotPhotoUrl, pilotId]);

  useEffect(() => {
    drawCanvas();
  }, [photoLoaded, sponsorsLoaded, mainLogoLoaded, igLogoLoaded, pilotName, pilotPseudonym, pilotCategory, pilotCity, pilotInstagram, panOffset.x, panOffset.y]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = 1080;
    const ch = 1080;
    canvas.width = cw;
    canvas.height = ch;
    const isFestival = pilotId.startsWith('festival_');
    const isNitrox = pilotId.startsWith('nitrox_');

    // === HELPER: Draw photo inside current clip ===
    const drawPhotoInClip = (fx: number, fy: number, fw: number, fh: number) => {
      const photo = photoImgRef.current;
      if (photo && photoLoaded) {
        const baseScale = Math.max(fw / photo.width, fh / photo.height);
        const scale = baseScale * 1.03;
        const drawW = photo.width * scale;
        const drawH = photo.height * scale;
        ctx.translate(fx + fw / 2, fy + fh / 2);
        let offsetY = 0;
        if (drawH > fh) offsetY = (drawH - fh) * 0.15;
        ctx.drawImage(photo, -drawW / 2 + panOffset.x, -drawH / 2 + offsetY + panOffset.y, drawW, drawH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(photoLoaded ? 'Sin Foto / Error' : 'Cargando foto...', fx + fw / 2, fy + fh / 2);
      }
    };

    // Helper to dynamically remove solid backgrounds (shared by sponsors and photo logos)
    const getProcessedImage = (img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.width;
      offCanvas.height = img.height;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return img;
      
      offCtx.drawImage(img, 0, 0);
      const imgData = offCtx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;
      
      // Check top-left corner pixel to auto-detect background type
      const cr = data[0], cg = data[1], cb = data[2];
      const isBlackBg = cr < 60 && cg < 60 && cb < 60;
      const isWhiteBg = cr > 195 && cg > 195 && cb > 195;
      const isRmLogo = img.src.includes('rm.jpeg');
      
      if (isBlackBg) {
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < 40 && data[i+1] < 40 && data[i+2] < 40) {
            data[i+3] = 0; // Transparent
          }
        }
      } else if (isWhiteBg) {
        // If it is the RM logo, use a higher threshold to preserve the off-white letters
        const threshold = isRmLogo ? 252 : 215;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > threshold && data[i+1] > threshold && data[i+2] > threshold) {
            data[i+3] = 0; // Transparent
          }
        }
      }
      
      offCtx.putImageData(imgData, 0, 0);
      return offCanvas;
    };

    // Helper to draw a logo inside the photo frame
    const drawPhotoLogo = (img: HTMLImageElement, x: number, y: number, slotW: number, slotH: number) => {
      const aspect = img.width / img.height;
      let drawW = slotW;
      let drawH = slotH;
      if (aspect > 1) {
        drawH = slotW / aspect;
      } else {
        drawW = slotH * aspect;
      }
      
      const px = x + (slotW - drawW) / 2;
      const py = y + (slotH - drawH) / 2;
      
      // Soft dark glow underneath for contrast against light photos
      const cx = x + slotW / 2;
      const cy = y + slotH / 2;
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, slotW * 0.75);
      bgGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      bgGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, slotW * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      const processed = getProcessedImage(img);
      ctx.drawImage(processed, px, py, drawW, drawH);
    };

    // === HELPER: Draw sponsors ===
    const drawSponsors = (glowColor: string, customH?: number) => {
      if (!sponsorsLoaded || sponsorsRefs.current.length === 0) return;
      ctx.save();
      const grad = ctx.createLinearGradient(0, ch - 220, 0, ch);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.3, 'rgba(0,0,0,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, ch - 220, cw, 220);
      const valid = sponsorsRefs.current.filter(i => i);
      if (!valid.length) { ctx.restore(); return; }

      // Filter out Fox, Maxxis, and Stunt Festival from the bottom row
      const bottomLogos = valid.filter(img => {
        const src = img.src.toLowerCase();
        return !src.includes('img65.jpeg') && !src.includes('maxi.jpeg') && !src.includes('stunt festival');
      });

      if (!bottomLogos.length) { ctx.restore(); return; }

      const sH = customH || 50;
      const sp = 15; // nice closer spacing
      const slotW = sH;
      const slotH = sH;
      const totalUsedWidth = (bottomLogos.length * slotW) + ((bottomLogos.length - 1) * sp);
      let currentX = (cw - totalUsedWidth) / 2;
      const yOff = isFestival ? 880 : (ch - 80 - (sH - 50));

      // Draw a very subtle, soft golden horizontal glow band across the entire sponsors row
      if (isFestival) {
        const glowY = yOff + slotH / 2;
        const horizontalGlow = ctx.createLinearGradient(0, glowY - 70, 0, glowY + 70);
        horizontalGlow.addColorStop(0, 'rgba(255, 184, 0, 0.0)');
        horizontalGlow.addColorStop(0.5, 'rgba(255, 184, 0, 0.12)'); // Very subtle gold glow
        horizontalGlow.addColorStop(1, 'rgba(255, 184, 0, 0.0)');
        ctx.save();
        ctx.fillStyle = horizontalGlow;
        ctx.fillRect(0, glowY - 70, cw, 140);
        ctx.restore();
      }

      bottomLogos.forEach((img) => {
        const aspect = img.width / img.height;
        let drawW = slotW;
        let drawH = slotH;
        if (aspect > 1) {
          drawH = slotW / aspect;
        } else {
          drawW = slotH * aspect;
        }
        
        ctx.shadowColor = glowColor; ctx.shadowBlur = 15; ctx.globalAlpha = 0.02;
        ctx.fillRect(currentX + (slotW - drawW) / 2, yOff + (slotH - drawH) / 2, drawW, drawH);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        
        // Draw the processed image with transparent background
        const processed = getProcessedImage(img);
        ctx.drawImage(processed, currentX + (slotW - drawW) / 2, yOff + (slotH - drawH) / 2, drawW, drawH);
        currentX += slotW + sp;
      });
      ctx.restore();
    };
    // === HELPER: IG handle ===
    const drawIG = (bg: string, border: string) => {
      if (!igLogoLoaded || !igLogoRef.current) return;
      ctx.save();
      const igL = igLogoRef.current, ix = 40, iy = 40, is2 = 28;
      ctx.font = 'bold 22px "Orbitron", sans-serif';
      const fb = pilotPseudonym !== 'N/A' && pilotPseudonym ? pilotPseudonym.replace(/\s+/g, '') : pilotName.split(' ')[0];
      const di = pilotInstagram && pilotInstagram !== 'N/A' ? pilotInstagram : fb;
      const it = di.startsWith('@') ? di : `@${di}`;
      const tw = ctx.measureText(it).width, pw = is2 + tw + 35, ph = 44, px = ix - 10, py = iy - (ph - is2) / 2;
      ctx.shadowColor = border; ctx.shadowBlur = 12; ctx.fillStyle = bg; ctx.strokeStyle = border; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(px, py, pw, ph, ph / 2); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.drawImage(igL, ix, iy, is2, is2);
      ctx.fillStyle = '#FFF'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(it, ix + is2 + 10, iy + is2 / 2);
      ctx.restore();
    };

    // === HELPER: PILOTO CONFIRMADO ===
    const drawPC = (gc: string) => {
      ctx.save();
      ctx.font = 'bold 24px "Orbitron", sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.shadowColor = gc; ctx.shadowBlur = 15; ctx.fillStyle = '#FFF';
      ctx.fillText('PILOTO CONFIRMADO', cw - 40, 54);
      ctx.restore();
    };
    // === HELPER: Main Logo ===
    const drawLogo = (y: number, customH?: number, glowColor?: string) => {
      if (!mainLogoLoaded || !mainLogoRef.current) return;
      ctx.save(); ctx.textAlign = 'center';
      const ml = mainLogoRef.current, a = ml.width / ml.height, lh = customH || 110, lw = lh * a;
      if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
      }
      ctx.drawImage(ml, (cw - lw) / 2, y, lw, lh);
      ctx.restore();
    };
    // === HELPER: Pilot name ===
    const drawName = (y: number) => {
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#FFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 15;
      let s = 60; ctx.font = `900 ${s}px "Orbitron", sans-serif`;
      let w = ctx.measureText(pilotName.toUpperCase()).width;
      while (w > cw * 0.9 && s > 30) { s -= 2; ctx.font = `900 ${s}px "Orbitron", sans-serif`; w = ctx.measureText(pilotName.toUpperCase()).width; }
      ctx.fillText(pilotName.toUpperCase(), cw / 2, y);
      ctx.restore();
    };

    // === HELPER: Pseudonym ===
    const drawPseudo = (y: number, color: string) => {
      if (!pilotPseudonym || pilotPseudonym === 'N/A') return;
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = 'italic 900 55px "Orbitron", sans-serif';
      ctx.shadowColor = 'black'; ctx.shadowBlur = 25; ctx.fillStyle = 'black';
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, y);
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, y);
      ctx.fillStyle = color; ctx.shadowBlur = 0;
      ctx.fillText(`"${pilotPseudonym.toUpperCase()}"`, cw / 2, y);
      ctx.restore();
    };

    // ================================================================
    //   FESTIVAL STUNT — Rounded frame, radial vignette, corner
    //   brackets, gradient pill, underlined city, clean modern look
    // ================================================================
    if (isFestival) {
      const P = '#FFB800', S = '#FF8C00'; // Gold + Deep Orange
      // Background: dark with warm amber tint
      ctx.fillStyle = '#0A0600';
      ctx.fillRect(0, 0, cw, ch);

      // FEW BUT BRUTAL diagonal slashes — thick, high opacity, RUDE
      ctx.save();
      // === TOP-RIGHT massive slashes ===
      ctx.strokeStyle = '#FFB800';
      ctx.lineWidth = 18; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(cw * 0.6, 0); ctx.lineTo(cw, ch * 0.45); ctx.stroke();
      ctx.lineWidth = 8; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(cw * 0.72, 0); ctx.lineTo(cw, ch * 0.32); ctx.stroke();
      ctx.lineWidth = 4; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(cw * 0.78, 0); ctx.lineTo(cw, ch * 0.25); ctx.stroke();

      // === BOTTOM-LEFT massive slashes ===
      ctx.lineWidth = 18; ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.moveTo(0, ch * 0.55); ctx.lineTo(cw * 0.45, ch); ctx.stroke();
      ctx.lineWidth = 8; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(0, ch * 0.68); ctx.lineTo(cw * 0.32, ch); ctx.stroke();
      ctx.lineWidth = 4; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.moveTo(0, ch * 0.75); ctx.lineTo(cw * 0.25, ch); ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.restore();

      // Corner brackets — gold, thicker, more prominent
      ctx.save(); ctx.strokeStyle = P; ctx.lineWidth = 5; ctx.globalAlpha = 0.5;
      ctx.shadowColor = P; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(20, 140); ctx.lineTo(20, 20); ctx.lineTo(140, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cw - 20, ch - 140); ctx.lineTo(cw - 20, ch - 20); ctx.lineTo(cw - 140, ch - 20); ctx.stroke();
      // Additional corner accents (top-right, bottom-left)
      ctx.lineWidth = 3; ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(cw - 20, 100); ctx.lineTo(cw - 20, 20); ctx.lineTo(cw - 100, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, ch - 100); ctx.lineTo(20, ch - 20); ctx.lineTo(100, ch - 20); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.restore();

      // ROUNDED RECTANGLE photo frame with DOUBLE gold border (Shifted Up to y = 330)
      const fw = cw * 0.68, fh = 400, fx = (cw - fw) / 2, fy = 330, r = 20;
      ctx.save(); ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, r); ctx.clip();
      ctx.fillStyle = '#111'; ctx.fill(); drawPhotoInClip(fx, fy, fw, fh);
      
      // Top-left: Fox logo
      const foxImg = sponsorsRefs.current.find(img => img && img.src.toLowerCase().includes('img65.jpeg'));
      if (foxImg) {
        drawPhotoLogo(foxImg, fx + 15, fy + 15, 80, 80);
      }
      
      // Top-right: Maxxis logo
      const maxiImg = sponsorsRefs.current.find(img => img && img.src.toLowerCase().includes('maxi.jpeg'));
      if (maxiImg) {
        drawPhotoLogo(maxiImg, fx + fw - 15 - 80, fy + 15, 80, 80);
      }
      
      ctx.restore();
      // Outer thick gold glow
      ctx.save(); ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, r);
      ctx.shadowColor = P; ctx.shadowBlur = 35; ctx.lineWidth = 5; ctx.strokeStyle = P; ctx.stroke();
      // Inner white accent border
      ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
      ctx.restore();

      // IG Handle and Festival logo top-right (instead of "PILOTO CONFIRMADO")
      drawIG('#1A0E00', S);
      // Draw Festival Stunt logo in top-right corner
      const festLogo = sponsorsRefs.current.find(img => img && img.src.toLowerCase().includes('stunt festival 9'));
      if (festLogo) {
        const flH = 95, flW = festLogo.width / festLogo.height * flH;
        const flX = cw - flW - 20, flY = 10;
        ctx.save();
        ctx.shadowColor = P; ctx.shadowBlur = 20;
        const festProcessed = getProcessedImage(festLogo);
        ctx.drawImage(festProcessed, flX, flY, flW, flH);
        ctx.restore();
      }
      
      // City: PEREIRA moved directly under the Instagram pill (Left Aligned)
      if (pilotCity && pilotCity !== 'N/A') {
        ctx.save(); ctx.font = 'bold 22px "Orbitron", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = P; ctx.shadowBlur = 12;
        const ct = pilotCity.toUpperCase(); 
        ctx.fillText(ct, 40, 105);
        const cityW = ctx.measureText(ct).width;
        ctx.strokeStyle = S; ctx.lineWidth = 2.5; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(40, 134); ctx.lineTo(40 + cityW, 134); ctx.stroke();
        ctx.restore();
      }

      // Draw Main Logo (Giant size, high up)
      drawLogo(fy - 390, 440, P);
      
      // Draw Name (Lowered right above photo frame)
      drawName(fy - 30);

      // Draw Pseudonym (Apodo: Lowered right below photo frame)
      drawPseudo(fy + fh + 40, '#FFFFFF');



      drawSponsors(P, 135);


    // ================================================================
    //   COPA STUNT NITROX — Hexagonal clipped-corner frame, diagonal
    //   circuit-board pattern, angular badges, techy green/gold
    // ================================================================
    } else if (isNitrox) {
      const P = '#00FF66', S = '#FFD700';
      // Background: military dark green diagonal gradient
      const bg = ctx.createLinearGradient(0, 0, cw, ch);
      bg.addColorStop(0, '#050D05'); bg.addColorStop(0.5, '#0a0a0a'); bg.addColorStop(1, '#051208');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);

      // Diagonal circuit-board lines
      ctx.save(); ctx.strokeStyle = P; ctx.globalAlpha = 0.08; ctx.lineWidth = 1;
      for (let i = -ch; i < cw + ch; i += 80) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + ch, ch); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.restore();

      // Bold diagonal slashes
      ctx.save(); ctx.strokeStyle = P; ctx.globalAlpha = 0.25;
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cw * 0.7, 0); ctx.lineTo(cw, ch * 0.35); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cw * 0.75, 0); ctx.lineTo(cw, ch * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ch * 0.65); ctx.lineTo(cw * 0.3, ch); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, ch * 0.7); ctx.lineTo(cw * 0.35, ch); ctx.stroke();
      ctx.globalAlpha = 1; ctx.restore();

      // HEXAGONAL CLIPPED-CORNER photo frame
      const fw = cw * 0.72, fh = ch * 0.45, fx = (cw - fw) / 2, fy = ch * 0.23, cc = 40;
      const hexF = () => {
        ctx.beginPath();
        ctx.moveTo(fx + cc, fy); ctx.lineTo(fx + fw - cc, fy); ctx.lineTo(fx + fw, fy + cc);
        ctx.lineTo(fx + fw, fy + fh - cc); ctx.lineTo(fx + fw - cc, fy + fh); ctx.lineTo(fx + cc, fy + fh);
        ctx.lineTo(fx, fy + fh - cc); ctx.lineTo(fx, fy + cc); ctx.closePath();
      };
      ctx.save(); hexF(); ctx.clip(); ctx.fillStyle = '#0a0a0a'; ctx.fill(); drawPhotoInClip(fx, fy, fw, fh); ctx.restore();
      ctx.save(); hexF(); ctx.lineWidth = 5; ctx.strokeStyle = P; ctx.shadowColor = P; ctx.shadowBlur = 25; ctx.stroke(); ctx.restore();

      // Corner tick marks
      ctx.save(); ctx.strokeStyle = S; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; const tk = 15;
      ctx.beginPath(); ctx.moveTo(fx + cc - tk, fy - 8); ctx.lineTo(fx + cc + tk, fy - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 8, fy + cc - tk); ctx.lineTo(fx - 8, fy + cc + tk); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx + fw - cc - tk, fy - 8); ctx.lineTo(fx + fw - cc + tk, fy - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx + fw + 8, fy + cc - tk); ctx.lineTo(fx + fw + 8, fy + cc + tk); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx + cc - tk, fy + fh + 8); ctx.lineTo(fx + cc + tk, fy + fh + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx + fw - cc - tk, fy + fh + 8); ctx.lineTo(fx + fw - cc + tk, fy + fh + 8); ctx.stroke();
      ctx.globalAlpha = 1; ctx.restore();

      drawIG('#051508', S); drawPC(P); drawLogo(fy - 190); drawName(fy - 25);
      drawPseudo(fy + fh + 65, P);

      // City: angular cut-corner badge
      let nY = fy + fh + 105;
      if (pilotCity && pilotCity !== 'N/A') {
        ctx.save(); ctx.font = 'bold 22px "Orbitron", sans-serif';
        const ct = pilotCity.toUpperCase(), cW = Math.max(ctx.measureText(ct).width + 40, 160), cH = 40;
        const cx3 = (cw - cW) / 2, cy3 = nY, c2 = 10;
        ctx.beginPath();
        ctx.moveTo(cx3 + c2, cy3); ctx.lineTo(cx3 + cW - c2, cy3); ctx.lineTo(cx3 + cW, cy3 + c2);
        ctx.lineTo(cx3 + cW, cy3 + cH - c2); ctx.lineTo(cx3 + cW - c2, cy3 + cH); ctx.lineTo(cx3 + c2, cy3 + cH);
        ctx.lineTo(cx3, cy3 + cH - c2); ctx.lineTo(cx3, cy3 + c2); ctx.closePath();
        ctx.fillStyle = 'rgba(0,255,102,0.08)'; ctx.shadowColor = P; ctx.shadowBlur = 12;
        ctx.strokeStyle = P; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF'; ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ct, cx3 + cW / 2, cy3 + cH / 2); ctx.restore(); nY += cH + 15;
      }
      // Category: angular cut-corner pill
      const ct = Array.isArray(pilotCategory) ? pilotCategory.join(' / ') : pilotCategory;
      const dct = ct.toUpperCase();
      ctx.save(); ctx.font = 'bold 35px "Orbitron", sans-serif';
      const cm = ctx.measureText(dct), pw2 = Math.max(cm.width + 80, 250), ph3 = 60, px2 = (cw - pw2) / 2, py2 = nY, c3 = 18;
      ctx.beginPath();
      ctx.moveTo(px2 + c3, py2); ctx.lineTo(px2 + pw2 - c3, py2); ctx.lineTo(px2 + pw2, py2 + c3);
      ctx.lineTo(px2 + pw2, py2 + ph3 - c3); ctx.lineTo(px2 + pw2 - c3, py2 + ph3); ctx.lineTo(px2 + c3, py2 + ph3);
      ctx.lineTo(px2, py2 + ph3 - c3); ctx.lineTo(px2, py2 + c3); ctx.closePath();
      ctx.fillStyle = '#051508'; ctx.shadowColor = P; ctx.shadowBlur = 15; ctx.strokeStyle = P; ctx.lineWidth = 3;
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFF'; ctx.shadowBlur = 0; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(dct, cw / 2, py2 + ph3 / 2); ctx.restore();

      drawSponsors(P);

    // ================================================================
    //   COPA STUNT F2R / DEFAULT — Skewed parallelogram frame,
    //   aggressive red racing lines, classic original layout
    // ================================================================
    } else {
      const P = '#E60000', S = '#00F0FF';
      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, ch);
      bg.addColorStop(0, '#0a0a0a'); bg.addColorStop(1, '#051005');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);

      // Racing geometric accents
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw * 0.5, 0); ctx.lineTo(0, ch * 0.5);
      ctx.fillStyle = 'rgba(230,0,0,0.03)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cw, ch); ctx.lineTo(cw * 0.5, ch); ctx.lineTo(cw, ch * 0.5);
      ctx.fillStyle = 'rgba(230,0,0,0.03)'; ctx.fill();
      ctx.strokeStyle = P; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cw * 0.8, 0); ctx.lineTo(cw, ch * 0.3); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cw * 0.85, 0); ctx.lineTo(cw, ch * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ch * 0.7); ctx.lineTo(cw * 0.2, ch); ctx.stroke();
      ctx.restore();

      // SKEWED PARALLELOGRAM photo frame
      const fw = cw * 0.70, fh = ch * 0.45, fx = (cw - fw) / 2, fy = ch * 0.23, sk = 30;
      const skF = () => { ctx.beginPath(); ctx.moveTo(fx + sk, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw - sk, fy + fh); ctx.lineTo(fx, fy + fh); ctx.closePath(); };
      ctx.save(); skF(); ctx.clip(); ctx.fillStyle = '#111'; ctx.fill(); drawPhotoInClip(fx, fy, fw, fh); ctx.restore();
      ctx.save(); skF(); ctx.lineWidth = 6; ctx.strokeStyle = P; ctx.shadowColor = P; ctx.shadowBlur = 20; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#FFF'; ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();

      drawIG('#001015', S); drawPC(P); drawLogo(fy - 190); drawName(fy - 25);
      drawPseudo(fy + fh + 65, P);

      // City: cyan neon pill
      let nY = fy + fh + 105;
      if (pilotCity && pilotCity !== 'N/A') {
        ctx.save(); ctx.font = 'bold 22px "Orbitron", sans-serif';
        const ct = pilotCity.toUpperCase(), cW = Math.max(ctx.measureText(ct).width + 30, 150), cH = 40;
        const cx3 = (cw - cW) / 2, cy3 = nY;
        ctx.shadowColor = S; ctx.shadowBlur = 15; ctx.fillStyle = '#001015'; ctx.strokeStyle = S; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(cx3, cy3, cW, cH, cH / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFF'; ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ct, cx3 + cW / 2, cy3 + cH / 2); ctx.restore(); nY += cH + 15;
      }
      // Category: red pill
      const ct = Array.isArray(pilotCategory) ? pilotCategory.join(' / ') : pilotCategory;
      const dct = ct.toUpperCase();
      ctx.save(); ctx.font = 'bold 35px "Orbitron", sans-serif';
      const cm = ctx.measureText(dct), pw2 = Math.max(cm.width + 80, 250), ph3 = 60, px2 = (cw - pw2) / 2, py2 = nY;
      ctx.shadowColor = P; ctx.shadowBlur = 15; ctx.fillStyle = '#051005'; ctx.strokeStyle = P; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(px2, py2, pw2, ph3, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#FFF'; ctx.shadowBlur = 0; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      ctx.fillText(dct, cw / 2, py2 + ph3 / 2); ctx.restore();

      drawSponsors(P);
    }

    // Trigger completion callback
    if (onRenderComplete && sponsorsLoaded && mainLogoLoaded && igLogoLoaded && photoLoaded) {
      setTimeout(() => {
        try { onRenderComplete(canvas.toDataURL('image/png')); } catch(e) { console.error("Export error", e); }
      }, 100);
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
    <Card className="bg-zinc-950 border-zinc-800 overflow-hidden w-full max-w-3xl mx-auto border-t-2 border-t-[#E60000]">
      <CardHeader className="border-b border-zinc-900 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#E60000] animate-pulse" />
              Póster Oficial F2R
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Generador automático del póster de redes sociales.
            </CardDescription>
          </div>
          <Button
            onClick={handleDownload}
            size="sm"
            className="bg-[#E60000] hover:bg-[#32E210] text-black font-black uppercase tracking-wider gap-1.5"
          >
            <Download className="w-4 h-4" /> Descargar PNG
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 md:p-8 flex justify-center bg-zinc-950">
        <div className="relative w-full max-w-[600px] aspect-square rounded-xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-cover touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onPointerDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDragging) return;
              const canvas = e.currentTarget;
              const scaleRatio = 1080 / (canvas.clientWidth || 1);
              const dx = (e.clientX - dragStart.x) * scaleRatio;
              const dy = (e.clientY - dragStart.y) * scaleRatio;
              setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
              setDragStart({ x: e.clientX, y: e.clientY });
            }}
            onPointerUp={(e) => {
              setIsDragging(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={(e) => {
              setIsDragging(false);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
