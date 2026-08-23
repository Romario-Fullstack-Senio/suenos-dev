export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Convierte tus suenos en codigo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Cursos de desarrollo web con proyectos reales, videos en streaming y certificados verificables.
        </p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Cursos en Video', desc: 'Aprende con proyectos practicos y videos en alta calidad.' },
          { title: 'Progreso Guardado', desc: 'Tu avance se guarda automaticamente. Continua donde lo dejaste.' },
          { title: 'Certificado Verificable', desc: 'Obten un certificado PDF con codigo de verificacion unico.' },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-8 shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
            <p className="text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
