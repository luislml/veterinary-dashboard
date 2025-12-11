import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { API_CONFIG } from '../../../lib/config';
import { getAuthHeaders } from '../../../lib/auth-utils';

/**
 * GET /api/content-veterinaries - Obtener lista de contenidos de veterinarias
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
        const veterinaryId = searchParams.get('veterinary_id');

        // Construir URL de Laravel
        const laravelUrl = new URL(`${API_CONFIG.baseURL}/content-veterinaries`);
        laravelUrl.searchParams.append('page', page);
        laravelUrl.searchParams.append('per_page', perPage);
        
        if (veterinaryId) {
            laravelUrl.searchParams.append('veterinary_id', veterinaryId);
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
            return NextResponse.json(
                { error: 'Respuesta inválida del servidor' },
                { status: 500 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al obtener contenidos' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en GET /api/content-veterinaries:', error);
        
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
 * POST /api/content-veterinaries - Crear un nuevo contenido
 * Proxy a la API de Laravel
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Verificar si es FormData o JSON
        const contentType = req.headers.get('content-type') || '';
        let body: any;
        let headers: Record<string, string>;

        if (contentType.includes('multipart/form-data')) {
            // Es FormData
            const formData = await req.formData();
            body = formData;
            headers = await getAuthHeaders(false);
        } else {
            // Es JSON
            body = await req.json();
            headers = await getAuthHeaders();
        }
        
        const response = await fetch(`${API_CONFIG.baseURL}/content-veterinaries`, {
            method: 'POST',
            headers,
            body: body instanceof FormData ? body : JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al crear contenido', errors: data.errors },
                { status: response.status }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Error en POST /api/content-veterinaries:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

