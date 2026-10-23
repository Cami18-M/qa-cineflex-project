/**
 * CineFlex - ReservaPage (patron Page Object Model)
 * Localizadores y acciones del flujo asientos -> pago -> ticket. Sin aserciones.
 */
const { By, until } = require('selenium-webdriver');

class ReservaPage {
  constructor(driver) {
    this.driver = driver;

    // Asientos
    this.tituloAsientos = By.id('asientos-titulo');
    this.contenedorAsientos = By.id('asientos-container');
    this.asientosSeleccionados = By.id('asientos-seleccionados');
    this.asientosTotal = By.id('asientos-total');
    this.errorAsientos = By.id('asientos-error');
    this.botonContinuar = By.id('btn-continuar-pago');
    this.botonVolverCartelera = By.id('btn-volver-cartelera');

    // Pago
    this.tituloPago = By.id('pago-titulo');
    this.campoNumero = By.id('card-numero');
    this.campoTitular = By.id('card-titular');
    this.campoExpiracion = By.id('card-expiracion');
    this.campoCvv = By.id('card-cvv');
    this.botonPagar = By.id('btn-pagar');
    this.errorPago = By.id('pago-error');

    // Ticket
    this.ticket = By.id('ticket');
    this.ticketCodigo = By.id('ticket-codigo');
    this.ticketPelicula = By.id('ticket-pelicula');
    this.ticketAsientos = By.id('ticket-asientos');
    this.ticketTotal = By.id('ticket-total');
    this.botonNuevaCompra = By.id('btn-nueva-compra');
  }

  async esperarVistaAsientos() {
    const vista = await this.driver.wait(until.elementLocated(By.id('asientos-view')), 10000);
    await this.driver.wait(until.elementIsVisible(vista), 10000);
    await this.driver.wait(until.elementLocated(By.css('#asientos-container .asiento')), 10000);
  }

  // Devuelve el localizador CSS de un asiento concreto
  localizadorAsiento(id) {
    return By.css(`.asiento[data-asiento="${id}"]`);
  }

  async esAsientoOcupado(id) {
    const el = await this.driver.findElement(this.localizadorAsiento(id));
    const clases = await el.getAttribute('class');
    return clases.split(' ').includes('ocupado');
  }

  async estaAsientoDeshabilitado(id) {
    const el = await this.driver.findElement(this.localizadorAsiento(id));
    return !(await el.isEnabled());
  }

  async seleccionarAsiento(id) {
    const el = await this.driver.findElement(this.localizadorAsiento(id));
    await el.click();
  }

  // Devuelve los IDs de los asientos visibles en la grilla
  async obtenerIdsAsientos() {
    const elementos = await this.driver.findElements(By.css('.asiento'));
    const ids = [];
    for (const el of elementos) {
      ids.push(await el.getAttribute('data-asiento'));
    }
    return ids;
  }

  async obtenerAsientosLibres() {
    const elementos = await this.driver.findElements(By.css('.asiento.libre'));
    const ids = [];
    for (const el of elementos) {
      ids.push(await el.getAttribute('data-asiento'));
    }
    return ids;
  }

  async obtenerAsientosOcupados() {
    const elementos = await this.driver.findElements(By.css('.asiento.ocupado'));
    const ids = [];
    for (const el of elementos) {
      ids.push(await el.getAttribute('data-asiento'));
    }
    return ids;
  }

  async obtenerAsientosSeleccionados() {
    const el = await this.driver.findElement(this.asientosSeleccionados);
    return (await el.getText()).trim();
  }

  async hacerClicContinuar() {
    await this.driver.findElement(this.botonContinuar).click();
  }

  async obtenerErrorAsientos() {
    try {
      const el = await this.driver.findElement(this.errorAsientos);
      const visible = await el.isDisplayed();
      return visible ? (await el.getText()).trim() : '';
    } catch (e) {
      return '';
    }
  }

  async esperarVistaPago() {
    const el = await this.driver.wait(until.elementLocated(By.id('pago-view')), 10000);
    await this.driver.wait(until.elementIsVisible(el), 10000);
  }

  async llenarPago({ numero, titular, expiracion, cvv }) {
    await this.driver.findElement(this.campoNumero).sendKeys(numero);
    await this.driver.findElement(this.campoTitular).sendKeys(titular);
    await this.driver.findElement(this.campoExpiracion).sendKeys(expiracion);
    await this.driver.findElement(this.campoCvv).sendKeys(cvv);
  }

  async hacerClicPagar() {
    await this.driver.findElement(this.botonPagar).click();
  }

  async obtenerErrorPago() {
    try {
      const el = await this.driver.findElement(this.errorPago);
      const visible = await el.isDisplayed();
      return visible ? (await el.getText()).trim() : '';
    } catch (e) {
      return '';
    }
  }

  async esperarTicket() {
    const el = await this.driver.wait(until.elementLocated(By.id('ticket-view')), 10000);
    await this.driver.wait(until.elementIsVisible(el), 10000);
  }

  async obtenerCodigoTicket() {
    const el = await this.driver.findElement(this.ticketCodigo);
    return (await el.getText()).trim();
  }

  async obtenerTicketPelicula() {
    const el = await this.driver.findElement(this.ticketPelicula);
    return (await el.getText()).trim();
  }

  async obtenerTicketAsientos() {
    const el = await this.driver.findElement(this.ticketAsientos);
    return (await el.getText()).trim();
  }

  async obtenerTicketTotal() {
    const el = await this.driver.findElement(this.ticketTotal);
    return (await el.getText()).trim();
  }

  async hacerClicNuevaCompra() {
    await this.driver.findElement(this.botonNuevaCompra).click();
  }
}

module.exports = ReservaPage;
