import { NextFunction, Request, Response } from "express"
import { z, ZodType } from "zod"
import { ApiResponse } from "../utils/apiResponse"

type Source = "body" | "query" | "params"

export const validateSchema = (schema: ZodType, source: Source = "body") =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source])
        if (!result.success) {
            const { fieldErrors, formErrors } = z.flattenError(result.error)
            const errors: Record<string, string[] | undefined> = formErrors.length ? { ...fieldErrors, general: formErrors } : fieldErrors
            ApiResponse.badRequest(res, "Datos inválidos", errors)
            return
        }
        if (source === "body") {
            req.body = result.data
        } else {
            res.locals[source] = result.data
        }
        next()
    }
