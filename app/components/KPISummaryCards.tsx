'use client';
import * as React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Stack,
    CircularProgress,
    Alert,
} from '@mui/material';
import AttachMoney from '@mui/icons-material/AttachMoney';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import TrendingUp from '@mui/icons-material/TrendingUp';

interface KPISummaryData {
    consultations: {
        today: number;
        yesterday: number;
    };
    sales: {
        today: {
            count: number;
            amount: number;
        };
        yesterday: {
            count: number;
            amount: number;
        };
    };
    earnings: {
        today: number;
        yesterday: number;
    };
}

interface KPISummaryCardsProps {
    veterinaryId: number;
}

export default function KPISummaryCards({ veterinaryId }: KPISummaryCardsProps) {
    const [data, setData] = React.useState<KPISummaryData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Cargar datos de KPIs
    const loadKPIData = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/kpi-summary?veterinary_id=${veterinaryId}`);

            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(responseData.error || responseData.message || 'Error al cargar KPIs');
            }

            setData(responseData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar KPIs');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadKPIData();
        }
    }, [loadKPIData, veterinaryId]);

    // Calcular cambio porcentual
    const calculateChange = (today: number, yesterday: number): string => {
        if (yesterday === 0) {
            return today > 0 ? '+100%' : '0%';
        }
        const change = ((today - yesterday) / yesterday) * 100;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    };

    // Formatear número con separadores
    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-ES');
    };

    // Formatear moneda
    const formatCurrency = (amount: number): string => {
        return `bs/${formatNumber(amount)}`;
    };

    // Calcular ticket promedio
    const calculateAverageTicket = (): { today: number; yesterday: number } => {
        if (!data) return { today: 0, yesterday: 0 };
        
        const todayAvg = data.sales.today.count > 0 
            ? data.sales.today.amount / data.sales.today.count 
            : 0;
        
        const yesterdayAvg = data.sales.yesterday.count > 0 
            ? data.sales.yesterday.amount / data.sales.yesterday.count 
            : 0;
        
        return { today: todayAvg, yesterday: yesterdayAvg };
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert severity="info">
                No hay datos disponibles
            </Alert>
        );
    }

    const averageTicket = calculateAverageTicket();

    const stats = [
        {
            title: 'Consultas del día',
            value: formatNumber(data.consultations.today),
            change: calculateChange(data.consultations.today, data.consultations.yesterday),
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#1976d2',
        },
        {
            title: 'Ventas del día',
            value: formatNumber(data.sales.today.count),
            change: calculateChange(data.sales.today.count, data.sales.yesterday.count),
            icon: <ShoppingCart sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
        },
        {
            title: 'Ticket promedio del día',
            value: formatCurrency(averageTicket.today),
            change: calculateChange(averageTicket.today, averageTicket.yesterday),
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            color: '#ed6c02',
        },
    ];

    return (
        <Grid container spacing={4} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
                <Grid key={index} size={{ xs: 12, md: 4 }}>
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
                                            color: stat.change.startsWith('+') ? 'success.main' : stat.change.startsWith('-') ? 'error.main' : 'text.secondary',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {stat.change} vs día anterior
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
                </Grid>
            ))}
        </Grid>
    );
}

