import { z } from "zod"

export const listServicioQuerySchema = z.object({
    estado: z.enum(["activo", "por_vencer", "vencido"]).optional()
})

export type ListServicioQuery = z.infer<typeof listServicioQuerySchema>
