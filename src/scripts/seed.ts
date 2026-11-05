import "reflect-metadata"
import { Transaction } from "sequelize"
import { sequelize } from "../config/database"
import { ESTADO_COMPRA, ESTADO_CUENTA, ESTADO_PANTALLA, ESTADO_SERVICIO, ROLES, TIPO_PRODUCTO } from "../constants/estados"
import { Compra } from "../models/Compra"
import { CompraItem } from "../models/CompraItem"
import { Cuenta } from "../models/Cuenta"
import { Pantalla } from "../models/Pantalla"
import { Plataforma } from "../models/Plataforma"
import { Producto } from "../models/Producto"
import { Servicio } from "../models/Servicio"
import { User } from "../models/User"
import { CuentaRepository } from "../repositories/cuentas/CuentaRepository"
import { CuentaService } from "../services/cuentas/CuentaService"
import { logger } from "../utils/logger"

const ADMIN_ID = 1
const DURACION = 30
const DIA_MS = 24 * 60 * 60 * 1000
const METODO_SEMILLA = "semilla"

const auditoria = { createdBy: ADMIN_ID, updatedBy: ADMIN_ID }

const plataformas = [
    { nombre: "Netflix", slug: "netflix", descripcion: "Series, películas y documentales", maxPantallas: 5, precioCuenta: "45000.00", precioPantalla: "12000.00" },
    { nombre: "Disney+", slug: "disney", descripcion: "Disney, Pixar, Marvel, Star Wars y National Geographic", maxPantallas: 4, precioCuenta: "35000.00", precioPantalla: "10000.00" },
    { nombre: "Prime Video", slug: "prime", descripcion: "Películas, series y originales de Amazon", maxPantallas: 3, precioCuenta: "28000.00", precioPantalla: "9000.00" },
    { nombre: "Max", slug: "max", descripcion: "HBO, Warner Bros. y DC", maxPantallas: 5, precioCuenta: "32000.00", precioPantalla: "10000.00" }
]

const clientes = [
    { nombre: "Laura Gómez", correo: "cliente1@streamstore.com", telefono: "+57 300 1111111" },
    { nombre: "Andrés Pérez", correo: "cliente2@streamstore.com", telefono: "+57 300 2222222" }
]

const CONTRASENA_CLIENTES = "Cliente123*"

const cuentaService = new CuentaService(new CuentaRepository())

const seedClientes = async (): Promise<Map<string, number>> => {
    const ids = new Map<string, number>()
    for (const cliente of clientes) {
        const [usuario] = await User.findOrCreate({
            where: { correo: cliente.correo },
            defaults: { ...cliente, contrasenaHash: CONTRASENA_CLIENTES, rolId: ROLES.CLIENTE, ...auditoria }
        })
        ids.set(cliente.correo, usuario.id)
    }
    return ids
}

const seedCatalogo = async (): Promise<Map<string, number>> => {
    const productosPantalla = new Map<string, number>()
    for (const datos of plataformas) {
        const [plataforma] = await Plataforma.findOrCreate({
            where: { nombre: datos.nombre },
            defaults: { nombre: datos.nombre, descripcion: datos.descripcion, maxPantallas: datos.maxPantallas, ...auditoria }
        })

        const tipos = [
            { tipo: TIPO_PRODUCTO.CUENTA, precio: datos.precioCuenta },
            { tipo: TIPO_PRODUCTO.PANTALLA, precio: datos.precioPantalla }
        ]
        for (const { tipo, precio } of tipos) {
            const [producto] = await Producto.findOrCreate({
                where: { plataformaId: plataforma.id, tipo, duracionDias: DURACION },
                defaults: { plataformaId: plataforma.id, tipo, duracionDias: DURACION, precio, ...auditoria }
            })
            if (tipo === TIPO_PRODUCTO.PANTALLA) productosPantalla.set(datos.slug, producto.id)
        }

        for (let numero = 1; numero <= 3; numero++) {
            const correoAcceso = `${datos.slug}${numero}@demo.streamstore.test`
            const existe = await Cuenta.count({ where: { plataformaId: plataforma.id, correoAcceso } })
            if (existe === 0) {
                await cuentaService.create({
                    plataformaId: plataforma.id,
                    correoAcceso,
                    contrasenaAcceso: `Demo-${datos.slug}-${numero}`
                }, ADMIN_ID)
            }
        }
    }
    return productosPantalla
}

interface ServicioSemilla {
    slug: string
    cuentaNumero: number
    diasRestantes: number
}

const asignarPantalla = async (
    slug: string,
    cuentaNumero: number,
    transaction: Transaction
): Promise<{ cuentaId: number, pantallaId: number }> => {
    const cuenta = await Cuenta.findOne({
        where: { correoAcceso: `${slug}${cuentaNumero}@demo.streamstore.test` },
        transaction,
        lock: transaction.LOCK.UPDATE
    })
    if (!cuenta) throw new Error(`No existe la cuenta semilla ${slug}${cuentaNumero}`)
    const pantalla = await Pantalla.findOne({
        where: { cuentaId: cuenta.id, estado: ESTADO_PANTALLA.DISPONIBLE },
        order: [["id", "ASC"]],
        transaction,
        lock: transaction.LOCK.UPDATE
    })
    if (!pantalla) throw new Error(`La cuenta semilla ${slug}${cuentaNumero} no tiene pantallas libres`)
    await pantalla.update({ estado: ESTADO_PANTALLA.VENDIDA, updatedBy: ADMIN_ID }, { transaction })
    await cuenta.update({ estado: ESTADO_CUENTA.PARCIAL, updatedBy: ADMIN_ID }, { transaction })
    return { cuentaId: cuenta.id, pantallaId: pantalla.id }
}

const seedCompra = async (
    usuarioId: number,
    servicios: ServicioSemilla[],
    productosPantalla: Map<string, number>
): Promise<boolean> => {
    const existe = await Compra.count({ where: { usuarioId, metodoPago: METODO_SEMILLA } })
    if (existe > 0) return false

    await sequelize.transaction(async (transaction) => {
        const ahora = Date.now()
        const lineas = await Promise.all(servicios.map(async (servicio) => {
            const productoId = productosPantalla.get(servicio.slug)
            const producto = productoId === undefined ? null : await Producto.findByPk(productoId, { transaction })
            if (!producto) throw new Error(`No existe el producto semilla ${servicio.slug}`)
            return { servicio, producto }
        }))
        const total = lineas.reduce((suma, { producto }) => suma + Number(producto.precio), 0)
        const fechaInicioMasAntigua = Math.min(...servicios.map((servicio) => ahora - (DURACION - servicio.diasRestantes) * DIA_MS))

        const fechaCompra = new Date(fechaInicioMasAntigua)
        const compra = await Compra.create({
            usuarioId,
            total: total.toFixed(2),
            estado: ESTADO_COMPRA.PAGADA,
            metodoPago: METODO_SEMILLA,
            pagadaAt: fechaCompra,
            createdBy: usuarioId,
            updatedBy: usuarioId,
            createdAt: fechaCompra,
            updatedAt: fechaCompra
        }, { transaction })

        for (const { servicio, producto } of lineas) {
            const item = await CompraItem.create({
                compraId: compra.id,
                productoId: producto.id,
                cantidad: 1,
                precioUnitario: producto.precio,
                subtotal: producto.precio,
                createdBy: usuarioId,
                updatedBy: usuarioId,
                createdAt: fechaCompra,
                updatedAt: fechaCompra
            }, { transaction })
            const { cuentaId, pantallaId } = await asignarPantalla(servicio.slug, servicio.cuentaNumero, transaction)
            const fechaInicio = new Date(ahora - (DURACION - servicio.diasRestantes) * DIA_MS)
            await Servicio.create({
                compraItemId: item.id,
                usuarioId,
                cuentaId,
                pantallaId,
                fechaInicio,
                fechaVencimiento: new Date(fechaInicio.getTime() + DURACION * DIA_MS),
                estado: servicio.diasRestantes < 0 ? ESTADO_SERVICIO.VENCIDO : ESTADO_SERVICIO.ACTIVO,
                createdBy: usuarioId,
                updatedBy: usuarioId,
                createdAt: fechaInicio,
                updatedAt: fechaInicio
            }, { transaction })
        }
    })
    return true
}

const main = async (): Promise<void> => {
    await sequelize.authenticate()
    const clientesIds = await seedClientes()
    logger.info(`Clientes listos: ${[...clientesIds.keys()].join(", ")}`)

    const productosPantalla = await seedCatalogo()
    logger.info("Plataformas, productos y cuentas listos")

    const cliente1 = clientesIds.get("cliente1@streamstore.com")
    const cliente2 = clientesIds.get("cliente2@streamstore.com")
    if (cliente1 === undefined || cliente2 === undefined) throw new Error("No se encontraron los clientes semilla")

    const compra1 = await seedCompra(cliente1, [
        { slug: "netflix", cuentaNumero: 1, diasRestantes: 3 },
        { slug: "disney", cuentaNumero: 1, diasRestantes: 1 }
    ], productosPantalla)
    const compra2 = await seedCompra(cliente2, [
        { slug: "max", cuentaNumero: 1, diasRestantes: 20 },
        { slug: "max", cuentaNumero: 2, diasRestantes: 20 },
        { slug: "prime", cuentaNumero: 1, diasRestantes: -2 }
    ], productosPantalla)
    logger.info(compra1 || compra2 ? "Compras y servicios semilla creados" : "Las compras semilla ya existían")
}

main()
    .then(async () => {
        await sequelize.close()
        logger.info("Semilla completada")
    })
    .catch(async (error: unknown) => {
        logger.error(error instanceof Error ? error.stack ?? error.message : String(error))
        await sequelize.close()
        process.exit(1)
    })
