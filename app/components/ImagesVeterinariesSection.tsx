'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Input,
    Avatar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useSnackbar } from 'notistack';
import { API_CONFIG } from '../../lib/config';

export interface ImageVeterinary {
    id: number;
    veterinary_id: number;
    type: 'team' | 'logo' | 'testimonial';
    file?: {
        url: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface ImagesVeterinariesSectionProps {
    veterinaryId: number;
}

export default function ImagesVeterinariesSection({ veterinaryId }: ImagesVeterinariesSectionProps) {
    const { enqueueSnackbar } = useSnackbar();

    const [images, setImages] = React.useState<ImageVeterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingImage, setEditingImage] = React.useState<ImageVeterinary | null>(null);
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar imágenes
    const loadImages = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/images-veterinaries?veterinary_id=${veterinaryId}`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar imágenes');
            }

            if (data.data) {
                setImages(data.data);
            } else if (Array.isArray(data)) {
                setImages(data);
            } else {
                setImages([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar imágenes');
            setImages([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadImages();
        }
    }, [loadImages, veterinaryId]);

    // Abrir modal para editar
    const handleEdit = (image: ImageVeterinary) => {
        setEditingImage(image);
        setImageFile(null);
        setImagePreview(null);
        if (image.file?.url) {
            setImageUrl(`${API_CONFIG.baseURL.replace('/api', '')}/${image.file.url}`);
        } else {
            setImageUrl(null);
        }
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingImage(null);
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
        setFormErrors({});
    };

    // Manejar selección de imagen
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(null); // Limpiar URL anterior si hay archivo nuevo
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Eliminar imagen seleccionada
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        const fileInput = document.getElementById('image-veterinary-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Actualizar imagen
    const handleUpdate = async () => {
        if (!editingImage) return;

        setFormErrors({});
        setSubmitting(true);

        try {
            const url = `/api/images-veterinaries/${editingImage.id}`;

            // Si hay imagen nueva, usar FormData, sino mostrar error
            if (imageFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('image', imageFile);
                formDataToSend.append('veterinary_id', veterinaryId.toString());
                formDataToSend.append('type', editingImage.type);
                formDataToSend.append('_method', 'PATCH');

                const response = await fetch(url, {
                    method: 'PUT',
                    body: formDataToSend,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.errors) {
                        setFormErrors(data.errors);
                    } else {
                        setFormErrors({ general: data.message || data.error || 'Error al actualizar imagen' });
                    }
                    enqueueSnackbar('Error al actualizar imagen', { variant: 'error' });
                    return;
                }

                handleCloseModal();
                loadImages();
                enqueueSnackbar('Imagen actualizada correctamente', { variant: 'success' });
            } else {
                setFormErrors({ general: 'Debe seleccionar una imagen para actualizar' });
                enqueueSnackbar('Debe seleccionar una imagen', { variant: 'warning' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al actualizar imagen' });
            enqueueSnackbar('Error al actualizar imagen', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Obtener etiqueta del tipo
    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            team: 'Equipo',
            logo: 'Logo',
            testimonial: 'Testimonio',
        };
        return labels[type] || type;
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6">Imágenes del Sitio</Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : images.length === 0 ? (
                    <Alert severity="info">No hay imágenes disponibles</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Imagen</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {images.map((image) => (
                                    <TableRow key={image.id}>
                                        <TableCell>
                                            {image.file?.url ? (
                                                <Avatar
                                                    src={`${API_CONFIG.baseURL.replace('/api', '')}/${image.file.url}`}
                                                    variant="rounded"
                                                    sx={{ width: 80, height: 80 }}
                                                />
                                            ) : (
                                                <Avatar variant="rounded" sx={{ width: 80, height: 80 }}>
                                                    No img
                                                </Avatar>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getTypeLabel(image.type)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(image)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Modal para editar */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                        Editar Imagen - {editingImage && getTypeLabel(editingImage.type)}
                    </DialogTitle>
                    <DialogContent dividers>
                        {formErrors.general && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formErrors.general}
                            </Alert>
                        )}

                        {/* Imagen */}
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Imagen
                            </Typography>
                            
                            {/* Vista previa */}
                            {(imagePreview || imageUrl) && (
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                        src={imagePreview || imageUrl || undefined}
                                        variant="rounded"
                                        sx={{ width: 150, height: 150 }}
                                    />
                                    {imagePreview && (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={handleRemoveImage}
                                        >
                                            Eliminar Nueva
                                        </Button>
                                    )}
                                </Box>
                            )}

                            {/* Input para subir imagen */}
                            <Input
                                id="image-veterinary-input"
                                type="file"
                                inputProps={{
                                    accept: 'image/*',
                                }}
                                onChange={handleImageChange}
                                sx={{ display: 'none' }}
                            />
                            <label htmlFor="image-veterinary-input">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    size="small"
                                    disabled={submitting}
                                >
                                    {imageFile ? 'Cambiar Imagen' : 'Seleccionar Nueva Imagen'}
                                </Button>
                            </label>
                            {formErrors.image && (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                    {formErrors.image}
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} disabled={submitting} color="error">
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} variant="contained" disabled={submitting || !imageFile}>
                            {submitting ? <CircularProgress size={20} /> : 'Actualizar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
}

