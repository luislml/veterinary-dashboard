'use client';
import * as React from 'react';
import {
    Box,
    Card,
    Typography,
    Grid,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
} from '@mui/material';
import ShowChart from '@mui/icons-material/ShowChart';
import Assignment from '@mui/icons-material/Assignment';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface SalesData {
    date: string;
    total_amount: number;
    total_products: number;
}

interface ConsultationData {
    date: string;
    total_consultations: number;
}

interface FormattedSalesData {
    name: string;
    ventas: number;
}

interface FormattedConsultationData {
    name: string;
    consultas: number;
}

interface ConsultationsAnalyticsResponse {
    consultations_by_date: ConsultationData[];
    summary: {
        total_consultations: number;
    };
    error?: string;
    message?: string;
}

interface AnalyticsChartsProps {
    veterinaryId: number;
}

export default function AnalyticsCharts({ veterinaryId }: AnalyticsChartsProps) {
    const [filterPeriod, setFilterPeriod] = React.useState<'week' | 'month' | 'year'>('month');
    const [salesData, setSalesData] = React.useState<FormattedSalesData[]>([]);
    const [consultationsData, setConsultationsData] = React.useState<FormattedConsultationData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Calcular fechas basadas en el período seleccionado
    const getDateRange = (period: 'week' | 'month' | 'year') => {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        let startDate = new Date(today);

        switch (period) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(1); // Primer día del mes actual
                break;
            case 'year':
                startDate.setMonth(0, 1); // Primer día del año actual
                break;
        }

        startDate.setHours(0, 0, 0, 0);

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        };
    };

    // Cargar datos de analytics
    const loadAnalytics = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { startDate, endDate } = getDateRange(filterPeriod);

            // Cargar ambas APIs en paralelo
            const [salesResponse, consultationsResponse] = await Promise.all([
                fetch(`/api/sales-analytics?veterinary_id=${veterinaryId}&start_date=${startDate}&end_date=${endDate}`),
                fetch(`/api/consultations-analytics?veterinary_id=${veterinaryId}&start_date=${startDate}&end_date=${endDate}`),
            ]);

            // Procesar respuesta de ventas
            let salesDataResponse;
            try {
                salesDataResponse = await salesResponse.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor (ventas)');
            }

            if (!salesResponse.ok) {
                throw new Error(salesDataResponse.error || salesDataResponse.message || 'Error al cargar analytics de ventas');
            }

            // Procesar respuesta de consultas
            let consultationsDataResponse: ConsultationsAnalyticsResponse;
            try {
                consultationsDataResponse = await consultationsResponse.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor (consultas)');
            }

            if (!consultationsResponse.ok) {
                throw new Error(consultationsDataResponse.error || consultationsDataResponse.message || 'Error al cargar analytics de consultas');
            }

            // Procesar datos de ventas
            let processedSalesData: SalesData[] = [];
            if (Array.isArray(salesDataResponse)) {
                processedSalesData = salesDataResponse;
            } else if (salesDataResponse.data && Array.isArray(salesDataResponse.data)) {
                processedSalesData = salesDataResponse.data;
            }

            // Formatear datos de ventas para la gráfica
            const formattedSalesData: FormattedSalesData[] = processedSalesData.map((item) => ({
                name: formatDate(item.date),
                ventas: item.total_amount || 0,
            }));

            // Procesar datos de consultas
            let processedConsultationsData: ConsultationData[] = [];
            if (consultationsDataResponse.consultations_by_date && Array.isArray(consultationsDataResponse.consultations_by_date)) {
                processedConsultationsData = consultationsDataResponse.consultations_by_date;
            }

            // Formatear datos de consultas para la gráfica
            const formattedConsultationsData: FormattedConsultationData[] = processedConsultationsData.map((item) => ({
                name: formatDate(item.date),
                consultas: item.total_consultations || 0,
            }));

            setSalesData(formattedSalesData);
            setConsultationsData(formattedConsultationsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar analytics');
            setSalesData([]);
            setConsultationsData([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId, filterPeriod]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadAnalytics();
        }
    }, [loadAnalytics, veterinaryId, filterPeriod]);

    // Formatear fecha para mostrar en la gráfica
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const dayNumber = date.getDate();
        return `${dayName} ${dayNumber}`;
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

    return (
        <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
                {/* Filtro de período */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Período</InputLabel>
                        <Select
                            value={filterPeriod}
                            label="Período"
                            onChange={(e) => setFilterPeriod(e.target.value as 'week' | 'month' | 'year')}
                        >
                            <MenuItem value="week">Últimos 7 Días</MenuItem>
                            <MenuItem value="month">Este Mes</MenuItem>
                            <MenuItem value="year">Este Año</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Grid>

            {/* Gráfica de Ventas */}
            <Grid size={{ xs: 12 }}>
                <Card
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            boxShadow: 6,
                        },
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                            color: 'white',
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                width: 48,
                                height: 48,
                            }}
                        >
                            <ShowChart />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Ventas - {filterPeriod === 'week' ? 'Últimos 7 Días' : filterPeriod === 'month' ? 'Este Mes' : 'Este Año'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Tendencia de ventas diarias
                            </Typography>
                        </Box>
                    </Box>

                    {/* Gráfica */}
                    <Box sx={{ p: 3, backgroundColor: 'background.paper' }}>
                        {salesData.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay datos de ventas para el período seleccionado
                                </Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart
                                    data={salesData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#666"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `Bs. ${(value / 1000).toFixed(0)}k`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            padding: '10px',
                                        }}
                                        formatter={(value: number) => [
                                            `Bs. ${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                            'Ventas',
                                        ]}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ventas"
                                        stroke="#1976d2"
                                        strokeWidth={3}
                                        dot={{ fill: '#1976d2', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Ventas"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Card>
            </Grid>

            {/* Gráfica de Consultas */}
            <Grid size={{ xs: 12 }}>
                <Card
                    elevation={3}
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            boxShadow: 6,
                        },
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                            color: 'white',
                            p: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                width: 48,
                                height: 48,
                            }}
                        >
                            <Assignment />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                Consultas - {filterPeriod === 'week' ? 'Últimos 7 Días' : filterPeriod === 'month' ? 'Este Mes' : 'Este Año'}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Tendencia de consultas diarias
                            </Typography>
                        </Box>
                    </Box>

                    {/* Gráfica */}
                    <Box sx={{ p: 3, backgroundColor: 'background.paper' }}>
                        {consultationsData.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay datos de consultas para el período seleccionado
                                </Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart
                                    data={consultationsData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#666"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            padding: '10px',
                                        }}
                                        formatter={(value: number) => [
                                            `${value} consultas`,
                                            'Consultas',
                                        ]}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="consultas"
                                        stroke="#2e7d32"
                                        strokeWidth={3}
                                        dot={{ fill: '#2e7d32', r: 5 }}
                                        activeDot={{ r: 7 }}
                                        name="Consultas"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Card>
            </Grid>
        </Grid>
    );
}

