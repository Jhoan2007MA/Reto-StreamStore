import { Router } from "express"
import swaggerUi from "swagger-ui-express"
import { openapi } from "../docs/openapi"

const router = Router()

router.get("/docs.json", (_req, res) => {
    res.json(openapi)
})
router.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: "StreamStore API" }))

export default router
