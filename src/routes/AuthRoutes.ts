import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { AuthMiddleware } from "../middlewares/AuthMiddleware"
import { validateSchema } from "../middlewares/ValidateSchema"
import { loginSchema, registerSchema } from "../validators/AuthValidators"

const router = Router()

router.post("/register", validateSchema(registerSchema), AuthController.register)
router.post("/login", validateSchema(loginSchema), AuthController.login)
router.post("/refresh", AuthController.refresh)
router.post("/logout", AuthController.logout)
router.get("/me", AuthMiddleware, AuthController.me)

export default router
