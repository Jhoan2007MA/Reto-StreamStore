import { Router } from "express"
import { NotificacionController } from "../../controllers/notificaciones/NotificacionController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.post("/ejecutar", NotificacionController.ejecutar)

export default router
