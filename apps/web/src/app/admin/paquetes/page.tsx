'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Package, Trash2, Plus, X } from 'lucide-react';

interface CursoOpcion {
  id: string;
  titulo: string;
  precio: number;
}

interface Paquete {
  id: string;
  titulo: string;
  descripcion: string;
  cursoIds: string[];
  descuentoPorcentaje: number;
  activo: boolean;
  cursos: { id: string; titulo: string; precio: number }[];
  precioTotal: number;
  precioFinal: number;
}

export default function AdminPaquetesPage() {
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [cursos, setCursos] = useState<CursoOpcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [descuento, setDescuento] = useState('20');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [ps, cs] = await Promise.all([
        apiGet<Paquete[]>('/paquetes/admin/todos'),
        apiGet<{ cursos: CursoOpcion[] }>('/cursos?limit=100'),
      ]);
      setPaquetes(ps);
      setCursos(cs.cursos);
    } catch (error) {
      toast.error('Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const toggleCurso = (id: string) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || seleccionados.length < 2) {
      toast.error('Elegí al menos 2 cursos');
      return;
    }
    setGuardando(true);
    try {
      await apiPost('/paquetes', {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        cursoIds: seleccionados,
        descuentoPorcentaje: Number(descuento),
      });
      toast.success('Paquete creado');
      setTitulo('');
      setDescripcion('');
      setSeleccionados([]);
      setMostrarForm(false);
      await cargar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el paquete');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (id: string, activo: boolean) => {
    try {
      await apiPatch(`/paquetes/${id}/estado`, { activo });
      setPaquetes((prev) => prev.map((p) => (p.id === id ? { ...p, activo } : p)));
    } catch (error) {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este paquete?')) return;
    try {
      await apiDelete(`/paquetes/${id}`);
      toast.success('Paquete eliminado');
      setPaquetes((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-ink">Paquetes</h1>
        </div>
        <Button onClick={() => setMostrarForm((v) => !v)} size="sm">
          {mostrarForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mostrarForm ? 'Cancelar' : 'Nuevo paquete'}
        </Button>
      </div>

      {mostrarForm && (
        <form onSubmit={crear} className="card mb-6">
          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={200} required />
          <TextArea label="Descripción" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <Input
            label="Descuento (%)"
            type="number"
            min={1}
            max={90}
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-muted mb-1.5">
              Cursos incluidos ({seleccionados.length} seleccionados, mínimo 2)
            </label>
            <div className="max-h-56 overflow-y-auto border border-ink/[0.12] rounded-xl divide-y divide-ink/[0.06]">
              {cursos.map((c) => (
                <label key={c.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-cloud-50">
                  <input type="checkbox" checked={seleccionados.includes(c.id)} onChange={() => toggleCurso(c.id)} />
                  <span className="flex-1 text-sm text-ink">{c.titulo}</span>
                  <span className="text-xs text-ink-soft">${c.precio}</span>
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" isLoading={guardando} disabled={guardando} className="w-full">
            Crear paquete
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : paquetes.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">Todavía no creaste ningún paquete</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paquetes.map((p) => (
            <div key={p.id} className="card flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink">{p.titulo}</span>
                  <span className="text-xs font-bold text-white bg-accent px-1.5 py-0.5 rounded">
                    -{p.descuentoPorcentaje}%
                  </span>
                  {!p.activo && (
                    <span className="text-xs font-semibold text-ink-soft bg-ink/10 px-1.5 py-0.5 rounded">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-ink-soft mt-1">
                  {p.cursos.length} cursos · ${p.precioTotal} → ${p.precioFinal} USD
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <label className="flex items-center gap-1.5 text-xs text-ink-muted cursor-pointer">
                  <input type="checkbox" checked={p.activo} onChange={(e) => cambiarEstado(p.id, e.target.checked)} />
                  Activo
                </label>
                <button onClick={() => eliminar(p.id)} className="text-ink-soft hover:text-red-500" aria-label="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
