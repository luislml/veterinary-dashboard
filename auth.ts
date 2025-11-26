import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import { loginWithAPI, getAuthenticatedUser } from './lib/api-client';


const providers: Provider[] = [Credentials({
    credentials: {
        email: { label: 'Correo Electrónico', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
    },
    async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
            throw new Error('Email y contraseña son requeridos');
        }

        try {
            const response = await loginWithAPI(
                String(credentials.email),
                String(credentials.password)
            );

            // Laravel puede devolver 'token' o 'access_token'
            const token = response.token || response.access_token;
            
            // Laravel puede devolver el usuario directamente o dentro de 'user'
            const user = response.user || response;
            
            if (!token || !user || !(user as any).id) {
                throw new Error('Respuesta inválida del servidor');
            }

            return {
                id: String((user as any).id),
                name: (user as any).name || (user as any).email || 'Usuario',
                email: (user as any).email || String(credentials.email),
                // Guardar el token para usarlo en las peticiones API
                accessToken: token,
            };
        } catch (error) {
            console.error('Error en autenticación:', error);
            
            // Propagar el error con los detalles de la API
            if (error && typeof error === 'object' && 'message' in error) {
                const apiError = error as { message: string; errors?: Record<string, string[]> };
                const customError = new Error(apiError.message);
                // Agregar los errores por campo usando cause (NextAuth preserva cause)
                customError.cause = {
                    fieldErrors: apiError.errors || {},
                };
                // También agregar directamente por si acaso
                (customError as any).fieldErrors = apiError.errors || {};
                throw customError;
            }
            
            throw new Error('Error al iniciar sesión. Verifica tus credenciales.');
        }
    },
}),
];




export const providerMap = providers.map((provider) => {
    if (typeof provider === 'function') {
        const providerData = provider();
        return { id: providerData.id, name: providerData.name };
    }
    return { id: provider.id, name: provider.name };
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers,



    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Guardar el token de Laravel cuando el usuario inicia sesión
            if (user) {
                // El token se pasa desde el authorize en el objeto user
                if ((user as any).accessToken) {
                    token.accessToken = (user as any).accessToken;
                    
                    // Obtener información completa del usuario con roles y permisos
                    try {
                        const userData = await getAuthenticatedUser((user as any).accessToken);
                        token.user = userData.user;
                        token.roles = userData.roles;
                        token.permissions = userData.permissions;
                        token.veterinaries = userData.veterinaries;
                    } catch (error) {
                        console.error('Error al obtener datos del usuario:', error);
                        // Si falla, al menos guardamos el token para intentar más tarde
                    }
                }
            }
            
            // Refrescar datos del usuario si es necesario
            if (trigger === 'update' && token.accessToken) {
                try {
                    const userData = await getAuthenticatedUser(token.accessToken as string);
                    token.user = userData.user;
                    token.roles = userData.roles;
                    token.permissions = userData.permissions;
                    token.veterinaries = userData.veterinaries;
                } catch (error) {
                    console.error('Error al actualizar datos del usuario:', error);
                }
            }
            
            return token;
        },
        async session({ session, token }) {
            // Agregar el token a la sesión
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken;
            }
            
            // Agregar datos del usuario, roles, permisos y veterinarias
            if (token.user) {
                (session as any).user = {
                    ...session.user,
                    ...token.user,
                };
            }
            
            if (token.roles) {
                (session as any).roles = token.roles;
            }
            
            if (token.permissions) {
                (session as any).permissions = token.permissions;
            }
            
            if (token.veterinaries) {
                (session as any).veterinaries = token.veterinaries;
            }
            
            return session;
        },
        authorized({ auth: session, request: { nextUrl } }) {
            const isLoggedIn = !!session?.user;
            const isPublicPage = nextUrl.pathname.startsWith('/public');

            if (isPublicPage || isLoggedIn) {
                return true;
            }

            return false; // Redirect unauthenticated users to login page
        },
    },
});
