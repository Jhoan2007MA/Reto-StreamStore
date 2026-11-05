import { Router } from "express"
import { HealthController } from "../controllers/HealthController"
import AuthRoutes from "./AuthRoutes"
import CarritoItemRoutes from "./carritoItems/CarritoItemRoutes"
import CompraRoutes from "./compras/CompraRoutes"
import CuentaRoutes from "./cuentas/CuentaRoutes"
import NotificacionRoutes from "./notificaciones/NotificacionRoutes"
import PlataformaRoutes from "./plataformas/PlataformaRoutes"
import ProductoRoutes from "./productos/ProductoRoutes"
import ServicioRoutes from "./servicios/ServicioRoutes"

const router = Router()

router.get("/health", HealthController.check)
router.use("/auth", AuthRoutes)
router.use("/plataformas", PlataformaRoutes)
router.use("/productos", ProductoRoutes)
router.use("/carrito", CarritoItemRoutes)
router.use("/compras", CompraRoutes)
router.use("/servicios", ServicioRoutes)
router.use("/admin/cuentas", CuentaRoutes)
router.use("/admin/cron", NotificacionRoutes)

export default router
