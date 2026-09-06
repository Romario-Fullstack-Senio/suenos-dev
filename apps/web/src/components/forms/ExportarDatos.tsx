'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

export function ExportarDatos() {
  const [descargando, setDescargando] = useState(false);

  const exportar = async () => {
    setDescargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/usuarios/me/exportar`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('No se pudieron exportar los datos');

      // El backend ya manda Content-Disposition: attachment, pero eso solo
      // funciona en una navegación de página completa — como esto es un
      // fetch (necesario para mandar el Bearer token), armamos la descarga
      // a mano con un <a> temporal sobre un blob: URL.
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mis-datos-suenos-dev.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Tus datos se descargaron correctamente');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron exportar los datos');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
      <div className="flex items-center gap-2 mb-1">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-ink">Exportar mis datos</h3>
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Descargá un archivo con tu perfil, inscripciones, certificados, compras, reseñas, preguntas, favoritos y
        tickets de soporte.
      </p>
      <Button variant="ghost" onClick={exportar} isLoading={descargando} disabled={descargando}>
        Descargar mis datos (JSON)
      </Button>
    </div>
  );
}
