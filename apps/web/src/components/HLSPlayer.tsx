'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  src: string;
  subtitulosUrl?: string;
}

export default function HLSPlayer({ src, subtitulosUrl }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  // <track> no manda headers custom — igual que el fallback de Safari para
  // el manifest HLS, el token va como query param (VideoController#serveSubtitulos
  // acepta ambos: header Authorization o ?token=).
  const subtitulosSrc = subtitulosUrl && token
    ? `${subtitulosUrl}${subtitulosUrl.includes('?') ? '&' : '?'}token=${token}`
    : subtitulosUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

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
      <video ref={videoRef} className="w-full h-full" controls crossOrigin={subtitulosSrc ? 'anonymous' : undefined}>
        {subtitulosSrc && (
          <track kind="subtitles" src={subtitulosSrc} srcLang="es" label="Español" default />
        )}
      </video>
    </div>
  );
}
