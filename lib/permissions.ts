/**
 * Utilidades para verificar roles y permisos del usuario
 * Para usar en Server Components y Server Actions
 */

import { auth } from '../auth';

export interface UserWithPermissions {
    roles?: string[];
    permissions?: string[];
    veterinaries?: Array<{ id: number; name: string; slug: string }>;
    hasRole?: (role: string) => boolean;
    hasRoles?: (roles: string[]) => boolean;
    hasPermission?: (permission: string) => boolean;
    hasPermissions?: (permissions: string[]) => boolean;
}

/**
 * Obtiene la sesión del usuario con métodos helper para roles y permisos
 * Para usar en Server Components y Server Actions
 */
export async function getSessionWithPermissions() {
    const session = await auth();
    
    if (!session) {
        return null;
    }

    const roles = (session as any).roles || [];
    const permissions = (session as any).permissions || [];
    const veterinaries = (session as any).veterinaries || [];

    return {
        ...session,
        roles,
        permissions,
        veterinaries,
        hasRole: (role: string) => roles.includes(role),
        hasRoles: (rolesToCheck: string[]) => {
            return rolesToCheck.some(role => roles.includes(role));
        },
        hasPermission: (permission: string) => permissions.includes(permission),
        hasPermissions: (permissionsToCheck: string[]) => {
            return permissionsToCheck.every(permission => permissions.includes(permission));
        },
    } as typeof session & UserWithPermissions;
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(role: string): Promise<boolean> {
    const session = await getSessionWithPermissions();
    if (!session) return false;
    return session.hasRole?.(role) || false;
}

/**
 * Verifica si el usuario tiene al menos uno de los roles especificados
 */
export async function hasRoles(roles: string[]): Promise<boolean> {
    const session = await getSessionWithPermissions();
    if (!session) return false;
    return session.hasRoles?.(roles) || false;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export async function hasPermission(permission: string): Promise<boolean> {
    const session = await getSessionWithPermissions();
    if (!session) return false;
    return session.hasPermission?.(permission) || false;
}

/**
 * Verifica si el usuario tiene todos los permisos especificados
 */
export async function hasPermissions(permissions: string[]): Promise<boolean> {
    const session = await getSessionWithPermissions();
    if (!session) return false;
    return session.hasPermissions?.(permissions) || false;
}

