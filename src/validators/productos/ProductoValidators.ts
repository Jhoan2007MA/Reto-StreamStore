import { z } from "zod"
import { paginationQuerySchema } from "../CommonValidators"

export const listProductoQuerySchema = paginationQuerySchema.extend({
    plataforma: z.coerce.number().int().positive().optional(),
    tipo: z.enum(["cuenta", "pantalla"]).optional()
})

export type ListProductoQuery = z.infer<typeof listProductoQuerySchema>
