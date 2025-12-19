'use client';
import { DataModel, DataSource, DataSourceCache } from '@toolpad/core/Crud';
import { z } from 'zod';
import { API_CONFIG } from '../lib/config';

export interface User extends DataModel {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

const API_URL = '/api/users';

export const usersDataSource: DataSource<User> = {
    fields: [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Nombre', width: 200 },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'email_verified_at',
            headerName: 'Email Verificado',
            type: 'date',
            valueGetter: (value) => value && new Date(value),
            width: 180,
        },
        {
            field: 'created_at',
            headerName: 'Fecha de Creación',
            type: 'date',
            valueGetter: (value) => value && new Date(value),
            width: 180,
        },
    ],
    getMany: async ({ paginationModel, filterModel, sortModel }) => {
        const queryParams = new URLSearchParams();

        queryParams.append('page', (paginationModel.page + 1).toString()); // Laravel usa página 1-indexed
        queryParams.append('per_page', paginationModel.pageSize.toString());
        
        if (sortModel?.length) {
            const sort = sortModel[0];
            queryParams.append('sort_by', sort.field);
            queryParams.append('sort_order', sort.sort || 'asc');
        }
        
        if (filterModel?.items?.length) {
            queryParams.append('filter', JSON.stringify(filterModel.items));
        }

        const res = await fetch(`${API_URL}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        const resJson = await res.json();

        if (!res.ok) {
            throw new Error(resJson.message || resJson.error || 'Error al obtener usuarios');
        }

        // Adaptar respuesta de Laravel al formato esperado por Toolpad
        // Laravel puede devolver: { data: [...], current_page, total, per_page }
        if (resJson.data) {
            return {
                items: resJson.data,
                itemCount: resJson.total || resJson.data.length,
            };
        }

        return {
            items: Array.isArray(resJson) ? resJson : [],
            itemCount: Array.isArray(resJson) ? resJson.length : 0,
        };
    },
    getOne: async (userId) => {
        const res = await fetch(`${API_URL}/${userId}`, {
            headers: {
                'Accept': 'application/json',
            },
        });
        const resJson = await res.json();

        if (!res.ok) {
            throw new Error(resJson.message || resJson.error || 'Error al obtener el usuario');
        }

        return resJson.data || resJson;
    },
    createOne: async (data) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        const resJson = await res.json();

        if (!res.ok) {
            const errorMessage = resJson.message || resJson.error || 'Error al crear el usuario';
            const errors = resJson.errors ? Object.values(resJson.errors).flat().join(', ') : '';
            throw new Error(errors || errorMessage);
        }

        return resJson.data || resJson;
    },
    updateOne: async (userId, data) => {
        const res = await fetch(`${API_URL}/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        const resJson = await res.json();

        if (!res.ok) {
            const errorMessage = resJson.message || resJson.error || 'Error al actualizar el usuario';
            const errors = resJson.errors ? Object.values(resJson.errors).flat().join(', ') : '';
            throw new Error(errors || errorMessage);
        }

        return resJson.data || resJson;
    },
    deleteOne: async (userId) => {
        const res = await fetch(`${API_URL}/${userId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
            },
        });
        
        if (!res.ok) {
            const resJson = await res.json();
            throw new Error(resJson.message || resJson.error || 'Error al eliminar el usuario');
        }

        // No retornar nada, el tipo esperado es void
    },
    validate: z.object({
        name: z.string({ required_error: 'El nombre es requerido' }).min(1, 'El nombre es requerido'),
        email: z.string({ required_error: 'El email es requerido' }).email('Email inválido'),
    })['~standard'].validate,
};

export const usersCache = new DataSourceCache();

