import "reflect-metadata"
import "./config/zod"
import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import { config } from "./config/config"
import { sequelize } from "./config/database"
import { iniciarJobVencimientos } from "./jobs/vencimientosJob"
import { ErrorMiddleware } from "./middlewares/ErrorMiddleware"
import { NotFoundMiddleware } from "./middlewares/NotFoundMiddleware"
import routes from "./routes"
import { logger } from "./utils/logger"

const app = express()

app.disable("x-powered-by")
app.use(cors({ origin: config.clientUrls, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan(config.isProduction ? "combined" : "dev"))

app.use("/api", routes)
app.use(NotFoundMiddleware)
app.use(ErrorMiddleware)

const start = async (): Promise<void> => {
    try {
        await sequelize.authenticate()
        logger.info(`Conectado a la base de datos ${config.db.database}`)
    } catch (error) {
        logger.error(`No se pudo conectar a la base de datos: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
    }

    const server = app.listen(config.port, () => {
        logger.info(`API en http://localhost:${config.port}/api`)
        iniciarJobVencimientos()
    })

    const shutdown = (signal: string): void => {
        logger.info(`${signal} recibido, cerrando servidor`)
        server.close(async () => {
            await sequelize.close()
            process.exit(0)
        })
    }

    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
}

void start()
