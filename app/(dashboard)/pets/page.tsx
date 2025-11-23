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
import { styled } from '@mui/material/styles';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";

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

interface Pet {
    id: number;
    name: string;
    race_id: number;
    client_id: number;
    color: string;
    gender: string;
    age: number;
    race?: {
        id: number;
        name: string;
    };
    client?: {
        id: number;
        name: string;
        last_name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Race {
    id: number;
    name: string;
}

interface Client {
    id: number;
    name: string;
    last_name: string;
}

// Opciones de género
const GENDER_OPTIONS = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Hembra' },
];

function PetsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [pets, setPets] = React.useState<Pet[]>([]);
    const [races, setRaces] = React.useState<Race[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingRaces, setLoadingRaces] = React.useState(false);
    const [loadingClients, setLoadingClients] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingPet, setEditingPet] = React.useState<Pet | null>(null);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        race_id: '', 
        client_id: '', 
        color: '', 
        gender: '', 
        age: '' 
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar razas
    const loadRaces = React.useCallback(async () => {
        try {
            setLoadingRaces(true);
            const response = await fetch(`/api/races?page=1&per_page=100`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar razas');
            }

            if (data.data) {
                setRaces(data.data);
            } else if (Array.isArray(data)) {
                setRaces(data);
            } else {
                setRaces([]);
            }
        } catch (err) {
            console.error('Error al cargar razas:', err);
            setRaces([]);
        } finally {
            setLoadingRaces(false);
        }
    }, []);

    // Cargar clientes
    const loadClients = React.useCallback(async () => {
        try {
            setLoadingClients(true);
            const response = await fetch(`/api/clients?page=1&per_page=100`);
            
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
    }, []);

    // Cargar mascotas
    const loadPets = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/pets?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar mascotas');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setPets(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setPets(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setPets([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar mascotas');
            setPets([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadPets();
        loadRaces();
        loadClients();
    }, [loadPets, loadRaces, loadClients]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingPet(null);
        setFormData({ name: '', race_id: '', client_id: '', color: '', gender: '', age: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (pet: Pet) => {
        setEditingPet(pet);
        setFormData({ 
            name: pet.name, 
            race_id: pet.race_id?.toString() || '', 
            client_id: pet.client_id?.toString() || '', 
            color: pet.color || '', 
            gender: pet.gender || '', 
            age: pet.age?.toString() || '' 
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingPet(null);
        setFormData({ name: '', race_id: '', client_id: '', color: '', gender: '', age: '' });
        setFormErrors({});
    };

    // Guardar mascota (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingPet ? `/api/pets/${editingPet.id}` : '/api/pets';
            const method = editingPet ? 'PUT' : 'POST';

            const dataToSend = {
                name: formData.name,
                race_id: parseInt(formData.race_id),
                client_id: parseInt(formData.client_id),
                color: formData.color,
                gender: formData.gender,
                age: parseInt(formData.age),
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar mascota' });
                }
                return;
            }

            handleCloseModal();
            loadPets();
            // Show success snackbar
            enqueueSnackbar(editingPet ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar mascota' });
            // Show error snackbar
            enqueueSnackbar(editingPet ? 'Error al actualizar mascota' : 'Error al crear mascota', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar mascota
    const handleDelete = async (petId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Mascota",
            description: "¿Estás seguro de que deseas eliminar esta mascota?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/pets/${petId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar mascota', { variant: 'error' });
                return;
            }

            loadPets();
            // Show success snackbar
            enqueueSnackbar('Mascota eliminada correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar mascota', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Registro de Mascotas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Mascota
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
                            <StyledTableCell>Nombre</StyledTableCell>
                            <StyledTableCell>Raza</StyledTableCell>
                            <StyledTableCell>Cliente</StyledTableCell>
                            <StyledTableCell>Color</StyledTableCell>
                            <StyledTableCell>Género</StyledTableCell>
                            <StyledTableCell>Edad</StyledTableCell>
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : pets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay mascotas disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            pets.map((pet) => (
                                <StyledTableRow key={pet.id}>
                                    <StyledTableCell>{pet.id}</StyledTableCell>
                                    <StyledTableCell>{pet.name}</StyledTableCell>
                                    <StyledTableCell>
                                        {pet.race?.name || `Raza ID: ${pet.race_id}`}
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        {pet.client ? `${pet.client.name} ${pet.client.last_name || ''}`.trim() : `Cliente ID: ${pet.client_id}`}
                                    </StyledTableCell>
                                    <StyledTableCell>{pet.color || '-'}</StyledTableCell>
                                    <StyledTableCell>
                                        {GENDER_OPTIONS.find(g => g.value === pet.gender)?.label || pet.gender}
                                    </StyledTableCell>
                                    <StyledTableCell>{pet.age || '-'}</StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(pet)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(pet.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
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
                    {editingPet ? 'Editar Mascota' : 'Nueva Mascota'}
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
                    <FormControl fullWidth size="small" error={!!formErrors.race_id} sx={{ mb: 2 }}>
                        <InputLabel>Raza</InputLabel>
                        <Select
                            value={formData.race_id}
                            label="Raza"
                            onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
                            disabled={loadingRaces}
                        >
                            {races.map((race) => (
                                <MenuItem key={race.id} value={race.id.toString()}>
                                    {race.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.race_id && <FormHelperText>{formErrors.race_id}</FormHelperText>}
                        {loadingRaces && <FormHelperText>Cargando razas...</FormHelperText>}
                    </FormControl>
                    <FormControl fullWidth size="small" error={!!formErrors.client_id} sx={{ mb: 2 }}>
                        <InputLabel>Cliente</InputLabel>
                        <Select
                            value={formData.client_id}
                            label="Cliente"
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            disabled={loadingClients}
                        >
                            {clients.map((client) => (
                                <MenuItem key={client.id} value={client.id.toString()}>
                                    {client.name} {client.last_name || ''}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.client_id && <FormHelperText>{formErrors.client_id}</FormHelperText>}
                        {loadingClients && <FormHelperText>Cargando clientes...</FormHelperText>}
                    </FormControl>
                    <TextField
                        label="Color"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        error={!!formErrors.color}
                        helperText={formErrors.color}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth size="small" error={!!formErrors.gender} sx={{ mb: 2 }}>
                        <InputLabel>Género</InputLabel>
                        <Select
                            value={formData.gender}
                            label="Género"
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            {GENDER_OPTIONS.map((gender) => (
                                <MenuItem key={gender.value} value={gender.value}>
                                    {gender.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.gender && <FormHelperText>{formErrors.gender}</FormHelperText>}
                    </FormControl>
                    <TextField
                        label="Edad"
                        type="number"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        error={!!formErrors.age}
                        helperText={formErrors.age}
                        inputProps={{ min: 0 }}
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
            <PetsPage />
        </SnackbarProvider>
    );
}

