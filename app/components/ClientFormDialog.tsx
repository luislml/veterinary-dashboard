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
    Chip,
    OutlinedInput,
    Box,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';

export interface Client {
    id: number;
    name: string;
    last_name: string;
    ci: string;
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
}

interface Veterinary {
    id: number;
    name: string;
}

interface ClientFormDialogProps {
    open: boolean;
    onClose: () => void;
    client?: Client | null;
    onSave?: () => void;
}

export default function ClientFormDialog({ open, onClose, client, onSave }: ClientFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es admin
    const isAdmin = session?.hasRole?.('admin') || false;
    
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        last_name: '', 
        ci: '', 
        phone: '', 
        address: '', 
        veterinary_id: [] as number[]
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar veterinarias (solo para admin)
    const loadVeterinaries = React.useCallback(async () => {
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

    // Inicializar formulario cuando se abre el modal o cambia el cliente
    React.useEffect(() => {
        if (open) {
            if (client) {
                // Editar cliente existente
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
                    ci: client.ci || '', 
                    phone: client.phone || '', 
                    address: client.address || '', 
                    veterinary_id: veterinaryIds
                });
            } else {
                // Crear nuevo cliente
                const defaultVeterinaryId = !isAdmin && selectedVeterinary?.id 
                    ? [selectedVeterinary.id] 
                    : [];
                setFormData({ 
                    name: '', 
                    last_name: '', 
                    ci: '', 
                    phone: '', 
                    address: '', 
                    veterinary_id: defaultVeterinaryId 
                });
            }
            setFormErrors({});
            
            // Cargar veterinarias si es admin
            if (isAdmin) {
                loadVeterinaries();
            }
        }
    }, [open, client, isAdmin, selectedVeterinary?.id, loadVeterinaries]);

    // Guardar cliente (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = client ? `/api/clients/${client.id}` : '/api/clients';
            const method = client ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId.length === 0) && selectedVeterinary?.id) {
                veterinaryId = [selectedVeterinary.id];
            }

            const dataToSend = {
                name: formData.name,
                last_name: formData.last_name,
                ci: formData.ci,
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

            onClose();
            if (onSave) {
                onSave();
            }
            // Show success snackbar
            enqueueSnackbar(client ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar cliente' });
            // Show error snackbar
            enqueueSnackbar(client ? 'Error al actualizar cliente' : 'Error al crear cliente', { variant: 'error' });
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
                {client ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    label="CI"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    error={!!formErrors.ci}
                    helperText={formErrors.ci}
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
                <Button onClick={handleClose} disabled={submitting} color="error">
                    Cancelar
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={submitting}>
                    {submitting ? <CircularProgress size={20} /> : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

