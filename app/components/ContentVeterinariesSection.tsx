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
    TextField,
    Alert,
    CircularProgress,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Input,
    Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useConfirm } from 'material-ui-confirm';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import { API_CONFIG } from '../../lib/config';

export interface ContentVeterinary {
    id: number;
    title: string;
    description: string;
    type: 'banner' | 'service' | 'specialty' | 'testimonial';
    file?: {
        url: string;
    };
    veterinary_id?: number;
    created_at?: string;
    updated_at?: string;
}

interface ContentVeterinariesSectionProps {
    veterinaryId: number;
}

export default function ContentVeterinariesSection({ veterinaryId }: ContentVeterinariesSectionProps) {
    const { enqueueSnackbar } = useSnackbar();
    const confirm = useConfirm();

    const [contents, setContents] = React.useState<ContentVeterinary[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingContent, setEditingContent] = React.useState<ContentVeterinary | null>(null);
    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        type: 'service' as 'banner' | 'service' | 'specialty' | 'testimonial',
    });
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);

    // Cargar contenidos
    const loadContents = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/content-veterinaries?veterinary_id=${veterinaryId}&per_page=100`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar contenidos');
            }

            if (data.data) {
                setContents(data.data);
            } else if (Array.isArray(data)) {
                setContents(data);
            } else {
                setContents([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar contenidos');
            setContents([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadContents();
        }
    }, [loadContents, veterinaryId]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingContent(null);
        setFormData({
            title: '',
            description: '',
            type: 'service',
        });
        setImageFile(null);
        setImagePreview(null);
        setImageUrl(null);
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (content: ContentVeterinary) => {
        setEditingContent(content);
        setFormData({
            title: content.title || '',
            description: content.description || '',
            type: content.type || 'service',
        });
        setImageFile(null);
        setImagePreview(null);
        if (content.file?.url) {
            setImageUrl(`${API_CONFIG.baseURL.replace('/api', '')}/${content.file.url}`);
        } else {
            setImageUrl(null);
        }
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingContent(null);
        setFormData({
            title: '',
            description: '',
            type: 'service',
        });
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
        const fileInput = document.getElementById('content-image-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Guardar contenido (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingContent ? `/api/content-veterinaries/${editingContent.id}` : '/api/content-veterinaries';
            const method = editingContent ? 'PUT' : 'POST';

            // Si hay imagen Y el tipo NO es testimonial, usar FormData, sino JSON
            if (imageFile && formData.type !== 'testimonial') {
                const formDataToSend = new FormData();
                formDataToSend.append('title', formData.title);
                formDataToSend.append('description', formData.description);
                formDataToSend.append('type', formData.type);
                formDataToSend.append('veterinary_id', veterinaryId.toString());
                formDataToSend.append('image', imageFile);
                if (editingContent) {
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
                        setFormErrors({ general: data.message || data.error || 'Error al guardar contenido' });
                    }
                    enqueueSnackbar('Error al guardar contenido', { variant: 'error' });
                    return;
                }

                handleCloseModal();
                loadContents();
                enqueueSnackbar(editingContent ? 'Contenido actualizado correctamente' : 'Contenido creado correctamente', { variant: 'success' });
            } else {
                // Sin imagen o tipo testimonial, usar JSON
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        type: formData.type,
                        veterinary_id: veterinaryId,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.errors) {
                        setFormErrors(data.errors);
                    } else {
                        setFormErrors({ general: data.message || data.error || 'Error al guardar contenido' });
                    }
                    enqueueSnackbar('Error al guardar contenido', { variant: 'error' });
                    return;
                }

                handleCloseModal();
                loadContents();
                enqueueSnackbar(editingContent ? 'Contenido actualizado correctamente' : 'Contenido creado correctamente', { variant: 'success' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar contenido' });
            enqueueSnackbar('Error al guardar contenido', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar contenido
    const handleDelete = async (contentId: number) => {
        // Buscar el contenido para verificar su tipo
        const contentToDelete = contents.find(c => c.id === contentId);
        
        // No permitir eliminar banners
        if (contentToDelete?.type === 'banner') {
            enqueueSnackbar('No se pueden eliminar contenidos de tipo banner', { variant: 'warning' });
            return;
        }

        const { confirmed } = await confirm({
            title: 'Eliminar Contenido',
            description: '¿Estás seguro de que deseas eliminar este contenido?',
            confirmationText: 'Eliminar',
            cancellationText: 'Cancelar',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/content-veterinaries/${contentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al eliminar contenido', { variant: 'error' });
                return;
            }

            loadContents();
            enqueueSnackbar('Contenido eliminado correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar contenido', { variant: 'error' });
        }
    };

    // Obtener etiqueta del tipo
    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            banner: 'Banner',
            service: 'Servicio',
            specialty: 'Especialidad',
            testimonial: 'Testimonio',
        };
        return labels[type] || type;
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Secciones del Sitio</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreate}
                        size="small"
                    >
                        Nueva Sección
                    </Button>
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
                ) : contents.length === 0 ? (
                    <Alert severity="info">No hay secciones disponibles</Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Imagen</TableCell>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contents.map((content) => (
                                    <TableRow key={content.id}>
                                        <TableCell>
                                            {content.file?.url ? (
                                                <Avatar
                                                    src={`${API_CONFIG.baseURL.replace('/api', '')}/${content.file.url}`}
                                                    variant="rounded"
                                                    sx={{ width: 56, height: 56 }}
                                                />
                                            ) : (
                                                <Avatar variant="rounded" sx={{ width: 56, height: 56 }}>
                                                    No img
                                                </Avatar>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {content.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {content.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getTypeLabel(content.type)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(content)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {content.type !== 'banner' && (
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(content.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Modal para crear/editar */}
                <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
                        {editingContent ? 'Editar Sección' : 'Nueva Sección'}
                    </DialogTitle>
                    <DialogContent dividers>
                        {formErrors.general && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formErrors.general}
                            </Alert>
                        )}

                        <TextField
                            label="Título"
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            error={!!formErrors.title}
                            helperText={formErrors.title}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            label="Descripción"
                            fullWidth
                            variant="outlined"
                            size="small"
                            multiline
                            rows={4}
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
                                onChange={(e) => {
                                    const newType = e.target.value as any;
                                    setFormData({ ...formData, type: newType });
                                    // Si cambia a testimonial, limpiar la imagen
                                    if (newType === 'testimonial') {
                                        setImageFile(null);
                                        setImagePreview(null);
                                        const fileInput = document.getElementById('content-image-input') as HTMLInputElement;
                                        if (fileInput) {
                                            fileInput.value = '';
                                        }
                                    }
                                }}
                            >
                                {/* <MenuItem value="banner">Banner</MenuItem> */}
                                <MenuItem value="service">Servicio</MenuItem>
                                <MenuItem value="specialty">Especialidad</MenuItem>
                                <MenuItem value="testimonial">Testimonio</MenuItem>
                            </Select>
                            {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
                        </FormControl>

                        {/* Imagen - Solo mostrar si el tipo NO es testimonial */}
                        {formData.type !== 'testimonial' && (
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
                                            sx={{ width: 100, height: 100 }}
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
                                    id="content-image-input"
                                    type="file"
                                    inputProps={{
                                        accept: 'image/*',
                                    }}
                                    onChange={handleImageChange}
                                    sx={{ display: 'none' }}
                                />
                                <label htmlFor="content-image-input">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        size="small"
                                        disabled={submitting}
                                    >
                                        {imageFile ? 'Cambiar Imagen' : 'Subir Imagen'}
                                    </Button>
                                </label>
                                {formErrors.image && (
                                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                        {formErrors.image}
                                    </Typography>
                                )}
                            </Box>
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
            </CardContent>
        </Card>
    );
}

