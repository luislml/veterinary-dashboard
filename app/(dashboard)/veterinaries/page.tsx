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

interface Veterinary {
    id: number;
    name: string;
    plan_id: number;
    user_id: number;
    plan?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Plan {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

function VeterinariesPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [plans, setPlans] = React.useState<Plan[]>([]);
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingPlans, setLoadingPlans] = React.useState(false);
    const [loadingUsers, setLoadingUsers] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingVeterinary, setEditingVeterinary] = React.useState<Veterinary | null>(null);
    const [formData, setFormData] = React.useState({ name: '', plan_id: '', user_id: '' });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar planes
    const loadPlans = React.useCallback(async () => {
        try {
            setLoadingPlans(true);
            const response = await fetch(`/api/plans?page=1&per_page=100`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar planes');
            }

            if (data.data) {
                setPlans(data.data);
            } else if (Array.isArray(data)) {
                setPlans(data);
            } else {
                setPlans([]);
            }
        } catch (err) {
            console.error('Error al cargar planes:', err);
            setPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    }, []);

    // Cargar usuarios
    const loadUsers = React.useCallback(async () => {
        try {
            setLoadingUsers(true);
            const response = await fetch(`/api/users?page=1&per_page=100`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar usuarios');
            }

            if (data.data) {
                setUsers(data.data);
            } else if (Array.isArray(data)) {
                setUsers(data);
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    // Cargar veterinarias
    const loadVeterinaries = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/veterinaries?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar veterinarias');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setVeterinaries(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setVeterinaries(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setVeterinaries([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar veterinarias');
            setVeterinaries([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadVeterinaries();
        loadPlans();
        loadUsers();
    }, [loadVeterinaries, loadPlans, loadUsers]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingVeterinary(null);
        setFormData({ name: '', plan_id: '', user_id: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (veterinary: Veterinary) => {
        setEditingVeterinary(veterinary);
        setFormData({ 
            name: veterinary.name, 
            plan_id: veterinary.plan_id?.toString() || '', 
            user_id: veterinary.user_id?.toString() || '' 
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingVeterinary(null);
        setFormData({ name: '', plan_id: '', user_id: '' });
        setFormErrors({});
    };

    // Guardar veterinaria (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingVeterinary ? `/api/veterinaries/${editingVeterinary.id}` : '/api/veterinaries';
            const method = editingVeterinary ? 'PUT' : 'POST';

            const dataToSend = {
                name: formData.name,
                plan_id: parseInt(formData.plan_id),
                user_id: parseInt(formData.user_id),
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar veterinaria' });
                }
                return;
            }

            handleCloseModal();
            loadVeterinaries();
            // Show success snackbar
            enqueueSnackbar(editingVeterinary ? 'Veterinaria actualizada correctamente' : 'Veterinaria creada correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar veterinaria' });
            // Show error snackbar
            enqueueSnackbar(editingVeterinary ? 'Error al actualizar veterinaria' : 'Error al crear veterinaria', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar veterinaria
    const handleDelete = async (veterinaryId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Veterinaria",
            description: "¿Estás seguro de que deseas eliminar esta veterinaria?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/veterinaries/${veterinaryId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar veterinaria', { variant: 'error' });
                return;
            }

            loadVeterinaries();
            // Show success snackbar
            enqueueSnackbar('Veterinaria eliminada correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar veterinaria', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Veterinarias</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Veterinaria
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
                            <StyledTableCell>Plan</StyledTableCell>
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : veterinaries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay veterinarias disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            veterinaries.map((veterinary) => (
                                <StyledTableRow key={veterinary.id}>
                                    <StyledTableCell>{veterinary.id}</StyledTableCell>
                                    <StyledTableCell>{veterinary.name}</StyledTableCell>
                                    <StyledTableCell>
                                        {veterinary.plan?.name || `Plan ID: ${veterinary.plan_id}`}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(veterinary)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(veterinary.id)}
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
                    {editingVeterinary ? 'Editar Veterinaria' : 'Nueva Veterinaria'}
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
                    <FormControl fullWidth size="small" error={!!formErrors.plan_id} sx={{ mb: 2 }}>
                        <InputLabel>Plan</InputLabel>
                        <Select
                            value={formData.plan_id}
                            label="Plan"
                            onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                            disabled={loadingPlans}
                        >
                            {plans.map((plan) => (
                                <MenuItem key={plan.id} value={plan.id.toString()}>
                                    {plan.name}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.plan_id && <FormHelperText>{formErrors.plan_id}</FormHelperText>}
                        {loadingPlans && <FormHelperText>Cargando planes...</FormHelperText>}
                    </FormControl>
                    <FormControl fullWidth size="small" error={!!formErrors.user_id} sx={{ mb: 2 }}>
                        <InputLabel>Usuario</InputLabel>
                        <Select
                            value={formData.user_id}
                            label="Usuario"
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            disabled={loadingUsers}
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id.toString()}>
                                    {user.name} ({user.email})
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.user_id && <FormHelperText>{formErrors.user_id}</FormHelperText>}
                        {loadingUsers && <FormHelperText>Cargando usuarios...</FormHelperText>}
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
            <VeterinariesPage />
        </SnackbarProvider>
    );
}



