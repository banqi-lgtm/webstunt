'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  isDeportista?: boolean;
}

export function CameraModal({ isOpen, onClose, onCapture, title = "Tomar Foto", isDeportista = false }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isCaptured, setIsCaptured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

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
        setIsCaptured(true);
      }
    }
  };

  const confirmPhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const retakePhoto = () => {
    setIsCaptured(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
            <Camera className="w-4 h-4 text-green-500" />
            {title}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black flex-1 min-h-0 sm:aspect-[3/4] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-400 text-sm">{error}</div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isCaptured ? 'hidden' : 'block'}`}
              />
              <canvas 
                ref={canvasRef} 
                className={`w-full h-full object-cover ${isCaptured ? 'block' : 'hidden'}`}
              />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 p-6 flex items-center justify-center gap-4 bg-zinc-900/90 border-t border-zinc-800 backdrop-blur-md">
          {!error && !isCaptured && (
            <button 
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-zinc-400 flex items-center justify-center hover:bg-zinc-200 transition-colors active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-zinc-900 bg-white"></div>
            </button>
          )}
          
          {isCaptured && (
            <div className="flex items-center gap-4 w-full">
              <Button variant="outline" onClick={retakePhoto} className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 h-12 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" />
                Repetir
              </Button>
              <Button onClick={confirmPhoto} className="flex-1 bg-green-500 text-black hover:bg-green-400 h-12 font-bold rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <Check className="w-4 h-4 mr-2" />
                Usar Foto
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
