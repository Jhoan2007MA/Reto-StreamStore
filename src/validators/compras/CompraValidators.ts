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
