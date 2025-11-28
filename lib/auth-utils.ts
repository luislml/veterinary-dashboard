/**
 * Utilidades para autenticación y obtención de tokens
 */

import { auth } from '../auth';

/**
 * Obtiene el token de acceso de la sesión actual
 * @returns El token de acceso o null si no está disponible
 */
export async function getAccessToken(): Promise<string | null> {
    const session = await auth();
    
    if (!session) {
        return null;
    }

    // El token se guarda en la sesión después del login
    return (session as any).accessToken || null;
}

/**
 * Obtiene los headers de autorización para peticiones a la API de Laravel
 * @param includeContentType Si es true, incluye Content-Type (por defecto true)
 * @returns Headers con el token de autorización
 */
export async function getAuthHeaders(includeContentType: boolean = true): Promise<Record<string, string>> {
    const token = await getAccessToken();
    
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };

    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

