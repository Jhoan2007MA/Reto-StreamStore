export interface PaginatedResult<T> {
    previousPage: number | null
    currentPage: number
    nextPage: number | null
    total: number
    totalPages: number
    limit: number
    data: T[]
}

export const getOffset = (limit: number, page: number): number => (page - 1) * limit

export const pagination = <T>(result: { count: number, rows: T[] }, limit: number, page: number): PaginatedResult<T> => {
    const totalPages = Math.ceil(result.count / limit)
    return {
        previousPage: page > 1 ? page - 1 : null,
        currentPage: page,
        nextPage: page < totalPages ? page + 1 : null,
        total: result.count,
        totalPages,
        limit,
        data: result.rows
    }
}
