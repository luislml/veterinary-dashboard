
# Dashboard Test

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-toolpad-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setup

### 1. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# API Configuration
# URL base de la API de Laravel
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# NextAuth Configuration
# Genera un secreto con: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here
```

Para generar un secreto seguro para `AUTH_SECRET`, ejecuta:
```bash
openssl rand -base64 32
```

### 2. Configurar la API de Laravel

Asegúrate de que tu API de Laravel esté corriendo en `http://localhost:8000/api` y que tenga los siguientes endpoints:

#### Autenticación
- `POST /api/login` - Endpoint de autenticación
  - Body: `{ "email": "user@example.com", "password": "password" }`
  - Response esperado: `{ "user": { "id": 1, "name": "User Name", "email": "user@example.com" }, "token": "..." }` o `{ "access_token": "..." }`

#### CRUD de Usuarios
- `GET /api/users` - Listar usuarios (con paginación)
  - Query params: `page`, `per_page`, `sort_by`, `sort_order`, `filter`
  - Response: `{ "data": [...], "current_page": 1, "total": 100, "per_page": 10 }` o array simple
  
- `GET /api/users/{id}` - Obtener un usuario específico
  - Response: `{ "data": { "id": 1, "name": "...", "email": "..." } }` o objeto directo
  
- `POST /api/users` - Crear un nuevo usuario
  - Body: `{ "name": "User Name", "email": "user@example.com" }`
  - Response: `{ "data": { "id": 1, "name": "...", "email": "..." } }`
  
- `PUT /api/users/{id}` - Actualizar un usuario
  - Body: `{ "name": "Updated Name", "email": "updated@example.com" }`
  - Response: `{ "data": { "id": 1, "name": "...", "email": "..." } }`
  
- `DELETE /api/users/{id}` - Eliminar un usuario
  - Response: `{ "success": true }` o `{ "message": "..." }`

**Nota:** Todas las peticiones a los endpoints de usuarios requieren autenticación mediante Bearer token en el header `Authorization: Bearer {token}`

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Estructura del Proyecto

- `/lib` - Utilidades y configuración
  - `config.ts` - Configuración de la API y variables de entorno
  - `api-client.ts` - Cliente para comunicación con la API de Laravel (login)
  - `auth-utils.ts` - Utilidades para obtener tokens de autenticación
- `/data` - Data sources para Toolpad Core
  - `users.ts` - DataSource para el CRUD de usuarios
- `/app` - Rutas y páginas de Next.js
  - `/api/users` - Rutas API proxy a Laravel para usuarios
  - `/(dashboard)/users` - Página CRUD de usuarios
- `/auth.ts` - Configuración de NextAuth con integración a Laravel

## Funcionalidades

- ✅ Autenticación con API de Laravel
- ✅ CRUD completo de usuarios conectado a Laravel
- ✅ Manejo de tokens de autenticación
- ✅ Paginación, ordenamiento y filtrado

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
