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
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import SalesFormDialog from '../../components/SalesFormDialog';
import SalesDetailDialog from '../../components/SalesDetailDialog';

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

function SalesPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();

    const [sales, setSales] = React.useState<Sale[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [openDetailModal, setOpenDetailModal] = React.useState(false);
    const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
    const [openStateConfirmModal, setOpenStateConfirmModal] = React.useState(false);
    const [saleToUpdate, setSaleToUpdate] = React.useState<{ id: number; newState: string } | null>(null);
    const [updatingState, setUpdatingState] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);

    // Cargar ventas
    const loadSales = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/sales?page=${page}&per_page=10`;
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
                throw new Error(data.error || data.message || 'Error al cargar ventas');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setSales(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setSales(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setSales([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar ventas');
            setSales([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadSales();
    }, [loadSales]);

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
        loadSales();
    };

    // Ver detalle de venta
    const handleViewDetail = async (saleId: number) => {
        try {
            const response = await fetch(`/api/sales/${saleId}`);
            
            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al cargar detalle de venta', { variant: 'error' });
                return;
            }

            const data = await response.json();
            const saleData = data.data || data;
            setSelectedSale(saleData);
            setOpenDetailModal(true);
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al cargar detalle de venta', { variant: 'error' });
        }
    };

    // Cerrar modal de detalle
    const handleCloseDetailModal = () => {
        setOpenDetailModal(false);
        setSelectedSale(null);
    };

    // Manejar cambio de estado
    const handleStateChange = (saleId: number, newState: string, currentState: string) => {
        if (newState === currentState) return;
        
        setSaleToUpdate({ id: saleId, newState });
        setOpenStateConfirmModal(true);
    };

    // Confirmar y actualizar estado
    const handleConfirmStateChange = async () => {
        if (!saleToUpdate) return;

        setUpdatingState(true);
        try {
            const response = await fetch(`/api/sales/${saleToUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    state: saleToUpdate.newState,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                enqueueSnackbar(data.error || data.message || 'Error al actualizar estado de la venta', { variant: 'error' });
                return;
            }

            setOpenStateConfirmModal(false);
            setSaleToUpdate(null);
            loadSales();
            enqueueSnackbar('Estado de la venta actualizado correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al actualizar estado de la venta', { variant: 'error' });
        } finally {
            setUpdatingState(false);
        }
    };

    // Cerrar modal de confirmación de estado
    const handleCloseStateConfirmModal = () => {
        if (!updatingState) {
            setOpenStateConfirmModal(false);
            setSaleToUpdate(null);
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Ventas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Venta
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
                            <TableCell>Estado</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Monto</TableCell>
                            <TableCell>Descuento</TableCell>
                            <TableCell>Productos</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay ventas disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell>{sale.id}</TableCell>
                                    <TableCell>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={sale.state || 'Completado'}
                                                onChange={(e) => handleStateChange(sale.id, e.target.value, sale.state || 'paid')}
                                                sx={{ fontSize: '0.875rem' }}
                                                disabled={sale.state === 'Cancelado'}
                                            >
                                                <MenuItem value="Completado">Completado</MenuItem>
                                                <MenuItem value="Cancelado">Cancelado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        {sale.client 
                                            ? `${sale.client.name} ${sale.client.last_name || ''}`.trim()
                                            : `Cliente ID: ${sale.client_id}`}
                                    </TableCell>
                                    <TableCell>
                                        {sale.amount !== undefined && sale.amount !== null
                                            ? `bs/${sale.amount}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sale.discount !== undefined && sale.discount !== null
                                            ? `bs/${sale.discount}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sale.products && sale.products.length > 0
                                            ? `${sale.products.length} producto(s)`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sale.created_at 
                                            ? new Date(sale.created_at).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ver Detalle" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewDetail(sale.id)}
                                                color="primary"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
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

            {/* Modal para crear venta */}
            <SalesFormDialog
                open={openModal}
                onClose={handleCloseModal}
                onSave={handleSaveSuccess}
            />

            {/* Modal para ver detalle de venta */}
            <SalesDetailDialog
                open={openDetailModal}
                onClose={handleCloseDetailModal}
                sale={selectedSale}
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
                            El cambio de estado de la venta afectará el stock de los productos. 
                            {saleToUpdate?.newState === 'canceled' 
                                ? ' Al cancelar la venta, el stock de los productos se incrementará.'
                                : ' Al marcar como pagada, el stock de los productos se decrementará.'}
                        </Typography>
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        ¿Está seguro de que desea cambiar el estado de la venta a <strong>{saleToUpdate?.newState === 'paid' ? 'Paid' : 'Canceled'}</strong>?
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
            <SalesPage />
        </SnackbarProvider>
    );
}

