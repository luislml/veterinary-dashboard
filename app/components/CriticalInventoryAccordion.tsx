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
    Button,
    Chip,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';

interface LowStockProduct {
    name: string;
    stock: number;
}

interface OutOfStockProduct {
    name: string;
}

interface CriticalInventoryData {
    low_stock: LowStockProduct[];
    out_of_stock: OutOfStockProduct[];
}

interface CriticalInventoryAccordionProps {
    veterinaryId: number;
}

export default function CriticalInventoryAccordion({ veterinaryId }: CriticalInventoryAccordionProps) {
    const [data, setData] = React.useState<CriticalInventoryData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [inventoryTab, setInventoryTab] = React.useState(0);

    // Cargar inventario crítico
    const loadCriticalInventory = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/critical-inventory?veterinary_id=${veterinaryId}`);

            let responseData;
            try {
                responseData = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(responseData.error || responseData.message || 'Error al cargar inventario crítico');
            }

            setData(responseData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar inventario crítico');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadCriticalInventory();
        }
    }, [loadCriticalInventory, veterinaryId]);

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

    const lowStockProducts = data.low_stock || [];
    const outOfStockProducts = data.out_of_stock || [];

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
                    background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
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
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
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
                    <TableContainer sx={{ borderRadius: '0px' }}>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: 'transparent', '& th': { color: 'black' } }}>
                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Stock</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                        Estado
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lowStockProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No hay productos por agotarse
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lowStockProducts.map((product, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {product.name}
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Tab Panel - Productos Agotados */}
                {inventoryTab === 1 && (
                    <TableContainer sx={{ borderRadius: '0px' }}>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: 'transparent', '& th': { color: 'black' } }}>
                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Producto</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                        Estado
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {outOfStockProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No hay productos agotados
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    outOfStockProducts.map((product, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {product.name}
                                                    </Typography>
                                                </Box>
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
                                    ))
                                )}
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
            </AccordionDetails>
        </Accordion>
    );
}

