import { Router } from "express"
import { CuentaController } from "../../controllers/cuentas/CuentaController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { createCuentaSchema, listCuentaQuerySchema } from "../../validators/cuentas/CuentaValidators"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.post("/", validateSchema(createCuentaSchema), CuentaController.create)
router.get("/", validateSchema(listCuentaQuerySchema, "query"), CuentaController.list)

export default router
