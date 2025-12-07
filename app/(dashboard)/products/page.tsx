'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    tableCellClasses,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Alert,
    CircularProgress,
    Pagination,
    Tooltip,
    Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../../lib/config';
import ProductFormDialog, { Product as ProductType } from '../../components/ProductFormDialog';

interface Product extends ProductType {}

function ProductsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar productos
    const loadProducts = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/products?page=${page}&per_page=10`;
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

            // Adaptar respuesta de Laravel
            if (data.data) {
                setProducts(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setProducts(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setProducts([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar productos');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (selectedVeterinary?.id) {
            setPage(1);
        }
    }, [selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingProduct(null);
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingProduct(null);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadProducts();
    };

    // Eliminar producto
    const handleDelete = async (productId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Producto",
            description: "¿Estás seguro de que deseas eliminar este producto?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar producto', { variant: 'error' });
                return;
            }

            loadProducts();
            // Show success snackbar
            enqueueSnackbar('Producto eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar producto', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Productos</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Producto
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Foto</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Precio</TableCell>
                            <TableCell>Stock</TableCell>
                            <TableCell>Veterinarias</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay productos disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const imageUrl = product.images && product.images.length > 0 
                                    ? `${API_CONFIG.baseURL.replace('/api', '')}/${(product.images as any)[product.images.length - 1].url}`
                                    : undefined;
                                
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.id}</TableCell>
                                        <TableCell>
                                            <Avatar
                                                src={imageUrl}
                                                sx={{ width: 50, height: 50 }}
                                                variant="square"
                                            >
                                                {product.name[0]}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.code || '-'}</TableCell>
                                        <TableCell>
                                            {product.price !== undefined && product.price !== null
                                                ? `bs/${product.price}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{product.stock !== undefined && product.stock !== null ? product.stock : '-'}</TableCell>
                                        <TableCell>
                                            {product.veterinaries && product.veterinaries.length > 0
                                                ? product.veterinaries.map(v => v.name).join(', ')
                                                : product.veterinary?.name || (Array.isArray(product.veterinary_id) 
                                                    ? product.veterinary_id.join(', ') 
                                                    : `Veterinaria ID: ${product.veterinary_id || '-'}`)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar" placement="top">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar" placement="top">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(product.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, newPage) => setPage(newPage)}
                        color="primary"
                    />
                </Box>
            )}

            {/* Modal para crear/editar */}
            <ProductFormDialog
                open={openModal}
                onClose={handleCloseModal}
                product={editingProduct}
                onSave={handleSaveSuccess}
            />
            
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ProductsPage />
        </SnackbarProvider>
    );
}

