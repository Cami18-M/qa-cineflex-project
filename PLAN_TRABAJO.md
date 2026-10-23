# Plan de Trabajo — Taller QA en Producción (CineFlex)

> Equipo de 4 integrantes trabajando desde un único computador y un único
> repositorio. Este documento define responsabilidades, archivos, dependencias,
> orden de implementación, lista de verificación y actividades de sustentación.

## 1. Distribución de responsabilidades

| Integrante | Rol | Responsabilidad | Archivos que le corresponden |
|---|---|---|---|
| **Integrante 1** | Backend | Backend mock y endpoints REST (Express, Helmet, Morgan, JWT, pasarela simulada) | `backend/server.js`, `backend/package.json`, `backend/.env.example`, `CONTRATO_API.md` |
| **Integrante 2** | Frontend + UI | Frontend HTML/CSS, integración con la API, Selenium WebDriver y patrón POM | `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`, `ui_tests/pages/*`, `ui_tests/test_suite.js`, `ui_tests/package.json` |
| **Integrante 3** | API + Performance | Postman/Newman y Apache JMeter | `api_tests/CineFlex_API_Collection.json`, `api_tests/CineFlex_Environment.json`, `performance/prueba_carga.jmx` |
| **Integrante 4** | QA/Docs/CI | Estrategia de pruebas, GitHub Actions, documentación e integración final | `estrategia_pruebas.pdf`, `.github/workflows/qa-pipeline.yml`, `README.md`, `GUIA_GIT_EQUIPO.md`, `INFORME_VALIDACION.md` |

## 2. Dependencias entre módulos

```
CONTRATO_API.md
      │
      ▼
backend (API REST) ──────┬──────────────► api_tests (Postman/Newman)
      │                  │                      │
      │                  ▼                      ▼
      │            frontend (HTML/CSS)    ejecución en CI
      │                  │              (GitHub Actions)
      │                  ▼
      │            ui_tests (Selenium/POM)
      │
      └────────────► performance (JMeter)
```

- El **contrato** define cómo se comunican backend y frontend.
- El **frontend** consume los endpoints reales del backend.
- **Selenium** automatiza el frontend (que a su vez consume el backend).
- **Newman** automatiza la API directamente y se integra en el pipeline de CI.
- **JMeter** hace carga sobre el endpoint de asientos del backend.

## 3. Orden de implementación

1. Estructura base + `.gitignore` + `CONTRATO_API.md`.
2. Backend mock (`server.js` + dependencias) y verificación manual de endpoints.
3. Colección Postman + entorno y validación con Newman.
4. Frontend HTML/CSS/JS consumiendo la API real.
5. Selenium WebDriver con POM y mínimo 15 casos de prueba.
6. `prueba_carga.jmx` (JMeter) y documentación de rendimiento.
7. Pipeline de GitHub Actions con Newman.
8. PDF de estrategia, README, guías, informe de validación y guion del video.

## 4. Lista de verificación de tareas

- [x] Leer `Taller.html` y verificar el entorno (Node, npm, Git, navegador, WebDriver, Postman/Newman, JMeter).
- [x] Backend funcional con Helmet, Morgan, JWT y manejo de errores.
- [x] Login con JWT, bloqueo tras 3 intentos fallidos (en backend).
- [x] Endpoints de cartelera, asientos y reservas respondiendo correctamente.
- [x] Pasarela de pagos simulada (aprobado / rechazado / inválido / error de servicio).
- [x] Evitar doble confirmación de un mismo asiento.
- [x] Colección Postman importable con mínimo 3 aserciones por endpoint.
- [x] Colección ejecutable con Newman (repetible, sin token manual).
- [x] Frontend con login, cartelera, asientos, pago y ticket virtual.
- [x] Navegación protegida (cerrar sesión bloquea el acceso con el botón Atrás).
- [x] POM estricto (sin aserciones en las clases Page).
- [x] 15+ casos de prueba en Selenium con aserciones reales.
- [x] `prueba_carga.jmx` válido (500 usuarios, ramp-up 15 s, validaciones).
- [x] `qa-pipeline.yml` válido y coherente con las rutas del proyecto.
- [x] `estrategia_pruebas.pdf` válido y legible.
- [x] `README.md` alineado con el código real.
- [x] `INFORME_VALIDACION.md` con tabla de verificación.
- [x] Sin secretos ni datos sensibles en el repositorio.

## 5. Pruebas que debe revisar cada integrante

- **Integrante 1:** respuestas HTTP de login (200/400/401/429), cartelera, asientos,
  reservas (201/400/402/404/409/502/503), manejo de errores y consistencia de asientos.
- **Integrante 2:** casos de UI en `ui_tests/test_suite.js` (login, bloqueo, flujo de
  compra, cierre de sesión, botón Atrás) y que el frontend consuma la API real.
- **Integrante 3:** aserciones de la colección Postman, ejecución con Newman y plan JMeter.
- **Integrante 4:** coherencia de la documentación con el código, validez del PDF, YAML y
  ejecución del pipeline.

## 6. Actividades para la sustentación (video ≤ 3 minutos)

| Tiempo | Integrante | Contenido |
|---|---|---|
| 0:00–0:45 | Integrante 4 | Arquitectura general de CineFlex y estrategia de pruebas. |
| 0:45–1:30 | Integrante 1 | Backend y sus endpoints (login/JWT, cartelera, asientos, reservas). |
| 1:30–2:15 | Integrante 2 | Frontend y patrón POM (clases Page + suite de 18 casos). |
| 2:15–3:00 | Integrante 3 | Ejecución en vivo de Postman/Newman y JMeter (si aplica), y cierre. |

Ver el guion completo en `README.md` (sección "Video de sustentación").
