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
    Avatar,
    IconButton,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../lib/config';
import PetsIcon from '@mui/icons-material/Pets';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Pet {
    id: number;
    name: string;
    race_id: number;
    client_id: number;
    color: string;
    gender: string;
    age: string | number;
    image?: string;
    race?: {
        id: number;
        name: string;
        type_pet_id?: number;
    };
    created_at?: string;
    updated_at?: string;
}

interface Race {
    id: number;
    name: string;
    type_pet_id?: number;
}

interface TypePet {
    id: number;
    name: string;
}

interface Client {
    id: number;
    name: string;
    last_name: string;
}

interface PetFormDialogProps {
    open: boolean;
    onClose: () => void;
    pet?: Pet | null;
    defaultClientId?: number | string;
    onSave?: () => void;
}

const GENDER_OPTIONS = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Hembra' },
];

export default function PetFormDialog({ open, onClose, pet, defaultClientId, onSave }: PetFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es veterinary
    const isVeterinary = session?.hasRole?.('veterinary') || false;
    
    const [typePets, setTypePets] = React.useState<TypePet[]>([]);
    const [races, setRaces] = React.useState<Race[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loadingTypePets, setLoadingTypePets] = React.useState(false);
    const [loadingRaces, setLoadingRaces] = React.useState(false);
    const [loadingClients, setLoadingClients] = React.useState(false);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        type_pet_id: '',
        race_id: '', 
        client_id: '', 
        color: '', 
        gender: '', 
        age: '' 
    });
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar tipos de mascotas
    const loadTypePets = React.useCallback(async () => {
        try {
            setLoadingTypePets(true);
            const response = await fetch(`/api/type-pets?paginate=false`);
            
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

    // Cargar todas las razas (para edición)
    const loadAllRaces = React.useCallback(async () => {
        try {
            const response = await fetch(`/api/races?paginate=false`);
            
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
                return data.data;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (err) {
            console.error('Error al cargar razas:', err);
            return [];
        }
    }, []);

    // Cargar razas según el tipo de mascota seleccionado
    const loadRaces = React.useCallback(async (typePetId?: string) => {
        if (!typePetId) {
            setRaces([]);
            return;
        }

        try {
            setLoadingRaces(true);
            const response = await fetch(`/api/races?paginate=false&type_pet_id=${typePetId}`);
            
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
            
            // Construir URL con filtro de veterinary_id si el rol es veterinary
            let url = `/api/clients?paginate=false`;
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
    }, [isVeterinary, selectedVeterinary?.id]);

    // Inicializar formulario cuando se abre el modal o cambia el pet
    React.useEffect(() => {
        if (open) {
            // Cargar datos necesarios
            loadTypePets();
            loadClients();

            if (pet) {
                // Editar mascota existente
                const initializeEdit = async () => {
                    setFormErrors({});
                    
                    // Intentar obtener la información completa de la mascota desde la API
                    let petData = pet;
                    try {
                        const response = await fetch(`/api/pets/${pet.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            petData = data.data || data;
                        }
                    } catch (err) {
                        console.error('Error al cargar datos completos de la mascota:', err);
                    }
                    
                    // Establecer la imagen actual si existe
                    if (petData.image) {
                        const baseUrl = API_CONFIG.baseURL.replace('/api', '');
                        const imageUrl = petData.image.startsWith('http') 
                            ? petData.image 
                            : `${baseUrl}/storage/${petData.image}`;
                        setImageUrl(imageUrl);
                        setImagePreview(null);
                    } else {
                        setImageUrl(null);
                        setImagePreview(null);
                    }
                    setImageFile(null);
                    
                    // Cargar todas las razas para encontrar el type_pet_id de la raza actual
                    try {
                        const allRaces = await loadAllRaces();
                        const currentRace = allRaces.find((r: any) => r.id === petData.race_id);
                        const typePetId = currentRace?.type_pet_id?.toString() || 
                                         petData.race?.type_pet_id?.toString() || 
                                         '';
                        
                        if (typePetId) {
                            // Cargar las razas filtradas por el tipo de mascota
                            await loadRaces(typePetId);
                            // Establecer el formData después de cargar las razas
                            setFormData({ 
                                name: petData.name || '', 
                                type_pet_id: typePetId,
                                race_id: petData.race_id?.toString() || '', 
                                client_id: petData.client_id?.toString() || '', 
                                color: petData.color || '', 
                                gender: petData.gender || '', 
                                age: String(petData.age || '') 
                            });
                        } else {
                            setFormData({ 
                                name: petData.name || '', 
                                type_pet_id: '',
                                race_id: petData.race_id?.toString() || '', 
                                client_id: petData.client_id?.toString() || '', 
                                color: petData.color || '', 
                                gender: petData.gender || '', 
                                age: String(petData.age || '') 
                            });
                            setRaces([]);
                        }
                    } catch (err) {
                        console.error('Error al cargar raza:', err);
                        setFormData({ 
                            name: petData.name || '', 
                            type_pet_id: '',
                            race_id: petData.race_id?.toString() || '', 
                            client_id: petData.client_id?.toString() || '', 
                            color: petData.color || '', 
                            gender: petData.gender || '', 
                            age: String(petData.age || '') 
                        });
                        setRaces([]);
                    }
                };
                
                initializeEdit();
            } else {
                // Crear nueva mascota
                const defaultClientIdValue = defaultClientId ? defaultClientId.toString() : '';
                setFormData({ 
                    name: '', 
                    type_pet_id: '', 
                    race_id: '', 
                    client_id: defaultClientIdValue, 
                    color: '', 
                    gender: '', 
                    age: '' 
                });
                setFormErrors({});
                setRaces([]);
                setImageFile(null);
                setImagePreview(null);
                setImageUrl(null);
            }
        }
    }, [open, pet, defaultClientId, loadTypePets, loadClients, loadAllRaces, loadRaces]);

    // Manejar cambio de tipo de mascota
    const handleTypePetChange = async (typePetId: string) => {
        setFormData({ ...formData, type_pet_id: typePetId, race_id: '' });
        await loadRaces(typePetId);
    };

    // Manejar selección de imagen
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                enqueueSnackbar('Por favor seleccione un archivo de imagen', { variant: 'error' });
                return;
            }
            
            // Validar tamaño (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                enqueueSnackbar('La imagen no debe exceder 5MB', { variant: 'error' });
                return;
            }

            setImageFile(file);
            setImageUrl(null); // Limpiar URL anterior si existe
            
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Eliminar imagen
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
        // Resetear el input file
        const fileInput = document.getElementById('pet-image-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Guardar mascota (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = pet ? `/api/pets/${pet.id}` : '/api/pets';
            const method = pet ? 'PUT' : 'POST';

            // Si hay imagen, usar FormData, sino JSON
            if (imageFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('race_id', formData.race_id);
                formDataToSend.append('client_id', formData.client_id);
                formDataToSend.append('color', formData.color);
                formDataToSend.append('gender', formData.gender);
                formDataToSend.append('age', formData.age);
                formDataToSend.append('image', imageFile);
                // Agregar _method PATCH para updates
                if (pet) {
                    formDataToSend.append('_method', 'PATCH');
                }

                const response = await fetch(url, {
                    method,
                    body: formDataToSend,
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

                onClose();
                if (onSave) {
                    onSave();
                }
                enqueueSnackbar(pet ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente', { variant: 'success' });
            } else {
                const dataToSend: any = {
                    name: formData.name,
                    race_id: parseInt(formData.race_id),
                    client_id: parseInt(formData.client_id),
                    color: formData.color,
                    gender: formData.gender,
                    age: formData.age,
                };
                // Agregar _method PATCH para updates
                if (pet) {
                    dataToSend._method = 'PATCH';
                }

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

                onClose();
                if (onSave) {
                    onSave();
                }
                enqueueSnackbar(pet ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente', { variant: 'success' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar mascota' });
            enqueueSnackbar(pet ? 'Error al actualizar mascota' : 'Error al crear mascota', { variant: 'error' });
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
                {pet ? 'Editar Mascota' : 'Nueva Mascota'}
            </DialogTitle>
            <DialogContent dividers>
                {formErrors.general && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formErrors.general}
                    </Alert>
                )}
                {/* Campo de imagen */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                            src={imagePreview || imageUrl || undefined}
                            sx={{
                                width: 120,
                                height: 120,
                                bgcolor: 'grey.200',
                                boxShadow: 2,
                            }}
                        >
                            {!imagePreview && !imageUrl && <PetsIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
                        </Avatar>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="pet-image-input"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="pet-image-input">
                            <IconButton
                                component="span"
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'primary.dark',
                                    },
                                    width: 36,
                                    height: 36,
                                }}
                            >
                                <CameraAltIcon fontSize="small" />
                            </IconButton>
                        </label>
                        {(imagePreview || imageUrl) && (
                            <IconButton
                                onClick={handleRemoveImage}
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    bgcolor: 'error.main',
                                    color: 'white',
                                    '&:hover': {
                                        bgcolor: 'error.dark',
                                    },
                                    width: 28,
                                    height: 28,
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    {formErrors.image && (
                        <FormHelperText error>{formErrors.image}</FormHelperText>
                    )}
                </Box>
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
                        onChange={(e) => handleTypePetChange(e.target.value)}
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
                <FormControl fullWidth size="small" error={!!formErrors.race_id} sx={{ mb: 2 }}>
                    <InputLabel>Raza</InputLabel>
                    <Select
                        value={formData.race_id}
                        label="Raza"
                        onChange={(e) => setFormData({ ...formData, race_id: e.target.value })}
                        disabled={loadingRaces || !formData.type_pet_id}
                    >
                        {races.map((race) => (
                            <MenuItem key={race.id} value={race.id.toString()}>
                                {race.name}
                            </MenuItem>
                        ))}
                    </Select>
                    {formErrors.race_id && <FormHelperText>{formErrors.race_id}</FormHelperText>}
                    {loadingRaces && <FormHelperText>Cargando razas...</FormHelperText>}
                    {!formData.type_pet_id && !loadingRaces && <FormHelperText>Seleccione primero un tipo de mascota</FormHelperText>}
                </FormControl>
                <FormControl fullWidth size="small" error={!!formErrors.client_id} sx={{ mb: 2 }}>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                        value={formData.client_id}
                        label="Cliente"
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        disabled={loadingClients || !!defaultClientId}
                    >
                        {clients.map((client) => (
                            <MenuItem key={client.id} value={client.id.toString()}>
                                {client.name} {client.last_name || ''}
                            </MenuItem>
                        ))}
                    </Select>
                    {formErrors.client_id && <FormHelperText>{formErrors.client_id}</FormHelperText>}
                    {loadingClients && <FormHelperText>Cargando clientes...</FormHelperText>}
                    {defaultClientId && <FormHelperText>Cliente pre-seleccionado</FormHelperText>}
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
                    type="text"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    error={!!formErrors.age}
                    helperText={formErrors.age || 'Ejemplo: 2 años, 3 meses'}
                    placeholder="Ejemplo: 2 años, 3 meses"
                    sx={{ mb: 2 }}
                />
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

