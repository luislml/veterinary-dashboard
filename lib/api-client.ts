/**
 * Cliente API para comunicación con Laravel
 */

import { API_CONFIG } from './config';

// En desarrollo, ignorar errores de certificado SSL (solo para desarrollo local)
if (process.env.NODE_ENV !== 'production' && typeof process !== 'undefined') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface LoginResponse {
    user?: {
        id: string | number;
        name: string;
        email: string;
    };
    token?: string;
    access_token?: string;
    message?: string;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

export interface Veterinary {
    id: number;
    name: string;
    slug: string;
}

export interface UserResponse {
    user: {
        id: number;
        name: string;
        email: string;
        last_name: string;
        phone: string;
    };
    roles: string[];
    permissions: string[];
    veterinaries: Veterinary[];
}

/**
 * Realiza una petición de login a la API de Laravel
 */
export async function loginWithAPI(email: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetch(API_CONFIG.baseURL + '/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const error: ApiError = {
                message: data.message || 'Error al iniciar sesión',
                errors: data.errors,
            };
            throw error;
        }

        return data;
    } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
            throw error;
        }
        throw {
            message: 'Error de conexión con el servidor',
        } as ApiError;
    }
}

/**
 * Obtiene el usuario autenticado desde la API con roles, permisos y veterinarias
 */
export async function getAuthenticatedUser(token: string): Promise<UserResponse> {
    try {
        const response = await fetch(API_CONFIG.baseURL + '/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw {
                message: data.message || 'Error al obtener el usuario',
            } as ApiError;
        }

        return data;
    } catch (error) {
        if (error && typeof error === 'object' && 'message' in error) {
            throw error;
        }
        throw {
            message: 'Error de conexión con el servidor',
        } as ApiError;
    }
}

