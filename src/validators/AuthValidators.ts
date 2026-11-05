import { z } from "zod"

export const loginSchema = z.object({
    correo: z.string().trim().toLowerCase().pipe(z.email()),
    contrasena: z.string().min(1)
})

export type LoginInput = z.infer<typeof loginSchema>
