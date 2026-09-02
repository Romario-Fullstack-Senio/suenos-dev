interface Modulo {
  id: string;
  titulo: string;
  lecciones: { id: string; titulo: string }[];
}

interface ModuleSidebarProps {
  modulos: Modulo[];
  leccionActualId: string;
  onSelectLeccion: (leccionId: string) => void;
}

export default function ModuleSidebar({ modulos, leccionActualId, onSelectLeccion }: ModuleSidebarProps) {
  return (
    <aside className="bg-suenos-surface rounded-xl p-6 shadow-sm border border-suenos-border">
      <h2 className="text-lg font-semibold mb-4">Contenido del Curso</h2>
      <ul className="space-y-4">
        {modulos.map((modulo) => (
          <li key={modulo.id}>
            <p className="font-medium text-sm mb-2">{modulo.titulo}</p>
            <ul className="ml-4 space-y-1">
              {modulo.lecciones.map((leccion) => (
                <li key={leccion.id}>
                  <button
                    onClick={() => onSelectLeccion(leccion.id)}
                    className={`text-sm ${leccion.id === leccionActualId ? 'text-suenos-violet-light font-medium' : 'text-suenos-muted hover:text-suenos-violet-light'}`}
                  >
                    {leccion.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}
