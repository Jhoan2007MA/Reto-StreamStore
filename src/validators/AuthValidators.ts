import { z } from "zod"

const correoSchema = z.string().trim().toLowerCase().pipe(z.email())

export const loginSchema = z.object({
    correo: correoSchema,
    contrasena: z.string().min(1)
})

export const registerSchema = z.object({
    nombre: z.string().trim().min(2).max(100),
    correo: correoSchema.pipe(z.string().max(150)),
    telefono: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, "Teléfono inválido").optional(),
    contrasena: z.string()
        .min(8)
        .max(72)
        .regex(/[A-Za-z]/, "La contraseña debe tener al menos una letra")
        .regex(/[0-9]/, "La contraseña debe tener al menos un número")
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
