import { Router } from "express"
import { CompraController } from "../../controllers/compras/CompraController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { idParamSchema } from "../../validators/CommonValidators"
import { listCompraAdminQuerySchema } from "../../validators/compras/CompraValidators"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.get("/", validateSchema(listCompraAdminQuerySchema, "query"), CompraController.listAdmin)
router.get("/:id", validateSchema(idParamSchema, "params"), CompraController.getByIdAdmin)

export default router
