'use client';
import * as React from 'react';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Stack,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Inventory2 from '@mui/icons-material/Inventory2';
import TrendingUp from '@mui/icons-material/TrendingUp';

interface TopSellingProduct {
    id: number;
    name: string;
    code: string;
    total_quantity_sold: string;
    total_earnings: string;
}

interface TopSellingProductsAccordionProps {
    veterinaryId: number;
}

export default function TopSellingProductsAccordion({ veterinaryId }: TopSellingProductsAccordionProps) {
    const [products, setProducts] = React.useState<TopSellingProduct[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Cargar productos más vendidos
    const loadTopSellingProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/top-selling-products?veterinary_id=${veterinaryId}`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar productos más vendidos');
            }

            // La respuesta puede venir como array directo o dentro de data
            if (Array.isArray(data)) {
                setProducts(data);
            } else if (data.data && Array.isArray(data.data)) {
                setProducts(data.data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos más vendidos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadTopSellingProducts();
        }
    }, [loadTopSellingProducts, veterinaryId]);

    // Formatear número con separadores
    const formatNumber = (num: string | number): string => {
        const numValue = typeof num === 'string' ? parseFloat(num) : num;
        return numValue.toLocaleString('es-ES');
    };

    // Formatear moneda
    const formatCurrency = (amount: string | number): string => {
        const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `bs/${formatNumber(amountValue.toFixed(2))}`;
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
        <Accordion
            defaultExpanded={false}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: 3,
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: 0,
                },
            }}
        >
            <AccordionSummary
                expandIcon={
                    <ExpandMore sx={{ color: 'white' }} />
                }
                sx={{
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    color: 'white',
                    p: 2.5,
                    minHeight: 72,
                    '&.Mui-expanded': {
                        minHeight: 72,
                        margin: '0px 0px !important',
                    },
                    '& .MuiAccordionSummary-content': {
                        margin: 0,
                        alignItems: 'center',
                        gap: 2,
                    },
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
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {products.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No hay productos vendidos
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: 'transparent', '& th': { color: 'black' } }}>
                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Cantidad</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                        Ingresos
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {products.map((product, index) => {
                                    const rank = index + 1;
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        bgcolor: rank <= 3 ? 'primary.main' : 'grey.300',
                                                        color: rank <= 3 ? 'white' : 'text.primary',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    {rank}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {product.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {product.code}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {formatNumber(product.total_quantity_sold)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    unidades
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                    {formatCurrency(product.total_earnings)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </AccordionDetails>
        </Accordion>
    );
}

