import { z, ZodType } from "zod"
import { loginSchema, recuperarContrasenaSchema, registerSchema, restablecerContrasenaSchema } from "../validators/AuthValidators"
import { createCarritoItemSchema, renovarCarritoItemSchema, updateCarritoItemSchema } from "../validators/carritoItems/CarritoItemValidators"
import { estadoSchema } from "../validators/CommonValidators"
import { listCompraAdminQuerySchema, listCompraQuerySchema, pagarCompraSchema } from "../validators/compras/CompraValidators"
import { createCuentaSchema, listCuentaQuerySchema } from "../validators/cuentas/CuentaValidators"
import { createPlataformaSchema, listPlataformaQuerySchema, updatePlataformaSchema } from "../validators/plataformas/PlataformaValidators"
import { createProductoSchema, listProductoAdminQuerySchema, listProductoQuerySchema, updateProductoSchema } from "../validators/productos/ProductoValidators"
import { listServicioQuerySchema } from "../validators/servicios/ServicioValidators"

type Json = Record<string, unknown>
type Acceso = "publico" | "cliente" | "admin" | "sesion"

interface Operacion {
    tag: string
    summary: string
    description?: string
    acceso: Acceso
    body?: ZodType
    example?: Json
    query?: ZodType
    id?: string
    responses: Record<number, string>
}

const schemaDe = (schema: ZodType, io: "input" | "output"): Json => {
    const { $schema: _, ...resto } = z.toJSONSchema(schema, { io, unrepresentable: "any" }) as Json
    return resto
}

const ref = (nombre: string): Json => ({ $ref: `#/components/schemas/${nombre}` })

const respuesta = (codigo: number, descripcion: string): Json => {
    const nombre = codigo === 400 ? "ErrorValidacion" : codigo >= 400 ? "Error" : "Exito"
    return { description: descripcion, content: { "application/json": { schema: ref(nombre) } } }
}

const parametrosQuery = (schema: ZodType): Json[] => {
    const json = schemaDe(schema, "output")
    const propiedades = (json.properties ?? {}) as Record<string, Json>
    return Object.entries(propiedades).map(([nombre, propiedad]) => {
        const { pattern: _, ...limpia } = propiedad
        return { name: nombre, in: "query", required: false, schema: limpia }
    })
}

const SEGURIDAD: Record<Acceso, Json[] | undefined> = {
    publico: [],
    sesion: [{ cookieRefresh: [] }],
    cliente: [{ bearerAuth: [] }, { cookieAuth: [] }],
    admin: [{ bearerAuth: [] }, { cookieAuth: [] }]
}

const ACCESO_TEXTO: Record<Acceso, string> = {
    publico: "Público.",
    sesion: "Usa la cookie `refreshToken` que deja el login.",
    cliente: "Requiere sesión de **cliente**.",
    admin: "Requiere sesión de **administrador** (Superadmin o Administrador)."
}

const op = (o: Operacion): Json => {
    const responses: Record<string, Json> = {}
    for (const [codigo, descripcion] of Object.entries(o.responses)) responses[codigo] = respuesta(Number(codigo), descripcion)
    if (o.acceso === "cliente" || o.acceso === "admin") {
        responses["401"] ??= respuesta(401, "Sin sesión o token vencido")
        responses["403"] ??= respuesta(403, "El rol del usuario no tiene acceso")
    }
    const parameters: Json[] = []
    if (o.id) parameters.push({ name: "id", in: "path", required: true, description: o.id, schema: { type: "integer", minimum: 1 } })
    if (o.query) parameters.push(...parametrosQuery(o.query))
    return {
        tags: [o.tag],
        summary: o.summary,
        description: [ACCESO_TEXTO[o.acceso], o.description].filter(Boolean).join("\n\n"),
        security: SEGURIDAD[o.acceso],
        ...(parameters.length ? { parameters } : {}),
        ...(o.body ? {
            requestBody: {
                required: true,
                content: { "application/json": { schema: schemaDe(o.body, "input"), ...(o.example ? { example: o.example } : {}) } }
            }
        } : {}),
        responses
    }
}

const paths: Record<string, Record<string, Json>> = {
    "/health": {
        get: op({ tag: "Sistema", summary: "Estado del servidor y la base de datos", acceso: "publico", responses: { 200: "Servidor y base de datos operativos", 503: "Base de datos no disponible" } })
    },
    "/auth/register": {
        post: op({
            tag: "Auth", summary: "Registrar cliente", acceso: "publico", body: registerSchema,
            example: { nombre: "Cliente Demo", correo: "demo@test.com", telefono: "+57 300 0000000", contrasena: "Clave1234" },
            description: "Crea un usuario con rol Cliente y deja la sesión iniciada (cookies `accessToken` y `refreshToken`). Devuelve también el `accessToken`.",
            responses: { 201: "Cuenta creada", 400: "Datos inválidos", 409: "Ya existe una cuenta con ese correo" }
        })
    },
    "/auth/login": {
        post: op({
            tag: "Auth", summary: "Iniciar sesión", acceso: "publico", body: loginSchema,
            example: { correo: "cliente1@streamstore.com", contrasena: "Cliente123*" },
            description: "Devuelve el `accessToken` (JWT) y deja las cookies de sesión. Admin de la semilla: `admin@streamstore.com` / `Admin123*`.",
            responses: { 200: "Sesión iniciada", 400: "Datos inválidos", 401: "Correo o contraseña incorrectos", 403: "Usuario inactivo" }
        })
    },
    "/auth/refresh": {
        post: op({ tag: "Auth", summary: "Renovar sesión", acceso: "sesion", responses: { 200: "Sesión renovada", 401: "Sesión inválida o expirada" } })
    },
    "/auth/logout": {
        post: op({ tag: "Auth", summary: "Cerrar sesión", acceso: "sesion", responses: { 200: "Sesión cerrada" } })
    },
    "/auth/me": {
        get: op({ tag: "Auth", summary: "Usuario actual", acceso: "cliente", description: "Funciona con cualquier rol.", responses: { 200: "Datos del usuario autenticado" } })
    },
    "/auth/recuperar": {
        post: op({
            tag: "Auth", summary: "Pedir enlace para restablecer contraseña", acceso: "publico", body: recuperarContrasenaSchema,
            example: { correo: "cliente1@streamstore.com" },
            description: "Siempre responde lo mismo, exista o no el correo. El enlace vence en 30 minutos. Máximo una solicitud por minuto por usuario.",
            responses: { 200: "Si el correo existe, se envió el enlace", 400: "Datos inválidos" }
        })
    },
    "/auth/restablecer": {
        post: op({
            tag: "Auth", summary: "Restablecer contraseña", acceso: "publico", body: restablecerContrasenaSchema,
            example: { token: "token-recibido-por-correo", contrasena: "NuevaClave1" },
            description: "El token sirve una sola vez. Al cambiar la contraseña se cierran las sesiones abiertas.",
            responses: { 200: "Contraseña actualizada", 400: "Datos inválidos o enlace vencido / ya usado" }
        })
    },
    "/plataformas": {
        get: op({ tag: "Catálogo", summary: "Plataformas activas", acceso: "publico", responses: { 200: "Lista de plataformas" } })
    },
    "/productos": {
        get: op({
            tag: "Catálogo", summary: "Catálogo con stock", acceso: "publico", query: listProductoQuerySchema,
            description: "Cada producto trae `stock` y `agotado`. Stock de **cuenta completa** = cuentas activas sin pantallas vendidas; stock de **pantalla** = pantallas disponibles en cuentas activas no vendidas completas.",
            responses: { 200: "Catálogo paginado", 400: "Filtros inválidos" }
        })
    },
    "/productos/{id}": {
        get: op({ tag: "Catálogo", summary: "Detalle de producto con stock", acceso: "publico", id: "Id del producto", responses: { 200: "Detalle del producto", 400: "Id inválido", 404: "Producto no encontrado o inactivo" } })
    },
    "/carrito": {
        get: op({ tag: "Carrito", summary: "Ver carrito", acceso: "cliente", description: "Ítems con subtotal y stock actual, `total`, `cantidadTotal` (contador del ícono) y `puedePagar`.", responses: { 200: "Carrito" } }),
        post: op({
            tag: "Carrito", summary: "Agregar producto", acceso: "cliente", body: createCarritoItemSchema,
            example: { productoId: 2, cantidad: 1 },
            description: "Si el producto ya está en el carrito suma la cantidad. Valida contra el stock (incluye lo que ya hay en el carrito de la misma plataforma y modalidad).",
            responses: { 201: "Producto agregado", 200: "Cantidad sumada a la línea existente", 400: "Datos inválidos o sin stock suficiente", 404: "Producto no encontrado" }
        }),
        delete: op({ tag: "Carrito", summary: "Vaciar carrito", acceso: "cliente", responses: { 200: "Carrito vaciado" } })
    },
    "/carrito/renovaciones": {
        post: op({
            tag: "Carrito", summary: "Agregar renovación de un servicio", acceso: "cliente", body: renovarCarritoItemSchema,
            example: { servicioId: 1 },
            description: "Renueva la misma cuenta o pantalla. `productoId` es opcional para elegir otra duración de la misma plataforma y modalidad. Siempre 1 unidad y no consume stock.",
            responses: { 201: "Renovación agregada", 400: "Producto no disponible o no corresponde al servicio", 404: "Servicio no encontrado", 409: "La renovación ya está en el carrito" }
        })
    },
    "/carrito/{id}": {
        patch: op({
            tag: "Carrito", summary: "Cambiar cantidad", acceso: "cliente", id: "Id del ítem del carrito", body: updateCarritoItemSchema,
            example: { cantidad: 2 },
            responses: { 200: "Cantidad actualizada", 400: "Datos inválidos, sin stock o es una renovación", 404: "El ítem no está en tu carrito" }
        }),
        delete: op({ tag: "Carrito", summary: "Quitar ítem", acceso: "cliente", id: "Id del ítem del carrito", responses: { 200: "Ítem quitado", 404: "El ítem no está en tu carrito" } })
    },
    "/compras": {
        post: op({
            tag: "Compras", summary: "Checkout", acceso: "cliente",
            description: "Crea la compra **pendiente** con los ítems y precios del carrito. Cancela otra compra pendiente del cliente.",
            responses: { 201: "Compra pendiente creada", 400: "Carrito vacío, producto no disponible o sin stock" }
        })
    },
    "/compras/mias": {
        get: op({ tag: "Compras", summary: "Historial de compras", acceso: "cliente", query: listCompraQuerySchema, responses: { 200: "Compras paginadas", 400: "Filtros inválidos" } })
    },
    "/compras/{id}/pagar": {
        post: op({
            tag: "Compras", summary: "Pagar (simulado)", acceso: "cliente", id: "Id de la compra", body: pagarCompraSchema,
            example: { metodoPago: "nequi" },
            description: "En una transacción con `SELECT ... FOR UPDATE` asigna cuentas y pantallas, crea un servicio por unidad, extiende las renovaciones, marca la compra pagada y vacía el carrito. Si falta stock se deshace todo. Después envía el correo de confirmación.",
            responses: { 200: "Pago exitoso", 400: "Ya pagada, cancelada o producto agotado", 404: "Compra no encontrada" }
        })
    },
    "/compras/{id}": {
        get: op({ tag: "Compras", summary: "Detalle de compra", acceso: "cliente", id: "Id de la compra", responses: { 200: "Detalle con ítems y servicios", 404: "Compra no encontrada" } })
    },
    "/servicios/mios": {
        get: op({
            tag: "Servicios", summary: "Mis servicios", acceso: "cliente", query: listServicioQuerySchema,
            description: "Credenciales descifradas, fecha de compra y vencimiento, `diasRestantes`, `estado` (`activo` > 3 días, `por_vencer` ≤ 3 días, `vencido`) y `renovable`.",
            responses: { 200: "Servicios del cliente", 400: "Filtro inválido" }
        })
    },
    "/admin/plataformas": {
        get: op({ tag: "Admin · Plataformas", summary: "Listar plataformas", acceso: "admin", query: listPlataformaQuerySchema, responses: { 200: "Plataformas con stock" } }),
        post: op({
            tag: "Admin · Plataformas", summary: "Crear plataforma", acceso: "admin", body: createPlataformaSchema,
            example: { nombre: "Crunchyroll", descripcion: "Anime", logoUrl: "https://example.com/logo.png", maxPantallas: 4 },
            responses: { 201: "Plataforma creada", 400: "Datos inválidos", 409: "Nombre repetido" }
        })
    },
    "/admin/plataformas/{id}": {
        get: op({ tag: "Admin · Plataformas", summary: "Detalle de plataforma", acceso: "admin", id: "Id de la plataforma", responses: { 200: "Plataforma", 404: "No encontrada" } }),
        patch: op({
            tag: "Admin · Plataformas", summary: "Editar plataforma", acceso: "admin", id: "Id de la plataforma", body: updatePlataformaSchema,
            example: { maxPantallas: 3 },
            description: "Envía uno o varios campos. `maxPantallas` aplica a las cuentas que se carguen después.",
            responses: { 200: "Plataforma actualizada", 400: "Datos inválidos", 404: "No encontrada", 409: "Nombre repetido" }
        })
    },
    "/admin/plataformas/{id}/estado": {
        patch: op({
            tag: "Admin · Plataformas", summary: "Activar o inactivar plataforma", acceso: "admin", id: "Id de la plataforma", body: estadoSchema,
            example: { estado: 0 }, description: "Inactiva, la plataforma y sus productos salen del catálogo.",
            responses: { 200: "Estado actualizado", 400: "Datos inválidos", 404: "No encontrada" }
        })
    },
    "/admin/productos": {
        get: op({ tag: "Admin · Productos", summary: "Listar productos", acceso: "admin", query: listProductoAdminQuerySchema, responses: { 200: "Productos con stock" } }),
        post: op({
            tag: "Admin · Productos", summary: "Crear producto", acceso: "admin", body: createProductoSchema,
            example: { plataformaId: 1, tipo: "pantalla", duracionDias: 60, precio: 22000 },
            responses: { 201: "Producto creado", 400: "Datos inválidos", 403: "Plataforma inactiva", 404: "Plataforma no encontrada", 409: "Ya existe esa plataforma, modalidad y duración" }
        })
    },
    "/admin/productos/{id}": {
        get: op({ tag: "Admin · Productos", summary: "Detalle de producto", acceso: "admin", id: "Id del producto", responses: { 200: "Producto", 404: "No encontrado" } }),
        patch: op({
            tag: "Admin · Productos", summary: "Editar producto", acceso: "admin", id: "Id del producto", body: updateProductoSchema,
            example: { precio: 13000 },
            description: "Si el producto ya tiene ventas no se puede cambiar su plataforma ni su modalidad.",
            responses: { 200: "Producto actualizado", 400: "Datos inválidos o producto con ventas", 403: "Plataforma inactiva", 404: "No encontrado", 409: "Combinación repetida" }
        })
    },
    "/admin/productos/{id}/estado": {
        patch: op({
            tag: "Admin · Productos", summary: "Activar o inactivar producto", acceso: "admin", id: "Id del producto", body: estadoSchema,
            example: { estado: 0 }, responses: { 200: "Estado actualizado", 400: "Datos inválidos", 404: "No encontrado" }
        })
    },
    "/admin/cuentas": {
        get: op({ tag: "Admin · Inventario", summary: "Inventario de cuentas y pantallas", acceso: "admin", query: listCuentaQuerySchema, responses: { 200: "Cuentas con sus pantallas" } }),
        post: op({
            tag: "Admin · Inventario", summary: "Cargar cuenta", acceso: "admin", body: createCuentaSchema,
            example: { plataformaId: 1, correoAcceso: "netflix4@demo.streamstore.test", contrasenaAcceso: "Demo-netflix-4" },
            description: "Crea la cuenta y sus pantallas según `maxPantallas` (perfil y PIN aleatorio). La contraseña se guarda cifrada con AES-256-GCM.",
            responses: { 201: "Cuenta cargada", 400: "Datos inválidos", 403: "Plataforma inactiva", 404: "Plataforma no encontrada", 409: "Correo repetido en la plataforma" }
        })
    },
    "/admin/compras": {
        get: op({ tag: "Admin · Ventas", summary: "Listar ventas", acceso: "admin", query: listCompraAdminQuerySchema, description: "`desde` y `hasta` filtran por fecha de creación (AAAA-MM-DD).", responses: { 200: "Ventas paginadas", 400: "Filtros inválidos" } })
    },
    "/admin/compras/{id}": {
        get: op({ tag: "Admin · Ventas", summary: "Detalle de venta", acceso: "admin", id: "Id de la compra", responses: { 200: "Detalle con cliente, ítems y servicios", 404: "No encontrada" } })
    },
    "/admin/resumen": {
        get: op({ tag: "Admin · Ventas", summary: "Resumen", acceso: "admin", description: "Ventas pagadas del día y del mes, stock y estado de cuentas por plataforma, servicios por estado y total de clientes.", responses: { 200: "Resumen" } })
    },
    "/admin/cron/ejecutar": {
        post: op({ tag: "Admin · Alertas", summary: "Ejecutar revisión de vencimientos", acceso: "admin", description: "Envía los avisos de 3 días, 1 día y el día del vencimiento sin repetir los ya enviados, y marca los vencidos. La tarea también corre sola todos los días a las 8:00.", responses: { 200: "Resultado: enviados, fallidos y vencidos marcados" } })
    }
}

export const openapi = {
    openapi: "3.1.0",
    info: {
        title: "StreamStore API",
        version: "1.0.0",
        description: "API de la tienda de cuentas y pantallas de streaming.\n\nPara probar: haz **login** (`POST /auth/login`), copia el `accessToken` de la respuesta y pégalo en **Authorize**. Usuarios de la semilla: `admin@streamstore.com` / `Admin123*`, `cliente1@streamstore.com` / `Cliente123*`."
    },
    servers: [{ url: "/api" }],
    tags: [
        { name: "Sistema" }, { name: "Auth" }, { name: "Catálogo" }, { name: "Carrito" }, { name: "Compras" }, { name: "Servicios" },
        { name: "Admin · Plataformas" }, { name: "Admin · Productos" }, { name: "Admin · Inventario" }, { name: "Admin · Ventas" }, { name: "Admin · Alertas" }
    ],
    paths,
    components: {
        securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
            cookieRefresh: { type: "apiKey", in: "cookie", name: "refreshToken" }
        },
        schemas: {
            Exito: {
                type: "object",
                properties: { message: { type: "string" }, data: { description: "Resultado de la operación" } },
                required: ["message", "data"]
            },
            Error: {
                type: "object",
                properties: { error: { type: "string" }, data: { description: "Detalle opcional, por ejemplo el stock disponible" } },
                required: ["error"]
            },
            ErrorValidacion: {
                type: "object",
                properties: {
                    error: { type: "string", examples: ["Datos inválidos"] },
                    errors: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } }
                },
                required: ["error"]
            }
        }
    }
}
