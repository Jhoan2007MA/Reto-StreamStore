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
npm run dev
```

Llena en `.env` al menos `DB_PASSWORD`, `JWT_SECRET` y `JWT_REFRESH_SECRET`. En producción los secretos JWT son obligatorios. `CLIENT_URL` acepta varias URL separadas por comas.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor con recarga (`tsx watch src/server.ts`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/server.js` |
| `npm run type-check` | Verifica tipos sin compilar |

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

Usuario inicial: `admin@streamstore.com` / `Admin123*`. Cámbialo después del primer inicio de sesión.

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
