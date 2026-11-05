import { ESTADO_REGISTRO } from "../../constants/estados"
import { Plataforma } from "../../models/Plataforma"

export class PlataformaRepository {
    findActivas(): Promise<Plataforma[]> {
        return Plataforma.findAll({
            where: { estado: ESTADO_REGISTRO.ACTIVO },
            attributes: ["id", "nombre", "descripcion", "logoUrl", "maxPantallas"],
            order: [["nombre", "ASC"]]
        })
    }
}
