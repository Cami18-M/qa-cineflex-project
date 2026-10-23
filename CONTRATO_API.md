# Contrato de API — CineFlex

> Documento de referencia de la API REST mock de CineFlex. Toda respuesta es JSON
> y usa el formato consistente descrito abajo. Responsable: **Integrante 1**.

- **URL base:** `http://localhost:3000/api`
- **Formato:** `application/json`
- **Autenticación:** JWT en el encabezado `Authorization: Bearer <token>`

## Envoltura de respuestas

### Éxito
Cada endpoint devuelve su propio cuerpo (ver secciones). El login devuelve `token`
y `user`; las consultas devuelven los datos solicitados; la reserva devuelve el
objeto de reserva confirmada.

### Error
Todas las respuestas de error comparten la estructura:

```json
{ "success": false, "error": "Mensaje legible" }
```

Algunos errores incluyen campos adicionales (p. ej. `codigo`, `reintentarEnSegundos`).

## Credenciales de prueba (ficticias)

| Email | Contraseña | Notas |
|---|---|---|
| `cliente@cineflex.com` | `CineFlex123` | Usuario principal de prueba |
| `ana@cineflex.com` | `Ana1234` | Usuario secundario de prueba |

## Tarjetas de prueba (ficticias — pasarela simulada)

La pasarela decide el resultado según los **últimos 4 dígitos** del número:

| Número (16 dígitos) | Últimos 4 | Resultado |
|---|---|---|
| `4242424242424242` | `4242` | APROBADO |
| `4000000000000002` | `0002` | RECHAZADO (tarjeta rechazada) |
| `4000000000000000` | `0000` | ERROR del servicio de pagos |
| `4000000000001234` | `1234` | RESPUESTA INVÁLIDA de la pasarela |
| `1234` (o cualquier otro largo) | — | 400 (validación de datos) |

## Endpoints

### 1. Inicio de sesión

**`POST /api/auth/login`** — público

Cuerpo:

```json
{ "email": "cliente@cineflex.com", "password": "CineFlex123" }
```

Respuestas:

| Código | Caso | Cuerpo |
|---|---|---|
| `200` | Credenciales válidas | `{ "token": "<jwt>", "user": { "id", "nombre", "email" } }` |
| `400` | Faltan campos | `{ "success": false, "error": "Email y contrasena son obligatorios" }` |
| `401` | Credenciales inválidas | `{ "success": false, "error": "Credenciales invalidas" }` |
| `429` | Cuenta bloqueada | `{ "success": false, "error": "Cuenta bloqueada por intentos fallidos", "reintentarEnSegundos": 60 }` |

**Bloqueo preventivo:** tras `LOGIN_MAX_INTENTOS` (3) intentos fallidos consecutivos
sobre el mismo email, la cuenta queda bloqueada durante `LOGIN_BLOQUEO_SEG` (60 s).
Se implementa en el backend (no en JavaScript del navegador).

### 2. Consulta de cartelera

**`GET /api/cartelera`** — protegido (JWT)

Respuesta `200`:

```json
{
  "peliculas": [
    {
      "id": 1,
      "titulo": "La Ultima Estacion",
      "genero": "Ciencia Ficcion",
      "duracion": 128,
      "clasificacion": "PG-13",
      "sala": "Sala 1",
      "horarios": ["14:00", "17:30", "21:00"],
      "precio": 15000,
      "poster": "🚀"
    }
  ]
}
```

| Código | Caso |
|---|---|
| `401` | Sin token o token inválido/expirado |

### 3. Consulta de asientos disponibles

**`GET /api/peliculas/:id/asientos`** — protegido (JWT)

Respuesta `200`:

```json
{
  "peliculaId": 1,
  "titulo": "La Ultima Estacion",
  "sala": "Sala 1",
  "asientos": [
    { "id": "A1", "fila": "A", "numero": 1, "estado": "libre" },
    { "id": "A2", "fila": "A", "numero": 2, "estado": "ocupado" }
  ]
}
```

| Código | Caso |
|---|---|
| `401` | Sin token o token inválido |
| `404` | Película no encontrada |

### 4. Creación de reserva

**`POST /api/reservas`** — protegido (JWT)

Cuerpo:

```json
{
  "peliculaId": 1,
  "asientos": ["A3", "A4"],
  "tarjeta": {
    "numero": "4242424242424242",
    "titular": "Cliente CineFlex",
    "expiracion": "12/27",
    "cvv": "123"
  }
}
```

Respuesta `201` (pago aprobado):

```json
{
  "reservaId": 1,
  "estado": "CONFIRMADA",
  "codigoTicket": "CF-000001",
  "pelicula": { "id": 1, "titulo": "La Ultima Estacion", "sala": "Sala 1" },
  "asientos": ["A3", "A4"],
  "total": 30000,
  "fecha": "2026-10-20T08:42:21.097Z",
  "transaccion": { "id": "TX-1A2B3C4D5E6F", "estado": "APROBADO" }
}
```

| Código | Caso |
|---|---|
| `201` | Reserva confirmada (pago aprobado) |
| `400` | Datos inválidos (asientos vacíos, tarjeta malformada) |
| `401` | Sin token o token inválido |
| `402` | Tarjeta rechazada (`{ "codigo": "RECHAZADO", ... }`) |
| `404` | Película no encontrada |
| `409` | Asiento ya ocupado |
| `502` | Respuesta inválida de la pasarela |
| `503` | Error del servicio de pagos |

### 5. Consulta del resultado de una reserva

**`GET /api/reservas/:id`** — protegido (JWT)

Respuesta `200`: el objeto de reserva (igual que en `POST /api/reservas`).

| Código | Caso |
|---|---|
| `401` | Sin token o token inválido |
| `404` | Reserva no encontrada |

### 6. Health check (auxiliar para CI)

**`GET /api/health`** — público

Respuesta `200`:

```json
{ "status": "ok", "servicio": "CineFlex API", "timestamp": "..." }
```

## Consistencia del estado

- El estado se guarda **en memoria**: al reiniciar el servidor, usuarios, asientos,
  reservas y bloqueos vuelven a su estado inicial.
- Un asiento confirmado pasa a `ocupado` de forma atómica, evitando que dos
  reservas confirmen el mismo asiento al mismo tiempo.
