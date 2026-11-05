import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { RecuperacionContrasenaController } from "../controllers/recuperacionesContrasena/RecuperacionContrasenaController"
import { AuthMiddleware } from "../middlewares/AuthMiddleware"
import { validateSchema } from "../middlewares/ValidateSchema"
import { loginSchema, recuperarContrasenaSchema, registerSchema, restablecerContrasenaSchema } from "../validators/AuthValidators"

const router = Router()

router.post("/register", validateSchema(registerSchema), AuthController.register)
router.post("/login", validateSchema(loginSchema), AuthController.login)
router.post("/refresh", AuthController.refresh)
router.post("/logout", AuthController.logout)
router.get("/me", AuthMiddleware, AuthController.me)
router.post("/recuperar", validateSchema(recuperarContrasenaSchema), RecuperacionContrasenaController.solicitar)
router.post("/restablecer", validateSchema(restablecerContrasenaSchema), RecuperacionContrasenaController.restablecer)

export default router
