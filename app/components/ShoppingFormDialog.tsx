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
    IconButton,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';

interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    code: string;
    image?: string;
    images?: object[] | null;
}

interface ShoppingItem {
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
    
    const [shoppingItems, setShoppingItems] = React.useState<ShoppingItem[]>([]);
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchInput, setSearchInput] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);

    // Cargar productos
    const loadProducts = React.useCallback(async () => {
        if (!open) return;
        
        try {
            setLoading(true);
            let url = `/api/products?page=1&per_page=50`;
            if (selectedVeterinary?.id) {
                url += `&veterinary_id=${selectedVeterinary.id}`;
            }
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
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
            setLoading(false);
        }
    }, [open, selectedVeterinary?.id, searchTerm]);

    // Inicializar cuando se abre el modal
    React.useEffect(() => {
        if (open) {
            setShoppingItems([]);
            setFormErrors({});
            setSearchInput('');
            setSearchTerm('');
        }
    }, [open]);

    // Cargar productos cuando cambia el término de búsqueda o se abre el modal
    React.useEffect(() => {
        if (open) {
            loadProducts();
        }
    }, [open, loadProducts]);

    // Manejar búsqueda al presionar Enter
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchTerm(searchInput);
        }
    };

    // Agregar producto a la lista de compra
    const handleAddProduct = (product: Product) => {
        const existingItem = shoppingItems.find(item => item.product_id === product.id);
        
        if (existingItem) {
            enqueueSnackbar('Este producto ya está en la lista', { variant: 'info' });
            return;
        }

        const defaultPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        
        setShoppingItems([...shoppingItems, {
            product_id: product.id,
            product,
            quantity: 1,
            price_unit: defaultPrice || 0,
        }]);
    };

    // Actualizar cantidad
    const handleUpdateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveProduct(productId);
            return;
        }
        
        setShoppingItems(shoppingItems.map(item =>
            item.product_id === productId
                ? { ...item, quantity }
                : item
        ));
    };

    // Actualizar precio unitario
    const handleUpdatePrice = (productId: number, price: number) => {
        if (price < 0) {
            return;
        }
        
        setShoppingItems(shoppingItems.map(item =>
            item.product_id === productId
                ? { ...item, price_unit: price }
                : item
        ));
    };

    // Eliminar producto
    const handleRemoveProduct = (productId: number) => {
        setShoppingItems(shoppingItems.filter(item => item.product_id !== productId));
    };

    // Calcular total
    const total = React.useMemo(() => {
        return shoppingItems.reduce((sum, item) => {
            const price = typeof item.price_unit === 'string' ? parseFloat(item.price_unit) : item.price_unit;
            const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
            return sum + (price * quantity);
        }, 0);
    }, [shoppingItems]);

    // Validar y mostrar modal de confirmación
    const handleConfirmShopping = () => {
        setFormErrors({});
        
        // Validaciones
        if (shoppingItems.length === 0) {
            enqueueSnackbar('Debe agregar al menos un producto a la compra', { variant: 'error' });
            return;
        }

        // Validar que todos los productos tengan cantidad y precio válidos
        const invalidItems = shoppingItems.filter(item => 
            !item.quantity || item.quantity <= 0 || !item.price_unit || item.price_unit <= 0
        );

        if (invalidItems.length > 0) {
            enqueueSnackbar('Todos los productos deben tener cantidad y precio válidos', { variant: 'error' });
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
                state: 'Completado',
                veterinary_id: selectedVeterinary?.id,
                products: shoppingItems.map(item => ({
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
            <DialogContent dividers sx={{ p: 2 }}>
                {formErrors.general && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formErrors.general}
                    </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 3, height: '70vh' }}>
                    {/* Listado de productos */}
                    <Box sx={{ flex: 1, border: 1, overflow: 'auto', width: '50%', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                        {/* Buscador de productos */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 2 }}>Buscar Productos</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Buscar productos... (Presiona Enter para buscar)"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : products.length === 0 ? (
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay productos disponibles
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {products.map((product) => {
                                    const isAdded = shoppingItems.some(item => item.product_id === product.id);
                                    return (
                                        <ListItem 
                                            key={product.id} 
                                            divider
                                            sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1">{product.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Código: {product.code} | Stock: {product.stock} | Precio: bs/{Number(product.price).toFixed(2)}
                                                </Typography>
                                            </Box>
                                            {!isAdded && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddProduct(product)}
                                                    disabled={product.stock <= 0}
                                                >
                                                    Agregar
                                                </Button>
                                            )}
                                            {isAdded && (
                                                <Typography variant="body2" color="success.main">
                                                    ✓ Agregado
                                                </Typography>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Box>

                    {/* Lista de productos en la compra */}
                    <Box sx={{ width: '50%' }}>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShoppingCartIcon />
                            Productos en la Compra
                        </Typography>
                        
                        {shoppingItems.length === 0 ? (
                            <Paper sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay productos agregados. Busque y agregue productos desde arriba.
                                </Typography>
                            </Paper>
                        ) : (
                            <TableContainer component={Paper} sx={{ height: '80%', overflow: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">Precio Unitario</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                            <TableCell align="center">Acción</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shoppingItems.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell>
                                                    <Typography variant="body2">{item.product.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.product.code}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const value = parseInt(e.target.value) || 0;
                                                            handleUpdateQuantity(item.product_id, value);
                                                        }}
                                                        inputProps={{ 
                                                            min: 1,
                                                            style: { textAlign: 'right', width: '80px' }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={item.price_unit}
                                                        onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            handleUpdatePrice(item.product_id, value);
                                                        }}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">bs/</InputAdornment>,
                                                        }}
                                                        inputProps={{ 
                                                            min: 0,
                                                            step: 0.01,
                                                            style: { textAlign: 'right', width: '100px' }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        bs/{(Number(item.price_unit) * item.quantity).toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveProduct(item.product_id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Resumen del total */}
                        {shoppingItems.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Paper sx={{ p: 2, minWidth: 200 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6">Total:</Typography>
                                        <Typography variant="h6" color="primary">
                                            bs/{Number(total).toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting} color="error">
                    Cancelar
                </Button>
                <Button onClick={handleConfirmShopping} variant="contained" disabled={submitting || shoppingItems.length === 0}>
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
                        {shoppingItems.map((item) => (
                            <ListItem key={item.product_id} divider>
                                <ListItemText
                                    primary={item.product.name}
                                    secondary={
                                        <>
                                            <Typography variant="caption" component="span" display="block">
                                                Cantidad: {item.quantity} x bs/{Number(item.price_unit).toFixed(2)}
                                            </Typography>
                                            <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', mt: 0.5, display: 'block' }}>
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

