import { ESTADO_COMPRA } from "../../constants/estados"
import { Compra } from "../../models/Compra"
import { CompraItem } from "../../models/CompraItem"
import { Cuenta } from "../../models/Cuenta"
import { Pantalla } from "../../models/Pantalla"
import { Plataforma } from "../../models/Plataforma"
import { Producto } from "../../models/Producto"
import { Servicio } from "../../models/Servicio"

export class ServicioRepository {
    findPagadosByUsuario(usuarioId: number): Promise<Servicio[]> {
        return Servicio.findAll({
            where: { usuarioId },
            attributes: ["id", "cuentaId", "pantallaId", "fechaInicio", "fechaVencimiento"],
            include: [
                {
                    model: CompraItem,
                    attributes: ["id", "compraId", "productoId"],
                    required: true,
                    include: [
                        {
                            model: Compra,
                            attributes: ["id", "pagadaAt"],
                            where: { estado: ESTADO_COMPRA.PAGADA },
                            required: true
                        },
                        { model: Producto, attributes: ["id", "tipo", "duracionDias"] }
                    ]
                },
                {
                    model: Cuenta,
                    attributes: ["id", "correoAcceso", "contrasenaAcceso", "plataformaId"],
                    include: [{ model: Plataforma, attributes: ["id", "nombre", "logoUrl"] }]
                },
                { model: Pantalla, attributes: ["id", "nombrePerfil", "pin"] }
            ],
            order: [["fechaVencimiento", "ASC"], ["id", "ASC"]]
        })
    }
}
