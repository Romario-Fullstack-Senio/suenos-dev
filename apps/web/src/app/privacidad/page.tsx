import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo Sueños Dev recolecta, usa y protege tus datos personales.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 text-ink">Política de Privacidad</h1>
      <p className="text-ink-soft text-sm mb-8">Última actualización: septiembre de 2026</p>

      <div className="space-y-8 text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">1. Qué datos recolectamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Datos de cuenta: nombre, email, contraseña (hasheada, nunca en texto plano).</li>
            <li>Datos de uso: progreso en cursos, resultados de evaluaciones, certificados emitidos.</li>
            <li>Datos de pago: procesados directamente por Stripe — nosotros no almacenamos números de tarjeta.</li>
            <li>Si iniciás sesión con Google o GitHub, recibimos tu nombre y email públicos de esos proveedores.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">2. Para qué usamos tus datos</h2>
          <p>
            Para darte acceso a los cursos que comprás, emitir certificados, procesar pagos y reembolsos,
            enviarte emails transaccionales (confirmación de compra, verificación de cuenta, recuperación
            de contraseña) y mejorar la Plataforma. No vendemos tus datos a terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">3. Cookies</h2>
          <p>
            Usamos cookies técnicas necesarias para mantener tu sesión iniciada y proteger las rutas de tu
            cuenta — no usamos cookies de rastreo publicitario. Podés ver el detalle en el banner de
            cookies que aparece en tu primera visita.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">4. Con quién compartimos datos</h2>
          <p>
            Compartimos datos con proveedores que operan la Plataforma en nuestro nombre: Stripe (pagos),
            proveedores de email transaccional, y almacenamiento de archivos (videos e imágenes de curso).
            Todos están obligados contractualmente a proteger tus datos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">5. Tus derechos</h2>
          <p>
            Podés acceder, corregir o eliminar tus datos personales, y solicitar una copia de tu
            información contactando a soporte desde tu panel. Podés cerrar tu cuenta en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">6. Seguridad</h2>
          <p>
            Las contraseñas se almacenan con hash (bcrypt), las sesiones usan tokens de acceso de vida
            corta con renovación segura, y las comunicaciones viajan cifradas (HTTPS).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">7. Contacto</h2>
          <p>Para cualquier consulta sobre privacidad, contactá a soporte desde tu panel de usuario.</p>
        </section>
      </div>
    </div>
  );
}
