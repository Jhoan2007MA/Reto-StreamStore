import { CarritoItem } from "../../models/CarritoItem"
import { Plataforma } from "../../models/Plataforma"
import { Producto } from "../../models/Producto"

const productoInclude = {
    model: Producto,
    attributes: ["id", "plataformaId", "tipo", "duracionDias", "precio", "estado"],
    include: [{ model: Plataforma, attributes: ["id", "nombre", "logoUrl", "estado"] }]
}

export class CarritoItemRepository {
    findByUsuario(usuarioId: number): Promise<CarritoItem[]> {
        return CarritoItem.findAll({
            where: { usuarioId },
            attributes: ["id", "productoId", "cantidad"],
            include: [productoInclude],
            order: [["createdAt", "ASC"], ["id", "ASC"]]
        })
    }

    findByIdUsuario(id: number, usuarioId: number): Promise<CarritoItem | null> {
        return CarritoItem.findOne({
            where: { id, usuarioId },
            attributes: ["id", "productoId", "cantidad"]
        })
    }

    async create(usuarioId: number, productoId: number, cantidad: number): Promise<void> {
        await CarritoItem.create({ usuarioId, productoId, cantidad, createdBy: usuarioId, updatedBy: usuarioId })
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
