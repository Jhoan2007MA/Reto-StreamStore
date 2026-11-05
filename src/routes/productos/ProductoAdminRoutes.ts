import { Router } from "express"
import { ProductoController } from "../../controllers/productos/ProductoController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { estadoSchema, idParamSchema } from "../../validators/CommonValidators"
import { createProductoSchema, listProductoAdminQuerySchema, updateProductoSchema } from "../../validators/productos/ProductoValidators"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.get("/", validateSchema(listProductoAdminQuerySchema, "query"), ProductoController.listAdmin)
router.post("/", validateSchema(createProductoSchema), ProductoController.create)
router.get("/:id", validateSchema(idParamSchema, "params"), ProductoController.getAdmin)
router.patch("/:id", validateSchema(idParamSchema, "params"), validateSchema(updateProductoSchema), ProductoController.update)
router.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(estadoSchema), ProductoController.cambiarEstado)

export default router
