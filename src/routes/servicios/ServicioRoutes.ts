import { Router } from "express"
import { ServicioController } from "../../controllers/servicios/ServicioController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloCliente } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { listServicioQuerySchema } from "../../validators/servicios/ServicioValidators"

const router = Router()

router.use(AuthMiddleware, soloCliente)

router.get("/mios", validateSchema(listServicioQuerySchema, "query"), ServicioController.listMios)

export default router
