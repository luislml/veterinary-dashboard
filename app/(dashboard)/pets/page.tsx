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
    Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PetsIcon from '@mui/icons-material/Pets';
import { PageContainer } from '@toolpad/core/PageContainer';
import { styled } from '@mui/material/styles';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../../lib/config';

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
    age: string | number;
    image?: string;
    race?: {
        id: number;
        name: string;
        type_pet_id?: number;
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

// Opciones de género
const GENDER_OPTIONS = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Hembra' },
];

function PetsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es veterinary
    const isVeterinary = session?.hasRole?.('veterinary') || false;
    
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [pets, setPets] = React.useState<Pet[]>([]);
    const [races, setRaces] = React.useState<Race[]>([]);
    const [typePets, setTypePets] = React.useState<TypePet[]>([]);
    const [clients, setClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [loadingRaces, setLoadingRaces] = React.useState(false);
    const [loadingTypePets, setLoadingTypePets] = React.useState(false);
    const [loadingClients, setLoadingClients] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingPet, setEditingPet] = React.useState<Pet | null>(null);
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
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

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

    // Cargar todas las razas (para edición, sin modificar el estado)
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

    // Cargar mascotas
    const loadPets = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si el rol es veterinary
            let url = `/api/pets?page=${page}&per_page=10`;
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
    }, [page, isVeterinary, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadPets();
        loadTypePets();
        loadClients();
    }, [loadPets, loadTypePets, loadClients]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (isVeterinary && selectedVeterinary?.id) {
            setPage(1);
        }
    }, [isVeterinary, selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingPet(null);
        setFormData({ name: '', type_pet_id: '', race_id: '', client_id: '', color: '', gender: '', age: '' });
        setFormErrors({});
        setRaces([]);
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = async (pet: Pet) => {
        setEditingPet(pet);
        setFormErrors({});
        setOpenModal(true);
        
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
        
        // Establecer la imagen actual si existe (usar datos actualizados)
        console.log(petData);
        if (petData.image) {
            console.log(petData.image);
            // Si la imagen es una URL completa, usarla directamente
            // Si es solo el nombre del archivo, construir la URL completa
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
                // Si no se encuentra el type_pet_id, dejar vacío y el usuario deberá seleccionar
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
                age: petData.age?.toString() || '' 
            });
            setRaces([]);
        }
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingPet(null);
        setFormData({ name: '', type_pet_id: '', race_id: '', client_id: '', color: '', gender: '', age: '' });
        setFormErrors({});
        setRaces([]);
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
    };

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
        const fileInput = document.getElementById('image-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Guardar mascota (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingPet ? `/api/pets/${editingPet.id}` : '/api/pets';
            const method = editingPet ? 'PUT' : 'POST';

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
                if (editingPet) {
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

                handleCloseModal();
                loadPets();
                enqueueSnackbar(editingPet ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente', { variant: 'success' });
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
                if (editingPet) {
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

                handleCloseModal();
                loadPets();
                enqueueSnackbar(editingPet ? 'Mascota actualizada correctamente' : 'Mascota creada correctamente', { variant: 'success' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar mascota' });
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
                                id="image-input"
                                type="file"
                                onChange={handleImageChange}
                            />
                            <label htmlFor="image-input">
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

