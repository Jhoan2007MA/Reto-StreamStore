import { escapar } from "../../utils/html"
import { Correo } from "../../utils/mailer"

export const correoRecuperacion = (nombre: string, correo: string, url: string, minutos: number): Correo => ({
    to: correo,
    subject: "Restablece tu contraseña de StreamStore",
    text: [
        `Hola ${nombre},`,
        "",
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta.",
        `Usa este enlace en los próximos ${minutos} minutos: ${url}`,
        "",
        "Si no fuiste tú, ignora este correo: tu contraseña no cambia.",
        "",
        "StreamStore"
    ].join("\n"),
    html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937">
            <h2 style="color:#1e1b4b">Restablece tu contraseña</h2>
            <p>Hola ${escapar(nombre)},</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace vence en ${minutos} minutos.</p>
            <a href="${escapar(url)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Crear nueva contraseña</a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">Si no fuiste tú, ignora este correo: tu contraseña no cambia.</p>
        </div>`
})
