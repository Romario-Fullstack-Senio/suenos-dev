'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

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
      <div className="min-h-screen bg-suenos-deep flex items-center justify-center">
        <p className="text-suenos-muted">Cargando certificados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-suenos-deep p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-suenos-text mb-8">Mis Certificados</h1>

        {certificados.length === 0 ? (
          <div className="bg-suenos-surface rounded-xl shadow-sm p-8 text-center">
            <p className="text-suenos-muted">
              Aun no tienes certificados. Completa un curso para obtener uno.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {certificados.map(cert => (
              <div
                key={cert.id}
                className="bg-suenos-surface rounded-xl shadow-sm p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-suenos-text">{cert.cursoNombre}</h3>
                    <p className="text-sm text-suenos-muted mt-1">
                      Emitido: {new Date(cert.fechaEmision).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-suenos-dim mt-2">
                      Codigo: {cert.codigoVerificacion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/api/certificados/${cert.id}/pdf`, '_blank')}
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
