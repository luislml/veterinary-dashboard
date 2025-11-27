import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { API_CONFIG } from '../../../../lib/config';
import { getAuthHeaders } from '../../../../lib/auth-utils';

/**
 * GET /api/schedules/[id] - Obtener un horario específico
 * Proxy a la API de Laravel
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;

        // Obtener headers con token de autenticación
        const headers = await getAuthHeaders();
        
        const response = await fetch(`${API_CONFIG.baseURL}/schedules/${id}`, {
            method: 'GET',
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Horario no encontrado' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en GET /api/schedules/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/schedules/[id] - Actualizar un horario
 * Proxy a la API de Laravel
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Obtener headers con token de autenticación
        const headers = await getAuthHeaders();
        
        const response = await fetch(`${API_CONFIG.baseURL}/schedules/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.message || 'Error al actualizar horario', errors: data.errors },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error en PUT /api/schedules/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/schedules/[id] - Eliminar un horario
 * Proxy a la API de Laravel
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        
        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { id } = await params;

        // Obtener headers con token de autenticación
        const headers = await getAuthHeaders();
        
        const response = await fetch(`${API_CONFIG.baseURL}/schedules/${id}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(
                { error: data.message || 'Error al eliminar horario' },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error en DELETE /api/schedules/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

