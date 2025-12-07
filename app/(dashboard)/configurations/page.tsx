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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';

interface Configuration {
    id: number;
    style: string;
    veterinary_id: number;
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

function ConfigurationsPage() {

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

    const [configurations, setConfigurations] = React.useState<Configuration[]>([]);
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingConfiguration, setEditingConfiguration] = React.useState<Configuration | null>(null);
    const [formData, setFormData] = React.useState({ 
        style: '', 
        veterinary_id: '' as string | number
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

    // Cargar configuraciones
    const loadConfigurations = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si el rol es veterinary
            let url = `/api/configurations?page=${page}&per_page=10`;
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
                throw new Error(data.error || data.message || 'Error al cargar configuraciones');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setConfigurations(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setConfigurations(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setConfigurations([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar configuraciones');
            setConfigurations([]);
        } finally {
            setLoading(false);
        }
    }, [page, isVeterinary, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadConfigurations();
        // Solo cargar veterinarias si es admin
        if (isAdmin) {
            loadVeterinaries();
        }
    }, [loadConfigurations, loadVeterinaries, isAdmin]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (isVeterinary && selectedVeterinary?.id) {
            setPage(1);
        }
    }, [isVeterinary, selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingConfiguration(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ style: '', veterinary_id: defaultVeterinaryId });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (configuration: Configuration) => {
        setEditingConfiguration(configuration);
        setFormData({ 
            style: configuration.style || '', 
            veterinary_id: configuration.veterinary_id || (!isAdmin && selectedVeterinary?.id ? selectedVeterinary.id : '')
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingConfiguration(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ style: '', veterinary_id: defaultVeterinaryId });
        setFormErrors({});
    };

    // Guardar configuración (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingConfiguration ? `/api/configurations/${editingConfiguration.id}` : '/api/configurations';
            const method = editingConfiguration ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId === '') && selectedVeterinary?.id) {
                veterinaryId = selectedVeterinary.id;
            }

            const dataToSend = {
                style: formData.style,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar configuración' });
                }
                return;
            }

            handleCloseModal();
            loadConfigurations();
            // Show success snackbar
            enqueueSnackbar(editingConfiguration ? 'Configuración actualizada correctamente' : 'Configuración creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar configuración' });
            // Show error snackbar
            enqueueSnackbar(editingConfiguration ? 'Error al actualizar configuración' : 'Error al crear configuración', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar configuración
    const handleDelete = async (configurationId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Configuración",
            description: "¿Estás seguro de que deseas eliminar esta configuración?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/configurations/${configurationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar configuración', { variant: 'error' });
                return;
            }

            loadConfigurations();
            // Show success snackbar
            enqueueSnackbar('Configuración eliminada correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar configuración', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Configuraciones</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Configuración
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
                            <TableCell>Estilo</TableCell>
                            {isAdmin && <TableCell>Veterinaria</TableCell>}
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 4 : 3} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : configurations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 4 : 3} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay configuraciones disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            configurations.map((configuration) => (
                                <TableRow key={configuration.id}>
                                    <TableCell>{configuration.id}</TableCell>
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
                                            {configuration.style || '-'}
                                        </Typography>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            {configuration.veterinary?.name || `ID: ${configuration.veterinary_id}`}
                                        </TableCell>
                                    )}
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(configuration)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(configuration.id)}
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
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    {editingConfiguration ? 'Editar Configuración' : 'Nueva Configuración'}
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
                    <TextField
                        label="Estilo"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={6}
                        size="small"
                        value={formData.style}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                        error={!!formErrors.style}
                        helperText={formErrors.style}
                        placeholder="Ingrese el estilo de configuración..."
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
            <ConfigurationsPage />
        </SnackbarProvider>
    );
}

