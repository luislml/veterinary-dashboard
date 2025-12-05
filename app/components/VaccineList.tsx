'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
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
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";

interface Vaccine {
    id: number;
    name: string;
    pet_id: number;
    date?: string;
    created_at?: string;
    updated_at?: string;
}

interface VaccineListProps {
    petId: number;
    onUpdateCount?: (count: number) => void;
}

export default function VaccineList({ petId, onUpdateCount }: VaccineListProps) {
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm();

    const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingVaccine, setEditingVaccine] = React.useState<Vaccine | null>(null);
    const [formData, setFormData] = React.useState({
        name: '',
        pet_id: petId,
    });
    const [customName, setCustomName] = React.useState('');
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    const vaccineOptions = [
        'Feligen® CRP',
        'Feligen® CRP + R',
        'Leucogen®',
        'Nobivac® DH2 Ppi',
        'Nobivac® DH2 Ppi + L',
        'Nobivac® DH2 Ppi + RL',
        'Nobivac® KC',
        'Nobivac® Lepto',
        'Nobivac® Puppy DP',
        'Nobivac® Rabia',
        'Nobivac® Tricat',
        'Nobivac® RL',
        'otro',
    ];

    // Cargar vacunas
    const loadVaccines = React.useCallback(async () => {
        if (!petId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/vaccines?pet_id=${petId}&paginate=false`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar vacunas');
            }

            let vaccinesData: Vaccine[] = [];
            if (data.data) {
                vaccinesData = Array.isArray(data.data) ? data.data : [];
            } else if (Array.isArray(data)) {
                vaccinesData = data;
            }
            
            setVaccines(vaccinesData);
            if (onUpdateCount) {
                onUpdateCount(vaccinesData.length);
            }
        } catch (err) {
            console.error('Error al cargar vacunas:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar vacunas');
            setVaccines([]);
            if (onUpdateCount) {
                onUpdateCount(0);
            }
        } finally {
            setLoading(false);
        }
    }, [petId, onUpdateCount]);

    React.useEffect(() => {
        loadVaccines();
    }, [loadVaccines]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingVaccine(null);
        setFormData({
            name: '',
            pet_id: petId,
        });
        setCustomName('');
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (vaccine: Vaccine) => {
        setEditingVaccine(vaccine);
        const name = vaccine.name || '';
        const isCustomName = name && !vaccineOptions.includes(name);
        setFormData({
            name: isCustomName ? 'otro' : name,
            pet_id: vaccine.pet_id,
        });
        setCustomName(isCustomName ? name : '');
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingVaccine(null);
        setFormData({
            name: '',
            pet_id: petId,
        });
        setCustomName('');
        setFormErrors({});
    };

    // Guardar vacuna (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingVaccine 
                ? `/api/vaccines/${editingVaccine.id}` 
                : '/api/vaccines';
            const method = editingVaccine ? 'PUT' : 'POST';

            const dataToSend = {
                name: formData.name === 'otro' ? customName : formData.name,
                pet_id: formData.pet_id,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar vacuna' });
                }
                return;
            }

            handleCloseModal();
            loadVaccines();
            enqueueSnackbar(
                editingVaccine ? 'Vacuna actualizada correctamente' : 'Vacuna creada correctamente',
                { variant: 'success' }
            );
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar vacuna' });
            enqueueSnackbar(
                editingVaccine ? 'Error al actualizar vacuna' : 'Error al crear vacuna',
                { variant: 'error' }
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar vacuna
    const handleDelete = async (vaccineId: number) => {
        const { confirmed } = await confirm({
            title: "Eliminar Vacuna",
            description: "¿Estás seguro de que deseas eliminar esta vacuna?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/vaccines/${vaccineId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al eliminar vacuna', { variant: 'error' });
                return;
            }

            loadVaccines();
            enqueueSnackbar('Vacuna eliminada correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar vacuna', { variant: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Vacunas ({vaccines.length})
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Vacuna
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            ) : vaccines.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Esta mascota no tiene vacunas registradas.
                </Alert>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell align="right"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vaccines.map((vaccine) => (
                                <TableRow key={vaccine.id}>
                                    <TableCell>
                                        {vaccine.date 
                                            ? new Date(vaccine.date).toLocaleDateString()
                                            : vaccine.created_at
                                            ? new Date(vaccine.created_at).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell>{vaccine.name || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(vaccine)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(vaccine.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal para crear/editar */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                    {editingVaccine ? 'Editar Vacuna' : 'Nueva Vacuna'}
                </DialogTitle>
                <DialogContent dividers>
                    {formErrors.general && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formErrors.general}
                        </Alert>
                    )}
                    <FormControl fullWidth size="small" error={!!formErrors.name} sx={{ mb: 2 }}>
                        <InputLabel>Nombre</InputLabel>
                        <Select
                            value={formData.name}
                            label="Nombre"
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (e.target.value !== 'otro') {
                                    setCustomName('');
                                }
                            }}
                            autoFocus
                        >
                            {vaccineOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.name && <FormHelperText>{formErrors.name}</FormHelperText>}
                    </FormControl>
                    {formData.name === 'otro' && (
                        <TextField
                            label="Especifique el nombre"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            error={!!formErrors.name}
                            helperText={formErrors.name || 'Ingrese el nombre de la vacuna...'}
                            placeholder="Ingrese el nombre de la vacuna..."
                            sx={{ mb: 2 }}
                        />
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
        </Box>
    );
}

