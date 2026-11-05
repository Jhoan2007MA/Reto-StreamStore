import { z } from "zod"

const cantidadSchema = z.number().int().min(1).max(100)

export const createCarritoItemSchema = z.object({
    productoId: z.number().int().positive(),
    cantidad: cantidadSchema.default(1)
})

export const updateCarritoItemSchema = z.object({
    cantidad: cantidadSchema
})

export type CreateCarritoItemInput = z.infer<typeof createCarritoItemSchema>
export type UpdateCarritoItemInput = z.infer<typeof updateCarritoItemSchema>
