'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Cupon {
  id: string;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  activo: boolean;
  cursoId?: string | null;
  fechaExpiracion?: string | null;
  usosMaximos?: number | null;
  usosActuales: number;
}

interface NuevoCuponForm {
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: string;
  cursoId: string;
  fechaExpiracion: string;
  usosMaximos: string;
}

const FORM_INICIAL: NuevoCuponForm = {
  codigo: '',
  tipo: 'porcentaje',
  valor: '',
  cursoId: '',
  fechaExpiracion: '',
  usosMaximos: '',
};

export default function AdminCuponesPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<NuevoCuponForm>(FORM_INICIAL);

  const fetchCupones = async () => {
    try {
      const data = await apiGet<Cupon[]>('/cupones');
      setCupones(data);
    } catch (error) {
      toast.error('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCupones();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.valor) {
      toast.error('Completa código y valor');
      return;
    }
    setCreando(true);
    try {
      await apiPost('/cupones', {
        codigo: form.codigo.trim(),
        tipo: form.tipo,
        valor: Number(form.valor),
        cursoId: form.cursoId.trim() || undefined,
        fechaExpiracion: form.fechaExpiracion || undefined,
        usosMaximos: form.usosMaximos ? Number(form.usosMaximos) : undefined,
      });
      toast.success('Cupón creado correctamente');
      setForm(FORM_INICIAL);
      fetchCupones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear cupón');
    } finally {
      setCreando(false);
    }
  };

  const handleDesactivar = async (id: string) => {
    try {
      await apiDelete(`/cupones/${id}`);
      toast.success('Cupón desactivado');
      fetchCupones();
    } catch (error) {
      toast.error('Error al desactivar cupón');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-ink">Gestionar Cupones</h1>

      <form onSubmit={handleCrear} className="card mb-8 grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <Input
          label="Código"
          placeholder="Ej: BIENVENIDA10"
          value={form.codigo}
          onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
        />
        <Select
          label="Tipo de descuento"
          value={form.tipo}
          onChange={e => setForm({ ...form, tipo: e.target.value as NuevoCuponForm['tipo'] })}
          options={[
            { value: 'porcentaje', label: 'Porcentaje (%)' },
            { value: 'monto_fijo', label: 'Monto fijo (USD)' },
          ]}
        />
        <Input
          label={form.tipo === 'porcentaje' ? 'Valor (%)' : 'Valor (USD)'}
          type="number"
          step="0.01"
          placeholder={form.tipo === 'porcentaje' ? '10' : '5.00'}
          value={form.valor}
          onChange={e => setForm({ ...form, valor: e.target.value })}
        />
        <Input
          label="ID de curso (opcional — vacío = aplica a todos)"
          placeholder="Dejar vacío para cupón global"
          value={form.cursoId}
          onChange={e => setForm({ ...form, cursoId: e.target.value })}
        />
        <Input
          label="Fecha de expiración (opcional)"
          type="date"
          value={form.fechaExpiracion}
          onChange={e => setForm({ ...form, fechaExpiracion: e.target.value })}
        />
        <Input
          label="Usos máximos (opcional)"
          type="number"
          placeholder="Ilimitado"
          value={form.usosMaximos}
          onChange={e => setForm({ ...form, usosMaximos: e.target.value })}
        />
        <div className="md:col-span-2">
          <Button type="submit" isLoading={creando} disabled={creando}>
            Crear Cupón
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : cupones.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-ink-muted">No hay cupones creados todavía</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-cloud-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Código</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Descuento</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Alcance</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Usos</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-ink-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {cupones.map((cupon) => (
                <tr key={cupon.id}>
                  <td className="px-6 py-4 font-semibold text-ink">{cupon.codigo}</td>
                  <td className="px-6 py-4 text-ink-muted">
                    {cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `$${cupon.valor} USD`}
                  </td>
                  <td className="px-6 py-4 text-ink-muted text-sm">
                    {cupon.cursoId ? `Curso ${cupon.cursoId.slice(0, 8)}…` : 'Todos los cursos'}
                  </td>
                  <td className="px-6 py-4 text-ink-muted text-sm">
                    {cupon.usosActuales}{cupon.usosMaximos ? ` / ${cupon.usosMaximos}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cupon.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {cupon.activo && (
                      <Button variant="ghost" size="sm" onClick={() => handleDesactivar(cupon.id)}>
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
