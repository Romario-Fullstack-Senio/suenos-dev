// Prueba de carga con k6 — apunta al stack de preprod real (o local con
// BASE_URL) y simula usuarios concurrentes recorriendo el catálogo.
//
// Correr contra preprod, desde el servidor mismo (los puertos son solo
// 127.0.0.1) o con un túnel SSH abierto:
//   docker run --rm -i --network host -e BASE_URL=http://127.0.0.1:3101/api \
//     grafana/k6 run - < tests/load-test.js
//
// Correr contra dev local:
//   docker run --rm -i -e BASE_URL=http://host.docker.internal:3001/api \
//     grafana/k6 run - < tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3101/api';

export const options = {
  scenarios: {
    // Sube gradual a 50 usuarios concurrentes, sostiene, y baja — para ver
    // en qué punto empiezan a aparecer errores o la latencia se dispara,
    // no solo el peor caso de golpe.
    ramping: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // menos de 1% de requests fallidos
    http_req_duration: ['p(95)<800'], // 95% de las requests bajo 800ms
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/health`.replace('/api/health', '/health'));
  check(health, { 'health 200': (r) => r.status === 200 });

  const cursos = http.get(`${BASE_URL}/cursos?page=1&limit=12`);
  check(cursos, {
    'cursos 200': (r) => r.status === 200,
    'cursos trae body': (r) => r.body && r.body.length > 0,
  });

  sleep(Math.random() * 2 + 0.5); // pausa entre 0.5s y 2.5s, como un usuario real
}
