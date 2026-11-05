import { Router } from "express"
import { HealthController } from "../controllers/HealthController"
import AuthRoutes from "./AuthRoutes"
import CuentaRoutes from "./cuentas/CuentaRoutes"
import PlataformaRoutes from "./plataformas/PlataformaRoutes"
import ProductoRoutes from "./productos/ProductoRoutes"

const router = Router()

router.get("/health", HealthController.check)
router.use("/auth", AuthRoutes)
router.use("/plataformas", PlataformaRoutes)
router.use("/productos", ProductoRoutes)
router.use("/admin/cuentas", CuentaRoutes)

export default router
