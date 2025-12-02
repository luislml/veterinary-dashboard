'use client';
import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Button,
    Box,
    Typography,
    InputAdornment,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import ProductGrid, { Product } from './ProductGrid';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface CartItem {
    product_id: number;
    product: Product;
    quantity: number;
    price_unit: number;
}

interface ShoppingFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export default function ShoppingFormDialog({ open, onClose, onSave }: ShoppingFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);

    // Cargar productos
    const loadProducts = React.useCallback(async () => {
        try {
            setLoadingProducts(true);
            let url = `/api/products?paginate=false&per_page=100`;
            if (selectedVeterinary?.id) {
                url += `&veterinary_id=${selectedVeterinary.id}`;
            }
            
            const response = await fetch(url);
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar productos');
            }

            if (data.data) {
                setProducts(data.data);
            } else if (Array.isArray(data)) {
                setProducts(data);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Error al cargar productos:', err);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [selectedVeterinary?.id]);

    // Inicializar cuando se abre el modal
    React.useEffect(() => {
        if (open) {
            loadProducts();
            setCart([]);
            setSearchTerm('');
            setFormErrors({});
        }
    }, [open, loadProducts]);

    // Agregar producto al carrito
    const handleAddToCart = (product: Product) => {
        const existingItem = cart.find(item => item.product_id === product.id);
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        
        if (existingItem) {
            // Si ya existe, aumentar cantidad
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            // Si no existe, agregar nuevo
            setCart([...cart, {
                product_id: product.id,
                product,
                quantity: 1,
                price_unit: price || 0,
            }]);
        }
    };

    // Actualizar cantidad en el carrito
    const handleUpdateQuantity = (productId: number, delta: number) => {
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const newQuantity = item.quantity + delta;
                if (newQuantity <= 0) {
                    return null;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    // Eliminar del carrito
    const handleRemoveFromCart = (productId: number) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    // Calcular subtotal
    const subtotal = React.useMemo(() => {
        return cart.reduce((sum, item) => {
            const price = typeof item.price_unit === 'string' ? parseFloat(item.price_unit) : item.price_unit;
            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            return sum + (price * quantity);
        }, 0);
    }, [cart]);

    // El total es igual al subtotal (sin descuento)
    const total = subtotal;

    // Validar y mostrar modal de confirmación
    const handleConfirmShopping = () => {
        setFormErrors({});
        
        // Validaciones
        if (cart.length === 0) {
            enqueueSnackbar('Debe agregar al menos un producto al carrito', { variant: 'error' });
            return;
        }

        setShowConfirmModal(true);
    };

    // Guardar compra
    const handleSave = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);

        try {
            const dataToSend = {
                amount: total,
                state: 'Completado',
                veterinary_id: selectedVeterinary?.id,
                products: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_unit: item.price_unit,
                })),
            };

            const response = await fetch('/api/shoppings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    setFormErrors({ general: data.message || data.error || 'Error al guardar compra' });
                }
                return;
            }

            onClose();
            if (onSave) {
                onSave();
            }
            enqueueSnackbar('Compra creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar compra' });
            enqueueSnackbar('Error al crear compra', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setFormErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                Nueva Compra
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                {formErrors.general && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {formErrors.general}
                    </Alert>
                )}
                <Box sx={{ display: 'flex', height: '70vh' }}>
                    {/* Sección izquierda - Productos */}
                    <Box sx={{ width: '60%', borderRight: 1, borderColor: 'divider', p: 2, overflow: 'auto' }}>
                        <ProductGrid
                            products={products}
                            loading={loadingProducts}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            onAddToCart={handleAddToCart}
                        />
                    </Box>

                    {/* Sección derecha - Carrito */}
                    <Box sx={{ width: '40%', p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShoppingCartIcon />
                            Carrito
                        </Typography>

                        {/* Lista del carrito */}
                        <Paper sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                            {cart.length === 0 ? (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        El carrito está vacío
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {cart.map((item) => (
                                        <ListItem key={item.product_id} divider>
                                            <ListItemText
                                                primary={item.product.name}
                                                secondary={
                                                    <>
                                                        <Typography variant="caption" display="block">
                                                            bs/{Number(item.price_unit).toFixed(2)} x {item.quantity}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                            bs/{(Number(item.price_unit) * item.quantity).toFixed(2)}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateQuantity(item.product_id, -1)}
                                                    >
                                                        <RemoveIcon fontSize="small" />
                                                    </IconButton>
                                                    <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                                                        {item.quantity}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleUpdateQuantity(item.product_id, 1)}
                                                    >
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveFromCart(item.product_id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>

                        {/* Resumen */}
                        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Total:</Typography>
                                <Typography variant="h6" color="primary">
                                    bs/{Number(total).toFixed(2)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting} color="error">
                    Cancelar
                </Button>
                <Button onClick={handleConfirmShopping} variant="contained" disabled={submitting || cart.length === 0}>
                    Completar Compra
                </Button>
            </DialogActions>

            {/* Modal de confirmación */}
            <Dialog 
                open={showConfirmModal} 
                onClose={() => !submitting && setShowConfirmModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    Confirmar Compra
                </DialogTitle>
                <DialogContent dividers sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Resumen de la Compra</Typography>
                    
                    {/* Productos */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Productos:</Typography>
                    <List dense>
                        {cart.map((item) => (
                            <ListItem key={item.product_id} divider>
                                <ListItemText
                                    primary={item.product.name}
                                    secondary={
                                        <>
                                            <Typography variant="caption" display="block">
                                                Cantidad: {item.quantity} x bs/{Number(item.price_unit).toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                                Subtotal: bs/{(Number(item.price_unit) * item.quantity).toFixed(2)}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>

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
                    <Button 
                        onClick={() => setShowConfirmModal(false)} 
                        disabled={submitting}
                        color="error"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={submitting}
                    >
                        {submitting ? <CircularProgress size={20} /> : 'Confirmar Compra'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}

