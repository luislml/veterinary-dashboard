'use server';
import { AuthError } from 'next-auth';
import type { AuthProvider } from '@toolpad/core';
import { signIn } from '../../../auth';

export default async function serverSignIn(provider: AuthProvider, formData: FormData, callbackUrl?: string) {
    try {
        return await signIn(provider.id, {      
        ...(formData && { email: formData.get('email'), password: formData.get('password') }),      
          redirectTo: callbackUrl ?? '/',
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
                    
            throw error;
        }
        
        // Intentar obtener los errores por campo de diferentes formas
        let fieldErrors: Record<string, string[]> = {};
        
        if (error instanceof AuthError) {
            // Intentar obtener los errores por campo del error original
            const cause = (error as any).cause;
            if (cause && typeof cause === 'object' && (cause as any).fieldErrors) {
                fieldErrors = (cause as any).fieldErrors;
            }
            // También intentar desde el error mismo
            if ((error as any).fieldErrors) {
                fieldErrors = (error as any).fieldErrors;
            }
            
            return {
                error: error.type === 'CredentialsSignin' ? 'Credenciales inválidas.' : 'Ocurrió un error con la autenticación.',
                type: error.type,
                fieldErrors: fieldErrors,
            };
        }
        
        // Si el error tiene fieldErrors directamente, devolverlos
        if (error instanceof Error && (error as any).fieldErrors) {
            return {
                error: error.message || 'Ocurrió un error con la autenticación.',
                type: 'ValidationError',
                fieldErrors: (error as any).fieldErrors,
            };
        }
        
        return {
            error: 'Algo salió mal.',
            type: 'UnknownError',
            fieldErrors: {},
        };
    }
}