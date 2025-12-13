import React, { useEffect, useRef } from 'react';
import { initGestureRecognition, stopGestureRecognition } from '../services/gestureService';

export const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 320, 
              height: 240,
              frameRate: { ideal: 30 }
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
                if(videoRef.current) initGestureRecognition(videoRef.current);
            });
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
        }
      }
    };

    startCamera();

    return () => {
      stopGestureRecognition();
    };
  }, []);

  return (
    <div className="absolute top-4 left-4 z-50 border-2 border-[#D4AF37] rounded-lg overflow-hidden shadow-[0_0_15px_#D4AF37] w-40 h-32 opacity-80 hover:opacity-100 transition-opacity">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover transform scale-x-[-1]" 
      />
      <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center text-[#D4AF37] p-1">
        GESTURE INPUT
      </div>
    </div>
  );
};