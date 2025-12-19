'use client';
import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';

interface Sale {
    id: number;
    amount: number;
    discount: number;
    state: string;
    client_id: number;
    client?: {
        id: number;
        name: string;
        last_name: string;
    };
    products?: Array<{
        id: number;
        product_id: number;
        quantity: number;
        price_unit: number;
        product?: {
            id: number;
            name: string;
        };
    }>;
    created_at?: string;
    updated_at?: string;
}

interface SalesDetailDialogProps {
    open: boolean;
    onClose: () => void;
    sale: Sale | null;
}

export default function SalesDetailDialog({ open, onClose, sale }: SalesDetailDialogProps) {
    // Calcular subtotal
    const subtotal = React.useMemo(() => {
        if (!sale || !sale.products || sale.products.length === 0) return 0;
        return sale.products.reduce((sum, item) => {
            const price = typeof item.price_unit === 'string' ? parseFloat(item.price_unit) : item.price_unit;
            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            return sum + (price * quantity);
        }, 0);
    }, [sale?.products]);

    if (!sale) return null;

    const discount = typeof sale.discount === 'string' ? parseFloat(sale.discount) : (sale.discount || 0);
    const total = typeof sale.amount === 'string' ? parseFloat(sale.amount) : (sale.amount || 0);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                Detalle de Venta #{sale.id}
            </DialogTitle>
            <DialogContent dividers sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Resumen de la Venta</Typography>
                
                {/* Cliente */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Cliente:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {sale.client 
                            ? `${sale.client.name} ${sale.client.last_name || ''}`.trim()
                            : `Cliente ID: ${sale.client_id}`}
                    </Typography>
                </Box>

                {/* Estado */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Estado:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {sale.state || '-'}
                    </Typography>
                </Box>

                {/* Fecha */}
                {sale.created_at && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Fecha:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {new Date(sale.created_at).toLocaleString()}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Productos */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Productos:</Typography>
                {!sale.products || sale.products.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No hay productos registrados
                    </Typography>
                ) : (
                    <List dense>
                        {sale.products.map((item, index) => {
                            const price = typeof item.price_unit === 'string' ? parseFloat(item.price_unit) : item.price_unit;
                            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
                            const productName = item.product?.name || `Producto ID: ${item.product_id}`;
                            
                            return (
                                <ListItem key={item.id || index} divider>
                                    <ListItemText
                                        primary={productName}
                                        secondary={
                                            <>
                                                <Typography variant="caption" display="block">
                                                    Cantidad: {quantity} x bs/{Number(price).toFixed(2)}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                    Subtotal: bs/{(Number(price) * quantity).toFixed(2)}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Totales */}
                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Subtotal:</Typography>
                        <Typography>bs/{Number(subtotal).toFixed(2)}</Typography>
                    </Box>
                    {discount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Descuento:</Typography>
                            <Typography color="error">
                                - bs/{Number(discount).toFixed(2)}
                            </Typography>
                        </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total:</Typography>
                        <Typography variant="h6" color="primary">
                            bs/{Number(total).toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

