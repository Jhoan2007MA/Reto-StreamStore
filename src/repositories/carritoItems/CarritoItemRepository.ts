import { CarritoItem } from "../../models/CarritoItem"
import { Plataforma } from "../../models/Plataforma"
import { CompraItem } from "../../models/CompraItem"
import { Cuenta } from "../../models/Cuenta"
import { Producto } from "../../models/Producto"
import { Servicio } from "../../models/Servicio"

const productoInclude = {
    model: Producto,
    attributes: ["id", "plataformaId", "tipo", "duracionDias", "precio", "estado"],
    include: [{ model: Plataforma, attributes: ["id", "nombre", "logoUrl", "estado"] }]
}

export class CarritoItemRepository {
    findByUsuario(usuarioId: number): Promise<CarritoItem[]> {
        return CarritoItem.findAll({
            where: { usuarioId },
            attributes: ["id", "productoId", "servicioId", "cantidad"],
            include: [productoInclude, { model: Servicio, attributes: ["id", "fechaVencimiento"] }],
            order: [["createdAt", "ASC"], ["id", "ASC"]]
        })
    }

    findByIdUsuario(id: number, usuarioId: number): Promise<CarritoItem | null> {
        return CarritoItem.findOne({
            where: { id, usuarioId },
            attributes: ["id", "productoId", "servicioId", "cantidad"]
        })
    }

    findServicioDeUsuario(servicioId: number, usuarioId: number): Promise<Servicio | null> {
        return Servicio.findOne({
            where: { id: servicioId, usuarioId },
            attributes: ["id", "pantallaId", "fechaVencimiento"],
            include: [
                { model: Cuenta, attributes: ["id", "plataformaId"] },
                { model: CompraItem, attributes: ["id", "productoId"] }
            ]
        })
    }

    async create(usuarioId: number, productoId: number, cantidad: number, servicioId: number | null = null): Promise<void> {
        await CarritoItem.create({ usuarioId, productoId, servicioId, cantidad, createdBy: usuarioId, updatedBy: usuarioId })
    }

    async updateCantidad(id: number, cantidad: number, usuarioId: number): Promise<void> {
        await CarritoItem.update({ cantidad, updatedBy: usuarioId }, { where: { id, usuarioId } })
    }

    async delete(id: number, usuarioId: number): Promise<void> {
        await CarritoItem.destroy({ where: { id, usuarioId } })
    }

    async deleteByUsuario(usuarioId: number): Promise<void> {
        await CarritoItem.destroy({ where: { usuarioId } })
    }
}
