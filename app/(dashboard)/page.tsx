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
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Avatar,
    Chip,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
} from '@mui/material';
import {
    TrendingUp,
    AttachMoney,
    ShoppingCart,
    BarChart,
    ShowChart,
    Pets,
    Visibility,
    ArrowForwardIos,
    Inventory2,
    TrendingDown,
    WarningAmber,
    Assignment,
    ErrorOutline,
} from '@mui/icons-material';
import { PageContainer } from '@toolpad/core/PageContainer';
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
    const [inventoryTab, setInventoryTab] = React.useState(0);

    // Generar datos para los últimos 7 días - Ventas
    const getLast7DaysSalesData = () => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNumber = date.getDate();
            days.push({
                name: `${dayName} ${dayNumber}`,
                ventas: Math.floor(Math.random() * 15000) + 5000,
            });
        }
        return days;
    };

    // Generar datos para los últimos 7 días - Consultas
    const getLast7DaysConsultationsData = () => {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNumber = date.getDate();
            days.push({
                name: `${dayName} ${dayNumber}`,
                consultas: Math.floor(Math.random() * 30) + 10,
            });
        }
        return days;
    };

    const salesLast7Days = React.useMemo(() => getLast7DaysSalesData(), []);
    const consultationsLast7Days = React.useMemo(() => getLast7DaysConsultationsData(), []);

    // Datos mock para mascotas atendidas
    const recentPets = [
        { id: 1, name: 'Michi', age: '1 año', species: 'Perro', type: 'Canino', lastVisit: 'Hace 2 horas', status: 'activo' },
        { id: 2, name: 'Luna', age: '3 años', species: 'Gato', type: 'Felino', lastVisit: 'Hace 5 horas', status: 'activo' },
        { id: 3, name: 'Max', age: '2 años', species: 'Perro', type: 'Canino', lastVisit: 'Ayer', status: 'pendiente' },
        { id: 4, name: 'Bella', age: '4 meses', species: 'Gato', type: 'Felino', lastVisit: 'Hace 1 día', status: 'activo' },
        { id: 5, name: 'Rocky', age: '5 años', species: 'Perro', type: 'Canino', lastVisit: 'Hace 2 días', status: 'activo' },
    ];

    // Datos mock para productos más vendidos
    const topProducts = [
        { id: 1, name: 'Alimento Premium para Perros', quantity: 245, revenue: 'Bs. 12,250', change: '+15%', rank: 1 },
        { id: 2, name: 'Vacuna Nobivac DH2 Ppi', quantity: 189, revenue: 'Bs. 9,450', change: '+8%', rank: 2 },
        { id: 3, name: 'Shampoo Antipulgas', quantity: 156, revenue: 'Bs. 4,680', change: '+22%', rank: 3 },
        { id: 4, name: 'Juguete Interactivo', quantity: 134, revenue: 'Bs. 2,680', change: '-5%', rank: 4 },
        { id: 5, name: 'Collar Ajustable', quantity: 98, revenue: 'Bs. 1,960', change: '+12%', rank: 5 },
    ];

    // Datos mock para productos con bajo stock
    const lowStockProducts = [
        { id: 1, name: 'Vacuna Feligen CRP', stock: 3, minStock: 10, category: 'Vacunas', status: 'crítico' },
        { id: 2, name: 'Alimento para Gatos Premium', stock: 5, minStock: 10, category: 'Alimentos', status: 'crítico' },
        { id: 3, name: 'Antiparasitario Oral', stock: 7, minStock: 10, category: 'Medicamentos', status: 'bajo' },
        { id: 4, name: 'Cepillo para Mascotas', stock: 8, minStock: 10, category: 'Accesorios', status: 'bajo' },
        { id: 5, name: 'Shampoo Medicado', stock: 9, minStock: 10, category: 'Higiene', status: 'bajo' },
    ];

    // Datos mock para productos por agotarse (menos de 10 unidades)
    const runningOutProducts = [
        { id: 1, name: 'Vacuna Nobivac Rabia', stock: 2, minStock: 10, category: 'Vacunas', daysLeft: 3 },
        { id: 2, name: 'Alimento Premium Perros', stock: 4, minStock: 10, category: 'Alimentos', daysLeft: 5 },
        { id: 3, name: 'Desparasitante Oral', stock: 6, minStock: 10, category: 'Medicamentos', daysLeft: 7 },
        { id: 4, name: 'Juguete Kong Clásico', stock: 8, minStock: 10, category: 'Accesorios', daysLeft: 10 },
        { id: 5, name: 'Arena Sanitaria', stock: 9, minStock: 10, category: 'Higiene', daysLeft: 12 },
    ];

    // Datos mock para productos agotados
    const outOfStockProducts = [
        { id: 1, name: 'Vacuna Leucogen', stock: 0, category: 'Vacunas', lastStock: 'Hace 5 días' },
        { id: 2, name: 'Alimento Húmedo Gatos', stock: 0, category: 'Alimentos', lastStock: 'Hace 3 días' },
        { id: 3, name: 'Antipulgas Spot On', stock: 0, category: 'Medicamentos', lastStock: 'Hace 7 días' },
        { id: 4, name: 'Cama para Mascotas', stock: 0, category: 'Accesorios', lastStock: 'Hace 2 días' },
        { id: 5, name: 'Cepillo de Dientes', stock: 0, category: 'Higiene', lastStock: 'Hace 4 días' },
    ];

    // Datos mock para consultas frecuentes
    const frequentConsultations = [
        { id: 1, type: 'Consulta general', count: 145, percentage: 32, rank: 1 },
        { id: 2, type: 'Vacunación', count: 98, percentage: 22, rank: 2 },
        { id: 3, type: 'Desparasitación', count: 76, percentage: 17, rank: 3 },
        { id: 4, type: 'Revisión/Chequeo', count: 65, percentage: 14, rank: 4 },
        { id: 5, type: 'Dermatología', count: 48, percentage: 11, rank: 5 },
    ];

    // Función para obtener iniciales
    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    // Función para obtener color del avatar
    const getAvatarColor = (name: string) => {
        const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Datos mock para las cajas superiores
    const stats = [
        {
            title: 'Consultas del día',
            value: '12',
            change: '+12.5%',
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#1976d2',
        },
        {
            title: 'Ventas del día',
            value: '50',
            change: '+8.2%',
            icon: <ShoppingCart sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
        },
        {
            title: 'Ticket promedio del día',
            value: 'bs/100',
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
                        </Box>
                    ))}
                </Stack>

                {/* 2 columnas con tablas */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
                    {/* Card de Mascotas Atendidas */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
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
                                    <Pets />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Mascotas Atendidas
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Recientemente
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Tabla */}
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Mascota</TableCell>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Especie</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                                Acción
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {recentPets.map((pet, index) => (
                                            <TableRow
                                                key={pet.id}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        cursor: 'pointer',
                                                    },
                                                    transition: 'background-color 0.2s',
                                                }}
                                            >
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {pet.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {pet.lastVisit}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={pet.species}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: pet.type === 'Canino' ? '#e3f2fd' : '#fce4ec',
                                                            color: pet.type === 'Canino' ? '#1976d2' : '#c2185b',
                                                            fontWeight: 500,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Ver detalles">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: 'primary.main',
                                                                '&:hover': {
                                                                    bgcolor: 'primary.light',
                                                                    color: 'white',
                                                                },
                                                            }}
                                                        >
                                                            <ArrowForwardIos fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Box>

                    {/* Card de Productos Más Vendidos */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
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
                                    <Inventory2 />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Productos Más Vendidos
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Top 5 del mes
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Tabla */}
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Cantidad</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                                Ingresos
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {topProducts.map((product) => (
                                            <TableRow
                                                key={product.id}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        cursor: 'pointer',
                                                    },
                                                    transition: 'background-color 0.2s',
                                                }}
                                            >
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {product.name}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {product.quantity}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        unidades
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                        {product.revenue}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Card>
                    </Box>
                </Stack>

                {/* 2 columnas con tablas */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
                    {/* Card de Consultas Frecuentes */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
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
                                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
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
                                        Consultas Frecuentes
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Top 5 del mes
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Tabla */}
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Tipo de Consulta</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                                Cantidad
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {frequentConsultations.map((consultation) => (
                                            <TableRow
                                                key={consultation.id}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: 'action.hover',
                                                        cursor: 'pointer',
                                                    },
                                                    transition: 'background-color 0.2s',
                                                }}
                                            >
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '50%',
                                                            bgcolor: consultation.rank <= 3 ? 'primary.main' : 'grey.300',
                                                            color: consultation.rank <= 3 ? 'white' : 'text.primary',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {consultation.rank}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {consultation.type}
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                mt: 0.5,
                                                                width: '100%',
                                                                height: 4,
                                                                bgcolor: 'grey.200',
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: `${consultation.percentage}%`,
                                                                    height: '100%',
                                                                    bgcolor: consultation.rank <= 3 ? 'primary.main' : 'grey.400',
                                                                    transition: 'width 0.3s ease',
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            {consultation.percentage}% del total
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                        {consultation.count}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        consultas
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Footer */}
                            <Box
                                sx={{
                                    p: 2,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    backgroundColor: 'action.hover',
                                }}
                            >
                                <Button
                                    fullWidth
                                    variant="text"
                                    endIcon={<ArrowForwardIos fontSize="small" />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Ver todas las consultas
                                </Button>
                            </Box>
                        </Card>
                    </Box>

                    {/* Card de Inventario Crítico con Tabs */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
                        <Card
                            elevation={3}
                            sx={{
                                height: '100%',
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
                                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
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
                                    <ErrorOutline />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Inventario Crítico
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Requiere atención
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={inventoryTab}
                                    onChange={(e, newValue) => setInventoryTab(newValue)}
                                    sx={{
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            minHeight: 48,
                                        },
                                    }}
                                >
                                    <Tab label="Por Agotarse" />
                                    <Tab label="Agotados" />
                                </Tabs>
                            </Box>

                            {/* Tab Panel - Productos por Agotarse */}
                            {inventoryTab === 0 && (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Stock</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                                    Estado
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {runningOutProducts.map((product) => (
                                                <TableRow
                                                    key={product.id}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                            cursor: 'pointer',
                                                        },
                                                        transition: 'background-color 0.2s',
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {product.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {product.category}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: product.stock <= 5 ? 'error.main' : 'warning.main',
                                                            }}
                                                        >
                                                            {product.stock} unidades
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ~{product.daysLeft} días
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={product.stock <= 5 ? 'Crítico' : 'Bajo'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: product.stock <= 5 ? 'error.light' : 'warning.light',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Tab Panel - Productos Agotados */}
                            {inventoryTab === 1 && (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                                <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Último Stock</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                                    Estado
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {outOfStockProducts.map((product) => (
                                                <TableRow
                                                    key={product.id}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                            cursor: 'pointer',
                                                        },
                                                        transition: 'background-color 0.2s',
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {product.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {product.category}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {product.lastStock}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label="Agotado"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'error.light',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Footer */}
                            <Box
                                sx={{
                                    p: 2,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    backgroundColor: 'action.hover',
                                }}
                            >
                                <Button
                                    fullWidth
                                    variant="text"
                                    endIcon={<ArrowForwardIos fontSize="small" />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                >
                                    Realizar compras
                                </Button>
                            </Box>
                        </Card>
                    </Box>
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
                            <MenuItem value="week">Últimos 7 Días</MenuItem>
                            <MenuItem value="month">Este Mes</MenuItem>
                            <MenuItem value="year">Este Año</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* 2 Gráficas lineales */}
                <Stack direction={{ xs: 'column' }} spacing={3}>
                    {/* Gráfica de LíneChart Ventas últimos 7 días */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%' } }}>
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
                                        Ventas - Últimos 7 Días
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Tendencia de ventas diarias
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Gráfica */}
                            <Box sx={{ p: 3, backgroundColor: 'background.paper' }}>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart
                                        data={salesLast7Days}
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
                            </Box>
                        </Card>
                    </Box>

                    {/* Gráfica de LíneChart Consultas últimos 7 días */}
                    <Box sx={{ flex: 1, minWidth: { xs: '100%' } }}>
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
                                        Consultas - Últimos 7 Días
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        Tendencia de consultas diarias
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Gráfica */}
                            <Box sx={{ p: 3, backgroundColor: 'background.paper' }}>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart
                                        data={consultationsLast7Days}
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
                            </Box>
                        </Card>
                    </Box>
                </Stack>
            </Box>
        </PageContainer>
    );
}
