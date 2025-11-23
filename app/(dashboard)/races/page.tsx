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

interface Race {
    id: number;
    name: string;
    type_pet_id: number;
    type_pet?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface TypePet {
    id: number;
    name: string;
}

function RacesPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [races, setRaces] = React.useState<Race[]>([]);
    const [typePets, setTypePets] = React.useState<TypePet[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingTypePets, setLoadingTypePets] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingRace, setEditingRace] = React.useState<Race | null>(null);
    const [formData, setFormData] = React.useState({ name: '', type_pet_id: '' });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar tipos de mascotas
    const loadTypePets = React.useCallback(async () => {
        try {
            setLoadingTypePets(true);
            const response = await fetch(`/api/type-pets?page=1&per_page=100`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar tipos de mascotas');
            }

            if (data.data) {
                setTypePets(data.data);
            } else if (Array.isArray(data)) {
                setTypePets(data);
            } else {
                setTypePets([]);
            }
        } catch (err) {
            console.error('Error al cargar tipos de mascotas:', err);
            setTypePets([]);
        } finally {
            setLoadingTypePets(false);
        }
    }, []);

    // Cargar razas
    const loadRaces = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/races?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar razas');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setRaces(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setRaces(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setRaces([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar razas');
            setRaces([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadRaces();
        loadTypePets();
    }, [loadRaces, loadTypePets]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingRace(null);
        setFormData({ name: '', type_pet_id: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (race: Race) => {
        setEditingRace(race);
        setFormData({ 
            name: race.name, 
            type_pet_id: race.type_pet_id?.toString() || '' 
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingRace(null);
        setFormData({ name: '', type_pet_id: '' });
        setFormErrors({});
    };

    // Guardar raza (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingRace ? `/api/races/${editingRace.id}` : '/api/races';
            const method = editingRace ? 'PUT' : 'POST';

            const dataToSend = {
                name: formData.name,
                type_pet_id: parseInt(formData.type_pet_id),
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar raza' });
                }
                return;
            }

            handleCloseModal();
            loadRaces();
            // Show success snackbar
            enqueueSnackbar(editingRace ? 'Raza actualizada correctamente' : 'Raza creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar raza' });
            // Show error snackbar
            enqueueSnackbar(editingRace ? 'Error al actualizar raza' : 'Error al crear raza', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar raza
    const handleDelete = async (raceId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Raza",
            description: "¿Estás seguro de que deseas eliminar esta raza?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/races/${raceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar raza', { variant: 'error' });
                return;
            }

            loadRaces();
            // Show success snackbar
            enqueueSnackbar('Raza eliminada correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar raza', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Razas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Raza
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
                            <StyledTableCell>Tipo de Mascota</StyledTableCell>
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : races.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay razas disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            races.map((race) => (
                                <StyledTableRow key={race.id}>
                                    <StyledTableCell>{race.id}</StyledTableCell>
                                    <StyledTableCell>{race.name}</StyledTableCell>
                                    <StyledTableCell>
                                        {race.type_pet?.name || `Tipo ID: ${race.type_pet_id}`}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(race)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(race.id)}
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
                    {editingRace ? 'Editar Raza' : 'Nueva Raza'}
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
                    <FormControl fullWidth size="small" error={!!formErrors.type_pet_id} sx={{ mb: 2 }}>
                        <InputLabel>Tipo de Mascota</InputLabel>
                        <Select
                            value={formData.type_pet_id}
                            label="Tipo de Mascota"
                            onChange={(e) => setFormData({ ...formData, type_pet_id: e.target.value })}
                            disabled={loadingTypePets}
                        >
                            {typePets.map((typePet) => (
                                <MenuItem key={typePet.id} value={typePet.id.toString()}>
                                    {typePet.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.type_pet_id && <FormHelperText>{formErrors.type_pet_id}</FormHelperText>}
                        {loadingTypePets && <FormHelperText>Cargando tipos de mascotas...</FormHelperText>}
                    </FormControl>
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
            <RacesPage />
        </SnackbarProvider>
    );
}

