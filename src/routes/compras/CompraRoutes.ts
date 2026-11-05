import { Router } from "express"
import { CompraController } from "../../controllers/compras/CompraController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloCliente } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { idParamSchema } from "../../validators/CommonValidators"
import { listCompraQuerySchema, pagarCompraSchema } from "../../validators/compras/CompraValidators"

const router = Router()

router.use(AuthMiddleware, soloCliente)

router.post("/", CompraController.checkout)
router.get("/mias", validateSchema(listCompraQuerySchema, "query"), CompraController.listMias)
router.post("/:id/pagar", validateSchema(idParamSchema, "params"), validateSchema(pagarCompraSchema), CompraController.pagar)
router.get("/:id", validateSchema(idParamSchema, "params"), CompraController.getById)

export default router
