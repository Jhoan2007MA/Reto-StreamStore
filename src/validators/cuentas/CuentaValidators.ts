import { z } from "zod"
import { paginationQuerySchema } from "../CommonValidators"

export const createCuentaSchema = z.object({
    plataformaId: z.number().int().positive(),
    correoAcceso: z.string().trim().toLowerCase().pipe(z.email()).pipe(z.string().max(150)),
    contrasenaAcceso: z.string().min(4).max(100)
})

export const listCuentaQuerySchema = paginationQuerySchema.extend({
    plataforma: z.coerce.number().int().positive().optional(),
    estado: z.enum(["disponible", "parcial", "vendida", "inactiva"]).optional()
})

export type CreateCuentaInput = z.infer<typeof createCuentaSchema>
export type ListCuentaQuery = z.infer<typeof listCuentaQuerySchema>
