'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    TextField,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Divider,
    Input,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../../lib/config';
import ContentVeterinariesSection from '../../components/ContentVeterinariesSection';
import ImagesVeterinariesSection from '../../components/ImagesVeterinariesSection';
interface Configuration {
    id: number;
    veterinary_id: number;
    color_primary: string;
    color_secondary: string;
    about_us: string;
    description_team: string;
    phone: string;
    phone_emergency: string;
    veterinary?: {
        id: number;
        name: string;
        slug: string;
    };
    favicon?: {
        url: string;
    };
}

function ConfigurationsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();

    const [configuration, setConfiguration] = React.useState<Configuration | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        color_primary: '',
        color_secondary: '',
        about_us: '',
        description_team: '',
        phone: '',
        phone_emergency: '',
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [faviconFile, setFaviconFile] = React.useState<File | null>(null);
    const [faviconPreview, setFaviconPreview] = React.useState<string | null>(null);

    // Cargar configuración
    const loadConfiguration = React.useCallback(async () => {
        if (!selectedVeterinary?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/configurations?veterinary_id=${selectedVeterinary.id}`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar configuración');
            }

            // La respuesta viene como { data: [...] }
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                const config = data.data[0];
                setConfiguration(config);
                setFormData({
                    color_primary: config.color_primary || '',
                    color_secondary: config.color_secondary || '',
                    about_us: config.about_us || '',
                    description_team: config.description_team || '',
                    phone: config.phone || '',
                    phone_emergency: config.phone_emergency || '',
                });
            } else {
                setError('No se encontró configuración para esta veterinaria');
                setConfiguration(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar configuración');
            setConfiguration(null);
        } finally {
            setLoading(false);
        }
    }, [selectedVeterinary?.id]);

    React.useEffect(() => {
        loadConfiguration();
    }, [loadConfiguration]);

    // Manejar selección de archivo de favicon
    const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFaviconFile(file);
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFaviconPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Limpiar preview de favicon
    const handleRemoveFavicon = () => {
        setFaviconFile(null);
        setFaviconPreview(null);
        // Resetear el input file
        const fileInput = document.getElementById('favicon-input') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Actualizar configuración
    const handleUpdate = async () => {
        if (!configuration) return;

        setFormErrors({});
        setSubmitting(true);

        try {
            // Si hay archivo de favicon, usar FormData, sino JSON
            if (faviconFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('color_primary', formData.color_primary);
                formDataToSend.append('color_secondary', formData.color_secondary);
                formDataToSend.append('about_us', formData.about_us);
                formDataToSend.append('description_team', formData.description_team);
                formDataToSend.append('phone', formData.phone);
                formDataToSend.append('phone_emergency', formData.phone_emergency);
                formDataToSend.append('favicon', faviconFile);
                formDataToSend.append('_method', 'PATCH');

                const response = await fetch(`/api/configurations/${configuration.id}`, {
                    method: 'PUT',
                    body: formDataToSend,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.errors) {
                        setFormErrors(data.errors);
                    } else {
                        setFormErrors({ general: data.message || data.error || 'Error al actualizar configuración' });
                    }
                    enqueueSnackbar('Error al actualizar configuración', { variant: 'error' });
                    return;
                }

                // Limpiar el archivo después de guardar
                setFaviconFile(null);
                setFaviconPreview(null);
                const fileInput = document.getElementById('favicon-input') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }

                // Recargar la configuración actualizada
                await loadConfiguration();
                enqueueSnackbar('Configuración actualizada correctamente', { variant: 'success' });
            } else {
                // Sin archivo, usar JSON
                const response = await fetch(`/api/configurations/${configuration.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        color_primary: formData.color_primary,
                        color_secondary: formData.color_secondary,
                        about_us: formData.about_us,
                        description_team: formData.description_team,
                        phone: formData.phone,
                        phone_emergency: formData.phone_emergency,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.errors) {
                        setFormErrors(data.errors);
                    } else {
                        setFormErrors({ general: data.message || data.error || 'Error al actualizar configuración' });
                    }
                    enqueueSnackbar('Error al actualizar configuración', { variant: 'error' });
                    return;
                }

                // Recargar la configuración actualizada
                await loadConfiguration();
                enqueueSnackbar('Configuración actualizada correctamente', { variant: 'success' });
            }
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al actualizar configuración' });
            enqueueSnackbar('Error al actualizar configuración', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!selectedVeterinary?.id) {
        return (
            <PageContainer>
                <Alert severity="warning">
                    Por favor, selecciona una veterinaria para ver sus configuraciones.
                </Alert>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Configuraciones Generales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {selectedVeterinary.name}
                </Typography>
            </Box>

            {error && !loading && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            ) : configuration ? (
                <Card>
                    <CardContent>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Información General
                            </Typography>
                            <Divider sx={{ mb: 3 }} />
                        </Box>

                        {formErrors.general && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {formErrors.general}
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            {/* Colores */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Color Primario"
                                    type="color"
                                    fullWidth
                                    size="small"
                                    value={formData.color_primary}
                                    onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                                    error={!!formErrors.color_primary}
                                    helperText={formErrors.color_primary}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        style: { height: '30px' },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Color Secundario"
                                    type="color"
                                    fullWidth
                                    size="small"
                                    value={formData.color_secondary}
                                    onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                                    error={!!formErrors.color_secondary}
                                    helperText={formErrors.color_secondary}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    inputProps={{
                                        style: { height: '30px' },
                                    }}
                                />
                            </Grid>

                            {/* Teléfonos */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Teléfono"
                                    fullWidth
                                    size="small"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    error={!!formErrors.phone}
                                    helperText={formErrors.phone}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Teléfono de Emergencia"
                                    fullWidth
                                    size="small"
                                    value={formData.phone_emergency}
                                    onChange={(e) => setFormData({ ...formData, phone_emergency: e.target.value })}
                                    error={!!formErrors.phone_emergency}
                                    helperText={formErrors.phone_emergency}
                                />
                            </Grid>

                            {/* Sobre Nosotros */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Sobre Nosotros"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={4}
                                    value={formData.about_us}
                                    onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
                                    error={!!formErrors.about_us}
                                    helperText={formErrors.about_us}
                                    placeholder="Descripción sobre la veterinaria..."
                                />
                            </Grid>

                            {/* Descripción del Equipo */}
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Descripción del Equipo"
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={4}
                                    value={formData.description_team}
                                    onChange={(e) => setFormData({ ...formData, description_team: e.target.value })}
                                    error={!!formErrors.description_team}
                                    helperText={formErrors.description_team}
                                    placeholder="Descripción del equipo de profesionales..."
                                />
                            </Grid>

                            {/* Favicon */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Favicon
                                    </Typography>
                                    
                                    {/* Vista previa del favicon actual o nuevo */}
                                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {(faviconPreview || configuration.favicon) && (
                                            <Box
                                                component="img"
                                                src={faviconPreview || `${API_CONFIG.baseURL.replace('/api', '')}/${configuration.favicon?.url}`}
                                                alt="Favicon"
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    objectFit: 'contain',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    backgroundColor: 'background.paper',
                                                }}
                                            />
                                        )}
                                        
                                        {faviconPreview && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={handleRemoveFavicon}
                                            >
                                                Eliminar Nuevo
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Input para subir nuevo favicon */}
                                    <Box>
                                        <Input
                                            id="favicon-input"
                                            type="file"
                                            inputProps={{
                                                accept: 'image/*',
                                            }}
                                            onChange={handleFaviconChange}
                                            sx={{ display: 'none' }}
                                        />
                                        <label htmlFor="favicon-input">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                size="small"
                                                disabled={submitting}
                                            >
                                                {faviconFile ? 'Cambiar Favicon' : 'Subir Nuevo Favicon'}
                                            </Button>
                                        </label>
                                        {formErrors.favicon && (
                                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                                {formErrors.favicon}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                                onClick={handleUpdate}
                                disabled={submitting}
                            >
                                {submitting ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Alert severity="info">
                    No se encontró configuración para esta veterinaria.
                </Alert>
            )}
            
            <Box sx={{ mt: 4 }}></Box>

            {/* Secciones del Sitio */}
            {selectedVeterinary?.id && (
                <ContentVeterinariesSection veterinaryId={selectedVeterinary.id} />
            )}

            <Box sx={{ mt: 4 }}></Box>

            {/* Imagenes del Sitio */}
            {selectedVeterinary?.id && (
                <ImagesVeterinariesSection veterinaryId={selectedVeterinary.id} />
            )}
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ConfigurationsPage />
        </SnackbarProvider>
    );
}
