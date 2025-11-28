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
    OutlinedInput,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { PageContainer } from '@toolpad/core/PageContainer';
import { styled } from '@mui/material/styles';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';

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
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
}));

interface Client {
    id: number;
    name: string;
    last_name: string;
    phone: string;
    address: string;
    veterinary_id?: number | number[];
    veterinaries?: {
        id: number;
        name: string;
    }[];
    veterinary?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
    pets?: {
        id: number;
        name: string;
    }[];
}

interface Veterinary {
    id: number;
    name: string;
}

function ClientsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es admin
    const isAdmin = session?.hasRole?.('admin') || false;
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [clients, setClients] = React.useState<Client[]>([]);
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingClient, setEditingClient] = React.useState<Client | null>(null);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        last_name: '', 
        phone: '', 
        address: '', 
        veterinary_id: [] as number[]
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

    // Buscar clientes
    const [searchTerm, setSearchTerm] = React.useState('');

    // Cargar clientes
    const loadClients = React.useCallback(async (searchTerm: string) => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/clients?page=${page}&search=${searchTerm}`;
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

            // Adaptar respuesta de Laravel
            if (data.data) {
                setClients(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setClients(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setClients([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar clientes');
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadClients('');
        // Solo cargar veterinarias si es admin
        if (isAdmin) {
            loadVeterinaries();
        }
    }, [loadClients, loadVeterinaries, isAdmin, searchTerm]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (selectedVeterinary?.id) {
            setPage(1);
        }
    }, [selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingClient(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? [selectedVeterinary.id] 
            : [];
        setFormData({ name: '', last_name: '', phone: '', address: '', veterinary_id: defaultVeterinaryId });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (client: Client) => {
        setEditingClient(client);
        
        // Manejar veterinary_id como array o número único
        let veterinaryIds: number[] = [];
        if (Array.isArray(client.veterinary_id)) {
            veterinaryIds = client.veterinary_id;
        } else if (client.veterinaries && client.veterinaries.length > 0) {
            veterinaryIds = client.veterinaries.map(v => v.id);
        } else if (client.veterinary_id) {
            veterinaryIds = [client.veterinary_id];
        }
        
        // Si es veterinary y no hay veterinarias asignadas, usar la veterinaria activa
        if (!isAdmin && veterinaryIds.length === 0 && selectedVeterinary?.id) {
            veterinaryIds = [selectedVeterinary.id];
        }
        
        setFormData({ 
            name: client.name, 
            last_name: client.last_name || '', 
            phone: client.phone || '', 
            address: client.address || '', 
            veterinary_id: veterinaryIds
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingClient(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? [selectedVeterinary.id] 
            : [];
        setFormData({ name: '', last_name: '', phone: '', address: '', veterinary_id: defaultVeterinaryId });
        setFormErrors({});
    };

    // Guardar cliente (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
            const method = editingClient ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId.length === 0) && selectedVeterinary?.id) {
                veterinaryId = [selectedVeterinary.id];
            }

            const dataToSend = {
                name: formData.name,
                last_name: formData.last_name,
                phone: formData.phone,
                address: formData.address,
                veterinary_id: veterinaryId,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar cliente' });
                }
                return;
            }

            handleCloseModal();
            loadClients('');
            // Show success snackbar
            enqueueSnackbar(editingClient ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar cliente' });
            // Show error snackbar
            enqueueSnackbar(editingClient ? 'Error al actualizar cliente' : 'Error al crear cliente', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <p>&nbsp;</p>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Formulario de búsqueda */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    label="Buscar cliente"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                            <StyledTableCell>Propietario</StyledTableCell>
                            <StyledTableCell>Teléfono</StyledTableCell>
                            <StyledTableCell>Mascotas</StyledTableCell>
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay clientes disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <StyledTableRow key={client.id}>
                                    <StyledTableCell>{client.name} {client.last_name || '-'}</StyledTableCell>
                                    <StyledTableCell>{client.phone || '-'}</StyledTableCell>
                                    <StyledTableCell>
                                        {client?.pets?.map((pet: any) => pet.name).join(', ') || '-'}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(client)}
                                            >
                                                <EditIcon />
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

            {/* Modal para crear/editar */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                </DialogTitle>
                <DialogContent dividers>
                    {formErrors.general && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formErrors.general}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        label="Nombre"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={!!formErrors.name}
                        helperText={formErrors.name}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Apellido"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        error={!!formErrors.last_name}
                        helperText={formErrors.last_name}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Teléfono"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        error={!!formErrors.phone}
                        helperText={formErrors.phone}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Dirección"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        size="small"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        error={!!formErrors.address}
                        helperText={formErrors.address}
                        sx={{ mb: 2 }}
                    />
                    {isAdmin && (
                        <FormControl fullWidth size="small" error={!!formErrors.veterinary_id} sx={{ mb: 2 }}>
                            <InputLabel>Veterinarias</InputLabel>
                            <Select
                                multiple
                                value={formData.veterinary_id}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({ 
                                        ...formData, 
                                        veterinary_id: typeof value === 'string' 
                                            ? value.split(',').map(v => parseInt(v.trim()))
                                            : value as number[]
                                    });
                                }}
                                input={<OutlinedInput label="Veterinarias" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as number[]).map((value) => {
                                            const veterinary = veterinaries.find(v => v.id === value);
                                            return veterinary ? (
                                                <Chip key={value} label={veterinary.name} size="small" />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
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
            <ClientsPage />
        </SnackbarProvider>
    );
}

