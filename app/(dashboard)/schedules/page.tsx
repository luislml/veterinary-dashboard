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
    Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';

interface Schedule {
    id: number;
    days: string;
    schedule: string;
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

// Opciones de días de la semana
const DAYS_OPTIONS = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miércoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sábado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' },
];

function SchedulesPage() {

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

    const [schedules, setSchedules] = React.useState<Schedule[]>([]);
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null);
    const [formData, setFormData] = React.useState({ 
        days: '', 
        schedule_start: '',
        schedule_end: '',
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

    // Cargar horarios
    const loadSchedules = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si el rol es veterinary
            let url = `/api/schedules?page=${page}&per_page=10`;
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
                throw new Error(data.error || data.message || 'Error al cargar horarios');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setSchedules(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setSchedules(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setSchedules([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar horarios');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [page, isVeterinary, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadSchedules();
        // Solo cargar veterinarias si es admin
        if (isAdmin) {
            loadVeterinaries();
        }
    }, [loadSchedules, loadVeterinaries, isAdmin]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (isVeterinary && selectedVeterinary?.id) {
            setPage(1);
        }
    }, [isVeterinary, selectedVeterinary?.id]);

    // Función para parsear el horario (ej: "08:00 - 18:00" -> { start: "08:00", end: "18:00" })
    const parseSchedule = (schedule: string) => {
        if (!schedule) return { start: '', end: '' };
        const parts = schedule.split(' - ');
        return {
            start: parts[0] || '',
            end: parts[1] || ''
        };
    };

    // Función para formatear el horario (ej: { start: "08:00", end: "18:00" } -> "08:00 - 18:00")
    const formatSchedule = (start: string, end: string) => {
        if (!start || !end) return '';
        return `${start} - ${end}`;
    };

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingSchedule(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ 
            days: '', 
            schedule_start: '',
            schedule_end: '',
            veterinary_id: defaultVeterinaryId 
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        const { start, end } = parseSchedule(schedule.schedule || '');
        setFormData({ 
            days: schedule.days || '', 
            schedule_start: start,
            schedule_end: end,
            veterinary_id: schedule.veterinary_id || (!isAdmin && selectedVeterinary?.id ? selectedVeterinary.id : '')
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingSchedule(null);
        // Si es veterinary, usar la veterinaria activa por defecto
        const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
            ? selectedVeterinary.id 
            : '';
        setFormData({ 
            days: '', 
            schedule_start: '',
            schedule_end: '',
            veterinary_id: defaultVeterinaryId 
        });
        setFormErrors({});
    };

    // Guardar horario (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingSchedule ? `/api/schedules/${editingSchedule.id}` : '/api/schedules';
            const method = editingSchedule ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId === '') && selectedVeterinary?.id) {
                veterinaryId = selectedVeterinary.id;
            }

            // Formatear el horario
            const schedule = formatSchedule(formData.schedule_start, formData.schedule_end);

            const dataToSend = {
                days: formData.days,
                schedule: schedule,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar horario' });
                }
                return;
            }

            handleCloseModal();
            loadSchedules();
            // Show success snackbar
            enqueueSnackbar(editingSchedule ? 'Horario actualizado correctamente' : 'Horario creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar horario' });
            // Show error snackbar
            enqueueSnackbar(editingSchedule ? 'Error al actualizar horario' : 'Error al crear horario', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar horario
    const handleDelete = async (scheduleId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Horario",
            description: "¿Estás seguro de que deseas eliminar este horario?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/schedules/${scheduleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar horario', { variant: 'error' });
                return;
            }

            loadSchedules();
            // Show success snackbar
            enqueueSnackbar('Horario eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar horario', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Horarios</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Horario
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
                            <TableCell>Día</TableCell>
                            <TableCell>Horario</TableCell>
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
                        ) : schedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay horarios disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            schedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <TableCell>{schedule.id}</TableCell>
                                    <TableCell>
                                        {DAYS_OPTIONS.find(d => d.value === schedule.days)?.label || schedule.days}
                                    </TableCell>
                                    <TableCell>{schedule.schedule || '-'}</TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            {schedule.veterinary?.name || `ID: ${schedule.veterinary_id}`}
                                        </TableCell>
                                    )}
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(schedule)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(schedule.id)}
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
                    {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
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
                    <FormControl fullWidth size="small" error={!!formErrors.days} sx={{ mb: 2 }}>
                        <InputLabel>Día</InputLabel>
                        <Select
                            value={formData.days}
                            label="Día"
                            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                        >
                            {DAYS_OPTIONS.map((day) => (
                                <MenuItem key={day.value} value={day.value}>
                                    {day.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.days && <FormHelperText>{formErrors.days}</FormHelperText>}
                    </FormControl>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Horario
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{xs: 6, md: 6}}>
                                <TextField
                                    label="Hora de inicio"
                                    type="time"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.schedule_start}
                                    onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                                    error={!!formErrors.schedule}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        step: 300, // 5 minutos
                                    }}
                                />
                            </Grid>
                            <Grid size={{xs: 6, md: 6}}>
                                <TextField
                                    label="Hora de fin"
                                    type="time"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.schedule_end}
                                    onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                                    error={!!formErrors.schedule}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        step: 300, // 5 minutos
                                    }}
                                />
                            </Grid>
                        </Grid>
                        {formErrors.schedule && (
                            <FormHelperText error sx={{ mt: 0.5 }}>
                                {formErrors.schedule}
                            </FormHelperText>
                        )}
                    </Box>
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
            <SchedulesPage />
        </SnackbarProvider>
    );
}

