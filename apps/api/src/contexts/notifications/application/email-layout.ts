/**
 * Layout compartido de todos los emails transaccionales — antes cada
 * handler tenía su propia copia pegada del mismo <!DOCTYPE html>...</html>
 * (6 copias casi idénticas, una con degradé verde suelto que ni siquiera
 * está en la paleta del sitio). Un solo lugar ahora define:
 *
 * - La marca real: el mismo degradé índigo→violeta y la marca "nube" del
 *   Header.tsx del sitio, tipografías Space Grotesk/Inter (con fallback a
 *   system-ui donde el cliente de correo no cargue Google Fonts).
 * - Modo oscuro real vía `prefers-color-scheme` — los clientes que lo
 *   soportan (Apple Mail, iOS Mail, Outlook Mac/iOS) muestran el email en
 *   la paleta oscura del sitio (--suenos-midnight/deep) en vez de quedar
 *   pegados en blanco; el resto cae al tema claro vía los estilos inline.
 * - Responsive real: la tabla de 600px se angosta con `max-width:100%` y
 *   los paddings bajan con una media query en pantallas chicas, en vez de
 *   desbordar el viewport de un teléfono.
 * - Texto de preheader (el resumen que se ve en la bandeja de entrada
 *   antes de abrir el correo) — ninguno de los templates anteriores lo
 *   tenía.
 */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500;600&display=swap');";

interface EmailLayoutOptions {
  /** Texto oculto que los clientes de correo muestran como preview en la bandeja de entrada. */
  preheader: string;
  /** Texto chico debajo de "Sueños Dev" en el header (opcional). */
  headerSubtitle?: string;
  /** Contenido del cuerpo — usar las clases email-heading/email-text/email-muted para que respeten el modo oscuro. */
  bodyHtml: string;
}

export function renderEmailLayout({ preheader, headerSubtitle, bodyHtml }: EmailLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="es" style="color-scheme: light dark; supported-color-schemes: light dark;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title></title>
<style>
  ${FONT_IMPORT}
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
  body { margin:0; padding:0; width:100% !important; }
  .email-bg { background-color:#f1f2f9; }
  .email-card { background-color:#ffffff; }
  .email-heading { color:#14162b; }
  .email-text { color:#5a5d78; }
  .email-muted { color:#9a9db2; }
  .email-border { border-color:#eceffb !important; }
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color:#0b0e1a !important; }
    .email-card { background-color:#111631 !important; }
    .email-heading { color:#f1f5f9 !important; }
    .email-text { color:#cbd5e1 !important; }
    .email-muted { color:#94a3b8 !important; }
    .email-border { border-color:#252b4a !important; }
  }
  @media only screen and (max-width:600px) {
    .email-container { width:100% !important; }
    .email-px { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body class="email-bg" style="margin:0;padding:0;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="width:600px;max-width:100%;">
          <tr>
            <td class="email-card" style="border-radius:16px;overflow:hidden;box-shadow:0 20px 40px -28px rgba(20,22,43,0.4);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="email-px" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding-right:10px;" valign="middle">
                          <table role="presentation" width="38" cellpadding="0" cellspacing="0" style="background-color:rgba(255,255,255,0.2);border-radius:19px;">
                            <tr><td width="38" height="38" align="center" valign="middle" style="font-size:17px;line-height:38px;">☁️</td></tr>
                          </table>
                        </td>
                        <td valign="middle" style="font-family:'Space Grotesk',Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.01em;">
                          Sueños Dev
                        </td>
                      </tr>
                    </table>
                    ${headerSubtitle ? `<p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:14px;font-family:'Inter',Arial,sans-serif;">${headerSubtitle}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td class="email-px" style="padding:40px;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td class="email-card email-border email-px" style="padding:24px 40px;border-top:1px solid;">
                    <p class="email-muted" style="margin:0;font-size:12px;text-align:center;line-height:1.6;">
                      © 2026 Sueños Dev — Plataforma de E-Learning<br>
                      Este es un correo automático, por favor no lo respondas.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Botón CTA — mismo degradé y forma que .btn-primary del sitio (globals.css). */
export function emailButton(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td align="center">
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;font-family:'Inter',Arial,sans-serif;box-shadow:0 14px 28px -14px rgba(99,102,241,0.6);">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

/** Tarjeta destacada (curso comprado, certificado, curso nuevo) — respeta modo oscuro. */
export function emailInfoCard(opts: { eyebrow: string; title: string; detail?: string; accent?: string }): string {
  const accent = opts.accent ?? '#6366f1';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card email-border" style="border:1px solid;margin-bottom:24px;border-radius:12px;">
  <tr>
    <td style="padding:22px 24px;">
      <p class="email-muted" style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;font-family:'Inter',Arial,sans-serif;">${opts.eyebrow}</p>
      <p class="email-heading" style="margin:0 0 8px;font-size:18px;font-weight:700;font-family:'Space Grotesk',Arial,sans-serif;">${opts.title}</p>
      ${opts.detail ? `<p style="margin:0;font-size:16px;font-weight:700;color:${accent};font-family:'Inter',Arial,sans-serif;">${opts.detail}</p>` : ''}
    </td>
  </tr>
</table>`;
}
