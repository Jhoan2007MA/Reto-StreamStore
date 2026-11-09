import { Sequelize } from "sequelize-typescript"
import { config } from "./config"
import { CarritoItem } from "../models/CarritoItem"
import { Compra } from "../models/Compra"
import { CompraItem } from "../models/CompraItem"
import { Cuenta } from "../models/Cuenta"
import { Notificacion } from "../models/Notificacion"
import { Pantalla } from "../models/Pantalla"
import { Plataforma } from "../models/Plataforma"
import { Producto } from "../models/Producto"
import { RecuperacionContrasena } from "../models/RecuperacionContrasena"
import { Rol } from "../models/Rol"
import { Servicio } from "../models/Servicio"
import { User } from "../models/User"
import { VerificacionCorreo } from "../models/VerificacionCorreo"

export const sequelize = new Sequelize({
    dialect: "mysql",
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    username: config.db.username,
    password: config.db.password,
    timezone: config.db.timezone,
    logging: false,
    models: [Rol, User, Plataforma, Producto, Cuenta, Pantalla, CarritoItem, Compra, CompraItem, Servicio, Notificacion, RecuperacionContrasena, VerificacionCorreo]
})
