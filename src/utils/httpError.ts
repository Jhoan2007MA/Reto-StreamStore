export class HttpError extends Error {
    status: number
    data?: unknown

    constructor(message: string, status = 400, data?: unknown) {
        super(message)
        this.name = "HttpError"
        this.status = status
        this.data = data
    }
}
