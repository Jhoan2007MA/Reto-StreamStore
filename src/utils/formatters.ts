import { config } from "../config/config"

export const formatDate = (value: Date | string): string =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: config.appTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date(value))

export const formatDateTime = (value: Date | string): string =>
    new Intl.DateTimeFormat("es-CO", {
        timeZone: config.appTimezone,
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(value))

export const formatCurrency = (value: number | string, currency = "COP", locale = "es-CO"): string =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value))
