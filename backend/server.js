/**
 * CineFlex - Backend mock (API REST)
 * Taller integrador: QA en Produccion
 *
 * Responsable: Integrante 1 (backend mock y endpoints REST)
 *
 * Tecnologias: Node.js + Express + Helmet + Morgan + jsonwebtoken
 *
 * IMPORTANTE (mock): el estado (usuarios, asientos, reservas, bloqueos)
 * se guarda EN MEMORIA. Al reiniciar el servidor, los datos se reinician.
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();

// ---------------------------------------------------------------------------
// Configuracion desde variables de entorno (con valores por defecto seguros)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cineflex_secreto_dev_no_usar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const LOGIN_MAX_INTENTOS = parseInt(process.env.LOGIN_MAX_INTENTOS || '3', 10);
const LOGIN_BLOQUEO_SEG = parseInt(process.env.LOGIN_BLOQUEO_SEG || '60', 10);

// ---------------------------------------------------------------------------
// Middlewares globales
// ---------------------------------------------------------------------------
app.use(helmet());                       // protege los encabezados HTTP
app.use(morgan('dev'));                  // trazabilidad de peticiones en consola
app.use(cors());                         // permite que el frontend consuma la API
app.use(express.json());                 // parseo de JSON en el body

// ---------------------------------------------------------------------------
// Datos ficticios (en memoria)
// ---------------------------------------------------------------------------
const usuarios = [
  { id: 1, nombre: 'Cliente CineFlex', email: 'cliente@cineflex.com', password: 'CineFlex123' },
  { id: 2, nombre: 'Ana Perez', email: 'ana@cineflex.com', password: 'Ana1234' },
];

const peliculas = [
  {
    id: 1,
    titulo: 'La Ultima Estacion',
    genero: 'Ciencia Ficcion',
    duracion: 128,
    clasificacion: 'PG-13',
    sala: 'Sala 1',
    horarios: ['14:00', '17:30', '21:00'],
    precio: 15000,
    poster: '🚀',
  },
  {
    id: 2,
    titulo: 'Horizonte Rojo',
    genero: 'Drama',
    duracion: 115,
    clasificacion: 'B',
    sala: 'Sala 2',
    horarios: ['13:15', '16:45', '20:15'],
    precio: 14000,
    poster: '🌇',
  },
  {
    id: 3,
    titulo: 'El Codigo del Tiempo',
    genero: 'Suspenso',
    duracion: 134,
    clasificacion: 'B',
    sala: 'Sala 3',
    horarios: ['15:00', '18:30', '22:00'],
    precio: 16000,
    poster: '⏳',
  },
  {
    id: 4,
    titulo: 'Sombras del Alba',
    genero: 'Terror',
    duracion: 102,
    clasificacion: 'C',
    sala: 'Sala 4',
    horarios: ['19:00', '21:30'],
    precio: 15000,
    poster: '🌒',
  },
  {
    id: 5,
    titulo: 'Nebulosa',
    genero: 'Animacion',
    duracion: 96,
    clasificacion: 'A',
    sala: 'Sala 5',
    horarios: ['11:00', '14:30', '17:00'],
    precio: 13000,
    poster: '✨',
  },
];

// Asientos: 5 filas (A-E) x 10 columnas = 50 asientos por sala
const FILAS = ['A', 'B', 'C', 'D', 'E'];
const COLUMNAS = 10;

function generarAsientos() {
  const asientos = [];
  for (const fila of FILAS) {
    for (let col = 1; col <= COLUMNAS; col++) {
      asientos.push({ id: `${fila}${col}`, fila, numero: col, estado: 'libre' });
    }
  }
  return asientos;
}

const asientosPorPelicula = {};
for (const pelicula of peliculas) {
  asientosPorPelicula[pelicula.id] = generarAsientos();
}

// Asientos pre-ocupados para la pelicula 1 (para probar el caso "asiento ocupado")
['A1', 'A2', 'B5', 'C3'].forEach((id) => {
  const asiento = asientosPorPelicula[1].find((a) => a.id === id);
  if (asiento) asiento.estado = 'ocupado';
});

// Estado de reservas y bloqueo de login (en memoria)
let contadorReservas = 1;
const reservas = [];
const intentosFallidos = {}; // { email: { count, bloqueadoHasta } }

// ---------------------------------------------------------------------------
// STUB de la pasarela de pagos (simula la respuesta del banco)
// Reglas segun los ultimos 4 digitos del numero de tarjeta:
//   4242 -> APROBADO
//   0002 -> RECHAZADO (tarjeta rechazada por el banco)
//   0000 -> ERROR del servicio de pagos (indisponible)
//   1234 -> RESPUESTA INVALIDA de la pasarela
//   otros -> APROBADO (comportamiento por defecto del mock)
// ---------------------------------------------------------------------------
function procesarPago(tarjeta) {
  const numero = String(tarjeta.numero).replace(/\s+/g, '');
  const ultimos4 = numero.slice(-4);

  switch (ultimos4) {
    case '0002':
      return { aprobado: false, codigo: 'RECHAZADO', mensaje: 'Tarjeta rechazada por el banco emisor' };
    case '0000':
      return { errorServicio: true, mensaje: 'La pasarela de pagos no esta disponible' };
    case '1234':
      return { respuestaInvalida: true, mensaje: 'Respuesta invalida de la pasarela de pagos' };
    default:
      return {
        aprobado: true,
        codigo: 'APROBADO',
        mensaje: 'Pago aprobado',
        transaccionId: 'TX-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
      };
  }
}

function validarTarjeta(tarjeta) {
  if (!tarjeta || typeof tarjeta !== 'object') return 'Datos de tarjeta no proporcionados';
  const numero = String(tarjeta.numero || '').replace(/\s+/g, '');
  if (!/^\d{16}$/.test(numero)) return 'Numero de tarjeta invalido (debe tener 16 digitos)';
  if (!tarjeta.titular || String(tarjeta.titular).trim().length < 3) return 'Titular de la tarjeta invalido';
  if (!/^\d{2}\/\d{2}$/.test(String(tarjeta.expiracion || '').trim())) return 'Fecha de expiracion invalida (formato MM/YY)';
  if (!/^\d{3,4}$/.test(String(tarjeta.cvv || '').trim())) return 'CVV invalido';
  return null;
}

// ---------------------------------------------------------------------------
// Middleware de autenticacion (valida el JWT)
// ---------------------------------------------------------------------------
function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de autenticacion requerido' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token invalido o expirado' });
  }
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

// Health check publico (util para el pipeline de CI)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'CineFlex API', timestamp: new Date().toISOString() });
});

// 1) Login (obtiene el JWT de prueba)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email y contrasena son obligatorios' });
  }

  const emailKey = String(email).toLowerCase();
  const registro = intentosFallidos[emailKey];


  // Verificar bloqueo activo
  if (registro && registro.bloqueadoHasta && Date.now() < registro.bloqueadoHasta) {
    const reintentarEn = Math.ceil((registro.bloqueadoHasta - Date.now()) / 1000);
    return res.status(429).json({
      success: false,
      error: 'Cuenta bloqueada por intentos fallidos',
      reintentarEnSegundos: reintentarEn,
    });
  }

  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === emailKey && u.password === password
  );

  if (!usuario) {
    const reg = intentosFallidos[emailKey] || { count: 0, bloqueadoHasta: 0 };
    reg.count += 1;

    if (reg.count >= LOGIN_MAX_INTENTOS) {
      reg.bloqueadoHasta = Date.now() + LOGIN_BLOQUEO_SEG * 1000;
      reg.count = 0;
      intentosFallidos[emailKey] = reg;
      return res.status(429).json({
        success: false,
        error: 'Cuenta bloqueada por intentos fallidos',
        reintentarEnSegundos: LOGIN_BLOQUEO_SEG,
      });
    }

    intentosFallidos[emailKey] = reg;
    return res.status(401).json({ success: false, error: 'Credenciales invalidas' });
  }

  // Login exitoso: reiniciar contador de intentos
  delete intentosFallidos[emailKey];

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({
    token,
    user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  });
});

// 2) Cartelera (protegida)
app.get('/api/cartelera', autenticar, (req, res) => {
  // No se expone informacion interna; solo campos utiles para el frontend
  const cartelera = peliculas.map(({ id, titulo, genero, duracion, clasificacion, sala, horarios, precio, poster }) => ({
    id,
    titulo,
    genero,
    duracion,
    clasificacion,
    sala,
    horarios,
    precio,
    poster,
  }));
  res.json({ peliculas: cartelera });
});

// 3) Consulta de asientos disponibles (protegida)
app.get('/api/peliculas/:id/asientos', autenticar, (req, res) => {
  const peliculaId = Number(req.params.id);
  const pelicula = peliculas.find((p) => p.id === peliculaId);

  if (!pelicula) {
    return res.status(404).json({ success: false, error: 'Pelicula no encontrada' });
  }

  const asientos = asientosPorPelicula[peliculaId];
  res.json({
    peliculaId,
    titulo: pelicula.titulo,
    sala: pelicula.sala,
    asientos,
  });
});

// 4) Creacion de reservas (protegida)
app.post('/api/reservas', autenticar, (req, res) => {
  const { peliculaId, asientos, tarjeta } = req.body || {};

  const pelicula = peliculas.find((p) => p.id === Number(peliculaId));
  if (!pelicula) {
    return res.status(404).json({ success: false, error: 'Pelicula no encontrada' });
  }

  if (!Array.isArray(asientos) || asientos.length === 0) {
    return res.status(400).json({ success: false, error: 'Debe seleccionar al menos un asiento' });
  }

  const errorTarjeta = validarTarjeta(tarjeta);
  if (errorTarjeta) {
    return res.status(400).json({ success: false, error: errorTarjeta });
  }

  // Verificar disponibilidad de los asientos (evita doble confirmacion)
  const estadoAsientos = asientosPorPelicula[pelicula.id];
  for (const id of asientos) {
    const asiento = estadoAsientos.find((a) => a.id === id);
    if (!asiento) {
      return res.status(400).json({ success: false, error: `El asiento ${id} no existe` });
    }
    if (asiento.estado === 'ocupado') {
      return res.status(409).json({ success: false, error: `El asiento ${id} ya esta ocupado` });
    }
  }

  // Procesar el pago a traves del stub de la pasarela
  const resultado = procesarPago(tarjeta);
  if (resultado.errorServicio) {
    return res.status(503).json({ success: false, error: resultado.mensaje });
  }
  if (resultado.respuestaInvalida) {
    return res.status(502).json({ success: false, error: resultado.mensaje });
  }
  if (!resultado.aprobado) {
    return res.status(402).json({ success: false, error: resultado.mensaje, codigo: resultado.codigo });
  }

  // Confirmar: marcar asientos como ocupados (operacion atomica en memoria)
  for (const id of asientos) {
    const asiento = estadoAsientos.find((a) => a.id === id);
    asiento.estado = 'ocupado';
  }

  const reservaId = contadorReservas++;
  const reserva = {
    reservaId,
    estado: 'CONFIRMADA',
    codigoTicket: 'CF-' + String(reservaId).padStart(6, '0'),
    pelicula: { id: pelicula.id, titulo: pelicula.titulo, sala: pelicula.sala },
    asientos: asientos.slice().sort(),
    total: pelicula.precio * asientos.length,
    fecha: new Date().toISOString(),
    transaccion: { id: resultado.transaccionId, estado: resultado.codigo },
  };

  reservas.push(reserva);
  return res.status(201).json(reserva);
});

// 5) Consulta del resultado de una reserva (protegida)
app.get('/api/reservas/:id', autenticar, (req, res) => {
  const reservaId = Number(req.params.id);
  const reserva = reservas.find((r) => r.reservaId === reservaId);

  if (!reserva) {
    return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
  }

  return res.json(reserva);
});

// ---------------------------------------------------------------------------
// Manejo de rutas no existentes y errores
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Middleware de manejo de errores (centralizado)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[CineFlex] Error no controlado:', err.message);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

// ---------------------------------------------------------------------------
// Inicio del servidor
// ---------------------------------------------------------------------------
if (require.main === module) {
  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[CineFlex] API disponible en http://localhost:${PORT}`);
    console.log(`[CineFlex] Health check: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // eslint-disable-next-line no-console
      console.error(`[CineFlex] ERROR: el puerto ${PORT} ya esta en uso.`);
      console.error('Deten el proceso que lo ocupa o arranca con otro puerto:');
      console.error('  PowerShell: Get-NetTCPConnection -LocalPort ' + PORT + ' -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }');
      console.error('  o usa:     $env:PORT=3001; npm start');
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.error('[CineFlex] Error al iniciar el servidor:', err.message);
    process.exit(1);
  });
}

module.exports = app;
