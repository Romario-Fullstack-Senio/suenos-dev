'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    try {
      const data = await apiGet<Usuario[]>('/usuarios');
      setUsuarios(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCambiarRol = async (userId: string, nuevoRol: string) => {
    try {
      await apiPut(`/usuarios/${userId}/rol`, { rol: nuevoRol });
      fetchUsuarios();
    } catch (error) {
      toast.error('Error al cambiar rol');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestionar Usuarios</h1>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-suenos-surface rounded-xl shadow-sm border border-suenos-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-suenos-deep">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-suenos-muted">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-suenos-muted">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-suenos-muted">Rol</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-suenos-muted">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-suenos-border border-suenos-border">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-6 py-4">{usuario.nombre}</td>
                  <td className="px-6 py-4">{usuario.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={usuario.rol}
                      onChange={(e) => handleCambiarRol(usuario.id, e.target.value)}
                      className="border border-suenos-border rounded px-2 py-1 text-sm"
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">Ver</Button>
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
