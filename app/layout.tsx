import * as React from 'react';
import { NextAppProvider } from '@toolpad/core/nextjs';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import StyleIcon from '@mui/icons-material/Style';
import PetsIcon from '@mui/icons-material/Pets';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import StarIcon from '@mui/icons-material/Star';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BookIcon from '@mui/icons-material/Book';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import type { Navigation } from '@toolpad/core/AppProvider';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import { auth } from '../auth';
import { getSessionWithPermissions } from '../lib/permissions';
import theme from '../theme';
import ConfirmProviderWrapper from './components/ConfirmProviderWrapper';
import { SelectedVeterinaryProvider } from '../lib/contexts/SelectedVeterinaryContext';


export const metadata = {
    title: 'Dashboard Veterinaria',
    description: 'Dashboard Veterinaria',
};

/**
 * Genera el menú de navegación basado en los permisos del usuario
 */
function getNavigation(
    hasPermission: (permission: string) => boolean,
    hasRole: (role: string) => boolean
): Navigation {
    const navigation: Navigation = [
        {
            kind: 'header',
            title: 'Menu Principal',
        },
        {
            segment: '',
            title: 'Dashboard',
            icon: <DashboardIcon />,
        },
    ];

    // consultas - requiere permiso 'view any consultations'
    if (hasPermission('view any consultations') && hasRole('veterinary')) {
        navigation.push({
            segment: 'consultations',
            title: 'Consultorio',
            icon: <AssignmentIcon />,
        });
    }

    // anuncios - requiere permiso 'view any ads'
    if (hasRole('veterinary')) {
    // if (hasPermission('') && hasRole('veterinary')) {
        navigation.push({
            segment: 'advertisements',
            title: 'Anuncios',
            icon: <AnnouncementIcon />,
        });
    }

    // Planes - requiere permiso 'view any plans'
    if (hasPermission('view any plans')) {
        navigation.push({
            segment: 'plans',
            title: 'Planes',
            icon: <StyleIcon />,
        });
    }

    // Usuarios - requiere permiso 'view any users'
    if (hasPermission('view any users')) {
        navigation.push({
            segment: 'users',
            title: 'Usuarios',
            icon: <PersonIcon />,
        });
    }

    // Veterinarias - requiere permiso 'view any veterinaries'
    if (hasPermission('view any veterinaries')) {
        navigation.push({
            segment: 'veterinaries',
            title: 'Veterinarias',
            icon: <PetsIcon />,
        });
    }

    // Clientes - requiere permiso 'view any clients'
    if (hasPermission('view any clients') && hasRole('admin')) {
        navigation.push({
            segment: 'clients',
            title: 'Clientes',
            icon: <PeopleIcon />,
        });
    }

    // Mascotas 
    // Tipos de mascotas - requiere permiso 'view any type-pets'
    if (hasPermission('view any type-pets') && hasRole('admin')) {
        navigation.push({
            segment: 'type-pets',
            title: 'Tipos de mascotas',
            icon: <CategoryIcon />,
        });
    }

    // Razas - requiere permiso 'view any races'
    if (hasPermission('view any races') && hasRole('admin')) {
        navigation.push({
            segment: 'races',
            title: 'Razas',
            icon: <StarIcon />,
        });
    }

    // Registro de mascotas - requiere permiso 'view any pets'
    if (hasPermission('view any pets') && hasRole('admin')) {
        navigation.push({
            segment: 'pets',
            title: 'Lista de mascotas',
            icon: <AssignmentIcon />,
        });
    }

    navigation.push({
        kind: 'header',
        title: 'Marketplace',
    });

    // Productos - requiere permiso 'view any products'
    if (hasPermission('view any products')) {
        navigation.push({
            segment: 'products',
            title: 'Productos',
            icon: <Inventory2Icon />,
        });
    }

    // compras y ventas
    if (hasPermission('view any shoppings')) {
        navigation.push({
            segment: 'shoppings',
            title: 'Compras',
            icon: <AddShoppingCartIcon />,
        });
    }
    if (hasPermission('view any sales')) {
        navigation.push({
            segment: 'sales',
            title: 'Ventas',
            icon: <ShoppingCartCheckoutIcon />,
        });
    }
    // libro de compras y ventas
    if (hasPermission('view any movements') && hasRole('veterinary')) {
        navigation.push({
            segment: 'movements-analytics',
            title: 'Libro de compras y ventas',
            icon: <BookIcon />,
        });
    }

    navigation.push({
        kind: 'header',
        title: 'Configuraciones',
    });

    // configuraciones - menú con subitems
    if (hasPermission('view any configurations') && hasRole('veterinary')) {
        navigation.push({
            segment: 'configurations',
            title: 'Mi veterinaria',
            icon: <PetsIcon />,
        });
    }
    if (hasPermission('view any schedules') && hasRole('veterinary')) {
        navigation.push({
            segment: 'schedules',
            title: 'Horarios',
            icon: <ScheduleIcon />,
        });
    }
    if (hasPermission('view any addresses') && hasRole('veterinary')) {
        navigation.push({
            segment: 'addresses',
            title: 'Direcciones',
            icon: <LocationOnIcon />,
        });
    }
    
    return navigation;
}

const BRANDING = {
  title: 'Veterinaria APP',
};


const AUTHENTICATION = {
    signIn,
    signOut,
};

const LOCALE_TEXT = {
    accountSignOutLabel: 'Salir',
};

export default async function RootLayout(props: { children: React.ReactNode }) {
    const session = await auth();
    
    // Obtener sesión con roles y permisos
    const sessionWithPermissions = await getSessionWithPermissions();
    
    // // Console.log a modo de prueba
    // if (sessionWithPermissions) {
    //     console.log('=== INFORMACIÓN DEL USUARIO ===');
    //     console.log('Usuario:', sessionWithPermissions.user);
    //     console.log('Roles:', sessionWithPermissions.roles);
    //     console.log('Permisos:', sessionWithPermissions.permissions);
    //     console.log('Veterinarias:', sessionWithPermissions.veterinaries);
    //     console.log('--- Verificaciones de ejemplo ---');
    //     console.log('¿Tiene rol "veterinary"?', sessionWithPermissions.hasRole?.('veterinary'));
    //     console.log('¿Tiene permiso "view pets"?', sessionWithPermissions.hasPermission?.('view pets'));
    //     console.log('¿Tiene permiso "view dashboard"?', sessionWithPermissions.hasPermission?.('view dashboard'));
    //     console.log('¿Tiene permiso "view any plans"?', sessionWithPermissions.hasPermission?.('view any plans'));
    //     console.log('¿Tiene alguno de estos roles ["veterinary", "admin"]?', sessionWithPermissions.hasRoles?.(['veterinary', 'admin']));
    //     console.log('¿Tiene todos estos permisos ["view pets", "create pets"]?', sessionWithPermissions.hasPermissions?.(['view pets', 'create pets']));
    //     console.log('================================');
    // }

    // Generar menú basado en permisos y roles
    const navigation = getNavigation(
        (permission: string) => sessionWithPermissions?.hasPermission?.(permission) || false,
        (role: string) => sessionWithPermissions?.hasRole?.(role) || false
    );

    return (
        <html lang="en" data-toolpad-color-scheme="light" suppressHydrationWarning>
            <body>
                <ConfirmProviderWrapper>
                <SessionProvider session={session}>
                    <SelectedVeterinaryProvider>
                        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                        
                            <NextAppProvider
                                navigation={navigation}
                                branding={BRANDING}
                                session={session as any}
                                authentication={AUTHENTICATION}
                                theme={theme}
                                localeText={LOCALE_TEXT}
                            >
                                {props.children}
                            </NextAppProvider>
                          
                        </AppRouterCacheProvider>
                    </SelectedVeterinaryProvider>
                </SessionProvider>
                </ConfirmProviderWrapper>
            </body>
        </html>
    );
}
