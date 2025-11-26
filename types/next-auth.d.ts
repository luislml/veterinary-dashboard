/**
 * Tipos extendidos para NextAuth con roles, permisos y veterinarias
 */

import 'next-auth';
import { Veterinary } from '../lib/api-client';

declare module 'next-auth' {
    interface User {
        accessToken?: string;
    }

    interface Session {
        accessToken?: string;
        user?: {
            id: number;
            name: string;
            email: string;
            last_name?: string;
            phone?: string;
        };
        roles?: string[];
        permissions?: string[];
        veterinaries?: Veterinary[];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        user?: {
            id: number;
            name: string;
            email: string;
            last_name?: string;
            phone?: string;
        };
        roles?: string[];
        permissions?: string[];
        veterinaries?: Veterinary[];
    }
}

