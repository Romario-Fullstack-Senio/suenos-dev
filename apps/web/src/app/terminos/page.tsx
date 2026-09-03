import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma Sueños Dev.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2 text-ink">Términos y Condiciones</h1>
      <p className="text-ink-soft text-sm mb-8">Última actualización: septiembre de 2026</p>

      <div className="space-y-8 text-ink-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">1. Aceptación de los términos</h2>
          <p>
            Al registrarte y usar Sueños Dev (&quot;la Plataforma&quot;) aceptás estos Términos y Condiciones.
            Si no estás de acuerdo, no debés usar la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">2. Qué ofrecemos</h2>
          <p>
            Sueños Dev es una plataforma de e-learning que permite a instructores publicar cursos en
            video y a estudiantes comprarlos, verlos, rendir evaluaciones y obtener certificados
            verificables de finalización.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">3. Cuentas</h2>
          <p>
            Sos responsable de mantener la confidencialidad de tu contraseña y de toda actividad que
            ocurra bajo tu cuenta. Debés darnos información verdadera al registrarte. Podés autenticarte
            con email/contraseña o a través de proveedores externos (Google, GitHub).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">4. Compras y pagos</h2>
          <p>
            Los pagos se procesan a través de Stripe. Al comprar un curso obtenés una licencia personal,
            no transferible, para acceder a su contenido mientras tu cuenta esté activa. No está permitido
            compartir el acceso ni redistribuir el contenido de los cursos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">5. Reembolsos</h2>
          <p>
            Podés solicitar el reembolso de una compra dentro de los 7 días posteriores a la compra desde
            &quot;Mis Compras&quot; en tu panel. Pasado ese plazo, contactá a soporte — los reembolsos fuera de la
            ventana automática quedan a criterio de la administración. Al procesarse un reembolso perdés
            el acceso al curso correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">6. Contenido de instructores</h2>
          <p>
            Los instructores son responsables del contenido que publican y garantizan tener los derechos
            necesarios sobre el material que suben (videos, textos, evaluaciones). Sueños Dev puede retirar
            contenido que infrinja derechos de terceros o estos Términos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">7. Uso aceptable</h2>
          <p>
            No está permitido: descargar o redistribuir videos de los cursos, intentar vulnerar las
            protecciones de acceso al contenido, compartir credenciales de cuenta, ni usar la Plataforma
            para fines ilegales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">8. Cambios</h2>
          <p>
            Podemos actualizar estos Términos ocasionalmente. Los cambios importantes se notificarán por
            email o mediante un aviso en la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">9. Contacto</h2>
          <p>Ante cualquier consulta sobre estos Términos, contactá a soporte desde tu panel de usuario.</p>
        </section>
      </div>
    </div>
  );
}
