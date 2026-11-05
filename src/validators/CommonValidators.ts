import { z } from "zod"

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

export const estadoSchema = z.object({
    estado: z.union([z.literal(0), z.literal(1)])
})

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
})

export const estadoQuerySchema = z.object({
    estado: z.coerce.number().int().min(0).max(1).optional()
})

export type IdParam = z.infer<typeof idParamSchema>
export type EstadoInput = z.infer<typeof estadoSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type EstadoQuery = z.infer<typeof estadoQuerySchema>
