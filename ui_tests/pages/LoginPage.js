/**
 * CineFlex - LoginPage (patron Page Object Model)
 *
 * NOTA IMPORTANTE (regla del taller): esta clase SOLO contiene localizadores
 * y metodos de interaccion. NO contiene aserciones; todas las aserciones
 * viven en test_suite.js.
 */
const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;

    // Localizadores (priorizando IDs estables)
    this.emailInput = By.id('email');
    this.passwordInput = By.id('password');
    this.botonLogin = By.id('btn-login');
    this.errorLogin = By.id('login-error');
    this.tituloLogin = By.id('login-titulo');
    this.botonLogout = By.id('btn-logout');
    this.carteleraTitulo = By.id('cartelera-titulo');
  }

  // Navega a la URL base del frontend
  async abrir(url) {
    await this.driver.get(url);
  }

  async ingresarEmail(email) {
    const campo = await this.driver.findElement(this.emailInput);
    await campo.clear();
    await campo.sendKeys(email);
  }

  async ingresarPassword(password) {
    const campo = await this.driver.findElement(this.passwordInput);
    await campo.clear();
    await campo.sendKeys(password);
  }

  async hacerClicLogin() {
    await this.driver.findElement(this.botonLogin).click();
  }

  // Interaccion combinada: completa el formulario y envia
  async login(email, password) {
    await this.ingresarEmail(email);
    await this.ingresarPassword(password);
    await this.hacerClicLogin();
  }

  async esperarTituloLogin() {
    const el = await this.driver.wait(until.elementLocated(this.tituloLogin), 10000);
    await this.driver.wait(until.elementIsVisible(el), 10000);
    return el;
  }

  // Devuelve el texto del mensaje de error del login ('' si no hay)
  async obtenerErrorLogin() {
    try {
      const el = await this.driver.findElement(this.errorLogin);
      const visible = await el.isDisplayed();
      if (visible) {
        return (await el.getText()).trim();
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  // Espera a que la cartelera sea visible (indica login exitoso)
  async esperarCartelera() {
    const el = await this.driver.wait(until.elementLocated(this.carteleraTitulo), 10000);
    await this.driver.wait(until.elementIsVisible(el), 10000);
  }

  async hacerClicLogout() {
    await this.driver.findElement(this.botonLogout).click();
  }
}

module.exports = LoginPage;
