import { z } from "zod"

const correoSchema = z.string().trim().toLowerCase().pipe(z.email())

const contrasenaSchema = z.string()
    .min(8)
    .max(72)
    .regex(/[A-Za-z]/, "La contraseña debe tener al menos una letra")
    .regex(/[0-9]/, "La contraseña debe tener al menos un número")

export const loginSchema = z.object({
    correo: correoSchema,
    contrasena: z.string().min(1)
})

export const registerSchema = z.object({
    nombre: z.string().trim().min(2).max(100),
    correo: correoSchema.pipe(z.string().max(150)),
    telefono: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, "Teléfono inválido").optional(),
    contrasena: contrasenaSchema
})

export const recuperarContrasenaSchema = z.object({
    correo: correoSchema
})

export const restablecerContrasenaSchema = z.object({
    token: z.string().trim().min(20).max(200),
    contrasena: contrasenaSchema
})

export const verificarCorreoSchema = z.object({
    correo: correoSchema,
    codigo: z.string().trim().regex(/^[0-9]{6}$/, "El código debe tener 6 dígitos")
})

export const reenviarCodigoSchema = z.object({
    correo: correoSchema
})

export type LoginInput = z.infer<typeof loginSchema>
export type VerificarCorreoInput = z.infer<typeof verificarCorreoSchema>
export type ReenviarCodigoInput = z.infer<typeof reenviarCodigoSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RecuperarContrasenaInput = z.infer<typeof recuperarContrasenaSchema>
export type RestablecerContrasenaInput = z.infer<typeof restablecerContrasenaSchema>
