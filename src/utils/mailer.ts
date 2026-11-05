import nodemailer, { Transporter } from "nodemailer"
import { config } from "../config/config"

export interface Correo {
    to: string
    subject: string
    html: string
    text: string
}

export interface Mailer {
    send(correo: Correo): Promise<void>
}

export class NodemailerMailer implements Mailer {
    private transporter: Transporter | null = null

    async send(correo: Correo): Promise<void> {
        if (!config.mail.user || !config.mail.pass) {
            throw new Error("Correo no configurado: faltan MAIL_USER y MAIL_PASS")
        }
        this.transporter ??= nodemailer.createTransport({
            host: config.mail.host,
            port: config.mail.port,
            auth: { user: config.mail.user, pass: config.mail.pass }
        })
        await this.transporter.sendMail({ from: config.mail.from, ...correo })
    }
}
