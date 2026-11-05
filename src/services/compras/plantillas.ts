import { ClienteCompra } from "../../interfaces/Admin"
import { CompraDetalle } from "../../interfaces/Compra"
import { formatCurrency, formatDateTime } from "../../utils/formatters"
import { escapar } from "../../utils/html"
import { Correo } from "../../utils/mailer"

const METODOS: Record<string, string> = { tarjeta: "Tarjeta", pse: "PSE", nequi: "Nequi" }

const describir = (item: CompraDetalle["items"][number]): string =>
    `${item.producto.plataforma.nombre} · ${item.producto.tipo === "cuenta" ? "Cuenta completa" : "Pantalla"} · ${item.producto.duracionDias} días${item.renovacionDe !== null ? " (renovación)" : ""}`

export const correoConfirmacion = (compra: CompraDetalle, cliente: ClienteCompra, urlServicios: string): Correo => {
    const fecha = formatDateTime(compra.pagadaAt ?? compra.createdAt)
    const metodo = METODOS[compra.metodoPago ?? ""] ?? compra.metodoPago ?? ""
    const subject = `Confirmación de tu compra #${compra.id} en StreamStore`

    const text = [
        `Hola ${cliente.nombre},`,
        "",
        `Tu pago fue exitoso. Este es el detalle de tu compra #${compra.id}:`,
        "",
        ...compra.items.map((item) => `- ${describir(item)} x${item.cantidad}: ${formatCurrency(item.subtotal)}`),
        "",
        `Total: ${formatCurrency(compra.total)}`,
        `Fecha: ${fecha}`,
        `Método de pago: ${metodo}`,
        "",
        `Tus datos de acceso están en Mis servicios: ${urlServicios}`,
        "",
        "StreamStore"
    ].join("\n")

    const filas = compra.items.map((item) => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapar(describir(item))}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${item.cantidad}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.precioUnitario)}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.subtotal)}</td>
        </tr>`).join("")

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937">
            <h2 style="color:#1e1b4b">¡Gracias por tu compra, ${escapar(cliente.nombre)}!</h2>
            <p>Tu pago fue exitoso. Este es el detalle de tu compra <strong>#${compra.id}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
                <thead>
                    <tr style="background:#f3f4f6">
                        <th style="padding:8px;text-align:left">Producto</th>
                        <th style="padding:8px">Cant.</th>
                        <th style="padding:8px;text-align:right">Precio</th>
                        <th style="padding:8px;text-align:right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding:8px;text-align:right"><strong>Total</strong></td>
                        <td style="padding:8px;text-align:right"><strong>${formatCurrency(compra.total)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <p style="color:#6b7280;font-size:14px">Fecha: ${escapar(fecha)} · Método de pago: ${escapar(metodo)}</p>
            <a href="${escapar(urlServicios)}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Ver mis accesos</a>
            <p style="color:#6b7280;font-size:12px;margin-top:24px">Por seguridad, las contraseñas no se envían por correo. Las encuentras en Mis servicios.</p>
        </div>`

    return { to: cliente.correo, subject, html, text }
}
