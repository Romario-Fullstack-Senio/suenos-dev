import { test as base, expect } from '@playwright/test';

// Cada test de Playwright arranca con un contexto de navegador limpio (sin
// localStorage) — eso significa que CookieConsent SIEMPRE se muestra al
// entrar, un banner fijo (z-40, bottom-0) que en la práctica termina
// interceptando el click de botones cercanos al pie de la pantalla
// (confirmado corriendo la suite: el submit de login/registro fallaba
// silenciosamente contra el banner en vez del botón real). Precargar el
// mismo localStorage key que usa CookieConsent evita el banner sin tener
// que clickear "Entendido" en cada test.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('cookie_consent', 'accepted');
      } catch {
        // Igual que el propio componente: si localStorage no está
        // disponible, no hay nada que precargar.
      }
    });
    await use(context);
  },
});

export { expect };
