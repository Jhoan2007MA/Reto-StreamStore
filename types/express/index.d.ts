import { AuthUser } from "../../src/interfaces/User"

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

export {}
