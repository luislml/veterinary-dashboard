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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";

interface Consultation {
    id: number;
    reason?: string;
    description: string;
    pet_id: number;
    date?: string;
    created_at?: string;
    updated_at?: string;
}

interface ConsultationListProps {
    petId: number;
    onUpdateCount?: (count: number) => void;
}

export default function ConsultationList({ petId, onUpdateCount }: ConsultationListProps) {
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm();

    const [consultations, setConsultations] = React.useState<Consultation[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingConsultation, setEditingConsultation] = React.useState<Consultation | null>(null);
    const [formData, setFormData] = React.useState({
        reason: '',
        description: '',
        pet_id: petId,
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar consultas
    const loadConsultations = React.useCallback(async () => {
        if (!petId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/consultations?pet_id=${petId}&paginate=false`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar consultas');
            }

            let consultationsData: Consultation[] = [];
            if (data.data) {
                consultationsData = Array.isArray(data.data) ? data.data : [];
            } else if (Array.isArray(data)) {
                consultationsData = data;
            }
            
            setConsultations(consultationsData);
            if (onUpdateCount) {
                onUpdateCount(consultationsData.length);
            }
        } catch (err) {
            console.error('Error al cargar consultas:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar consultas');
            setConsultations([]);
            if (onUpdateCount) {
                onUpdateCount(0);
            }
        } finally {
            setLoading(false);
        }
    }, [petId, onUpdateCount]);

    React.useEffect(() => {
        loadConsultations();
    }, [loadConsultations]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingConsultation(null);
        setFormData({
            reason: '',
            description: '',
            pet_id: petId,
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (consultation: Consultation) => {
        setEditingConsultation(consultation);
        setFormData({
            reason: consultation.reason || '',
            description: consultation.description || '',
            pet_id: consultation.pet_id,
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingConsultation(null);
        setFormData({
            reason: '',
            description: '',
            pet_id: petId,
        });
        setFormErrors({});
    };

    // Guardar consulta (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingConsultation 
                ? `/api/consultations/${editingConsultation.id}` 
                : '/api/consultations';
            const method = editingConsultation ? 'PUT' : 'POST';

            const dataToSend = {
                reason: formData.reason,
                description: formData.description,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar consulta' });
                }
                return;
            }

            handleCloseModal();
            loadConsultations();
            enqueueSnackbar(
                editingConsultation ? 'Consulta actualizada correctamente' : 'Consulta creada correctamente',
                { variant: 'success' }
            );
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar consulta' });
            enqueueSnackbar(
                editingConsultation ? 'Error al actualizar consulta' : 'Error al crear consulta',
                { variant: 'error' }
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar consulta
    const handleDelete = async (consultationId: number) => {
        const { confirmed } = await confirm({
            title: "Eliminar Consulta",
            description: "¿Estás seguro de que deseas eliminar esta consulta?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/consultations/${consultationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al eliminar consulta', { variant: 'error' });
                return;
            }

            loadConsultations();
            enqueueSnackbar('Consulta eliminada correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar consulta', { variant: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Consultas ({consultations.length})
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nueva Consulta
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
            ) : consultations.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Esta mascota no tiene consultas registradas.
                </Alert>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Motivo</strong></TableCell>
                                <TableCell><strong>Descripción</strong></TableCell>
                                <TableCell align="right"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {consultations.map((consultation) => (
                                <TableRow key={consultation.id}>
                                    <TableCell>
                                        {consultation.date 
                                            ? new Date(consultation.date).toLocaleDateString()
                                            : consultation.created_at
                                            ? new Date(consultation.created_at).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell>{consultation.reason || '-'}</TableCell>
                                    <TableCell>{consultation.description || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(consultation)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(consultation.id)}
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
                    {editingConsultation ? 'Editar Consulta' : 'Nueva Consulta'}
                </DialogTitle>
                <DialogContent dividers>
                    {formErrors.general && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formErrors.general}
                        </Alert>
                    )}
                    <TextField
                        label="Motivo"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        error={!!formErrors.reason}
                        helperText={formErrors.reason}
                        placeholder="Ingrese el motivo de la consulta..."
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Descripción"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={4}
                        size="small"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        error={!!formErrors.description}
                        helperText={formErrors.description}
                        placeholder="Ingrese la descripción de la consulta..."
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
        </Box>
    );
}

