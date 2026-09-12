'use client';

import { useState, useEffect } from 'react';
import { apiGet, API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Award } from 'lucide-react';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { SkeletonList } from '@/components/ui/SkeletonGrid';
import { formatearFecha } from '@/lib/format';

interface Certificado {
  id: string;
  cursoId: string;
  cursoNombre: string;
  fechaEmision: string;
  codigoVerificacion: string;
  linkedinAddToProfile: string;
}

export default function CertificadosPage() {
  const { user } = useAuth();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCertificados();
    }
  }, [user]);

  async function loadCertificados() {
    try {
      const data = await apiGet(`/certificados/estudiante/${user?.id}`) as Certificado[];
      setCertificados(data);
    } catch (error) {
      console.error('Error loading certificados:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cloud-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-ink mb-8">Mis Certificados</h1>
          <SkeletonList cantidad={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-8">Mis Certificados</h1>

        {certificados.length === 0 ? (
          <EstadoVacio
            icono={Award}
            titulo="Todavía no tenés certificados"
            texto="Completá un curso para obtener tu primer certificado verificable."
            cta={{ href: '/dashboard', label: 'Ir a mis cursos' }}
          />
        ) : (
          <div className="grid gap-4">
            {certificados.map(cert => (
              <div
                key={cert.id}
                className="card"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-ink">{cert.cursoNombre}</h3>
                    <p className="text-sm text-ink-muted mt-1">
                      Emitido: {formatearFecha(cert.fechaEmision)}
                    </p>
                    <p className="text-xs text-ink-soft mt-2 font-mono">
                      Código: {cert.codigoVerificacion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`${API_URL}/certificados/${cert.id}/pdf`, '_blank')}
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(cert.linkedinAddToProfile, '_blank')}
                    >
                      Agregar a LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
