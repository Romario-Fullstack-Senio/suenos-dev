'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  src: string;
}

export default function HLSPlayer({ src }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // El endpoint de video ahora exige acceso (vista previa gratuita,
        // inscripción, o dueño/admin) — este header autentica tanto el
        // manifest como cada segmento .ts que hls.js pida.
        xhrSetup: (xhr) => {
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        },
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari (HLS nativo) no manda headers custom — el token va como
      // query param; el backend reescribe el manifest para que cada
      // segmento también lo lleve (ver VideoController#serveHls).
      video.src = token ? `${src}${src.includes('?') ? '&' : '?'}token=${token}` : src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }
  }, [src]);

  return (
    <div className="bg-black aspect-video rounded-xl overflow-hidden mb-6">
      <video ref={videoRef} className="w-full h-full" controls />
    </div>
  );
}
