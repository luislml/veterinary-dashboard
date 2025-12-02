'use client';
import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import ProductGrid, { Product } from './ProductGrid';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';


interface Client {
    id: number;
    name: string;
    last_name: string;
}

interface CartItem {
    product_id: number;
    product: Product;
    quantity: number;
    price_unit: number;
}

interface SalesFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export default function SalesFormDialog({ open, onClose, onSave }: SalesFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    const [products, setProducts] = React.useState<Product[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loadingProducts, setLoadingProducts] = React.useState(false);
    const [loadingClients, setLoadingClients] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [cart, setCart] = React.useState<CartItem[]>([]);
    const [formData, setFormData] = React.useState({
        client_id: '',
        discount: '0',
    });
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

    // Cargar clientes
    const loadClients = React.useCallback(async () => {
        try {
            setLoadingClients(true);
            let url = `/api/clients?paginate=false`;
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
                throw new Error(data.error || data.message || 'Error al cargar clientes');
            }

            if (data.data) {
                setClients(data.data);
            } else if (Array.isArray(data)) {
                setClients(data);
            } else {
                setClients([]);
            }
        } catch (err) {
            console.error('Error al cargar clientes:', err);
            setClients([]);
        } finally {
            setLoadingClients(false);
        }
    }, [selectedVeterinary?.id]);

    // Inicializar cuando se abre el modal
    React.useEffect(() => {
        if (open) {
            loadProducts();
            loadClients();
            setCart([]);
            setFormData({
                client_id: '',
                discount: '0',
            });
            setSearchTerm('');
            setFormErrors({});
        }
    }, [open, loadProducts, loadClients]);

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

    // Calcular total con descuento
    const total = React.useMemo(() => {
        const discount = parseFloat(formData.discount) || 0;
        return Math.max(0, subtotal - discount);
    }, [subtotal, formData.discount]);

    // Validar y mostrar modal de confirmación
    const handleConfirmSale = () => {
        setFormErrors({});
        
        // Validaciones
        if (!formData.client_id) {
            setFormErrors({ client_id: 'Debe seleccionar un cliente' });
            return;
        }
        
        if (cart.length === 0) {
            enqueueSnackbar('Debe agregar al menos un producto al carrito', { variant: 'error' });
            return;
        }

        setShowConfirmModal(true);
    };

    // Guardar venta
    const handleSave = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);

        try {
            const dataToSend = {
                amount: total,
                client_id: parseInt(formData.client_id),
                discount: parseFloat(formData.discount) || 0,
                state: 'Completado',
                veterinary_id: selectedVeterinary?.id,
                products: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_unit: item.price_unit,
                })),
            };

            const response = await fetch('/api/sales', {
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar venta' });
                }
                return;
            }

            onClose();
            if (onSave) {
                onSave();
            }
            enqueueSnackbar('Venta creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar venta' });
            enqueueSnackbar('Error al crear venta', { variant: 'error' });
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
                Nueva Venta
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

                        {/* Select de cliente */}
                        <FormControl fullWidth size="small" error={!!formErrors.client_id} sx={{ mb: 2 }}>
                            <InputLabel>Cliente *</InputLabel>
                            <Select
                                value={formData.client_id}
                                label="Cliente *"
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                disabled={loadingClients}
                            >
                                {clients.map((client) => (
                                    <MenuItem key={client.id} value={client.id.toString()}>
                                        {client.name} {client.last_name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.client_id && <FormHelperText>{formErrors.client_id}</FormHelperText>}
                        </FormControl>

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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Subtotal:</Typography>
                                <Typography>bs/{Number(subtotal).toFixed(2)}</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                size="small"
                                label="Descuento"
                                type="number"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">bs/</InputAdornment>,
                                }}
                                sx={{ mb: 2 }}
                            />
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
                <Button onClick={handleConfirmSale} variant="contained" disabled={submitting || cart.length === 0}>
                    Completar Venta
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
                    Confirmar Venta
                </DialogTitle>
                <DialogContent dividers sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Resumen de la Venta</Typography>
                    
                    {/* Cliente */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Cliente:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {clients.find(c => c.id.toString() === formData.client_id) 
                                ? `${clients.find(c => c.id.toString() === formData.client_id)?.name} ${clients.find(c => c.id.toString() === formData.client_id)?.last_name || ''}`.trim()
                                : 'No seleccionado'}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

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

                    {/* Totales */}
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Subtotal:</Typography>
                            <Typography>bs/{Number(subtotal).toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>Descuento:</Typography>
                            <Typography color="error">
                                - bs/{Number(formData.discount || 0).toFixed(2)}
                            </Typography>
                        </Box>
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
                        {submitting ? <CircularProgress size={20} /> : 'Confirmar Venta'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
}

