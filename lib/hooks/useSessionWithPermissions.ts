'use client';

/**
 * Hook de React para acceder a la sesión con métodos helper para roles y permisos
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export function useSessionWithPermissions() {
    const { data: session, status, update } = useSession();

    const sessionWithPermissions = useMemo(() => {
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
        };
    }, [session]);

    return {
        data: sessionWithPermissions,
        status,
        update,
    };
}

