import { Router } from "express"
import { CarritoItemController } from "../../controllers/carritoItems/CarritoItemController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloCliente } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { createCarritoItemSchema, renovarCarritoItemSchema, updateCarritoItemSchema } from "../../validators/carritoItems/CarritoItemValidators"
import { idParamSchema } from "../../validators/CommonValidators"

const router = Router()

router.use(AuthMiddleware, soloCliente)

router.get("/", CarritoItemController.get)
router.post("/", validateSchema(createCarritoItemSchema), CarritoItemController.add)
router.post("/renovaciones", validateSchema(renovarCarritoItemSchema), CarritoItemController.renovar)
router.delete("/", CarritoItemController.clear)
router.patch("/:id", validateSchema(idParamSchema, "params"), validateSchema(updateCarritoItemSchema), CarritoItemController.update)
router.delete("/:id", validateSchema(idParamSchema, "params"), CarritoItemController.remove)

export default router
