# Taller Práctico Integrador: QA en Producción

# Estrategia de Pruebas — Plataforma Web "CineFlex"

**Integrantes:**

- Integrante 1 (Backend/ Postman/Newma): Andres Males Goyes
- Integrante 2 (Frontend y UI): Jefferson Claros Muños
- Integrante 3 (CI  y JMeter):Andrea Camila Ortiz
- Integrante 4 (Estrategia, CI y Documentación): Jaider Martinez

**Docente:** Kevin Rodriguez
**Institución:** UNIPUTUMAYO
**Fecha:** 23 / 10 /2026

---

## Introducción

CineFlex es una plataforma web de venta de boletos de cine compuesta por tres capas:

- un **Frontend (UI)** donde el usuario inicia sesión, explora la cartelera, selecciona asientos y paga;
- un **Backend (API REST en Node.js/Express)** que gestiona autenticación, inventario de salas y lógica de reservas;
- una capa de **Base de Datos y Terceros** que incluye una pasarela de pagos externa (simulada en el entorno de pruebas).

Este documento define la estrategia de aseguramiento de calidad aplicada al proyecto. Antes de escribir código de automatización, se documentan las decisiones arquitectónicas de pruebas: el enfoque de integración, la estrategia de sistema y regresión, y la comparativa entre Selenium WebDriver y Cypress. Su objetivo es garantizar que CineFlex funcione correctamente y no colapse en la noche de su gran estreno.

---

## Objetivos

### Objetivo general

Definir e implementar una estrategia integral de pruebas (integración, sistema, regresión y rendimiento) que valide el comportamiento funcional y no funcional de la plataforma CineFlex sin depender de los servicios bancarios reales.

### Objetivos específicos

- Seleccionar y justificar el enfoque de integración adecuado para un escenario con una pasarela de pagos externa no disponible.
- Diseñar un Stub que simule la respuesta del banco para probar el flujo de ventas de extremo a extremo.
- Definir requisitos funcionales y no funcionales medibles, con su respectivo plan de prueba.
- Establecer un criterio de selección de pruebas de regresión que optimice recursos sin omitir riesgos críticos.
- Comparar técnicamente Selenium WebDriver y Cypress y justificar su uso dentro del proyecto.

---

## Actividad A. Pruebas de Integración (Stubs y Drivers)

### Enfoque seleccionado: Top-Down

Para el escenario de CineFlex se selecciona el enfoque de integración **Top-Down** (de arriba hacia abajo). En este enfoque, los módulos de nivel superior se prueban primero y los módulos de nivel inferior aún no disponibles se sustituyen temporalmente por **Stubs**.

- El Frontend (interfaz de pago) y el Backend (endpoint de transacción) ya están terminados.
- El único componente que falta es el más bajo de la jerarquía: la pasarela de pagos del banco.
- Top-Down permite validar hoy el flujo completo (UI → API → pago) reemplazando solo el banco por un Stub.
- El enfoque Bottom-Up habría exigido probar primero la pasarela real (indisponible) y habría requerido Drivers para simular al Backend, lo cual es innecesario porque el Backend ya existe.

### Diseño del Stub de la pasarela de pagos

El Stub se implementa dentro del backend como una función `procesarPago()` que simula la respuesta del banco de forma determinista según los últimos cuatro dígitos del número de tarjeta. No se conecta a ningún servicio externo y siempre devuelve una de las siguientes respuestas predefinidas:

- **Pago exitoso (APROBADO):** devuelve un identificador de transacción y el código `APROBADO`.
- **Tarjeta rechazada (RECHAZADO):** devuelve el motivo de rechazo del banco emisor.
- **Respuesta inválida:** devuelve una respuesta malformada o inesperada de la pasarela.
- **Error del servicio:** simula que la pasarela está caída o fuera de tiempo.

### Integración del Stub con el backend

El endpoint `POST /api/reservas` ejecuta la lógica de negocio (validar película, validar asientos y validar tarjeta) y luego invoca al Stub en lugar de llamar a la API real del banco. Cuando el banco otorgue acceso a su entorno de pruebas, solo será necesario sustituir la llamada al Stub por la llamada real, sin modificar el resto del flujo. De esta forma, CineFlex procesa correctamente las ventas sin depender del banco real.

### Escenarios de prueba del Stub

| Escenario | Estímulo (tarjeta) | Respuesta del Stub | Resultado esperado en CineFlex |
|---|---|---|---|
| Pago exitoso | `4242 4242 4242 4242` | APROBADO + transaccionId | 201: reserva confirmada y ticket emitido |
| Tarjeta rechazada | `4000 0000 0000 0002` | RECHAZADO | 402: sin reserva y sin ticket |
| Respuesta inválida | `4000 0000 0000 1234` | Respuesta malformada | 502: error controlado de pasarela |
| Error del servicio | `4000 0000 0000 0000` | Pasarela no disponible | 503: error controlado de pasarela |

### Cómo se comprueba el procesamiento de ventas

Se ejecuta la colección de Postman y la suite de Selenium sobre el entorno con el Stub activo. Se verifica que únicamente en el escenario de pago aprobado se cree una reserva confirmada y se emita un ticket válido (código con formato `CF-XXXXXX`), y que en los demás escenarios no se emita ticket. Esto demuestra que CineFlex procesa correctamente las ventas de extremo a extremo sin el banco real.

---

## Actividad B. Pruebas de Sistema y de Regresión

### Requisitos funcionales

- **RF1 - Autenticación:** el usuario debe poder iniciar sesión con credenciales válidas y recibir un token JWT; el sistema debe bloquear la cuenta tras 3 intentos fallidos consecutivos.
- **RF2 - Compra de boletos:** el usuario debe poder seleccionar una película, elegir asientos libres y completar la compra con pago aprobado, obteniendo un ticket virtual.

### Requisitos no funcionales (medibles y verificables)

- **RNF1 - Rendimiento (SLA):** el endpoint de consulta de cartelera debe responder en menos de 300 ms en condiciones normales. Se verifica con la aserción de tiempo de respuesta de la colección Postman.
- **RNF2 - Capacidad:** el endpoint de consulta de asientos debe soportar 500 usuarios concurrentes con una tasa de error menor al 1%. Se verifica con el plan de carga de Apache JMeter (500 hilos, ramp-up 15 s).

### Cómo probar cada requisito

RF1 y RF2 se prueban con pruebas de sistema (end-to-end) mediante la suite Selenium (login exitoso, bloqueo, flujo de compra, ticket) y con pruebas de API mediante Postman/Newman (códigos HTTP y aserciones). RNF1 se mide con la aserción `responseTime < 300 ms` de Postman. RNF2 se mide con el plan de carga de JMeter, analizando el Throughput y el porcentaje de error del Summary Report.

### Estrategia de regresión: cambio de color de un botón secundario

**Caso analizado:** un desarrollador cambia únicamente el color de un botón secundario en la vista del perfil de usuario.

**Criterio de selección:** se aplica regresión selectiva basada en riesgo e impacto. El cambio es cosmético y aislado en la vista de perfil, por lo que **no** se repite la suite completa de la pasarela de pagos. Se ejecutan:

- Pruebas de humo (smoke) de la vista de perfil: verificar que el botón sigue visible y funcional.
- Pruebas de regresión de la navegación general: login, cierre de sesión y acceso a la cartelera (para detectar regresiones de renderizado o estilos que rompan el layout).
- No serían prioritarias: las pruebas de la pasarela de pagos, del flujo de reservas ni las pruebas de carga, porque no comparten dependencias con el componente modificado.

**Justificación:** el riesgo de que un cambio de color afecte la lógica de pagos es mínimo, y ejecutar toda la suite sería un desperdicio de recursos. Sin embargo, se conserva un conjunto mínimo de pruebas de humo de autenticación y navegación porque el Frontend comparte hojas de estilo globales: un error en CSS podría propagarse a otras vistas. Omitir todas las pruebas críticas de autenticación sí sería un riesgo, por lo que se mantienen las pruebas de humo de login.

---

## Actividad C. Comparativa: Selenium WebDriver vs Cypress

### Qué es cada herramienta

**Selenium WebDriver** es un framework de automatización de navegadores que controla el navegador real a través del protocolo W3C WebDriver, soportando múltiples navegadores y lenguajes. **Cypress** es una herramienta de testing de frontend que se ejecuta dentro del navegador, orientada a aplicaciones JavaScript modernas, con soporte integrado de esperas, depuración y mocks de red.

### Tabla comparativa técnica

| Criterio | Selenium WebDriver | Cypress |
|---|---|---|
| Arquitectura | Cliente-servidor fuera del navegador (WebDriver) | Se ejecuta dentro del navegador |
| Navegadores | Chrome, Edge, Firefox, Safari, etc. | Principalmente Chromium (Firefox experimental) |
| Lenguajes | Java, JS, Python, C#, Ruby, etc. | Solo JavaScript/TypeScript |
| Múltiples pestañas/orígenes | Soporte nativo | Limitado |
| Control de red (mocks) | Requiere herramientas externas | Integrado (interceptores) |
| Velocidad de ejecución | Menor (arranca navegador real) | Mayor (integrado al navegador) |
| Complejidad de configuración | Requiere driver por navegador | Configuración mínima |

### Escenarios de CineFlex para cada herramienta

- **Selenium WebDriver:** se utiliza para validar el flujo de compra end-to-end real (login → cartelera → asientos → pago → ticket) contra el navegador Edge/Chrome del usuario, verificando la navegación protegida (cierre de sesión y botón Atrás) y la interacción con la API real sin mocks.
- **Cypress:** sería conveniente para pruebas de componentes rápidas durante el desarrollo, por ejemplo validar la lógica del formulario de pago o del selector de asientos con respuestas simuladas, aprovechando sus mocks de red y su velocidad.

**Por qué Selenium es obligatorio en este taller:** porque el objetivo es demostrar pruebas de UI reales y multiplataforma sobre un navegador real, aplicando el patrón Page Object Model (POM). Selenium valida el comportamiento real del navegador (incluida la navegación y el botón Atrás), mientras que Cypress se limita a un entorno integrado. Esto permite al docente evaluar el dominio de WebDriver y del patrón POM, que es el criterio explícito de la rúbrica.

---

## Conclusiones

- El enfoque Top-Down con un Stub de la pasarela de pagos permite validar las ventas de CineFlex hoy, sin depender del banco real.
- La definición de requisitos funcionales y no funcionales medibles permite comprobar de forma objetiva la calidad del sistema.
- La regresión selectiva basada en riesgo optimiza recursos sin descuidar las pruebas críticas.
- Selenium WebDriver es la herramienta adecuada para pruebas de UI reales y multiplataforma; Cypress es una alternativa complementaria para pruebas rápidas de componentes.

---

## Referencias

- Selenium WebDriver - documentación oficial: <https://www.selenium.dev>
- Cypress - documentación oficial: <https://www.cypress.io>
- Apache JMeter - documentación oficial: <https://jmeter.apache.org>
- Postman / Newman - documentación oficial: <https://learning.postman.com>
- Page Object Model - Selenium docs: <https://www.selenium.dev/documentation/test_practices>