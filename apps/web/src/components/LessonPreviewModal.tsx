'use client';

import { X } from 'lucide-react';
import HLSPlayer from './HLSPlayer';

interface LessonPreviewModalProps {
  titulo: string;
  videoUrl: string;
  onClose: () => void;
}

export function LessonPreviewModal({ titulo, videoUrl, onClose }: LessonPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-cloud-50 rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-ink truncate pr-4">{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-soft hover:text-ink flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <HLSPlayer src={videoUrl} />
        <p className="text-xs text-ink-soft text-center">Vista previa gratuita — comprá el curso para ver todo el contenido</p>
      </div>
    </div>
  );
}
