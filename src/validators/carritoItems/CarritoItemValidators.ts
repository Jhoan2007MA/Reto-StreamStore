import { z } from "zod"

const cantidadSchema = z.number().int().min(1).max(100)

export const createCarritoItemSchema = z.object({
    productoId: z.number().int().positive(),
    cantidad: cantidadSchema.default(1)
})

export const updateCarritoItemSchema = z.object({
    cantidad: cantidadSchema
})

export const renovarCarritoItemSchema = z.object({
    servicioId: z.number().int().positive(),
    productoId: z.number().int().positive().optional()
})

export type CreateCarritoItemInput = z.infer<typeof createCarritoItemSchema>
export type UpdateCarritoItemInput = z.infer<typeof updateCarritoItemSchema>
export type RenovarCarritoItemInput = z.infer<typeof renovarCarritoItemSchema>
