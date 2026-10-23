/**
 * Genera estrategia_pruebas.pdf (Fase A - teoria) usando pdfkit.
 * Uso: node generate_pdf.js
 * Salida: ../estrategia_pruebas.pdf
 */
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUT = path.join(__dirname, '..', 'estrategia_pruebas.pdf');

const COLOR_PRIMARIO = '#e11d48';
const COLOR_OSCURO = '#0f172a';
const COLOR_TEXTO = '#334155';
const COLOR_GRIS = '#64748b';

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  bufferPages: true,
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

let pageNumber = 0;

function portada() {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR_OSCURO);

  doc.fillColor('#ffffff');
  doc.font('Helvetica-Bold').fontSize(15);
  doc.text('Taller Practico Integrador: QA en Produccion', 55, 150, { width: 502 });
  doc.moveDown(0.3);

  doc.fontSize(28).fillColor(COLOR_PRIMARIO);
  doc.text('Estrategia de Pruebas', 55, doc.y + 10, { width: 502 });
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica');
  doc.text('Plataforma Web "CineFlex"', 55, doc.y + 6, { width: 502 });

  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff');
  doc.text('Integrantes:', 55, doc.y + 10);
  doc.font('Helvetica').fontSize(11).fillColor('#cbd5e1');
  const lineas = [
    'Integrante 1 (Backend): _______________________________',
    'Integrante 2 (Frontend y UI): _________________________',
    'Integrante 3 (Postman/Newman y JMeter): ________________',
    'Integrante 4 (Estrategia, CI y Documentacion): _________',
  ];
  lineas.forEach((l) => doc.text(l, 55, doc.y + 6, { width: 502 }));

  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(11).fillColor('#cbd5e1');
  doc.text('Docente: ______________________________________________', 55, doc.y + 8);
  doc.text('Institucion: ___________________________________________', 55, doc.y + 6);
  doc.text('Fecha: ____ / ____ / ________', 55, doc.y + 6);

  doc.addPage();
  resetEstilos();
}

function resetEstilos() {
  doc.font('Helvetica').fontSize(11).fillColor(COLOR_TEXTO);
}

function titulo(texto) {
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR_OSCURO);
  doc.text(texto, { width: doc.page.width - 110 });
  doc.moveTo(55, doc.y + 2).lineTo(doc.page.width - 55, doc.y + 2).strokeColor(COLOR_PRIMARIO).lineWidth(1.5).stroke();
  doc.moveDown(0.6);
  resetEstilos();
}

function subtitulo(texto) {
  doc.font('Helvetica-Bold').fontSize(12.5).fillColor(COLOR_OSCURO);
  doc.text(texto, { width: doc.page.width - 110 });
  doc.moveDown(0.4);
  resetEstilos();
}

function parrafo(texto) {
  doc.font('Helvetica').fontSize(11).fillColor(COLOR_TEXTO).lineGap(2);
  doc.text(texto, { width: doc.page.width - 110, align: 'justify' });
  doc.moveDown(0.6);
}

function viñetas(items) {
  doc.font('Helvetica').fontSize(11).fillColor(COLOR_TEXTO).lineGap(2);
  items.forEach((it) => {
    doc.text('•  ' + it, { width: doc.page.width - 130, indent: 10 });
  });
  doc.moveDown(0.6);
}

function dibujarTabla(columnas, filas, anchos) {
  const x0 = 55;
  const anchoDisponible = doc.page.width - 110;
  const padX = 6;
  const padY = 6;
  const fontSize = 9;
  const headerFontSize = 9.5;

  // Normalizar anchos para que sumen exactamente el ancho disponible
  const suma = anchos.reduce((a, b) => a + b, 0);
  const anchosNorm = anchos.map((w) => (w / suma) * anchoDisponible);

  let y = doc.y;

  // Altura del encabezado (considera texto que envuelve)
  const alturasHeader = columnas.map((c, i) =>
    doc.heightOfString(c, { width: anchosNorm[i] - padX * 2 })
  );
  const headerH = Math.max(headerFontSize, ...alturasHeader) + padY * 2;

  // Encabezado
  doc.rect(x0, y, anchoDisponible, headerH).fill(COLOR_OSCURO);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(headerFontSize);
  let cx = x0;
  columnas.forEach((c, i) => {
    doc.text(c, cx + padX, y + padY, { width: anchosNorm[i] - padX * 2 });
    cx += anchosNorm[i];
  });

  y += headerH;

  // Filas
  doc.font('Helvetica').fontSize(fontSize);
  filas.forEach((fila, ri) => {
    // Altura de la fila = mayor altura de sus celdas (con envoltura de texto)
    const alturas = fila.map((celda, ci) =>
      doc.heightOfString(String(celda), { width: anchosNorm[ci] - padX * 2 })
    );
    const altoCelda = Math.max(fontSize, ...alturas) + padY * 2;

    if (ri % 2 === 0) {
      doc.rect(x0, y, anchoDisponible, altoCelda).fill('#f1f5f9');
    }
    doc.fillColor(COLOR_TEXTO);
    let cy = x0;
    fila.forEach((celda, ci) => {
      doc.text(String(celda), cy + padX, y + padY, { width: anchosNorm[ci] - padX * 2 });
      cy += anchosNorm[ci];
    });
    doc.rect(x0, y, anchoDisponible, altoCelda).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    y += altoCelda;
  });

  doc.y = y + 10;
  resetEstilos();
}

function pieDePagina() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font('Helvetica').fontSize(8).fillColor(COLOR_GRIS);
    doc.text('CineFlex - Estrategia de Pruebas', 55, doc.page.height - 30, { width: 200 });
    doc.text('Pagina ' + (i + 1), doc.page.width - 120, doc.page.height - 30, { width: 65, align: 'right' });
  }
}

// ===========================================================================
portada();

titulo('Introduccion');
parrafo('CineFlex es una plataforma web de venta de boletos de cine compuesta por tres capas: un Frontend (UI) donde el usuario inicia sesion, explora la cartelera, selecciona asientos y paga; un Backend (API REST en Node.js/Express) que gestiona autenticacion, inventario de salas y logica de reservas; y una capa de Base de Datos y Terceros que incluye una pasarela de pagos externa (simulada en el entorno de pruebas).');
parrafo('Este documento define la estrategia de aseguramiento de calidad aplicada al proyecto. Antes de escribir codigo de automatizacion, se documentan las decisiones arquitectonicas de pruebas: el enfoque de integracion, la estrategia de sistema y regresion, y la comparativa entre Selenium WebDriver y Cypress. Su objetivo es garantizar que CineFlex funcione correctamente y no colapse en la noche de su gran estreno.');

titulo('Objetivos');
subtitulo('Objetivo general');
parrafo('Definir e implementar una estrategia integral de pruebas (integracion, sistema, regresion y rendimiento) que valide el comportamiento funcional y no funcional de la plataforma CineFlex sin depender de los servicios bancarios reales.');
subtitulo('Objetivos especificos');
viñetas([
  'Seleccionar y justificar el enfoque de integracion adecuado para un escenario con una pasarela de pagos externa no disponible.',
  'Disenar un Stub que simule la respuesta del banco para probar el flujo de ventas de extremo a extremo.',
  'Definir requisitos funcionales y no funcionales medibles, con su respectivo plan de prueba.',
  'Establecer un criterio de seleccion de pruebas de regresion que optimice recursos sin omitir riesgos criticos.',
  'Comparar tecnicamente Selenium WebDriver y Cypress y justificar su uso dentro del proyecto.',
]);

titulo('Actividad A. Pruebas de Integracion (Stubs y Drivers)');

subtitulo('Enfoque seleccionado: Top-Down');
parrafo('Para el escenario de CineFlex se selecciona el enfoque de integracion Top-Down (de arriba hacia abajo). En este enfoque, los modulos de nivel superior se prueban primero y los modulos de nivel inferior aun no disponibles se sustituyen temporalmente por Stubs.');
viñetas([
  'El Frontend (interfaz de pago) y el Backend (endpoint de transaccion) ya estan terminados.',
  'El unico componente que falta es el mas bajo de la jerarquia: la pasarela de pagos del banco.',
  'Top-Down permite validar hoy el flujo completo (UI -> API -> pago) reemplazando solo el banco por un Stub.',
  'El enfoque Bottom-Up habria exigido probar primero la pasarela real (indisponible) y habria requerido Drivers para simular al Backend, lo cual es innecesario porque el Backend ya existe.',
]);

subtitulo('Diseno del Stub de la pasarela de pagos');
parrafo('El Stub se implementa dentro del backend como una funcion procesarPago() que simula la respuesta del banco de forma determinista segun los ultimos cuatro digitos del numero de tarjeta. No se conecta a ningun servicio externo y siempre devuelve una de las siguientes respuestas predefinidas:');
viñetas([
  'Pago exitoso (APROBADO): devuelve un identificador de transaccion y el codigo APROBADO.',
  'Tarjeta rechazada (RECHAZADO): devuelve el motivo de rechazo del banco emisor.',
  'Respuesta invalida: devuelve una respuesta malformada o inesperada de la pasarela.',
  'Error del servicio: simula que la pasarela esta caida o fuera de tiempo.',
]);

subtitulo('Integracion del Stub con el backend');
parrafo('El endpoint POST /api/reservas ejecuta la logica de negocio (validar pelicula, validar asientos y validar tarjeta) y luego invoca al Stub en lugar de llamar a la API real del banco. Cuando el banco otorgue acceso a su entorno de pruebas, solo sera necesario sustituir la llamada al Stub por la llamada real, sin modificar el resto del flujo. De esta forma, CineFlex procesa correctamente las ventas sin depender del banco real.');

subtitulo('Escenarios de prueba del Stub');
dibujarTabla(
  ['Escenario', 'Estimulo (tarjeta)', 'Respuesta del Stub', 'Resultado esperado en CineFlex'],
  [
    ['Pago exitoso', '4242 4242 4242 4242', 'APROBADO + transaccionId', '201: reserva confirmada y ticket emitido'],
    ['Tarjeta rechazada', '4000 0000 0000 0002', 'RECHAZADO', '402: sin reserva y sin ticket'],
    ['Respuesta invalida', '4000 0000 0000 1234', 'Respuesta malformada', '502: error controlado de pasarela'],
    ['Error del servicio', '4000 0000 0000 0000', 'Pasarela no disponible', '503: error controlado de pasarela'],
  ],
  [95, 125, 115, 175]
);

subtitulo('Como se comprueba el procesamiento de ventas');
parrafo('Se ejecuta la coleccion de Postman y la suite de Selenium sobre el entorno con el Stub activo. Se verifica que unicamente en el escenario de pago aprobado se cree una reserva confirmada y se emita un ticket valido (codigo con formato CF-XXXXXX), y que en los demas escenarios no se emita ticket. Esto demuestra que CineFlex procesa correctamente las ventas de extremo a extremo sin el banco real.');

titulo('Actividad B. Pruebas de Sistema y de Regresion');

subtitulo('Requisitos funcionales');
viñetas([
  'RF1 - Autenticacion: El usuario debe poder iniciar sesion con credenciales validas y recibir un token JWT; el sistema debe bloquear la cuenta tras 3 intentos fallidos consecutivos.',
  'RF2 - Compra de boletos: El usuario debe poder seleccionar una pelicula, elegir asientos libres y completar la compra con pago aprobado, obteniendo un ticket virtual.',
]);

subtitulo('Requisitos no funcionales (medibles y verificables)');
viñetas([
  'RNF1 - Rendimiento (SLA): El endpoint de consulta de cartelera debe responder en menos de 300 ms en condiciones normales. Se verifica con la asercion de tiempo de respuesta de la coleccion Postman.',
  'RNF2 - Capacidad: El endpoint de consulta de asientos debe soportar 500 usuarios concurrentes con una tasa de error menor al 1%. Se verifica con el plan de carga de Apache JMeter (500 hilos, ramp-up 15 s).',
]);

subtitulo('Como probar cada requisito');
parrafo('RF1 y RF2 se prueban con pruebas de sistema (end-to-end) mediante la suite Selenium (login exitoso, bloqueo, flujo de compra, ticket) y con pruebas de API mediante Postman/Newman (codigos HTTP y aserciones). RNF1 se mide con la asercion responseTime < 300 ms de Postman. RNF2 se mide con el plan de carga de JMeter, analizando el Throughput y el porcentaje de error del Summary Report.');

subtitulo('Estrategia de regresion: cambio de color de un boton secundario');
parrafo('Caso analizado: un desarrollador cambia unicamente el color de un boton secundario en la vista del perfil de usuario.');
parrafo('Criterio de seleccion: se aplica regresion selectiva basada en riesgo e impacto. El cambio es cosmetico y aislado en la vista de perfil, por lo que NO se repite la suite completa de la pasarela de pagos. Se ejecutan:');
viñetas([
  'Pruebas de humo (smoke) de la vista de perfil: verificar que el boton sigue visible y funcional.',
  'Pruebas de regresion de la navegacion general: login, cierre de sesion y acceso a la cartelera (para detectar regresiones de renderizado o estilos que rompan el layout).',
  'No serian prioritarias: las pruebas de la pasarela de pagos, del flujo de reservas ni las pruebas de carga, porque no comparten dependencias con el componente modificado.',
]);
parrafo('Justificacion: el riesgo de que un cambio de color afecte la logica de pagos es minimo, y ejecutar toda la suite seria un desperdicio de recursos. Sin embargo, se conserva un conjunto minimo de pruebas de humo de autenticacion y navegacion porque el Frontend comparte hojas de estilo globales: un error en CSS podria propagarse a otras vistas. Omitir todas las pruebas criticas de autenticacion si seria un riesgo, por lo que se mantienen las pruebas de humo de login.');

titulo('Actividad C. Comparativa: Selenium WebDriver vs Cypress');

subtitulo('Que es cada herramienta');
parrafo('Selenium WebDriver es un framework de automatizacion de navegadores que controla el navegador real a traves del protocolo W3C WebDriver, soportando multiples navegadores y lenguajes. Cypress es una herramienta de testing de frontend que se ejecuta dentro del navegador, orientada a aplicaciones JavaScript modernas, con soporte integrado de esperas, depuracion y mocks de red.');

subtitulo('Tabla comparativa tecnica');
dibujarTabla(
  ['Criterio', 'Selenium WebDriver', 'Cypress'],
  [
    ['Arquitectura', 'Cliente-servidor fuera del navegador (WebDriver)', 'Se ejecuta dentro del navegador'],
    ['Navegadores', 'Chrome, Edge, Firefox, Safari, etc.', 'Principalmente Chromium (Firefox experimental)'],
    ['Lenguajes', 'Java, JS, Python, C#, Ruby, etc.', 'Solo JavaScript/TypeScript'],
    ['Multiples pestanas/origenes', 'Soporte nativo', 'Limitado'],
    ['Control de red (mocks)', 'Requiere herramientas externas', 'Integrado (interceptores)'],
    ['Velocidad de ejecucion', 'Menor (arranca navegador real)', 'Mayor (integrado al navegador)'],
    ['Complejidad de configuracion', 'Requiere driver por navegador', 'Configuracion minima'],
  ],
  [110, 200, 200]
);

subtitulo('Escenarios de CineFlex para cada herramienta');
viñetas([
  'Selenium WebDriver: se utiliza para validar el flujo de compra end-to-end real (login -> cartelera -> asientos -> pago -> ticket) contra el navegador Edge/Chrome del usuario, verificando la navegacion protegida (cierre de sesion y boton Atras) y la interaccion con la API real sin mocks.',
  'Cypress: seria conveniente para pruebas de componentes rapidas durante el desarrollo, por ejemplo validar la logica del formulario de pago o del selector de asientos con respuestas simuladas, aprovechando sus mocks de red y su velocidad.',
]);
parrafo('Por que Selenium es obligatorio en este taller: porque el objetivo es demostrar pruebas de UI reales y multiplataforma sobre un navegador real, aplicando el patron Page Object Model. Selenium valida el comportamiento real del navegador (incluida la navegacion y el boton Atras), mientras que Cypress se limita a un entorno integrado. Esto permite al docente evaluar el dominio de WebDriver y del patron POM, que es el criterio explicito de la rubrica.');

titulo('Conclusiones');
viñetas([
  'El enfoque Top-Down con un Stub de la pasarela de pagos permite validar las ventas de CineFlex hoy, sin depender del banco real.',
  'La definicion de requisitos funcionales y no funcionales medibles permite comprobar de forma objetiva la calidad del sistema.',
  'La regresion selectiva basada en riesgo optimiza recursos sin descuidar las pruebas criticas.',
  'Selenium WebDriver es la herramienta adecuada para pruebas de UI reales y multiplataforma; Cypress es una alternativa complementaria para pruebas rapidas de componentes.',
]);

titulo('Referencias');
viñetas([
  'Selenium WebDriver - documentacion oficial: https://www.selenium.dev',
  'Cypress - documentacion oficial: https://www.cypress.io',
  'Apache JMeter - documentacion oficial: https://jmeter.apache.org',
  'Postman / Newman - documentacion oficial: https://learning.postman.com',
  'Page Object Model - Selenium docs: https://www.selenium.dev/documentation/test_practices',
]);

pieDePagina();
doc.end();

stream.on('finish', () => {
  console.log('PDF generado: ' + OUT);
});
