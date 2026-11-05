import { z } from "zod"
import { paginationQuerySchema } from "../CommonValidators"

export const createPlataformaSchema = z.object({
    nombre: z.string().trim().min(2).max(80),
    descripcion: z.string().trim().max(255).nullable().optional(),
    logoUrl: z.url().max(500).nullable().optional(),
    maxPantallas: z.number().int().min(1).max(10)
})

export const updatePlataformaSchema = createPlataformaSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    "Envía al menos un campo para actualizar"
)

export const listPlataformaQuerySchema = paginationQuerySchema.extend({
    estado: z.coerce.number().int().min(0).max(1).optional(),
    buscar: z.string().trim().min(1).max(80).optional()
})

export type CreatePlataformaInput = z.infer<typeof createPlataformaSchema>
export type UpdatePlataformaInput = z.infer<typeof updatePlataformaSchema>
export type ListPlataformaQuery = z.infer<typeof listPlataformaQuerySchema>
