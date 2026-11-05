import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"
import { config } from "../config/config"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

const key = createHash("sha256").update(config.credentialsSecret).digest()

export const encrypt = (value: string): string => {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv, tag, encrypted].map((part) => part.toString("base64")).join(":")
}

export const decrypt = (value: string): string => {
    const [iv, tag, encrypted] = value.split(":").map((part) => Buffer.from(part, "base64"))
    if (!iv || !tag || !encrypted) throw new Error("Valor cifrado con formato inválido")
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
