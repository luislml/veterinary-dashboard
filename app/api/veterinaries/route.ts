import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { API_CONFIG } from '../../../lib/config';
import { getAuthHeaders } from '../../../lib/auth-utils';

/**
 * GET /api/veterinaries - Obtener lista de veterinarias
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

        // Construir URL de Laravel
        const laravelUrl = new URL(`${API_CONFIG.baseURL}/veterinaries`);
        laravelUrl.searchParams.append('page', page);
        laravelUrl.searchParams.append('per_page', perPage);
        
        if (sortBy) {
            laravelUrl.searchParams.append('sort_by', sortBy);
            laravelUrl.searchParams.append('sort_order', sortOrder);
        }
        
        if (filter) {
            laravelUrl.searchParams.append('filter', filter);
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
                { error: data.message || 'Error al obtener veterinarias' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en GET /api/veterinaries:', error);
        
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
 * POST /api/veterinaries - Crear una nueva veterinaria
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
        
        const response = await fetch(`${API_CONFIG.baseURL}/veterinaries`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al crear veterinaria', errors: data.errors },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error en POST /api/veterinaries:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}



