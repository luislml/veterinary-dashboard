/**
 * Configuración de la aplicación
 * Variables de entorno y constantes
 */

export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000/api',
} as const;

/**
 * Obtiene la URL completa del endpoint de login
 */
export function getLoginEndpoint(): string {
    return `${API_CONFIG.baseURL}/login`;
}

/**
 * Obtiene la URL completa del endpoint de logout
 */
export function getLogoutEndpoint(): string {
    return `${API_CONFIG.baseURL}/logout`;
}

/**
 * Obtiene la URL completa del endpoint de usuario autenticado
 */
export function getUserEndpoint(): string {
    return `${API_CONFIG.baseURL}/user`;
}

