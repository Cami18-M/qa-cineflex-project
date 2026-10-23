/**
 * CineFlex - Suite de pruebas UI (Selenium WebDriver + POM)
 *
 * Contiene TODAS las aserciones (las clases Page no contienen ninguna).
 * Requisitos previos:
 *   1. Backend corriendo en http://localhost:3000  (node server.js)
 *   2. Frontend corriendo en http://localhost:8081 (node serve.js)
 *
 * Ejecucion:  npm test   (o: node test_suite.js)
 * Opcional:   HEADLESS=false npm test   para ver el navegador.
 */
const { Builder, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');
const assert = require('assert');

const LoginPage = require('./pages/LoginPage');
const CarteleraPage = require('./pages/CarteleraPage');
const ReservaPage = require('./pages/ReservaPage');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const EMAIL = 'cliente@cineflex.com';
const PASSWORD = 'CineFlex123';
const PELICULA_PRUEBA = 1;
const TITULO_PELICULA = 'La Ultima Estacion';

let driver;
let loginPage;
let carteleraPage;
let reservaPage;

// ---------------------------------------------------------------------------
// Configuracion del driver
// ---------------------------------------------------------------------------
async function crearDriver() {
  const options = new edge.Options();
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--window-size=1280,900');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');

  return new Builder()
    .forBrowser('MicrosoftEdge')
    .setEdgeOptions(options)
    .build();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function preflight() {
  const apiOk = await fetch(API_URL + '/health')
    .then((r) => r.ok)
    .catch(() => false);
  const frontOk = await fetch(FRONTEND_URL)
    .then((r) => r.ok)
    .catch(() => false);

  if (!apiOk || !frontOk) {
    throw new Error(
      'Backend (' + API_URL + ') o frontend (' + FRONTEND_URL +
      ') no disponibles. Inicia ambos servidores antes de ejecutar la suite.'
    );
  }
}

// Reinicia el estado del navegador: limpia localStorage y vuelve a #login
async function resetEstado() {
  await driver.get(FRONTEND_URL);
  await driver.executeScript('window.localStorage.clear();');
  await driver.get(FRONTEND_URL);
}

// Inicia sesion de forma limpia y espera la cartelera
async function loginExitoso() {
  await resetEstado();
  await loginPage.login(EMAIL, PASSWORD);
  await loginPage.esperarCartelera();
}

// Va a la vista de asientos de la pelicula de prueba
async function irAAsientos() {
  await loginExitoso();
  await carteleraPage.seleccionarPelicula(PELICULA_PRUEBA);
  await reservaPage.esperarVistaAsientos();
}

// Selecciona el primer asiento libre y llega a la vista de pago.
// Devuelve el id del asiento seleccionado.
async function irAPago() {
  await irAAsientos();
  const libres = await reservaPage.obtenerAsientosLibres();
  assert(libres.length > 0, 'Debe existir al menos un asiento libre');
  const asiento = libres[0];
  await reservaPage.seleccionarAsiento(asiento);
  await reservaPage.hacerClicContinuar();
  await reservaPage.esperarVistaPago();
  return asiento;
}

// Espera hasta que el error de login contenga un texto dado
async function esperarErrorLoginCon(subcadena) {
  await driver.wait(async () => {
    const texto = await loginPage.obtenerErrorLogin();
    return texto.includes(subcadena);
  }, 10000);
}

// ---------------------------------------------------------------------------
// Registro de casos de prueba
// ---------------------------------------------------------------------------
const casos = [];

function caso(nombre, fn) {
  casos.push({ nombre, fn });
}

// ============================ LOGIN ============================
caso('1. Login con campos vacios muestra error', async () => {
  await resetEstado();
  await loginPage.hacerClicLogin();
  await driver.wait(async () => (await loginPage.obtenerErrorLogin()).length > 0, 10000);
  const error = await loginPage.obtenerErrorLogin();
  assert(error.length > 0, 'Debe mostrarse un mensaje de error');
});

caso('2. Login con credenciales invalidas', async () => {
  await resetEstado();
  await loginPage.login(EMAIL, 'claveErronea');
  await esperarErrorLoginCon('Credenciales');
  const error = await loginPage.obtenerErrorLogin();
  assert(error.includes('Credenciales'), 'Debe indicar credenciales invalidas');
});

caso('3. Bloqueo preventivo tras 3 intentos fallidos', async () => {
  await resetEstado();
  const email = 'bloqueo' + Date.now() + '@cineflex.com';

  await loginPage.login(email, 'claveErronea');
  await esperarErrorLoginCon('Credenciales');

  await loginPage.login(email, 'claveErronea');
  await esperarErrorLoginCon('Credenciales');

  await loginPage.login(email, 'claveErronea');
  await esperarErrorLoginCon('bloqueada');

  const error = await loginPage.obtenerErrorLogin();
  assert(error.includes('bloqueada'), 'La cuenta debe quedar bloqueada');
});

caso('4. Login exitoso muestra la cartelera', async () => {
  await loginExitoso();
  const visible = await driver.findElement(By.id('cartelera-view')).isDisplayed();
  assert.strictEqual(visible, true, 'La cartelera debe estar visible');
});

// ============================ CARTELERA ============================
caso('5. El titulo "Cartelera" aparece en el DOM', async () => {
  await loginExitoso();
  const titulo = await carteleraPage.obtenerTituloCartelera();
  assert.strictEqual(titulo, 'Cartelera', 'El titulo debe ser "Cartelera"');
});

caso('6. La cartelera lista peliculas', async () => {
  await loginExitoso();
  await carteleraPage.esperarPeliculas();
  const cantidad = await carteleraPage.contarPeliculas();
  assert(cantidad >= 1, 'Debe existir al menos una pelicula');
});

caso('7. Nombre de usuario visible en la barra superior', async () => {
  await loginExitoso();
  const nombre = await carteleraPage.obtenerNombreUsuario();
  assert(nombre.includes('Cliente CineFlex'), 'Debe mostrar el nombre del usuario');
});

// ============================ ASIENTOS ============================
caso('8. Seleccionar pelicula muestra la vista de asientos', async () => {
  await irAAsientos();
  const visible = await driver.findElement(By.id('asientos-view')).isDisplayed();
  assert.strictEqual(visible, true, 'La vista de asientos debe estar visible');
  const ids = await reservaPage.obtenerIdsAsientos();
  assert(ids.length > 0, 'Debe haber asientos en la grilla');
});

caso('9. Asiento ocupado no es seleccionable', async () => {
  await irAAsientos();
  const ocupados = await reservaPage.obtenerAsientosOcupados();
  assert(ocupados.length > 0, 'Debe haber asientos ocupados predefinidos');
  const ocupado = ocupados[0];
  const estaOcupado = await reservaPage.esAsientoOcupado(ocupado);
  assert.strictEqual(estaOcupado, true, 'El asiento ' + ocupado + ' debe estar marcado como ocupado');
  const deshabilitado = await reservaPage.estaAsientoDeshabilitado(ocupado);
  assert.strictEqual(deshabilitado, true, 'El asiento ocupado debe estar deshabilitado');
});

caso('10. Seleccionar asiento libre actualiza el resumen', async () => {
  await irAAsientos();
  const libres = await reservaPage.obtenerAsientosLibres();
  assert(libres.length > 0, 'Debe haber asientos libres');
  await reservaPage.seleccionarAsiento(libres[0]);
  const resumen = await reservaPage.obtenerAsientosSeleccionados();
  assert(resumen.includes(libres[0]), 'El resumen debe mostrar el asiento seleccionado');
});

caso('11. Continuar sin seleccionar asiento muestra error', async () => {
  await irAAsientos();
  await reservaPage.hacerClicContinuar();
  await driver.wait(async () => (await reservaPage.obtenerErrorAsientos()).length > 0, 10000);
  const error = await reservaPage.obtenerErrorAsientos();
  assert(error.includes('asiento'), 'Debe pedir seleccionar al menos un asiento');
});

// ============================ PAGO ============================
caso('12. Pago con tarjeta rechazada no genera ticket', async () => {
  await irAPago();
  await reservaPage.llenarPago({
    numero: '4000000000000002',
    titular: 'Cliente CineFlex',
    expiracion: '12/27',
    cvv: '123',
  });
  await reservaPage.hacerClicPagar();
  await driver.wait(async () => (await reservaPage.obtenerErrorPago()).length > 0, 10000);
  const error = await reservaPage.obtenerErrorPago();
  assert(error.includes('rechazada'), 'Debe indicar que la tarjeta fue rechazada');
});

caso('13. Pago con tarjeta invalida muestra error de validacion', async () => {
  await irAPago();
  await reservaPage.llenarPago({
    numero: '1234',
    titular: 'Cliente CineFlex',
    expiracion: '12/27',
    cvv: '123',
  });
  await reservaPage.hacerClicPagar();
  await driver.wait(async () => (await reservaPage.obtenerErrorPago()).length > 0, 10000);
  const error = await reservaPage.obtenerErrorPago();
  assert(error.includes('tarjeta'), 'Debe indicar que la tarjeta es invalida');
});

caso('14. Error del servicio de pagos se muestra al usuario', async () => {
  await irAPago();
  await reservaPage.llenarPago({
    numero: '4000000000000000',
    titular: 'Cliente CineFlex',
    expiracion: '12/27',
    cvv: '123',
  });
  await reservaPage.hacerClicPagar();
  await driver.wait(async () => (await reservaPage.obtenerErrorPago()).length > 0, 10000);
  const error = await reservaPage.obtenerErrorPago();
  assert(error.includes('pasarela'), 'Debe indicar que la pasarela no esta disponible');
});

// ============================ COMPRA COMPLETA ============================
caso('15. Flujo completo de compra genera ticket virtual', async () => {
  const asiento = await irAPago();
  await reservaPage.llenarPago({
    numero: '4242424242424242',
    titular: 'Cliente CineFlex',
    expiracion: '12/27',
    cvv: '123',
  });
  await reservaPage.hacerClicPagar();
  await reservaPage.esperarTicket();

  const codigo = await reservaPage.obtenerCodigoTicket();
  assert(/^CF-\d{6}$/.test(codigo), 'El codigo de ticket debe tener formato CF-XXXXXX');

  const pelicula = await reservaPage.obtenerTicketPelicula();
  assert.strictEqual(pelicula, TITULO_PELICULA, 'El ticket debe mostrar la pelicula correcta');

  const asientos = await reservaPage.obtenerTicketAsientos();
  assert(asientos.includes(asiento), 'El ticket debe mostrar el asiento comprado');

  const total = await reservaPage.obtenerTicketTotal();
  assert(total.startsWith('$'), 'El ticket debe mostrar el total en pesos');
});

// ============================ SESION / NAVEGACION ============================
caso('16. Cerrar sesion vuelve a la pantalla de login', async () => {
  await loginExitoso();
  await loginPage.hacerClicLogout();
  await loginPage.esperarTituloLogin();
  const loginVisible = await driver.findElement(By.id('login-view')).isDisplayed();
  assert.strictEqual(loginVisible, true, 'La vista de login debe estar visible');
});

caso('17. El boton Atras no permite volver a la cartelera protegida', async () => {
  await loginExitoso();
  await loginPage.hacerClicLogout();
  await loginPage.esperarTituloLogin();

  await driver.navigate().back();
  await driver.wait(until.elementIsVisible(await driver.findElement(By.id('login-view'))), 10000);

  const loginVisible = await driver.findElement(By.id('login-view')).isDisplayed();
  const carteleraVisible = await driver.findElement(By.id('cartelera-view')).isDisplayed();
  assert.strictEqual(loginVisible, true, 'Login debe seguir visible tras pulsar Atras');
  assert.strictEqual(carteleraVisible, false, 'La cartelera no debe ser accesible tras cerrar sesion');
});

caso('18. Acceso directo a cartelera sin token redirige al login', async () => {
  await resetEstado();
  await driver.get(FRONTEND_URL + '#cartelera');
  await loginPage.esperarTituloLogin();
  const loginVisible = await driver.findElement(By.id('login-view')).isDisplayed();
  const carteleraVisible = await driver.findElement(By.id('cartelera-view')).isDisplayed();
  assert.strictEqual(loginVisible, true, 'Debe redirigir a login');
  assert.strictEqual(carteleraVisible, false, 'La cartelera no debe estar visible sin sesion');
});

// ---------------------------------------------------------------------------
// Ejecucion principal
// ---------------------------------------------------------------------------
async function ejecutar() {
  await preflight();
  driver = await crearDriver();
  loginPage = new LoginPage(driver);
  carteleraPage = new CarteleraPage(driver);
  reservaPage = new ReservaPage(driver);

  let aprobados = 0;
  let fallidos = 0;
  const resultados = [];

  console.log('==============================================');
  console.log('  CineFlex - Suite de pruebas UI (Selenium)');
  console.log('==============================================\n');

  try {
    for (const c of casos) {
      try {
        await c.fn();
        aprobados++;
        resultados.push({ caso: c.nombre, estado: 'APROBADO' });
        console.log('  [PASO] ' + c.nombre);
      } catch (err) {
        fallidos++;
        resultados.push({ caso: c.nombre, estado: 'FALLIDO', error: err.message });
        console.log('  [FALLO] ' + c.nombre);
        console.log('          -> ' + err.message);
      }
    }
  } finally {
    await driver.quit();
  }

  console.log('\n----------------------------------------------');
  console.log('  Total de casos: ' + casos.length);
  console.log('  Aprobados:      ' + aprobados);
  console.log('  Fallidos:       ' + fallidos);
  console.log('----------------------------------------------');

  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, 'reports');
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'resultado_suite.json'),
      JSON.stringify({ total: casos.length, aprobados, fallidos, resultados }, null, 2)
    );
  } catch (e) {
    /* el reporte es opcional */
  }

  process.exit(fallidos > 0 ? 1 : 0);
}

ejecutar().catch((err) => {
  console.error('Error fatal en la suite: ' + err.message);
  process.exit(2);
});
