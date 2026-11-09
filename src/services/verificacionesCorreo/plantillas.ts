import { escapar } from "../../utils/html"
import { Correo } from "../../utils/mailer"

export const correoVerificacion = (nombre: string, correo: string, codigo: string, minutos: number): Correo => ({
    to: correo,
    subject: `${codigo} es tu código de verificación de StreamStore`,
    text: [
        `Hola ${nombre},`,
        "",
        "Gracias por crear tu cuenta en StreamStore.",
        `Tu código de verificación es: ${codigo}`,
        `Vence en ${minutos} minutos.`,
        "",
        "Si no creaste esta cuenta, ignora este correo.",
        "",
        "StreamStore"
    ].join("\n"),
    html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937">
            <h2 style="color:#1e1b4b">Verifica tu correo</h2>
            <p>Hola ${escapar(nombre)},</p>
            <p>Gracias por crear tu cuenta en StreamStore. Ingresa este código para activarla. Vence en ${minutos} minutos.</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#eef2ff;color:#1e1b4b;padding:16px;border-radius:8px;text-align:center">${escapar(codigo)}</p>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">Si no creaste esta cuenta, ignora este correo.</p>
        </div>`
})
