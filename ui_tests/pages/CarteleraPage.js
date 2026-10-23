/**
 * CineFlex - CarteleraPage (patron Page Object Model)
 * Localizadores y acciones de la vista de cartelera. Sin aserciones.
 */
const { By, until } = require('selenium-webdriver');

class CarteleraPage {
  constructor(driver) {
    this.driver = driver;

    this.tituloCartelera = By.id('cartelera-titulo');
    this.listaCartelera = By.id('cartelera-lista');
    this.tarjetasPelicula = By.css('#cartelera-lista .pelicula-card');
    this.botonLogout = By.id('btn-logout');
    this.usuarioNombre = By.id('user-nombre');
    this.errorCartelera = By.id('cartelera-error');
  }

  async esperarCartelera() {
    const el = await this.driver.wait(until.elementLocated(this.tituloCartelera), 10000);
    await this.driver.wait(until.elementIsVisible(el), 10000);
  }

  async obtenerTituloCartelera() {
    const el = await this.driver.findElement(this.tituloCartelera);
    return (await el.getText()).trim();
  }

  async esperarPeliculas() {
    await this.driver.wait(
      until.elementLocated(By.css('#cartelera-lista .pelicula-card')),
      10000
    );
  }

  async contarPeliculas() {
    const cards = await this.driver.findElements(this.tarjetasPelicula);
    return cards.length;
  }

  async obtenerNombreUsuario() {
    const el = await this.driver.findElement(this.usuarioNombre);
    return (await el.getText()).trim();
  }

  // Selecciona una pelicula por su id (boton con data-pelicula-id)
  async seleccionarPelicula(id) {
    const selector = `.btn-seleccionar[data-pelicula-id="${id}"]`;
    const boton = await this.driver.wait(until.elementLocated(By.css(selector)), 10000);
    await this.driver.wait(until.elementIsVisible(boton), 10000);
    await boton.click();
  }

  async hacerClicLogout() {
    await this.driver.findElement(this.botonLogout).click();
  }
}

module.exports = CarteleraPage;
