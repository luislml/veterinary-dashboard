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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Pagination,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    Tooltip,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';

interface Address {
    id: number;
    address: string;
    veterinary_id: number;
    address_type: 'social_media' | 'physical' | 'map';
    veterinary?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Veterinary {
    id: number;
    name: string;
}

const ADDRESS_TYPE_OPTIONS = [
    { value: 'social_media', label: 'Redes Sociales' },
    { value: 'physical', label: 'Física' },
    { value: 'map', label: 'Mapa' },
];

const ADDRESS_TYPE_LABELS: Record<string, string> = {
    'social_media': 'Redes Sociales',
    'physical': 'Física',
    'map': 'Mapa',
};

const ADDRESS_TYPE_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
    'social_media': 'primary',
    'physical': 'success',
    'map': 'info',
};

function AddressesPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es admin
    const isAdmin = session?.hasRole?.('admin') || false;
    const isVeterinary = session?.hasRole?.('veterinary') || false;
    
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [addresses, setAddresses] = React.useState<Address[]>([]);
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingAddress, setEditingAddress] = React.useState<Address | null>(null);
    const [formData, setFormData] = React.useState({ 
        address: '', 
        veterinary_id: '' as string | number,
        address_type: '' as string
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar veterinarias (solo para admin)
    const loadVeterinaries = React.useCallback(async () => {
        // Solo cargar si el usuario es admin
        if (!isAdmin) {
            setVeterinaries([]);
            return;
        }

        try {
            setLoadingVeterinaries(true);
            const response = await fetch(`/api/veterinaries?page=1&per_page=100`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar veterinarias');
            }

            if (data.data) {
                setVeterinaries(data.data);
            } else if (Array.isArray(data)) {
                setVeterinaries(data);
            } else {
                setVeterinaries([]);
            }
        } catch (err) {
            console.error('Error al cargar veterinarias:', err);
            setVeterinaries([]);
        } finally {
            setLoadingVeterinaries(false);
        }
    }, [isAdmin]);

    // Cargar direcciones
    const loadAddresses = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si el rol es veterinary
            let url = `/api/addresses?page=${page}&per_page=10`;
            if (isVeterinary && selectedVeterinary?.id) {
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
                throw new Error(data.error || data.message || 'Error al cargar direcciones');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setAddresses(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setAddresses(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setAddresses([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar direcciones');
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, [page, isVeterinary, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadAddresses();
        // Solo cargar veterinarias si es admin
        if (isAdmin) {
            loadVeterinaries();
        }
    }, [loadAddresses, loadVeterinaries, isAdmin]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (isVeterinary && selectedVeterinary?.id) {
            setPage(1);
        }
    }, [isVeterinary, selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingAddress(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ address: '', veterinary_id: defaultVeterinaryId, address_type: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({ 
            address: address.address || '', 
            veterinary_id: address.veterinary_id || (!isAdmin && selectedVeterinary?.id ? selectedVeterinary.id : ''),
            address_type: address.address_type || ''
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingAddress(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ address: '', veterinary_id: defaultVeterinaryId, address_type: '' });
        setFormErrors({});
    };

    // Guardar dirección (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
            const method = editingAddress ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId === '') && selectedVeterinary?.id) {
                veterinaryId = selectedVeterinary.id;
            }

            const dataToSend = {
                address: formData.address,
                veterinary_id: veterinaryId,
                address_type: formData.address_type,
            };

            const response = await fetch(url, {
                method,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar dirección' });
                }
                return;
            }

            handleCloseModal();
            loadAddresses();
            // Show success snackbar
            enqueueSnackbar(editingAddress ? 'Dirección actualizada correctamente' : 'Dirección creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar dirección' });
            // Show error snackbar
            enqueueSnackbar(editingAddress ? 'Error al actualizar dirección' : 'Error al crear dirección', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar dirección
    const handleDelete = async (addressId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Dirección",
            description: "¿Estás seguro de que deseas eliminar esta dirección?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/addresses/${addressId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar dirección', { variant: 'error' });
                return;
            }

            loadAddresses();
            // Show success snackbar
            enqueueSnackbar('Dirección eliminada correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar dirección', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Direcciones</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Dirección
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
                            <TableCell>Dirección</TableCell>
                            <TableCell>Tipo</TableCell>
                            {isAdmin && <TableCell>Veterinaria</TableCell>}
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : addresses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay direcciones disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            addresses.map((address) => (
                                <TableRow key={address.id}>
                                    <TableCell>{address.id}</TableCell>
                                    <TableCell>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                maxWidth: 400, 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap' 
                                            }}
                                        >
                                            {address.address || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={ADDRESS_TYPE_LABELS[address.address_type] || address.address_type} 
                                            size="small" 
                                            color={ADDRESS_TYPE_COLORS[address.address_type] || 'default'}
                                        />
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            {address.veterinary?.name || `ID: ${address.veterinary_id}`}
                                        </TableCell>
                                    )}
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(address)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(address.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
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

            {/* Modal para crear/editar */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
                </DialogTitle>
                <DialogContent dividers>
                    {formErrors.general && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formErrors.general}
                        </Alert>
                    )}
                    {isAdmin && (
                        <FormControl fullWidth size="small" error={!!formErrors.veterinary_id} sx={{ mb: 2 }}>
                            <InputLabel>Veterinaria</InputLabel>
                            <Select
                                value={formData.veterinary_id}
                                label="Veterinaria"
                                onChange={(e) => setFormData({ ...formData, veterinary_id: e.target.value })}
                                disabled={loadingVeterinaries}
                            >
                                {veterinaries.map((veterinary) => (
                                    <MenuItem key={veterinary.id} value={veterinary.id}>
                                        {veterinary.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.veterinary_id && <FormHelperText>{formErrors.veterinary_id}</FormHelperText>}
                            {loadingVeterinaries && <FormHelperText>Cargando veterinarias...</FormHelperText>}
                        </FormControl>
                    )}
                    {!isAdmin && selectedVeterinary && (
                        <TextField
                            label="Veterinaria"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={selectedVeterinary.name}
                            disabled
                            sx={{ mb: 2 }}
                        />
                    )}
                    <FormControl fullWidth size="small" error={!!formErrors.address_type} sx={{ mb: 2 }}>
                        <InputLabel>Tipo de Dirección</InputLabel>
                        <Select
                            value={formData.address_type}
                            label="Tipo de Dirección"
                            onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
                        >
                            {ADDRESS_TYPE_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.address_type && <FormHelperText>{formErrors.address_type}</FormHelperText>}
                    </FormControl>
                    <TextField
                        label="Dirección"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        error={!!formErrors.address}
                        helperText={formErrors.address}
                        placeholder="Ingrese la dirección..."
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} disabled={submitting} color="error">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Guardar'}
                    </Button>
                </DialogActions>
            </Dialog>
            
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <AddressesPage />
        </SnackbarProvider>
    );
}

