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

interface Shopping {
    id: number;
    amount: number;
    state: string;
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

interface ShoppingDetailDialogProps {
    open: boolean;
    onClose: () => void;
    shopping: Shopping | null;
}

export default function ShoppingDetailDialog({ open, onClose, shopping }: ShoppingDetailDialogProps) {
    if (!shopping) return null;

    // Calcular subtotal
    const subtotal = React.useMemo(() => {
        if (!shopping.products || shopping.products.length === 0) return 0;
        return shopping.products.reduce((sum, item) => {
            const price = typeof item.price_unit === 'string' ? parseFloat(item.price_unit) : item.price_unit;
            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            return sum + (price * quantity);
        }, 0);
    }, [shopping.products]);

    const total = typeof shopping.amount === 'string' ? parseFloat(shopping.amount) : (shopping.amount || 0);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                Detalle de Compra #{shopping.id}
            </DialogTitle>
            <DialogContent dividers sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Resumen de la Compra</Typography>
                
                {/* Estado */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Estado:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {shopping.state || '-'}
                    </Typography>
                </Box>

                {/* Fecha */}
                {shopping.created_at && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Fecha:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {new Date(shopping.created_at).toLocaleString()}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Productos */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Productos:</Typography>
                {!shopping.products || shopping.products.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No hay productos registrados
                    </Typography>
                ) : (
                    <List dense>
                        {shopping.products.map((item, index) => {
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

                {/* Total */}
                <Box sx={{ mt: 2 }}>
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

