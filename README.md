# CineFlex — Taller Práctico Integrador: QA en Producción

> Plataforma web simulada de venta de boletos de cine, construida y certificada
> por un equipo de QA de 4 integrantes. Este repositorio contiene el entorno
> mock (frontend y backend), las suites de pruebas automatizadas (API, UI y
> rendimiento) y la documentación de la estrategia de aseguramiento de calidad.

---

## 📹 Video de sustentación

> **Enlace del video (máx. 3 minutos):**

( https://drive.google.com/file/d/1zoNQdzAXQWdy6hayUq2uRU2F3L1hDkT0/view?usp=sharing ).

---

## 1. Descripción de CineFlex

CineFlex es una plataforma web de venta de boletos de cine con tres capas:

| Capa | Descripción |
|---|---|
| **Frontend (UI)** | Interfaz interactiva donde el usuario inicia sesión, explora la cartelera, selecciona asientos y paga. |
| **Backend (API REST)** | Servidor Node.js/Express que gestiona autenticación (JWT), inventario de salas y lógica de reservas. |
| **Datos y terceros** | Almacenamiento en memoria y una pasarela de pagos externa **simulada**. |

## 2. Objetivo del taller

Demostrar conocimientos de aseguramiento de calidad aplicando: estrategia de
pruebas, backend mock, automatización de API con Postman/Newman, automatización
de UI con Selenium WebDriver + Page Object Model (POM), pruebas de rendimiento
con Apache JMeter e integración continua con GitHub Actions.

## 3. Arquitectura

```
[Frontend HTML/CSS/JS]  --fetch-->  [Backend Express]  --stub-->  [Pasarela de pagos simulada]
      (puerto 8081)                    (puerto 3000)
            ^
            └── Selenium WebDriver (Edge) automatiza la UI
                        |
[Postman/Newman] --------+-----> valida la API REST
[JMeter] -----------------------> genera carga sobre GET /api/peliculas/:id/asientos
[GitHub Actions] ---------------> ejecuta Newman en cada push/pull request
```

- El **frontend** consume los endpoints reales del backend (`http://localhost:3000/api`).
- La **pasarela de pagos** está simulada dentro del backend (stub) y responde
  según los últimos 4 dígitos de la tarjeta.

## 4. Estructura de carpetas

```
qa-cineflex-project/
├── README.md
├── PLAN_TRABAJO.md
├── CONTRATO_API.md
├── GUIA_GIT_EQUIPO.md
├── INFORME_VALIDACION.md
├── estrategia_pruebas.pdf
├── .gitignore
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── serve.js            (servidor estático auxiliar, sin dependencias)
├── api_tests/
│   ├── CineFlex_API_Collection.json
│   └── CineFlex_Environment.json
├── ui_tests/
│   ├── package.json
│   ├── test_suite.js
│   └── pages/
│       ├── LoginPage.js
│       ├── CarteleraPage.js
│       └── ReservaPage.js
├── performance/
│   └── prueba_carga.jmx
└── .github/
    └── workflows/
        └── qa-pipeline.yml
```

## 5. Tecnologías utilizadas

- **Backend:** Node.js, Express, Helmet, Morgan, jsonwebtoken, dotenv, cors.
- **Frontend:** HTML5, CSS3, JavaScript (vanilla).
- **Pruebas de API:** Postman + Newman.
- **Pruebas de UI:** Selenium WebDriver (JavaScript) + patrón POM.
- **Rendimiento:** Apache JMeter 5.6.3.
- **CI:** GitHub Actions.

## 6. Requisitos previos

| Herramienta | Versión verificada | Notas |
|---|---|---|
| Node.js | 24.x (compatible con 18/20/22) | Incluye `npm` |
| npm | 11.x | |
| Git | 2.54 | |
| Navegador Edge/Chrome | Edge 155 | Necesario para Selenium |
| Postman | cualquiera reciente | Para importar la colección |
| Newman | 6.x | `npm install -g newman` |
| Apache JMeter | 5.6.3 | Requiere Java 8+ |
| Java (para JMeter) | 1.8+ | |

## 7. Instalación paso a paso

```bash
# 1. Clonar el repositorio (cuando exista) o descomprimir la carpeta
git clone <URL_DEL_REPOSITORIO>        # o copia la carpeta qa-cineflex-project

# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias de las pruebas de UI
cd ../ui_tests
npm install

# 4. (Opcional) Instalar Newman de forma global
npm install -g newman
```

## 8. Configuración de variables de entorno

El backend lee su configuración de variables de entorno. Copia el ejemplo:

```bash
cd backend
cp .env.example .env
```

Valores por defecto (sin secretos reales):

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del backend |
| `JWT_SECRET` | valor de desarrollo | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | `1h` | Duración del token |
| `LOGIN_MAX_INTENTOS` | `3` | Intentos antes de bloquear |
| `LOGIN_BLOQUEO_SEG` | `60` | Duración del bloqueo |

## 9. Inicio del backend

```bash
cd backend
npm start        # ejecuta: node server.js
# o en modo desarrollo (reinicio automático):
npm run dev      # ejecuta: nodemon server.js
```

Verificar: abrir `http://localhost:3000/api/health` → `{"status":"ok",...}`.

> El estado (usuarios, asientos, reservas, bloqueos) se guarda **en memoria**:
> al reiniciar el servidor, los datos vuelven a su estado inicial.

## 10. Apertura y uso del frontend

```bash
cd frontend
node serve.js    # sirve la UI en http://localhost:8081
```

Abrir en el navegador `http://localhost:8081`.

**Usuario de prueba:** `cliente@cineflex.com` / `CineFlex123`.

**Tarjetas ficticias:**

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago aprobado |
| `4000 0000 0000 0002` | Tarjeta rechazada |
| `4000 0000 0000 0000` | Error del servicio de pagos |
| `4000 0000 0000 1234` | Respuesta inválida de la pasarela |
| `1234` (cualquier otro largo) | Tarjeta inválida (validación) |

## 11. Importación y ejecución de Postman

1. Abre Postman → **Import**.
2. Importa `api_tests/CineFlex_API_Collection.json` y
   `api_tests/CineFlex_Environment.json`.
3. Selecciona el entorno **CineFlex Environment** (menú desplegable arriba a la derecha).
4. Asegúrate de que el backend esté corriendo en el puerto 3000.
5. Ejecuta la colección completa con **Run** (o carpeta por carpeta).

La colección incluye: login (200/400/401/429 sin captura dinámica del JWT),
cartelera (con/sin token, SLA < 300 ms) y reserva (rechazada, inválida, asiento
ocupado, error de servicio, respuesta inválida, compra exitosa y consulta).

## 12. Ejecución de Newman

Con el backend corriendo:

```bash
cd api_tests   # o desde la raíz del proyecto
newman run CineFlex_API_Collection.json -e CineFlex_Environment.json
```

Para exportar un reporte JUnit (útil para CI):

```bash
newman run CineFlex_API_Collection.json -e CineFlex_Environment.json \
  --reporters cli,junit --reporter-junit-export newman-report.xml
```

## 13. Ejecución de Selenium

Requisitos: backend (3000) y frontend (8081) corriendo, y navegador Edge o Chrome.

```bash
cd ui_tests
npm test                       # node test_suite.js  (modo headless)
HEADLESS=false npm test        # para VER el navegador ejecutando las pruebas
```

- Selenium Manager descarga automáticamente el WebDriver de Edge la primera vez.
- La suite ejecuta **18 casos de prueba** modulares (login, bloqueo, cartelera,
  asientos, pago, ticket, cierre de sesión y navegación protegida).
- Las clases `pages/*.js` contienen solo localizadores y acciones (POM estricto);
  todas las aserciones están en `test_suite.js`.

## 14. Ejecución de JMeter

El plan `performance/prueba_carga.jmx` simula **500 usuarios concurrentes** con
**ramp-up de 15 s** consultando asientos disponibles.

### Importar (modo gráfico)

1. Abre JMeter (`jmeter.bat` en Windows, `jmeter` en Linux/macOS).
2. **File → Open** → `performance/prueba_carga.jmx`.
3. Ajusta `host` y `port` en el elemento "Variables de configuracion".
4. Ejecuta y abre el listener "Ver arbol de resultados" o añade un "Summary Report".

### Ejecutar (modo no gráfico)

```bash
jmeter -n -t performance/prueba_carga.jmx -l results.jtl
# Para generar el dashboard HTML con estadísticas:
jmeter -n -t performance/prueba_carga.jmx -l results.jtl -e -o reporte-html
```

El plan usa un hilo `setUp` que hace login una vez, extrae el JWT y lo comparte
con los 500 hilos de carga mediante una propiedad de JMeter.

## 15. Funcionamiento de GitHub Actions

El archivo `.github/workflows/qa-pipeline.yml` se ejecuta en cada `push` y
`pull_request` a `main`/`master`. El pipeline:

1. Descarga el repositorio y configura Node.js 20.
2. Instala las dependencias del backend y Newman.
3. Inicia el backend y espera a `http://localhost:3000/api/health`.
4. Ejecuta la colección con Newman (reporte JUnit).
5. Marca la ejecución como fallida si alguna aserción falla.
6. Sube el reporte `newman-report.xml` como artefacto.

> El pipeline usa `permissions: contents: read` y no utiliza credenciales reales.

## 16. Resultados de pruebas realmente ejecutadas

Estos resultados se obtuvieron en la máquina local (Windows) durante el desarrollo.

### 16.1 API — Newman

```
assertions: 45   failed: 0   requests: 21
average response time: 8 ms   total run duration: ~1.5 s
```

### 16.2 UI — Selenium WebDriver (Edge)

```
Total de casos: 18   Aprobados: 18   Fallidos: 0
```

### 16.3 Rendimiento — JMeter (500 usuarios, ramp-up 15 s)

```
summary = 501 in 00:00:17 = 29.9/s Avg: 4  Min: 2  Max: 95  Err: 0 (0.00%)
```

| Métrica | Valor |
|---|---|
| Usuarios concurrentes | 500 |
| Peticiones totales | 501 (1 login + 500 asientos) |
| Throughput | 29.9 req/s |
| Tiempo promedio | 4 ms |
| Tiempo máximo | 95 ms |
| **Porcentaje de error** | **0.00 %** |

> Nota: el dashboard HTML de JMeter puede regenerarse con el comando de la
> sección 14. La métrica de Summary Report (Throughput y % de error) se muestra
> arriba con los valores reales del resumen en consola.

## 17. Limitaciones conocidas

- El backend usa **almacenamiento en memoria**: los datos se reinician al reiniciar.
- La pasarela de pagos es un **stub** (no contacta a ningún banco).
- Las pruebas de UI usan **Edge**; para Chrome, instala el navegador y ajusta el
  `forBrowser` en `ui_tests/test_suite.js`.
- La aserción de tiempo de respuesta (< 300 ms) es sensible al entorno; se
  recomienda ejecutar Newman en local sin carga adicional.
- GitHub Actions solo ejecuta las pruebas de API (Newman); las pruebas de UI y
  de carga se ejecutan en local por requerir navegador y recursos de máquina.
- Los resultados de JMeter dependen del hardware; en máquinas con menos recursos
  se recomienda reducir el número de hilos.

## 18. Enlace al repositorio

> **https://github.com/Cami18-M/qa-cineflex-project.git**

