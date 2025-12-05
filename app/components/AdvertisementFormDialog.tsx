'use client';
import * as React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    Box,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';

interface Pet {
    id: number;
    name: string;
    race?: {
        name: string;
    };
    client?: {
        name: string;
        last_name: string;
    };
}

interface Advertisement {
    id?: number;
    id_pets: number;
    description: string;
    date: string;
    pet?: Pet;
}

interface AdvertisementFormDialogProps {
    open: boolean;
    onClose: () => void;
    advertisement?: Advertisement | null;
    onSave?: () => void;
}

export default function AdvertisementFormDialog({ 
    open, 
    onClose, 
    advertisement,
    onSave 
}: AdvertisementFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    const [pets, setPets] = React.useState<Pet[]>([]);
    const [loadingPets, setLoadingPets] = React.useState(false);
    const [formData, setFormData] = React.useState({
        id_pets: '',
        description: '',
        date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar mascotas de la veterinaria activa
    const loadPets = React.useCallback(async () => {
        if (!selectedVeterinary?.id) return;
        
        try {
            setLoadingPets(true);
            let url = `/api/pets?paginate=false&per_page=1000`;
            url += `&veterinary_id=${selectedVeterinary.id}`;
            
            const response = await fetch(url);
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar mascotas');
            }

            if (data.data) {
                setPets(data.data);
            } else if (Array.isArray(data)) {
                setPets(data);
            } else {
                setPets([]);
            }
        } catch (err) {
            console.error('Error al cargar mascotas:', err);
            setPets([]);
        } finally {
            setLoadingPets(false);
        }
    }, [selectedVeterinary?.id]);

    // Inicializar cuando se abre el modal
    React.useEffect(() => {
        if (open) {
            if (advertisement) {
                setFormData({
                    id_pets: advertisement.id_pets?.toString() || '',
                    description: advertisement.description || '',
                    date: advertisement.date || new Date().toISOString().split('T')[0],
                });
            } else {
                setFormData({
                    id_pets: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                });
            }
            setFormErrors({});
            loadPets();
        }
    }, [open, advertisement, loadPets]);

    // Manejar cambios en los campos
    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
        const value = e.target.value as string;
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Guardar anuncio
    const handleSave = async () => {
        setFormErrors({});
        
        // Validaciones
        if (!formData.id_pets) {
            setFormErrors({ id_pets: 'Debe seleccionar una mascota' });
            return;
        }
        
        if (!formData.description.trim()) {
            setFormErrors({ description: 'La descripción es requerida' });
            return;
        }
        
        if (!formData.date) {
            setFormErrors({ date: 'La fecha es requerida' });
            return;
        }

        setSubmitting(true);

        try {
            const dataToSend = {
                id_pets: parseInt(formData.id_pets),
                description: formData.description.trim(),
                date: formData.date,
            };

            const url = advertisement 
                ? `/api/advertisements/${advertisement.id}`
                : '/api/advertisements';
            
            const method = advertisement ? 'PUT' : 'POST';

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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar anuncio' });
                }
                return;
            }

            onClose();
            if (onSave) {
                onSave();
            }
            enqueueSnackbar(
                advertisement ? 'Anuncio actualizado correctamente' : 'Anuncio creado correctamente', 
                { variant: 'success' }
            );
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar anuncio' });
            enqueueSnackbar('Error al guardar anuncio', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setFormErrors({});
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                {advertisement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </DialogTitle>
            <DialogContent dividers sx={{ mt: 2 }}>
                {formErrors.general && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formErrors.general}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Select de mascotas */}
                    <FormControl fullWidth size="small" error={!!formErrors.id_pets}>
                        <InputLabel id="pet-select-label">Mascota</InputLabel>
                        <Select
                            labelId="pet-select-label"
                            id="pet-select"
                            value={formData.id_pets}
                            onChange={(e) => setFormData({ ...formData, id_pets: e.target.value })}
                            label="Mascota"
                            disabled={loadingPets || submitting}
                        >
                            {pets.map((pet) => (
                                <MenuItem key={pet.id} value={pet.id.toString()}>
                                    {pet.name} {pet.race ? `- ${pet.race.name}` : ''} 
                                    {pet.client ? ` (${pet.client.name} ${pet.client.last_name || ''})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.id_pets && (
                            <FormHelperText>{formErrors.id_pets}</FormHelperText>
                        )}
                    </FormControl>

                    {/* Campo de descripción */}
                    <TextField
                        fullWidth
                        label="Descripción"
                        multiline
                        rows={4}
                        size="small"
                        value={formData.description}
                        onChange={handleChange('description')}
                        error={!!formErrors.description}
                        helperText={formErrors.description}
                        disabled={submitting}
                        required
                    />

                    {/* Campo de fecha */}
                    <TextField
                        fullWidth
                        label="Fecha"
                        type="date"
                        size="small"
                        value={formData.date}
                        onChange={handleChange('date')}
                        error={!!formErrors.date}
                        helperText={formErrors.date}
                        disabled={submitting}
                        required
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting} color="error">
                    Cancelar
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : (advertisement ? 'Actualizar' : 'Guardar')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

