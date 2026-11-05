import { z } from "zod"
import { paginationQuerySchema } from "../CommonValidators"

export const listProductoQuerySchema = paginationQuerySchema.extend({
    plataforma: z.coerce.number().int().positive().optional(),
    tipo: z.enum(["cuenta", "pantalla"]).optional()
})

export type ListProductoQuery = z.infer<typeof listProductoQuerySchema>

export const createProductoSchema = z.object({
    plataformaId: z.number().int().positive(),
    tipo: z.enum(["cuenta", "pantalla"]),
    duracionDias: z.number().int().min(1).max(365),
    precio: z.number().positive().max(999999999999).multipleOf(0.01)
})

export const updateProductoSchema = createProductoSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    "Envía al menos un campo para actualizar"
)

export const listProductoAdminQuerySchema = listProductoQuerySchema.extend({
    estado: z.coerce.number().int().min(0).max(1).optional()
})

export type CreateProductoInput = z.infer<typeof createProductoSchema>
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>
export type ListProductoAdminQuery = z.infer<typeof listProductoAdminQuerySchema>
