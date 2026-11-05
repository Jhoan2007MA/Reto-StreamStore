# StreamStore API

Backend en Node 24 + Express 5 + TypeScript estricto + Sequelize (MySQL `streamStoreDb`).

## Arquitectura en capas

Route → Middlewares (AuthMiddleware, validateSchema) → Controller → Service → Repository → Model.
Cada capa solo habla con la de abajo.

- **Route**: método + URL + middlewares. Sin lógica.
- **Validator**: esquemas Zod y tipos con `z.infer`. No consulta la BD.
- **Controller**: métodos estáticos, cada uno en `try/catch`, responde con `ApiResponse`. Crea su service una vez: `const service = new XxxService(new XxxRepository())`.
- **Service**: reglas de negocio; lanza `HttpError(mensaje, status)` (404 no existe, 409 duplicado, 403 sin permiso/inactivo, 400 regla). No usa `req`/`res` ni escribe queries.
- **Repository**: queries con los modelos. No lanza errores HTTP ni conoce Express.
- **Model**: tabla con decoradores y relaciones. Solo hooks simples.

Auth vive en la raíz de cada capa. Todo dominio nuevo va en su subcarpeta: `controllers/<dominio>/XxxController.ts`, igual en services, repositories, routes y validators.

## Convenciones

- Tablas: plural, camelCase, español (`centrosCosto`). Columnas camelCase, FK `xxxId`, auditoría en inglés (`createdBy`, `updatedBy`, `createdAt`, `updatedAt`).
- Modelo singular PascalCase. Carpeta de dominio = nombre de la tabla. URL `/api/<tabla>`.
- Esquemas `createXxxSchema`, `updateXxxSchema` (`create.partial().refine(...)`), `listXxxQuerySchema` (`paginationQuerySchema.extend(...)`). Tipos `CreateXxxInput`, `UpdateXxxInput`, `ListXxxQuery`.
- `validateSchema(schema)` deja el body en `req.body`; con `"query"` o `"params"` el resultado queda en `res.locals.query` / `res.locals.params`.
- Respuestas: éxito `{ message, data }`; paginado con `pagination()`; error `{ error }`; validación `{ error: "Datos inválidos", errors }`. `message` en español para el usuario.
- Nunca exponer `error.message` de Sequelize u otras librerías. Nunca devolver `contrasenaHash` ni `refreshToken`.
- Llaves `INT UNSIGNED`, estados `TINYINT` con `@Comment`, dinero `DECIMAL(14,2)`.
- Cada `@Column` con `DataType` explícito. Las propiedades usan `!` (no `declare`); `useDefineForClassFields` está en `false`.
- Todo modelo nuevo se registra en `src/config/database.ts`.
- Cambios de esquema: `database/migrations/AAAAMMDD_descripcion.sql`, idempotente (revisar `information_schema`).
- Auditoría: en create `createdBy` y `updatedBy` = `req.user!.id`; en update solo `updatedBy`.
- Catálogos se inactivan con `PATCH /:id/estado`, no se eliminan.

## Código

- TypeScript estricto, sin `any`.
- 4 espacios, comillas dobles, sin punto y coma, sin comentarios.
- `process.env` solo se lee en `src/config/config.ts`; cada variable nueva va también en `.env.example`.

## Módulo nuevo (de abajo hacia arriba)

1. Migración → 2. Modelo + registro en `database.ts` → 3. Validators → 4. Repository → 5. Service → 6. Controller → 7. Routes (`router.use(AuthMiddleware)`) → 8. Registro en `src/routes/index.ts` → 9. `npm run type-check` y probar 200/201, 400, 404 y 409.
