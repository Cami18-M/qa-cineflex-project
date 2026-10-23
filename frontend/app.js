/**
 * CineFlex - Logica del frontend
 * Consume la API REST real del backend (http://localhost:3000/api).
 * Responsable: Integrante 2 (frontend + integracion con la API).
 */

const API_BASE = 'http://localhost:3000/api';

const RUTAS_PROTEGIDAS = ['#cartelera', '#asientos', '#pago', '#ticket'];

const estado = {
  token: null,
  usuario: null,
  peliculas: [],
  peliculaActual: null,
  asientos: [],
  seleccionados: [],
  reserva: null,
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function getToken() {
  return localStorage.getItem('cineflex_token') || null;
}

function setToken(token) {
  estado.token = token;
  if (token) {
    localStorage.setItem('cineflex_token', token);
  } else {
    localStorage.removeItem('cineflex_token');
  }
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('cineflex_usuario') || 'null');
  } catch (e) {
    return null;
  }
}

function setUser(usuario) {
  estado.usuario = usuario;
  if (usuario) {
    localStorage.setItem('cineflex_usuario', JSON.stringify(usuario));
  } else {
    localStorage.removeItem('cineflex_usuario');
  }
}

function mostrarVista(id) {
  $$('.view').forEach((v) => v.classList.add('hidden'));
  const vista = $('#' + id);
  if (vista) vista.classList.remove('hidden');
  window.scrollTo(0, 0);
}

function ocultarErrores() {
  $$('.alert').forEach((a) => a.classList.add('hidden'));
}

function mostrarError(id, mensaje) {
  const el = $('#' + id);
  if (el) {
    el.textContent = mensaje;
    el.classList.remove('hidden');
  }
}

function formatearPrecio(valor) {
  return '$' + Number(valor).toLocaleString('es-CO');
}

async function api(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const respuesta = await fetch(API_BASE + path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }

  return { status: respuesta.status, ok: respuesta.ok, data: datos };
}

function sesionExpirada(status) {
  if (status === 401) {
    cerrarSesion();
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Router (navegacion protegida)
// ---------------------------------------------------------------------------
function router() {
  const hash = location.hash || '#login';
  const esProtegida = RUTAS_PROTEGIDAS.includes(hash);
  const token = getToken();

  if (esProtegida && !token) {
    // Impide acceder a contenido privado sin sesion (incluye el boton Atras)
    location.replace('#login');
    renderLogin();
    return;
  }

  actualizarTopbar();

  switch (hash) {
    case '#cartelera':
      renderCartelera();
      break;
    case '#asientos':
      renderAsientos();
      break;
    case '#pago':
      renderPago();
      break;
    case '#ticket':
      renderTicket();
      break;
    default:
      if (token) {
        location.replace('#cartelera');
      } else {
        location.replace('#login');
        renderLogin();
      }
  }
}

function actualizarTopbar() {
  const usuario = getUser();
  const nombre = $('#user-nombre');
  const logout = $('#btn-logout');
  if (usuario) {
    nombre.textContent = 'Hola, ' + usuario.nombre;
    logout.classList.remove('hidden');
  } else {
    nombre.textContent = '';
    logout.classList.add('hidden');
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
function renderLogin() {
  mostrarVista('login-view');
  ocultarErrores();
  $('#email').value = '';
  $('#password').value = '';
}

async function manejarLogin(evento) {
  evento.preventDefault();
  ocultarErrores();

  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (!email || !password) {
    mostrarError('login-error', 'Por favor ingresa tu correo y contraseña.');
    return;
  }

  const btn = $('#btn-login');
  btn.disabled = true;
  $('#login-label').textContent = 'Ingresando…';

  try {
    const respuesta = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (respuesta.ok) {
      setToken(respuesta.data.token);
      setUser(respuesta.data.user);
      location.hash = '#cartelera';
    } else if (respuesta.status === 429) {
      const seg = respuesta.data.reintentarEnSegundos || 60;
      mostrarError('login-error', 'Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ' + seg + ' segundos.');
    } else if (respuesta.status === 401) {
      mostrarError('login-error', 'Credenciales inválidas. Verifica tu correo y contraseña.');
    } else {
      mostrarError('login-error', (respuesta.data && respuesta.data.error) || 'Error al iniciar sesión.');
    }
  } catch (e) {
    mostrarError('login-error', 'No se pudo conectar con el servidor.');
  } finally {
    btn.disabled = false;
    $('#login-label').textContent = 'Ingresar';
  }
}

// ---------------------------------------------------------------------------
// Cartelera
// ---------------------------------------------------------------------------
async function renderCartelera() {
  mostrarVista('cartelera-view');
  ocultarErrores();

  const lista = $('#cartelera-lista');
  lista.innerHTML = '';

  const respuesta = await api('/cartelera');
  if (sesionExpirada(respuesta.status)) return;

  if (!respuesta.ok) {
    mostrarError('cartelera-error', 'No se pudo cargar la cartelera.');
    return;
  }

  estado.peliculas = respuesta.data.peliculas || [];
  renderPeliculas();
}

function renderPeliculas() {
  const lista = $('#cartelera-lista');
  lista.innerHTML = '';

  estado.peliculas.forEach((pelicula) => {
    const card = document.createElement('article');
    card.className = 'pelicula-card';
    card.setAttribute('data-pelicula-id', pelicula.id);

    card.innerHTML =
      '<div class="pelicula-poster">' + (pelicula.poster || '🎬') + '</div>' +
      '<div class="pelicula-info">' +
      '<h2 class="pelicula-titulo">' + pelicula.titulo + '</h2>' +
      '<div class="pelicula-meta">' + pelicula.genero + ' · ' + pelicula.duracion + ' min</div>' +
      '<div class="pelicula-meta">' + pelicula.clasificacion + ' · ' + pelicula.sala + '</div>' +
      '<div class="pelicula-precio">' + formatearPrecio(pelicula.precio) + '</div>' +
      '<button class="btn btn-primary btn-seleccionar" type="button" data-pelicula-id="' + pelicula.id + '">Seleccionar</button>' +
      '</div>';

    lista.appendChild(card);
  });
}

function seleccionarPelicula(id) {
  estado.peliculaActual = estado.peliculas.find((p) => p.id === id) || null;
  estado.seleccionados = [];
  if (estado.peliculaActual) {
    location.hash = '#asientos';
  }
}

// ---------------------------------------------------------------------------
// Asientos
// ---------------------------------------------------------------------------
async function renderAsientos() {
  const pelicula = estado.peliculaActual;
  if (!pelicula) {
    location.replace('#cartelera');
    return;
  }

  mostrarVista('asientos-view');
  ocultarErrores();

  $('#asientos-pelicula').textContent = pelicula.titulo;
  $('#asientos-sala').textContent = pelicula.sala;
  $('#asientos-seleccionados').textContent = 'Ninguno';
  $('#asientos-total').textContent = '$0';

  const contenedor = $('#asientos-container');
  contenedor.innerHTML = '';

  const respuesta = await api('/peliculas/' + pelicula.id + '/asientos');
  if (sesionExpirada(respuesta.status)) return;

  if (!respuesta.ok) {
    mostrarError('asientos-error', 'No se pudo cargar la disponibilidad de asientos.');
    return;
  }

  estado.asientos = respuesta.data.asientos || [];
  renderAsientosGrid();
}

function renderAsientosGrid() {
  const contenedor = $('#asientos-container');
  contenedor.innerHTML = '';

  estado.asientos.forEach((asiento) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'asiento ' + asiento.estado;
    boton.setAttribute('data-asiento', asiento.id);
    boton.setAttribute('aria-label', 'Asiento ' + asiento.id);
    boton.textContent = asiento.id;

    if (asiento.estado === 'ocupado') {
      boton.disabled = true;
    } else {
      boton.addEventListener('click', () => alternarAsiento(asiento.id));
    }

    contenedor.appendChild(boton);
  });
}

function alternarAsiento(id) {
  const asiento = estado.asientos.find((a) => a.id === id);
  if (!asiento || asiento.estado === 'ocupado') return;

  const indice = estado.seleccionados.indexOf(id);
  if (indice >= 0) {
    estado.seleccionados.splice(indice, 1);
  } else {
    estado.seleccionados.push(id);
  }

  actualizarSeleccion();
  resaltarAsientos();
}

function actualizarSeleccion() {
  const resumen = $('#asientos-seleccionados');
  const total = $('#asientos-total');

  if (estado.seleccionados.length === 0) {
    resumen.textContent = 'Ninguno';
    total.textContent = '$0';
  } else {
    resumen.textContent = estado.seleccionados.slice().sort().join(', ');
    total.textContent = formatearPrecio(estado.peliculaActual.precio * estado.seleccionados.length);
  }
}

function resaltarAsientos() {
  $$('.asiento').forEach((boton) => {
    const id = boton.getAttribute('data-asiento');
    if (estado.seleccionados.includes(id)) {
      boton.classList.add('seleccionado');
      boton.classList.remove('libre');
    } else if (boton.classList.contains('seleccionado')) {
      boton.classList.remove('seleccionado');
      boton.classList.add('libre');
    }
  });
}

function continuarAlPago() {
  ocultarErrores();
  if (estado.seleccionados.length === 0) {
    mostrarError('asientos-error', 'Debes seleccionar al menos un asiento.');
    return;
  }
  location.hash = '#pago';
}

// ---------------------------------------------------------------------------
// Pago
// ---------------------------------------------------------------------------
function renderPago() {
  if (!estado.peliculaActual || estado.seleccionados.length === 0) {
    location.replace('#asientos');
    return;
  }

  mostrarVista('pago-view');
  ocultarErrores();

  $('#pago-resumen').textContent =
    'Resumen: ' + estado.peliculaActual.titulo + ' — Asientos ' +
    estado.seleccionados.slice().sort().join(', ') + ' — Total ' +
    formatearPrecio(estado.peliculaActual.precio * estado.seleccionados.length);
}

async function manejarPago(evento) {
  evento.preventDefault();
  ocultarErrores();

  const numero = $('#card-numero').value.replace(/\s+/g, '');
  const titular = $('#card-titular').value.trim();
  const expiracion = $('#card-expiracion').value.trim();
  const cvv = $('#card-cvv').value.trim();

  if (!numero || !titular || !expiracion || !cvv) {
    mostrarError('pago-error', 'Completa todos los campos de la tarjeta.');
    return;
  }

  const btn = $('#btn-pagar');
  btn.disabled = true;

  try {
    const respuesta = await api('/reservas', {
      method: 'POST',
      body: {
        peliculaId: estado.peliculaActual.id,
        asientos: estado.seleccionados,
        tarjeta: { numero, titular, expiracion, cvv },
      },
    });

    if (respuesta.ok) {
      estado.reserva = respuesta.data;
      location.hash = '#ticket';
    } else {
      const mensaje = respuesta.data && respuesta.data.error
        ? respuesta.data.error
        : 'No se pudo procesar el pago.';
      mostrarError('pago-error', mensaje);
    }
  } catch (e) {
    mostrarError('pago-error', 'No se pudo conectar con el servidor.');
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------
function renderTicket() {
  const reserva = estado.reserva;
  if (!reserva) {
    location.replace('#cartelera');
    return;
  }

  mostrarVista('ticket-view');
  ocultarErrores();

  $('#ticket-pelicula').textContent = reserva.pelicula.titulo;
  $('#ticket-sala').textContent = reserva.pelicula.sala;
  $('#ticket-asientos').textContent = reserva.asientos.join(', ');
  $('#ticket-total').textContent = formatearPrecio(reserva.total);
  $('#ticket-fecha').textContent = new Date(reserva.fecha).toLocaleString('es-CO');
  $('#ticket-codigo').textContent = reserva.codigoTicket;
}

function nuevaCompra() {
  estado.seleccionados = [];
  estado.reserva = null;
  location.hash = '#cartelera';
}

// ---------------------------------------------------------------------------
// Cierre de sesion
// ---------------------------------------------------------------------------
function cerrarSesion() {
  setToken(null);
  setUser(null);
  estado.peliculaActual = null;
  estado.seleccionados = [];
  estado.reserva = null;
  actualizarTopbar();
  // location.replace evita que el boton "Atras" vuelva a una vista protegida
  location.replace('#login');
  renderLogin();
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const tokenGuardado = getToken();
  if (tokenGuardado) {
    setToken(tokenGuardado);
  }
  router();

  $('#login-form').addEventListener('submit', manejarLogin);
  $('#btn-logout').addEventListener('click', cerrarSesion);
  $('#btn-continuar-pago').addEventListener('click', continuarAlPago);
  $('#btn-volver-cartelera').addEventListener('click', () => { location.hash = '#cartelera'; });
  $('#btn-volver-asientos').addEventListener('click', () => { location.hash = '#asientos'; });
  $('#pago-form').addEventListener('submit', manejarPago);
  $('#btn-nueva-compra').addEventListener('click', nuevaCompra);

  $('#cartelera-lista').addEventListener('click', (evento) => {
    const boton = evento.target.closest('.btn-seleccionar');
    if (boton) {
      seleccionarPelicula(Number(boton.getAttribute('data-pelicula-id')));
    }
  });
});

window.addEventListener('hashchange', router);
