# StreamStore API

Backend de StreamStore con Node + Express 5 + TypeScript + MySQL.

## Requisitos

- Node v24.19.0 (ver `.nvmrc`)
- MySQL 8

## Instalación

```bash
nvm use
npm install
cp .env.example .env
mysql -u root -p < database/streamStoreDb.sql
for f in database/migrations/*.sql; do mysql -u root -p < "$f"; done
npm run seed
npm run dev
```

Llena en `.env` al menos `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` y `CREDENTIALS_SECRET` (puedes generarlo con `openssl rand -hex 32`). En producción esos secretos son obligatorios. `CREDENTIALS_SECRET` cifra las contraseñas de las cuentas de streaming: si cambia, las ya guardadas no se pueden descifrar. `CLIENT_URL` acepta varias URL separadas por comas.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor con recarga (`tsx watch src/server.ts`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/server.js` |
| `npm run type-check` | Verifica tipos sin compilar |
| `npm run seed` | Carga los datos semilla (se puede correr varias veces sin duplicar) |

## Endpoints

Base: `http://localhost:3000/api`

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servidor y de la base de datos |
| POST | `/auth/register` | Registra un cliente (`nombre`, `correo`, `telefono` opcional, `contrasena` de 8+ caracteres con letra y número) y deja la sesión iniciada |
| POST | `/auth/login` | Inicia sesión (`correo`, `contrasena`); deja `accessToken` y `refreshToken` en cookies httpOnly |
| POST | `/auth/refresh` | Renueva la sesión con la cookie `refreshToken` |
| POST | `/auth/logout` | Cierra la sesión y borra las cookies |
| GET | `/auth/me` | Usuario autenticado (cookie o `Authorization: Bearer <token>`) |
| GET | `/plataformas` | Plataformas activas (público) |
| GET | `/productos` | Catálogo con stock (público). Filtros `plataforma` (id), `tipo` (`cuenta` o `pantalla`), `page`, `limit` |
| GET | `/productos/:id` | Detalle de un producto con su stock (público) |

| GET | `/carrito` | Cliente. Ítems con subtotal, stock actual y `stockSuficiente`; además `total`, `cantidadTotal` (para el contador) y `puedePagar` |
| POST | `/carrito` | Cliente. Agrega `{ productoId, cantidad }` (cantidad por defecto 1). Si el producto ya está, suma la cantidad |
| PATCH | `/carrito/:id` | Cliente. Cambia la cantidad de un ítem (`{ cantidad }`) |
| DELETE | `/carrito/:id` | Cliente. Quita un ítem |
| DELETE | `/carrito` | Cliente. Vacía el carrito |
| POST | `/admin/cuentas` | Admin. Carga una cuenta (`plataformaId`, `correoAcceso`, `contrasenaAcceso`); crea sus pantallas según `maxPantallas` de la plataforma con PIN aleatorio |
| GET | `/admin/cuentas` | Admin. Inventario con estado de cada cuenta y sus pantallas. Filtros `plataforma` (id), `estado` (`disponible`, `parcial`, `vendida`, `inactiva`), `page`, `limit` |

El stock se calcula por plataforma y modalidad: **cuenta completa** = cuentas activas sin pantallas vendidas; **pantalla** = pantallas disponibles en cuentas activas que no estén vendidas completas. Con stock 0 el producto sale con `agotado: true`.

El carrito no aparta stock: valida al agregar y al cambiar cantidades, sumando los productos que comparten stock (misma plataforma y modalidad, distinta duración). Todas las rutas del carrito devuelven el carrito completo actualizado.

Las contraseñas de las cuentas de streaming se guardan cifradas con AES-256-GCM y nunca se devuelven en el inventario; solo se descifran para el dueño del servicio.

## Datos semilla

`npm run seed` carga datos ficticios para probar y para la demo:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin@streamstore.com` | `Admin123*` | Superadmin |
| `cliente1@streamstore.com` | `Cliente123*` | Cliente |
| `cliente2@streamstore.com` | `Cliente123*` | Cliente |

- 4 plataformas: Netflix (5 pantallas), Disney+ (4), Prime Video (3) y Max (5).
- 2 productos por plataforma (cuenta completa y pantalla) a 30 días.
- 3 cuentas por plataforma con sus pantallas; correos `<plataforma><n>@demo.streamstore.test`.
- `cliente1` tiene una pantalla de Netflix que vence en 3 días y una de Disney+ que vence en 1 día (para probar los correos).
- `cliente2` tiene 2 pantallas de Max activas y una de Prime Video vencida.
- Max cuenta completa queda con stock 1 (para probar la validación del carrito).

Las fechas de vencimiento se calculan desde el día en que se corre la semilla.

## Estructura

```
database/          esquema base y migraciones
src/config/        variables de entorno, conexión y Zod en español
src/routes/        rutas por dominio
src/controllers/   leen la petición y responden
src/services/      reglas de negocio
src/repositories/  queries con Sequelize
src/models/        tablas mapeadas con decoradores
src/validators/    esquemas Zod
src/middlewares/   auth, roles, validación, 404 y errores
src/constants/     códigos de estado y roles
src/utils/         respuestas, errores, paginación, logger y formatos
```
