const ENTIDADES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }

export const escapar = (texto: string): string => texto.replace(/[&<>"']/g, (c) => ENTIDADES[c] ?? c)
