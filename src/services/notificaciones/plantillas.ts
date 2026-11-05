import { escapar } from "../../utils/html"
import { Correo } from "../../utils/mailer"

export interface DatosAviso {
    cliente: string
    correo: string
    plataforma: string
    modalidad: "cuenta" | "pantalla"
    fechaVencimiento: string
    dias: number
    urlRenovar: string
}

const cuando = (dias: number): string => {
    if (dias <= 0) return "vence hoy"
    if (dias === 1) return "vence mañana"
    return `vence en ${dias} días`
}

export const correoVencimiento = (datos: DatosAviso): Correo => {
    const servicio = datos.modalidad === "cuenta" ? `cuenta completa de ${datos.plataforma}` : `pantalla de ${datos.plataforma}`
    const titulo = `Tu ${servicio} ${cuando(datos.dias)}`
    const text = [
        `Hola ${datos.cliente},`,
        "",
        `Tu ${servicio} ${cuando(datos.dias)} (${datos.fechaVencimiento}).`,
        `Plataforma: ${datos.plataforma}`,
        `Modalidad: ${datos.modalidad === "cuenta" ? "Cuenta completa" : "Pantalla"}`,
        `Fecha de vencimiento: ${datos.fechaVencimiento}`,
        "",
        `Renueva aquí para no perder el acceso: ${datos.urlRenovar}`,
        "",
        "StreamStore"
    ].join("\n")
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937">
            <h2 style="color:#1e1b4b">${escapar(titulo)}</h2>
            <p>Hola ${escapar(datos.cliente)},</p>
            <p>Tu <strong>${escapar(servicio)}</strong> ${cuando(datos.dias)}.</p>
            <table style="border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Plataforma</td><td><strong>${escapar(datos.plataforma)}</strong></td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Modalidad</td><td>${datos.modalidad === "cuenta" ? "Cuenta completa" : "Pantalla"}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Vence</td><td>${escapar(datos.fechaVencimiento)}</td></tr>
            </table>
            <a href="${escapar(datos.urlRenovar)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Renovar ahora</a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">StreamStore</p>
        </div>`
    return { to: datos.correo, subject: titulo, html, text }
}
