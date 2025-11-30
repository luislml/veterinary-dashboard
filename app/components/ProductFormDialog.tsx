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
    Avatar,
    IconButton,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../lib/config';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    code: string;
    image?: string;
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

interface ProductFormDialogProps {
    open: boolean;
    onClose: () => void;
    product?: Product | null;
    onSave?: () => void;
}

export default function ProductFormDialog({ open, onClose, product, onSave }: ProductFormDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es admin
    const isAdmin = session?.hasRole?.('admin') || false;
    
    const [veterinaries, setVeterinaries] = React.useState<Veterinary[]>([]);
    const [loadingVeterinaries, setLoadingVeterinaries] = React.useState(false);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        price: '', 
        stock: '', 
        code: '', 
        veterinary_id: [] as number[]
    });
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
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
        const fileInput = document.getElementById('product-image-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Inicializar formulario cuando se abre el modal o cambia el producto
    React.useEffect(() => {
        if (open) {
            if (product) {
                // Editar producto existente
                const initializeEdit = async () => {
                    let veterinaryIds: number[] = [];
                    if (Array.isArray(product.veterinary_id)) {
                        veterinaryIds = product.veterinary_id;
                    } else if (product.veterinaries && product.veterinaries.length > 0) {
                        veterinaryIds = product.veterinaries.map(v => v.id);
                    } else if (product.veterinary_id) {
                        veterinaryIds = [product.veterinary_id];
                    }
                    
                    // Si es veterinary y no hay veterinarias asignadas, usar la veterinaria activa
                    if (!isAdmin && veterinaryIds.length === 0 && selectedVeterinary?.id) {
                        veterinaryIds = [selectedVeterinary.id];
                    }
                    
                    // Intentar obtener la información completa del producto desde la API
                    let productData = product;
                    try {
                        const response = await fetch(`/api/products/${product.id}`);
                        if (response.ok) {
                            const data = await response.json();
                            productData = data.data || data;
                        }
                    } catch (err) {
                        console.error('Error al cargar datos completos del producto:', err);
                    }
                    
                    // Establecer la imagen actual si existe
                    if (productData.image) {
                        const baseUrl = API_CONFIG.baseURL.replace('/api', '');
                        const imageUrl = productData.image.startsWith('http') 
                            ? productData.image 
                            : `${baseUrl}/storage/${productData.image}`;
                        setImageUrl(imageUrl);
                        setImagePreview(null);
                    } else {
                        setImageUrl(null);
                        setImagePreview(null);
                    }
                    setImageFile(null);
                    
                    setFormData({ 
                        name: productData.name || '', 
                        price: productData.price?.toString() || '', 
                        stock: productData.stock?.toString() || '', 
                        code: productData.code || '', 
                        veterinary_id: veterinaryIds
                    });
                };
                
                initializeEdit();
            } else {
                // Crear nuevo producto - usar veterinaria activa por defecto
                const defaultVeterinaryId = selectedVeterinary?.id 
                    ? [selectedVeterinary.id] 
                    : [];
                setFormData({ 
                    name: '', 
                    price: '', 
                    stock: '', 
                    code: '', 
                    veterinary_id: defaultVeterinaryId
                });
                setImageFile(null);
                setImagePreview(null);
                setImageUrl(null);
            }
            setFormErrors({});
            
            // Cargar veterinarias si es admin
            if (isAdmin) {
                loadVeterinaries();
            }
        }
    }, [open, product, isAdmin, selectedVeterinary?.id, loadVeterinaries]);

    // Guardar producto (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = product ? `/api/products/${product.id}` : '/api/products';
            const method = product ? 'PUT' : 'POST';

            // Si es veterinary y no hay veterinary_id, usar la veterinaria activa
            let veterinaryId = formData.veterinary_id;
            if (!isAdmin && (!veterinaryId || veterinaryId.length === 0) && selectedVeterinary?.id) {
                veterinaryId = [selectedVeterinary.id];
            }

            // Si hay imagen, usar FormData, sino JSON
            if (imageFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('name', formData.name);
                formDataToSend.append('price', formData.price.toString());
                formDataToSend.append('stock', formData.stock.toString());
                formDataToSend.append('code', formData.code);
                // Agregar cada veterinary_id como array
                veterinaryId.forEach((id) => {
                    formDataToSend.append('veterinary_ids[]', id.toString());
                });
                formDataToSend.append('image', imageFile);
                // Agregar _method PATCH para updates
                if (product) {
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
                        setFormErrors({ general: data.message || data.error || 'Error al guardar producto' });
                    }
                    return;
                }

                onClose();
                if (onSave) {
                    onSave();
                }
                enqueueSnackbar(product ? 'Producto actualizado correctamente' : 'Producto creado correctamente', { variant: 'success' });
            } else {
                const dataToSend: any = {
                    name: formData.name,
                    price: parseFloat(formData.price.toString()),
                    stock: parseInt(formData.stock.toString()),
                    code: formData.code,
                    veterinary_ids: veterinaryId,
                };
                // Agregar _method PATCH para updates
                if (product) {
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
                        setFormErrors({ general: data.message || data.error || 'Error al guardar producto' });
                    }
                    return;
                }

                onClose();
                if (onSave) {
                    onSave();
                }
                enqueueSnackbar(product ? 'Producto actualizado correctamente' : 'Producto creado correctamente', { variant: 'success' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar producto' });
            enqueueSnackbar(product ? 'Error al actualizar producto' : 'Error al crear producto', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setFormErrors({});
            setImageFile(null);
            setImagePreview(null);
            // No limpiar imageUrl aquí para mantener la imagen actual si se cancela
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                {product ? 'Editar Producto' : 'Nuevo Producto'}
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
                            {!imagePreview && !imageUrl && <ShoppingCartIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
                        </Avatar>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="product-image-input"
                            type="file"
                            onChange={handleImageChange}
                        />
                        <label htmlFor="product-image-input">
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
                        <FormHelperText error sx={{ ml: 2 }}>{formErrors.image}</FormHelperText>
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
                <TextField
                    label="Código"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    error={!!formErrors.code}
                    helperText={formErrors.code}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Precio"
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="number"
                    inputProps={{ step: '0.01', min: '0' }}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    error={!!formErrors.price}
                    helperText={formErrors.price}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Stock"
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="number"
                    inputProps={{ min: '0' }}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    error={!!formErrors.stock}
                    helperText={formErrors.stock}
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

