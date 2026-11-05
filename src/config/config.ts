import dotenv from "dotenv"

dotenv.config({ quiet: true })

const env = (name: string, fallback = ""): string => process.env[name] ?? fallback

const nodeEnv = env("NODE_ENV", "development")
const isProduction = nodeEnv === "production"

const requiredInProduction = (name: string, devFallback: string): string => {
    const value = env(name)
    if (value) return value
    if (isProduction) throw new Error(`Falta la variable de entorno ${name}`)
    return devFallback
}

export const config = {
    nodeEnv,
    isProduction,
    port: Number(env("PORT", "3000")),
    clientUrls: env("CLIENT_URL", "http://localhost:5173")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    appTimezone: env("APP_TIMEZONE", "America/Bogota"),
    db: {
        host: env("DB_HOST", "127.0.0.1"),
        port: Number(env("DB_PORT", "3306")),
        database: env("DB_DATABASE", "streamStoreDb"),
        username: env("DB_USERNAME", "root"),
        password: env("DB_PASSWORD"),
        timezone: env("DB_TIMEZONE", "-05:00")
    },
    jwt: {
        secret: requiredInProduction("JWT_SECRET", "dev-access-secret"),
        refreshSecret: requiredInProduction("JWT_REFRESH_SECRET", "dev-refresh-secret"),
        accessExpiresIn: env("JWT_ACCESS_EXPIRES_IN", "8h"),
        refreshExpiresIn: env("JWT_REFRESH_EXPIRES_IN", "7d")
    }
}
