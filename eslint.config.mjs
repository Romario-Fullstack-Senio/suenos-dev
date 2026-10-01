// ESLint 9 (flat config) — reemplaza a los tres .eslintrc.json (raíz, apps/api,
// apps/web). Next 16 eliminó `next lint` y eslint-config-next 16 solo trae
// flat config, así que la configuración vive acá para todo el monorepo: tanto
// `npm run lint` en la raíz como `npm run lint -w apps/web` usan este archivo
// (ESLint lo busca subiendo desde el directorio actual, y los `files` se
// resuelven relativos a esta ubicación).
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    '**/coverage/**',
    '**/*.tsbuildinfo',
    '**/next-env.d.ts',
    'apps/api/temp-videos/**',
    'tests/screenshots/**',
    'playwright-report/**',
    'test-results/**',
    '.agents/**',
  ]),

  // Raíz, API, shared-kernel, e2e y scripts: mismo criterio que el viejo
  // .eslintrc.json de la raíz. apps/web queda afuera a propósito — antes era
  // `root: true` con solo next/core-web-vitals, y se mantiene igual abajo.
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: ['apps/web/**'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['apps/web/**'],
    extends: [tseslint.configs.recommended],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // tests/load-test.js no corre en Node sino dentro del runtime de k6,
    // que inyecta sus propios globales (__ENV con las variables de
    // entorno, __VU, __ITER). Sin declararlos acá, `eslint .` marcaba
    // "__ENV is not defined" como ERROR y tumbaba el job de lint de
    // build-and-push.yml — y con él la publicación de imagen y el deploy.
    files: ['tests/load-test.js'],
    languageOptions: {
      globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly' },
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  // Web: las reglas de Next (core web vitals), igual que antes.
  {
    files: ['apps/web/**/*.{js,jsx,mjs,ts,tsx}'],
    extends: [nextCoreWebVitals],
    settings: { next: { rootDir: 'apps/web' } },
    rules: {
      // Reglas nuevas de eslint-plugin-react-hooks 7 (vino con
      // eslint-config-next 16), pensadas para React Compiler. Marcan el
      // patrón "fetch en useEffect + setState" y el "latest ref" que usa
      // toda la app desde antes — no son bugs. En warning para que se vean
      // sin bloquear CI; pasarlas a error es un refactor aparte (mover el
      // data fetching a Server Components / una lib de datos).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
]);
