import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';
import { loginWithAPI } from './lib/api-client';


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
            
            if (!token || !user || !user.id) {
                throw new Error('Respuesta inválida del servidor');
            }

            return {
                id: String(user.id),
                name: user.name || user.email || 'Usuario',
                email: user.email || String(credentials.email),
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
        async jwt({ token, user }) {
            // Guardar el token de Laravel cuando el usuario inicia sesión
            if (user) {
                // El token se pasa desde el authorize en el objeto user
                if ((user as any).accessToken) {
                    token.accessToken = (user as any).accessToken;
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Agregar el token a la sesión
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken;
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
