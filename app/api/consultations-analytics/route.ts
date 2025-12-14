import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { API_CONFIG } from '../../../lib/config';
import { getAuthHeaders } from '../../../lib/auth-utils';

/**
 * GET /api/consultations-analytics - Obtener analytics de consultas
 * Proxy a la API de Laravel
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const veterinaryId = searchParams.get('veterinary_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        // Construir URL de Laravel
        const laravelUrl = new URL(`${API_CONFIG.baseURL}/consultations-analytics`);
        
        if (veterinaryId) {
            laravelUrl.searchParams.append('veterinary_id', veterinaryId);
        }
        
        if (startDate) {
            laravelUrl.searchParams.append('start_date', startDate);
        }
        
        if (endDate) {
            laravelUrl.searchParams.append('end_date', endDate);
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
                { error: data.message || 'Error al obtener analytics de consultas' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en GET /api/consultations-analytics:', error);
        
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

