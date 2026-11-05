import { Router } from "express"
import { ProductoController } from "../../controllers/productos/ProductoController"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { idParamSchema } from "../../validators/CommonValidators"
import { listProductoQuerySchema } from "../../validators/productos/ProductoValidators"

const router = Router()

router.get("/", validateSchema(listProductoQuerySchema, "query"), ProductoController.list)
router.get("/:id", validateSchema(idParamSchema, "params"), ProductoController.getById)

export default router
