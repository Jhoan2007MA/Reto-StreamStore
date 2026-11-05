import { Router } from "express"
import { PlataformaController } from "../../controllers/plataformas/PlataformaController"
import { AuthMiddleware } from "../../middlewares/AuthMiddleware"
import { soloAdmin } from "../../middlewares/RoleMiddleware"
import { validateSchema } from "../../middlewares/ValidateSchema"
import { estadoSchema, idParamSchema } from "../../validators/CommonValidators"
import { createPlataformaSchema, listPlataformaQuerySchema, updatePlataformaSchema } from "../../validators/plataformas/PlataformaValidators"

const router = Router()

router.use(AuthMiddleware, soloAdmin)

router.get("/", validateSchema(listPlataformaQuerySchema, "query"), PlataformaController.listAdmin)
router.post("/", validateSchema(createPlataformaSchema), PlataformaController.create)
router.get("/:id", validateSchema(idParamSchema, "params"), PlataformaController.getAdmin)
router.patch("/:id", validateSchema(idParamSchema, "params"), validateSchema(updatePlataformaSchema), PlataformaController.update)
router.patch("/:id/estado", validateSchema(idParamSchema, "params"), validateSchema(estadoSchema), PlataformaController.cambiarEstado)

export default router
