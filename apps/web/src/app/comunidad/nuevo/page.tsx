'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const CATEGORIAS = [
  { value: 'general', label: 'General' },
  { value: 'ayuda', label: 'Ayuda' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'sugerencias', label: 'Sugerencias' },
];

export default function NuevoTemaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const publicar = async () => {
    if (!titulo.trim() || !texto.trim()) {
      toast.error('Completá el título y el mensaje');
      return;
    }
    setEnviando(true);
    try {
      const tema = await apiPost<{ id: string }>('/foro/temas', { titulo, categoria, texto });
      toast.success('Tema publicado');
      router.push(`/comunidad/${tema.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar el tema');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-ink">Nuevo tema</h1>

      <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
        <Input label="Título" placeholder="¿De qué querés hablar?" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

        <label className="block text-sm font-semibold text-ink-muted mb-1">Categoría</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <label className="block text-sm font-semibold text-ink-muted mb-1">Mensaje</label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="Contá tu duda, tu proyecto, o lo que quieras compartir..."
          className="w-full px-3 py-2 bg-cloud-50 text-ink border border-ink/[0.12] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-4"
        />

        <Button onClick={publicar} isLoading={enviando} disabled={enviando}>
          Publicar tema
        </Button>
      </div>
    </div>
  );
}
