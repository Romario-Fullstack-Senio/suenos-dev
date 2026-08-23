'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  onProgress?: (percent: number) => void;
}

export default function VideoPlayer({ src, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      video.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full aspect-video rounded-xl"
      onTimeUpdate={() => {
        const video = videoRef.current;
        if (video && onProgress) {
          const percent = Math.round((video.currentTime / video.duration) * 100);
          onProgress(percent);
        }
      }}
    />
  );
}
