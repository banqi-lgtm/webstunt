'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, MoveRight, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  isDeportista?: boolean;
  mode?: 'single' | 'double';
}

export function CameraModal({ 
  isOpen, 
  onClose, 
  onCapture, 
  title = "Tomar Foto", 
  isDeportista = false,
  mode = 'single'
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Para el modo doble, un canvas oculto donde componemos la imagen final
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  // Estado general de captura (para single mode)
  const [isCaptured, setIsCaptured] = useState(false);

  // Estados para double mode
  const [doubleStep, setDoubleStep] = useState<'front' | 'back' | 'preview'>('front');
  const [frontImageSrc, setFrontImageSrc] = useState<string | null>(null);
  const [backImageSrc, setBackImageSrc] = useState<string | null>(null);
  const [finalImageSrc, setFinalImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetState();
    }
    return () => stopCamera();
  }, [isOpen]);

  const resetState = () => {
    setIsCaptured(false);
    setDoubleStep('front');
    setFrontImageSrc(null);
    setBackImageSrc(null);
    setFinalImageSrc(null);
    setError('');
  };

  const startCamera = async () => {
    setError('');
    setIsCaptured(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isDeportista ? 'user' : 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError("No se pudo acceder a la cámara. Por favor, revisa los permisos en tu navegador.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const currentSrc = canvas.toDataURL('image/jpeg', 0.9);

        if (mode === 'single') {
          setIsCaptured(true);
        } else if (mode === 'double') {
          if (doubleStep === 'front') {
            setFrontImageSrc(currentSrc);
            setDoubleStep('back');
            // La cámara sigue corriendo para tomar el reverso
          } else if (doubleStep === 'back') {
            setBackImageSrc(currentSrc);
            setDoubleStep('preview');
            combineImages(frontImageSrc!, currentSrc);
          }
        }
      }
    }
  };

  const combineImages = (frontSrc: string, backSrc: string) => {
    const hiddenCanvas = hiddenCanvasRef.current;
    if (!hiddenCanvas) return;
    
    const ctx = hiddenCanvas.getContext('2d');
    if (!ctx) return;

    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => {
      img2.onload = () => {
        // Asumimos que ambas fotos tienen el mismo tamaño (el de la cámara)
        const width = img1.width;
        const height = img1.height;
        
        // Creamos un canvas que es el doble de alto para poner una sobre la otra
        hiddenCanvas.width = width;
        hiddenCanvas.height = height * 2 + 20; // 20px de espacio entre ellas

        // Fondo blanco
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

        // Dibujamos el frente arriba
        ctx.drawImage(img1, 0, 0, width, height);
        // Dibujamos el reverso abajo (dejando 20px de espacio)
        ctx.drawImage(img2, 0, height + 20, width, height);

        setFinalImageSrc(hiddenCanvas.toDataURL('image/jpeg', 0.9));
      };
      img2.src = backSrc;
    };
    img1.src = frontSrc;
  };

  const confirmPhoto = () => {
    if (mode === 'single' && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.9);
    } else if (mode === 'double' && finalImageSrc) {
      // Convertir dataURL a File
      fetch(finalImageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `documento_doble_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        });
    }
  };

  const retakePhoto = () => {
    if (mode === 'single') {
      setIsCaptured(false);
    } else if (mode === 'double') {
      // Si estamos en preview, volvemos a capturar TODO desde cero
      setDoubleStep('front');
      setFrontImageSrc(null);
      setBackImageSrc(null);
      setFinalImageSrc(null);
    }
  };

  if (!isOpen) return null;

  // Condiciones para mostrar el video o el canvas
  const showVideo = mode === 'single' ? !isCaptured : doubleStep !== 'preview';
  const showSingleCanvas = mode === 'single' && isCaptured;
  const showDoublePreview = mode === 'double' && doubleStep === 'preview';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-600" />
              {title}
            </h3>
            {mode === 'double' && doubleStep !== 'preview' && (
              <span className="text-xs text-yellow-400 font-bold mt-1">
                {doubleStep === 'front' ? 'PASO 1: Toma el FRENTE del documento' : 'PASO 2: Toma el REVERSO del documento'}
              </span>
            )}
            {mode === 'double' && doubleStep === 'preview' && (
              <span className="text-xs text-red-500 font-bold mt-1">
                Frente y reverso combinados exitosamente
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-full p-1 ml-4 self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black flex-1 min-h-0 sm:aspect-[3/4] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : (
            <>
              {/* VIDEO EN VIVO */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${showVideo ? 'block' : 'hidden'}`}
              />
              
              {/* GUÍA VISUAL PARA DOCUMENTO */}
              {mode === 'double' && showVideo && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  
                  {/* Etiqueta FRENTE/REVERSO Arriba */}
                  <span className="mb-6 text-white font-black text-2xl uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,0,0,1)] bg-black/50 px-6 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
                    {doubleStep === 'front' ? 'FRENTE' : 'REVERSO'}
                  </span>

                  {/* Croquis SVG */}
                  <div className="w-full max-w-sm aspect-[1.6/1] relative flex items-center justify-center">
                    {doubleStep === 'front' ? (
                      // Croquis FRENTE
                      <svg viewBox="0 0 400 250" className="w-full h-full opacity-80 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Esquinas Amarillas */}
                        <path d="M 40,70 L 40,40 L 70,40" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 360,70 L 360,40 L 330,40" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 40,180 L 40,210 L 70,210" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 360,180 L 360,210 L 330,210" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Tarjeta Base */}
                        <rect x="50" y="50" width="300" height="190" rx="12" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="2" strokeDasharray="6 6"/>
                        
                        {/* Banda superior (roja en el ejemplo) */}
                        <rect x="50" y="50" width="300" height="25" fill="#EF4444" fillOpacity="0.8" style={{clipPath: "inset(0 0 0 0 round 12px 12px 0 0)"}}/>
                        
                        {/* Foto silueta */}
                        <rect x="70" y="90" width="60" height="80" fill="black" fillOpacity="0.6"/>
                        <circle cx="100" cy="115" r="14" fill="white" fillOpacity="0.9"/>
                        <path d="M 75,165 Q 100,135 125,165 Z" fill="white" fillOpacity="0.9"/>
                        
                        {/* Lineas de texto */}
                        <rect x="150" y="95" width="160" height="6" rx="3" fill="white" fillOpacity="0.8"/>
                        <rect x="150" y="115" width="130" height="6" rx="3" fill="white" fillOpacity="0.8"/>
                        <rect x="150" y="135" width="150" height="6" rx="3" fill="white" fillOpacity="0.8"/>
                        <rect x="150" y="155" width="90" height="6" rx="3" fill="white" fillOpacity="0.8"/>
                        <rect x="150" y="175" width="140" height="6" rx="3" fill="white" fillOpacity="0.8"/>
                        
                        {/* Círculo decorativo a la derecha */}
                        <circle cx="330" cy="145" r="10" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
                      </svg>
                    ) : (
                      // Croquis REVERSO
                      <svg viewBox="0 0 400 250" className="w-full h-full opacity-80 drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Esquinas Amarillas */}
                        <path d="M 40,70 L 40,40 L 70,40" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 360,70 L 360,40 L 330,40" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 40,180 L 40,210 L 70,210" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M 360,180 L 360,210 L 330,210" stroke="#FFC107" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                        
                        {/* Tarjeta Base */}
                        <rect x="50" y="50" width="300" height="190" rx="12" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="2" strokeDasharray="6 6"/>
                        
                        {/* Banda Magnética Negra */}
                        <rect x="50" y="70" width="300" height="35" fill="black" fillOpacity="0.8"/>
                        
                        {/* Chips / Bloques grises */}
                        <rect x="70" y="115" width="40" height="30" rx="4" fill="white" fillOpacity="0.6"/>
                        <rect x="120" y="115" width="50" height="15" rx="4" fill="white" fillOpacity="0.4"/>
                        <rect x="180" y="115" width="50" height="15" rx="4" fill="white" fillOpacity="0.4"/>
                        <rect x="240" y="115" width="50" height="15" rx="4" fill="white" fillOpacity="0.4"/>
                        <rect x="300" y="115" width="30" height="15" rx="4" fill="white" fillOpacity="0.4"/>
                        
                        {/* Código QR / Huella dactilar */}
                        <rect x="70" y="160" width="40" height="40" rx="4" fill="white" fillOpacity="0.6"/>
                        <rect x="75" y="165" width="12" height="12" fill="black" fillOpacity="0.5"/>
                        <rect x="93" y="165" width="12" height="12" fill="black" fillOpacity="0.5"/>
                        <rect x="75" y="183" width="12" height="12" fill="black" fillOpacity="0.5"/>
                        <rect x="93" y="183" width="12" height="12" fill="black" fillOpacity="0.5"/>
                        
                        {/* Bloques de código de barras (simulación) */}
                        <rect x="120" y="150" width="150" height="6" fill="white" fillOpacity="0.5"/>
                        <rect x="120" y="165" width="210" height="30" rx="4" fill="white" fillOpacity="0.3"/>
                        <line x1="130" y1="175" x2="320" y2="175" stroke="white" strokeWidth="3" strokeDasharray="4 2 8 3 2 5" strokeOpacity="0.8"/>
                        <line x1="130" y1="185" x2="320" y2="185" stroke="white" strokeWidth="3" strokeDasharray="2 5 3 2 6 2" strokeOpacity="0.8"/>
                      </svg>
                    )}
                  </div>
                  
                  <p className="mt-8 text-white text-xs text-center font-bold bg-black/60 px-6 py-2.5 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
                    Ubica el documento exactamente dentro del croquis
                  </p>
                </div>
              )}

              {/* CANVAS PARA MODO SINGLE */}
              <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-cover ${showSingleCanvas ? 'block' : 'hidden'}`}
              />

              {/* IMAGEN COMBINADA PARA MODO DOUBLE */}
              {showDoublePreview && finalImageSrc && (
                <div className="w-full h-full overflow-y-auto bg-zinc-900 p-4 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={finalImageSrc} alt="Preview" className="w-full max-w-sm h-auto object-contain rounded-md shadow-lg border border-zinc-700" />
                </div>
              )}

              {/* Canvas Oculto para combinar imágenes */}
              <canvas ref={hiddenCanvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 p-6 flex flex-col items-center justify-center gap-4 bg-zinc-900/90 border-t border-zinc-800 backdrop-blur-md">
          {!error && showVideo && (
            <button 
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400 flex items-center justify-center hover:bg-zinc-200 transition-colors active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-zinc-900 bg-white flex items-center justify-center">
                 {mode === 'double' && doubleStep === 'front' && <ArrowDown className="w-5 h-5 text-zinc-400" />}
                 {mode === 'double' && doubleStep === 'back' && <Check className="w-5 h-5 text-red-600" />}
              </div>
            </button>
          )}
          
          {(showSingleCanvas || showDoublePreview) && (
            <div className="flex items-center gap-4 w-full">
              <Button variant="outline" onClick={retakePhoto} className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 h-12 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" />
                {mode === 'double' ? 'Repetir Ambas' : 'Repetir'}
              </Button>
              <Button onClick={confirmPhoto} className="flex-1 bg-red-600 text-black hover:bg-red-500 h-12 font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <Check className="w-4 h-4 mr-2" />
                Usar {mode === 'double' ? 'Documento' : 'Foto'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
