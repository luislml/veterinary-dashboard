import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { API_CONFIG } from '../../../lib/config';
import { getAuthHeaders } from '../../../lib/auth-utils';

/**
 * GET /api/users - Obtener lista de usuarios
 * Proxy a la API de Laravel
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = searchParams.get('page') || '1';
        const perPage = searchParams.get('per_page') || '10';
        const sortBy = searchParams.get('sort_by');
        const sortOrder = searchParams.get('sort_order') || 'asc';
        const filter = searchParams.get('filter');
        const role = searchParams.get('role');
        const paginate = searchParams.get('paginate') || 'true';

        // Construir URL de Laravel
        const laravelUrl = new URL(`${API_CONFIG.baseURL}/users`);
        laravelUrl.searchParams.append('page', page);
        laravelUrl.searchParams.append('per_page', perPage);
        
        if (sortBy) {
            laravelUrl.searchParams.append('sort_by', sortBy);
            laravelUrl.searchParams.append('sort_order', sortOrder);
        }
        
        if (filter) {
            laravelUrl.searchParams.append('filter', filter);
        }
        
        if (role) {
            laravelUrl.searchParams.append('role', role);
        }

        if (paginate) {
            laravelUrl.searchParams.append('paginate', paginate);
        }

        // Obtener headers con token de autenticación
        const headers = await getAuthHeaders();
        
        const response = await fetch(laravelUrl.toString(), {
            method: 'GET',
            headers,
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            // Si la respuesta no es JSON, devolver un error
            return NextResponse.json(
                { error: 'Respuesta inválida del servidor' },
                { status: 500 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al obtener usuarios' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en GET /api/users:', error);
        
        // Si es un error de conexión, devolver un mensaje más claro
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return NextResponse.json(
                { error: 'No se pudo conectar con el servidor. Verifica que la API de Laravel esté corriendo.' },
                { status: 503 }
            );
        }
        
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users - Crear un nuevo usuario
 * Proxy a la API de Laravel
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const body = await req.json();

        // Obtener headers con token de autenticación
        const headers = await getAuthHeaders();
        
        const response = await fetch(`${API_CONFIG.baseURL}/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al crear usuario', errors: data.errors },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error en POST /api/users:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

