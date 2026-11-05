import { Router } from "express"
import { HealthController } from "../controllers/HealthController"
import AuthRoutes from "./AuthRoutes"

const router = Router()

router.get("/health", HealthController.check)
router.use("/auth", AuthRoutes)

export default router
