'use client';
import * as React from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    CircularProgress,
    TextField,
    Button,
    Stack,
} from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import SearchIcon from '@mui/icons-material/Search';

interface DailyTotal {
    movement_date: string;
    total_entry: string;
    total_output: string;
    daily_balance: string;
    accumulated_balance: number;
}

interface MovementsAnalyticsResponse {
    daily_totals: DailyTotal[];
    total_accumulated: number;
}

// Función para obtener el primer y último día del mes actual
const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

export default function MovementsAnalyticsPage() {
    const { selectedVeterinary } = useSelectedVeterinary();
    const currentMonth = getCurrentMonthDates();
    
    const [data, setData] = React.useState<MovementsAnalyticsResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [startDate, setStartDate] = React.useState(currentMonth.start);
    const [endDate, setEndDate] = React.useState(currentMonth.end);

    // Cargar datos
    const loadData = React.useCallback(async () => {
        if (!startDate || !endDate) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtros
            let url = `/api/movements-analytics?start=${startDate}&end=${endDate}`;
            if (selectedVeterinary?.id) {
                url += `&veterinary_id=${selectedVeterinary.id}`;
            }
            
            const response = await fetch(url);
            
            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(responseData.error || responseData.message || 'Error al cargar datos');
            }

            setData(responseData);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [selectedVeterinary?.id]);

    // Cargar datos al montar el componente y cuando cambien los filtros
    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Formatear número con separadores de miles
    const formatNumber = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <PageContainer>
            <Box>
                {/* Filtros */}
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
                        <TextField
                            label="Fecha Inicial"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Fecha Final"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            size="small"
                        />
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={loadData}
                            disabled={loading || !startDate || !endDate}
                            sx={{ minWidth: 120 }}
                        >
                            Buscar
                        </Button>
                    </Stack>
                </Paper>

                {/* Resumen Total */}
                {data && (
                    <Paper
                        elevation={2}
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: 2,
                            backgroundColor: 'primary.main',
                            color: 'white',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Balance Acumulado Total: ${formatNumber(data.total_accumulated)}
                        </Typography>
                    </Paper>
                )}

                {/* Tabla de datos */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                ) : !data || data.daily_totals.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No hay datos disponibles para el período seleccionado.
                    </Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        Fecha
                                    </TableCell>
                                    <TableCell>
                                        Total Entradas
                                    </TableCell>
                                    <TableCell>
                                        Total Salidas
                                    </TableCell>
                                    <TableCell>
                                        Balance Diario
                                    </TableCell>
                                    <TableCell>
                                        Balance Acumulado
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.daily_totals.map((row, index) => (
                                    <TableRow
                                        key={index}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {formatDate(row.movement_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'success.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                ${formatNumber(row.total_entry)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                ${formatNumber(row.total_output)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: parseFloat(row.daily_balance) >= 0 ? 'success.main' : 'error.main',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                ${formatNumber(row.daily_balance)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: row.accumulated_balance >= 0 ? 'success.main' : 'error.main',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ${formatNumber(row.accumulated_balance)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </PageContainer>
    );
}

