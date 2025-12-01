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
    Select,
    MenuItem,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { PageContainer } from '@toolpad/core/PageContainer';
import { styled } from '@mui/material/styles';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import ShoppingFormDialog from '../../components/ShoppingFormDialog';
import ShoppingDetailDialog from '../../components/ShoppingDetailDialog';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
}));
const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
      border: 0,
    },
}));

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

function ShoppingsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();

    const [shoppings, setShoppings] = React.useState<Shopping[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [openDetailModal, setOpenDetailModal] = React.useState(false);
    const [selectedShopping, setSelectedShopping] = React.useState<Shopping | null>(null);
    const [openStateConfirmModal, setOpenStateConfirmModal] = React.useState(false);
    const [shoppingToUpdate, setShoppingToUpdate] = React.useState<{ id: number; newState: string } | null>(null);
    const [updatingState, setUpdatingState] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);

    // Cargar compras
    const loadShoppings = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/shoppings?page=${page}&per_page=10`;
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
                throw new Error(data.error || data.message || 'Error al cargar compras');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setShoppings(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setShoppings(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setShoppings([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar compras');
            setShoppings([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadShoppings();
    }, [loadShoppings]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (selectedVeterinary?.id) {
            setPage(1);
        }
    }, [selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadShoppings();
    };

    // Ver detalle de compra
    const handleViewDetail = async (shoppingId: number) => {
        try {
            const response = await fetch(`/api/shoppings/${shoppingId}`);
            
            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al cargar detalle de compra', { variant: 'error' });
                return;
            }

            const data = await response.json();
            const shoppingData = data.data || data;
            setSelectedShopping(shoppingData);
            setOpenDetailModal(true);
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al cargar detalle de compra', { variant: 'error' });
        }
    };

    // Cerrar modal de detalle
    const handleCloseDetailModal = () => {
        setOpenDetailModal(false);
        setSelectedShopping(null);
    };

    // Manejar cambio de estado
    const handleStateChange = (shoppingId: number, newState: string, currentState: string) => {
        if (newState === currentState) return;
        
        setShoppingToUpdate({ id: shoppingId, newState });
        setOpenStateConfirmModal(true);
    };

    // Confirmar y actualizar estado
    const handleConfirmStateChange = async () => {
        if (!shoppingToUpdate) return;

        setUpdatingState(true);
        try {
            const response = await fetch(`/api/shoppings/${shoppingToUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    state: shoppingToUpdate.newState,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                enqueueSnackbar(data.error || data.message || 'Error al actualizar estado de la compra', { variant: 'error' });
                return;
            }

            setOpenStateConfirmModal(false);
            setShoppingToUpdate(null);
            loadShoppings();
            enqueueSnackbar('Estado de la compra actualizado correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al actualizar estado de la compra', { variant: 'error' });
        } finally {
            setUpdatingState(false);
        }
    };

    // Cerrar modal de confirmación de estado
    const handleCloseStateConfirmModal = () => {
        if (!updatingState) {
            setOpenStateConfirmModal(false);
            setShoppingToUpdate(null);
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Compras</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Compra
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
                            <StyledTableCell>ID</StyledTableCell>
                            <StyledTableCell>Estado</StyledTableCell>
                            <StyledTableCell>Monto</StyledTableCell>
                            <StyledTableCell>Productos</StyledTableCell>
                            <StyledTableCell>Fecha</StyledTableCell>
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : shoppings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay compras disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            shoppings.map((shopping) => (
                                <StyledTableRow key={shopping.id}>
                                    <StyledTableCell>{shopping.id}</StyledTableCell>
                                    <StyledTableCell>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={shopping.state || 'paid'}
                                                onChange={(e) => handleStateChange(shopping.id, e.target.value, shopping.state || 'paid')}
                                                sx={{ fontSize: '0.875rem' }}
                                            >
                                                <MenuItem value="paid">Paid</MenuItem>
                                                <MenuItem value="canceled">Canceled</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {shopping.amount !== undefined && shopping.amount !== null
                                            ? `bs/${shopping.amount}`
                                            : '-'}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {shopping.products && shopping.products.length > 0
                                            ? `${shopping.products.length} producto(s)`
                                            : '-'}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {shopping.created_at 
                                            ? new Date(shopping.created_at).toLocaleDateString()
                                            : '-'}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Ver Detalle" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetail(shopping.id)}
                                                color="primary"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </StyledTableCell>
                                </StyledTableRow>
                            ))
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

            {/* Modal para crear compra */}
            <ShoppingFormDialog
                open={openModal}
                onClose={handleCloseModal}
                onSave={handleSaveSuccess}
            />

            {/* Modal para ver detalle de compra */}
            <ShoppingDetailDialog
                open={openDetailModal}
                onClose={handleCloseDetailModal}
                shopping={selectedShopping}
            />

            {/* Modal de confirmación para cambio de estado */}
            <Dialog 
                open={openStateConfirmModal} 
                onClose={handleCloseStateConfirmModal}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: 'warning.main', color: 'white' }}>
                    Confirmar Cambio de Estado
                </DialogTitle>
                <DialogContent dividers sx={{ mt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            ¡Atención!
                        </Typography>
                        <Typography variant="body2">
                            El cambio de estado de la compra afectará el stock de los productos. 
                            {shoppingToUpdate?.newState === 'canceled' 
                                ? ' Al cancelar la compra, el stock de los productos se decrementará.'
                                : ' Al marcar como pagada, el stock de los productos se incrementará.'}
                        </Typography>
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        ¿Está seguro de que desea cambiar el estado de la compra a <strong>{shoppingToUpdate?.newState === 'paid' ? 'Paid' : 'Canceled'}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleCloseStateConfirmModal} 
                        disabled={updatingState}
                        color="error"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmStateChange} 
                        variant="contained" 
                        disabled={updatingState}
                        color="warning"
                    >
                        {updatingState ? <CircularProgress size={20} /> : 'Confirmar Cambio'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ShoppingsPage />
        </SnackbarProvider>
    );
}

