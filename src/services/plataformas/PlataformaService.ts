import { PlataformaPublica } from "../../interfaces/Catalogo"
import { PlataformaRepository } from "../../repositories/plataformas/PlataformaRepository"

export class PlataformaService {
    constructor(private readonly repository: PlataformaRepository) {}

    async listActivas(): Promise<PlataformaPublica[]> {
        const plataformas = await this.repository.findActivas()
        return plataformas.map((plataforma) => ({
            id: plataforma.id,
            nombre: plataforma.nombre,
            descripcion: plataforma.descripcion,
            logoUrl: plataforma.logoUrl,
            maxPantallas: plataforma.maxPantallas
        }))
    }
}
