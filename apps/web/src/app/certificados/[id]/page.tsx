export default function CertificadoPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-suenos-surface rounded-xl p-8 shadow-sm border border-suenos-border text-center">
        <h1 className="text-3xl font-bold mb-2">Certificado Verificado</h1>
        <p className="text-suenos-muted mb-6">ID: {params.id}</p>
        <div className="border-2 border-suenos-violet rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-suenos-violet-light mb-2">Suenos Dev</h2>
          <p className="text-lg mb-1">Certifica que</p>
          <p className="text-xl font-semibold mb-1">[Nombre del Estudiante]</p>
          <p className="text-suenos-muted mb-4">ha completado exitosamente el curso</p>
          <p className="text-xl font-semibold text-suenos-violet-light mb-4">[Nombre del Curso]</p>
          <p className="text-sm text-suenos-muted">Fecha de emision: [Fecha]</p>
          <p className="text-sm text-suenos-muted">Codigo de verificacion: [Codigo]</p>
        </div>
        <a href="#" className="text-suenos-violet-light underline">Agregar a LinkedIn Profile</a>
      </div>
    </div>
  );
}
