import { ESTADO_CUENTA } from "../../constants/estados"
import { ResumenAdmin } from "../../interfaces/Admin"
import { ProductoRepository } from "../../repositories/productos/ProductoRepository"
import { ResumenRepository } from "../../repositories/resumen/ResumenRepository"
import { hoy, inicioDelDia, inicioDelMes, inicioDelMesSiguiente, sumarDias } from "../../utils/fechas"

const DIAS_AVISO = 3

export class ResumenService {
    constructor(
        private readonly repository: ResumenRepository,
        private readonly productoRepository: ProductoRepository
    ) {}

    async get(ahora = new Date()): Promise<ResumenAdmin> {
        const fecha = hoy(ahora)
        const [ventasHoy, ventasMes, plataformas, cuentas, servicios, clientes] = await Promise.all([
            this.repository.ventasEntre(inicioDelDia(fecha), inicioDelDia(sumarDias(fecha, 1))),
            this.repository.ventasEntre(inicioDelDia(inicioDelMes(fecha)), inicioDelDia(inicioDelMesSiguiente(fecha))),
            this.repository.findPlataformas(),
            this.repository.cuentasPorEstado(),
            this.repository.contarServicios(ahora, inicioDelDia(sumarDias(fecha, DIAS_AVISO + 1))),
            this.repository.contarClientes()
        ])
        const stock = await this.productoRepository.stockPorPlataforma(plataformas.map((plataforma) => plataforma.id))

        return {
            fecha,
            ventas: { hoy: ventasHoy, mes: ventasMes },
            plataformas: plataformas.map((plataforma) => {
                const contar = (estado: number): number => cuentas
                    .filter((fila) => Number(fila.plataformaId) === plataforma.id && Number(fila.estado) === estado)
                    .reduce((suma, fila) => suma + Number(fila.total), 0)
                const resumenCuentas = {
                    disponibles: contar(ESTADO_CUENTA.DISPONIBLE),
                    parciales: contar(ESTADO_CUENTA.PARCIAL),
                    vendidas: contar(ESTADO_CUENTA.VENDIDA),
                    inactivas: contar(ESTADO_CUENTA.INACTIVA)
                }
                return {
                    id: plataforma.id,
                    nombre: plataforma.nombre,
                    estado: plataforma.estado,
                    stock: stock.get(plataforma.id) ?? { cuenta: 0, pantalla: 0 },
                    cuentas: {
                        total: resumenCuentas.disponibles + resumenCuentas.parciales + resumenCuentas.vendidas + resumenCuentas.inactivas,
                        ...resumenCuentas
                    }
                }
            }),
            servicios,
            clientes
        }
    }
}
