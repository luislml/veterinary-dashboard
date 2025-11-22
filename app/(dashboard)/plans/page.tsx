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

interface Plan {
    id: number;
    name: string;
    description: string;
    type: string;
    created_at?: string;
    updated_at?: string;
}

// Datos de prueba para el tipo de plan
const PLAN_TYPES = [
    { value: 'basic', label: 'Básico' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'custom', label: 'Personalizado' },
];

function PlansPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [plans, setPlans] = React.useState<Plan[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
    const [formData, setFormData] = React.useState({ name: '', description: '', type: '' });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar planes
    const loadPlans = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/plans?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar planes');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setPlans(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setPlans(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setPlans([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar planes');
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingPlan(null);
        setFormData({ name: '', description: '', type: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({ name: plan.name, description: plan.description, type: plan.type });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingPlan(null);
        setFormData({ name: '', description: '', type: '' });
        setFormErrors({});
    };

    // Guardar plan (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingPlan ? `/api/plans/${editingPlan.id}` : '/api/plans';
            const method = editingPlan ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setFormErrors(data.errors);
                } else {
                    setFormErrors({ general: data.message || data.error || 'Error al guardar plan' });
                }
                return;
            }

            handleCloseModal();
            loadPlans();
            // Show success snackbar
            enqueueSnackbar(editingPlan ? 'Plan actualizado correctamente' : 'Plan creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar plan' });
            // Show error snackbar
            enqueueSnackbar(editingPlan ? 'Error al actualizar plan' : 'Error al crear plan', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar plan
    const handleDelete = async (planId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Plan",
            description: "¿Estás seguro de que deseas eliminar este plan?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/plans/${planId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar plan', { variant: 'error' });
                return;
            }

            loadPlans();
            // Show success snackbar
            enqueueSnackbar('Plan eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar plan', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Planes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Plan
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
                            <StyledTableCell>Descripción</StyledTableCell>
                            <StyledTableCell>Tipo</StyledTableCell>
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
                        ) : plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay planes disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <StyledTableRow key={plan.id}>
                                    <StyledTableCell>{plan.id}</StyledTableCell>
                                    <StyledTableCell>{plan.name}</StyledTableCell>
                                    <StyledTableCell>{plan.description}</StyledTableCell>
                                    <StyledTableCell>
                                        {PLAN_TYPES.find(t => t.value === plan.type)?.label || plan.type}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(plan)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(plan.id)}
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
                    {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
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
                        label="Descripción"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        size="small"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        error={!!formErrors.description}
                        helperText={formErrors.description}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth size="small" error={!!formErrors.type} sx={{ mb: 2 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={formData.type}
                            label="Tipo"
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            {PLAN_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
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
            <PlansPage />
        </SnackbarProvider>
    );
}