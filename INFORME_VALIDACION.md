# Informe de Validación — CineFlex

> Auditoría, corrección y validación final del proyecto. Se distingue entre
> **código implementado**, **pruebas ejecutadas** y **comprobaciones pendientes**.

- **Fecha de validación:** 22 de octubre de 2026
- **Entorno:** Windows, Node v24.15.0, npm 11.12.1, Git 2.54, Edge 155, Java 1.8, Apache JMeter 5.6.3, Newman 6.x
- **Estado de la leyenda:** ✅ Aprobado · ❌ Fallido · ⛔ Bloqueado · ⏳ Pendiente

---

## 1. Problemas encontrados durante la auditoría

| # | Problema | Impacto | Corrección aplicada |
|---|---|---|---|
| 1 | **Puerto del backend cambiado a 3030** (`server.js`, `.env`, `.env.example`, `CONTRATO_API.md`, parte del `README.md`), mientras el frontend, Postman, JMeter, Selenium y CI seguían en **3000** | El frontend no conectaba con la API; Postman/Newman, JMeter y CI apuntaban a un puerto equivocado; documentación inconsistente | Se **estandarizó el puerto 3000** en todos los archivos (`server.js`, `.env.example`, `CONTRATO_API.md`, `README.md`) |
| 2 | `.env` mal ubicado (raíz del proyecto, no en `backend/`) y con `PORT=3030` | El backend no lo leía (dotenv carga `backend/.env`); valor incorrecto | Se eliminó el `.env` de la raíz; se corrige el valor por defecto en el código |
| 3 | `package-lock.json` vacío en la raíz del proyecto (sin `package.json` raíz) | Archivo basura de un `npm install` accidental | Se eliminó |
| 4 | `jmeter.log` suelto en la carpeta padre (`QA-CineFloix/`) | Log residual de una ejecución de JMeter | Se eliminó |
| 5 | `PLAN_TRABAJO.md` y `GUIA_GIT_EQUIPO.md` eliminados | Eran entregables obligatorios del taller | Se recrearon |

## 2. Archivos modificados y motivo

| Archivo | Cambio |
|---|---|
| `backend/server.js` | Puerto por defecto `3030` → `3000` |
| `backend/.env.example` | `PORT=3030` → `PORT=3000` |
| `CONTRATO_API.md` | URL base `3030` → `3000` |
| `README.md` | Puerto `3030` → `3000` (2 líneas); métricas actualizadas con la última ejecución |
| `PLAN_TRABAJO.md` | Recreado (estaba eliminado) |
| `GUIA_GIT_EQUIPO.md` | Recreado (estaba eliminado) |
| `INFORME_VALIDACION.md` | Reescrito con esta auditoría |

**Archivos eliminados (basura):** `.env` (raíz), `package-lock.json` (raíz), `jmeter.log` (padre).

## 3. Rutas y puertos verificados

| Componente | URL / puerto | Estado |
|---|---|---|
| Backend | `http://localhost:3000` (configurable vía `PORT`) | ✅ responde |
| Health check | `GET /api/health` | ✅ `200` |
| Login | `POST /api/auth/login` | ✅ `200/400/401/429` |
| Cartelera | `GET /api/cartelera` (JWT) | ✅ `200/401` |
| Asientos | `GET /api/peliculas/:id/asientos` (JWT) | ✅ `200/401/404` |
| Reserva | `POST /api/reservas` (JWT) | ✅ `201/400/402/404/409/502/503` |
| Reserva | `GET /api/reservas/:id` (JWT) | ✅ `200/404` |
| Frontend | `http://localhost:8081` | ✅ abre |
| Frontend → API | `http://localhost:3000/api` (`frontend/app.js`) | ✅ coherente |

## 4. Comandos ejecutados (en orden)

```powershell
node --check backend\server.js ; node --check frontend\app.js ; node --check ui_tests\test_suite.js   # sintaxis
newman run api_tests\CineFlex_API_Collection.json -e api_tests\CineFlex_Environment.json              # API
node ui_tests\test_suite.js                                                                           # UI (Selenium)
jmeter -n -t performance\prueba_carga.jmx -l results.jtl                                              # carga (500 usuarios)
npx js-yaml .github\workflows\qa-pipeline.yml                                                         # YAML
```

## 5. Resultados reales de cada prueba

| Prueba | Estado | Resultado |
|---|---|---|
| Sintaxis JavaScript (`node --check`) | ✅ | 8/8 archivos sin errores |
| JSON válidos | ✅ | 5/5 archivos parsean correctamente |
| Backend + endpoints + JWT | ✅ | login, cartelera, asientos, reservas y bloqueo funcionan |
| API — Newman | ✅ | **45 aserciones, 0 fallos** (21 peticiones, ~8 ms) |
| UI — Selenium (Edge) | ✅ | **18/18 casos aprobados** |
| Rendimiento — JMeter | ✅ | 500 usuarios, **0.00 % errores, 29.9 req/s**, 4 ms prom. |
| YAML del workflow | ✅ | parsea correctamente |
| PDF de estrategia | ✅ | válido (cabecera `%PDF` y `%%EOF`) |
| Secretos en el repo | ✅ | sin coincidencias |

### Nota de estabilidad (Selenium)
En la primera corrida de esta auditoría se observó **1 fallo transitorio** que no
se reprodujo en las dos corridas siguientes (18/18 en ambas). No se identificó
una causa determinista; se deja documentado como posible variación de tiempos del
navegador en modo headless.

## 6. Conteo de pruebas

| Categoría | Cantidad |
|---|---|
| Aprobadas (API + UI) | 45 aserciones + 18 casos = 63 |
| Fallidas | 0 (en la validación final) |
| Bloqueadas | 0 |
| Pendientes | 3 (ver sección 8) |

## 7. Errores que todavía existen

Ningún error funcional pendiente en el entorno local. Todos los flujos
verificados pasan.

## 8. Requisitos que debo instalar / pasos manuales pendientes

| Ítem | Motivo | Acción |
|---|---|---|
| Ejecución de GitHub Actions en remoto | Requiere repositorio público | Crear repo y hacer push (con autorización) |
| Video de sustentación | Requiere grabación | Grabar ≤ 3 min y pegar enlace en `README.md` |
| Enlace del repositorio | Requiere publicación | Pegar URL en `README.md` (sección 18) |
| Apache JMeter en el PATH | No está en el PATH del sistema | Descargar JMeter 5.6.3 o usar la ruta completa a `jmeter.bat` |

## 9. Estado de los entregables del taller

| Entregable | Estado |
|---|---|
| `README.md` | ✅ alineado con el código |
| `PLAN_TRABAJO.md` | ✅ recreado |
| `CONTRATO_API.md` | ✅ coherente con la API |
| `GUIA_GIT_EQUIPO.md` | ✅ recreado |
| `estrategia_pruebas.pdf` | ✅ válido |
| `INFORME_VALIDACION.md` | ✅ este documento |
| Backend (`server.js`) | ✅ funcional |
| Frontend | ✅ funcional |
| Postman + Newman | ✅ 45 aserciones |
| Selenium + POM | ✅ 18 casos |
| JMeter | ✅ plan ejecutado |
| GitHub Actions | ✅ YAML válido (pendiente verificación remota) |

## 10. Archivos recomendados para Git

**Incluir (entregables y código fuente):** todo el contenido de
`qa-cineflex-project/` **excepto** lo listado abajo. En particular:
`README.md`, `PLAN_TRABAJO.md`, `CONTRATO_API.md`, `GUIA_GIT_EQUIPO.md`,
`INFORME_VALIDACION.md`, `estrategia_pruebas.pdf`, `.gitignore`, `backend/`
(server.js, package.json, package-lock.json, .env.example), `frontend/`
(index.html, styles.css, app.js, serve.js), `api_tests/`, `ui_tests/`
(pages, test_suite.js, package.json, package-lock.json), `performance/`,
`scripts/`, `.github/`.

**Excluir (ya en `.gitignore`):** `node_modules/`, `.env`, `*.log`,
`newman/`, `ui_tests/reports/`, `ui_tests/screenshots/`, `performance/*.jtl`,
`performance/results/`, `jmeter-results/`, `.vscode/`, `.idea/`, `.DS_Store`.

> Antes de hacer commit, ejecutar `git status` y confirmar que no aparecen
> `node_modules`, `.env` ni archivos `.jtl`/`.log`.

## 11. Instrucciones para arrancar y demostrar en vivo

```powershell
# Terminal 1 — Backend (http://localhost:3000)
cd qa-cineflex-project\backend
npm install          # solo la primera vez
npm start

# Terminal 2 — Frontend (http://localhost:8081)
cd qa-cineflex-project\frontend
node serve.js

# Terminal 3 — Pruebas de API
cd qa-cineflex-project
newman run api_tests\CineFlex_API_Collection.json -e api_tests\CineFlex_Environment.json

# Terminal 4 — Pruebas de UI (ver navegador: $env:HEADLESS="false")
cd qa-cineflex-project\ui_tests
npm test

# Terminal 5 — Carga (requiere JMeter)
jmeter -n -t performance\prueba_carga.jmx -l results.jtl
```

**Verificación rápida de puertos y rutas:**

```powershell
curl http://localhost:3000/api/health     # backend arriba
curl http://localhost:8081/index.html     # frontend arriba
```
