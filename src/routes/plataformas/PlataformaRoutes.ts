import { Router } from "express"
import { PlataformaController } from "../../controllers/plataformas/PlataformaController"

const router = Router()

router.get("/", PlataformaController.list)

export default router
