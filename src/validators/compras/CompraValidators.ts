import { z } from "zod"
import { paginationQuerySchema } from "../CommonValidators"

export const pagarCompraSchema = z.object({
    metodoPago: z.enum(["tarjeta", "pse", "nequi"]).default("tarjeta")
}).prefault({})

export const listCompraQuerySchema = paginationQuerySchema.extend({
    estado: z.enum(["pendiente", "pagada", "cancelada"]).optional()
})

export type PagarCompraInput = z.infer<typeof pagarCompraSchema>
export type ListCompraQuery = z.infer<typeof listCompraQuerySchema>

export const listCompraAdminQuerySchema = listCompraQuerySchema.extend({
    cliente: z.string().trim().min(1).max(150).optional(),
    desde: z.iso.date().optional(),
    hasta: z.iso.date().optional()
}).refine(
    (data) => !data.desde || !data.hasta || data.desde <= data.hasta,
    { message: "La fecha desde no puede ser mayor que hasta", path: ["desde"] }
)

export type ListCompraAdminQuery = z.infer<typeof listCompraAdminQuerySchema>
