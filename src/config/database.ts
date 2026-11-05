import { Sequelize } from "sequelize-typescript"
import { config } from "./config"
import { Rol } from "../models/Rol"
import { User } from "../models/User"

export const sequelize = new Sequelize({
    dialect: "mysql",
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    username: config.db.username,
    password: config.db.password,
    timezone: config.db.timezone,
    logging: false,
    models: [Rol, User]
})
