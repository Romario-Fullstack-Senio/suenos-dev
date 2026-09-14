'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  src: string;
  subtitulosUrl?: string;
  // Reporta la posición real de reproducción (no un contador simulado) para
  // que el progreso del estudiante se registre con datos reales.
  onProgress?: (currentTime: number, duration: number) => void;
  // Se dispara cuando el video termina — permite marcar la lección como
  // completada al instante, sin esperar al próximo tick periódico.
  onEnded?: () => void;
}

export default function HLSPlayer({ src, subtitulosUrl, onProgress, onEnded }: HLSPlayerProps) {
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
        // Pausar y desacoplar el <video> ANTES de destruir hls.js: si se
        // llama a destroy() mientras el video todavía tiene una descarga o
        // un play() en curso, el navegador aborta ese fetch y lo reporta
        // como una promesa rechazada sin capturar (AbortError: "The
        // fetching process for the media resource was aborted..."), que
        // en dev Next.js muestra como error fatal aunque es inofensivo.
        video.pause();
        hls.detachMedia();
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

  // Listeners aparte del efecto de arriba (que reconstruye el hls.js) para
  // no reenganchar el player entero cada vez que el padre re-renderiza y
  // pasa un onProgress/onEnded nuevo — usamos refs para leer siempre la
  // versión más reciente de los callbacks sin que sean dependencias.
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  onProgressRef.current = onProgress;
  onEndedRef.current = onEnded;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && isFinite(video.duration)) {
        onProgressRef.current?.(video.currentTime, video.duration);
      }
    };
    const handleEnded = () => {
      onEndedRef.current?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
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
