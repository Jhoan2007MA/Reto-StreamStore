import { Router } from "express"
import { ResumenController } from "../../controllers/resumen/ResumenController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.get("/", ResumenController.get)

export default router
