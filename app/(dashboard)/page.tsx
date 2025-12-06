'use client';
import * as React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Stack,
} from '@mui/material';
import {
    TrendingUp,
    AttachMoney,
    ShoppingCart,
    BarChart,
    ShowChart,
} from '@mui/icons-material';
import { PageContainer } from '@toolpad/core/PageContainer';

// Datos mock para las gráficas
const generateMockData = (period: 'today' | 'month' | 'year') => {
    if (period === 'today') {
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            sales: Math.floor(Math.random() * 5000) + 1000,
        }));
    } else if (period === 'month') {
        return Array.from({ length: 30 }, (_, i) => ({
            day: `Día ${i + 1}`,
            sales: Math.floor(Math.random() * 10000) + 5000,
        }));
    } else {
        return Array.from({ length: 12 }, (_, i) => ({
            month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
            sales: Math.floor(Math.random() * 50000) + 20000,
        }));
    }
};

export default function HomePage() {
    const [filterPeriod, setFilterPeriod] = React.useState<'today' | 'month' | 'year'>('month');

    // Datos mock para las cajas superiores
    const stats = [
        {
            title: 'Ventas Totales',
            value: '$125,430',
            change: '+12.5%',
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#1976d2',
        },
        {
            title: 'Órdenes',
            value: '1,234',
            change: '+8.2%',
            icon: <ShoppingCart sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
        },
        {
            title: 'Crecimiento',
            value: '+15.3%',
            change: '+2.1%',
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            color: '#ed6c02',
        },
    ];

    return (
        <PageContainer>
            <Box sx={{ p: 3 }}>
                {/* 3 Cajas superiores */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Box key={index} sx={{ flex: 1, minWidth: { xs: '100%', sm: '300px' } }}>
                            <Card
                                sx={{
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                                    border: `1px solid ${stat.color}30`,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}
                                            >
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: stat.change.startsWith('+') ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {stat.change} vs período anterior
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                color: stat.color,
                                                backgroundColor: `${stat.color}20`,
                                                borderRadius: 2,
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    ))}
                </Stack>

                {/* Filtro de período */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Período</InputLabel>
                        <Select
                            value={filterPeriod}
                            label="Período"
                            onChange={(e) => setFilterPeriod(e.target.value as 'today' | 'month' | 'year')}
                        >
                            <MenuItem value="today">Hoy</MenuItem>
                            <MenuItem value="month">Este Mes</MenuItem>
                            <MenuItem value="year">Este Año</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* 2 Gráficas de ventas */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    {/* Gráfica de Barras */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '400px' } }}>
                        grafica de barras
                    </Box>

                    {/* Gráfica de Línea */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '400px' } }}>
                        grafica de linea
                    </Box>
                </Stack>
            </Box>
        </PageContainer>
    );
}
