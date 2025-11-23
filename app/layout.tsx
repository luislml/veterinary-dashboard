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

import type { Navigation } from '@toolpad/core/AppProvider';
import { SessionProvider, signIn, signOut } from 'next-auth/react';
import { auth } from '../auth';
import theme from '../theme';
import ConfirmProviderWrapper from './components/ConfirmProviderWrapper';

export const metadata = {
    title: 'Dashboard Veterinaria',
    description: 'Dashboard Veterinaria',
};

const NAVIGATION: Navigation = [
    {
        kind: 'header',
        title: 'Menu Principal',
    },
    {
        segment: '',
        title: 'Dashboard',
        icon: <DashboardIcon />,
    },
    {
        segment: 'plans',
        title: 'Planes',
        icon: <StyleIcon />,
    },
    {
        segment: 'users',
        title: 'Usuarios',
        icon: <PersonIcon />,
    },
    {
        segment: 'veterinaries',
        title: 'Veterinarias',
        icon: <PetsIcon />,
    },
    {
        segment: 'clients',
        title: 'Clientes',
        icon: <PeopleIcon />,
    },
    {
        title: 'Mascotas',
        icon: <EmojiNatureIcon />,
        children: [
            {
                segment: 'type-pets',
                title: 'Tipos de mascotas',
                icon: <CategoryIcon />,
            },
            {
                segment: 'races',
                title: 'Razas',
                icon: <StarIcon />,
            },
            {
                segment: 'pets',
                title: 'Registro de mascotas',
                icon: <AssignmentIcon />,
            },
        ],
    },
];

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

    return (
        <html lang="en" data-toolpad-color-scheme="light" suppressHydrationWarning>
            <body>
                <ConfirmProviderWrapper>
                <SessionProvider session={session}>
                    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                    
                        <NextAppProvider
                            navigation={NAVIGATION}
                            branding={BRANDING}
                            session={session}
                            authentication={AUTHENTICATION}
                            theme={theme}
                            localeText={LOCALE_TEXT}
                        >
                            {props.children}
                        </NextAppProvider>
                      
                    </AppRouterCacheProvider>
                </SessionProvider>
                </ConfirmProviderWrapper>
            </body>
        </html>
    );
}
