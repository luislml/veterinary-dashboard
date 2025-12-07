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
    Alert,
    CircularProgress,
    Pagination,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import AdvertisementFormDialog from '../../components/AdvertisementFormDialog';

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
    id: number;
    id_pets: number;
    description: string;
    date: string;
    pet?: Pet;
    created_at?: string;
    updated_at?: string;
}

function AdvertisementsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingAdvertisement, setEditingAdvertisement] = React.useState<Advertisement | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar anuncios
    const loadAdvertisements = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/advertisements?page=${page}&per_page=10`;
            if (selectedVeterinary?.id) {
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
                throw new Error(data.error || data.message || 'Error al cargar anuncios');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setAdvertisements(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setAdvertisements(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setAdvertisements([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar anuncios');
            setAdvertisements([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadAdvertisements();
    }, [loadAdvertisements]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (selectedVeterinary?.id) {
            setPage(1);
        }
    }, [selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingAdvertisement(null);
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (advertisement: Advertisement) => {
        setEditingAdvertisement(advertisement);
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingAdvertisement(null);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadAdvertisements();
    };

    // Eliminar anuncio
    const handleDelete = async (advertisementId: number) => {
        const { confirmed } = await confirm({
            title: "Eliminar Anuncio",
            description: "¿Estás seguro de que deseas eliminar este anuncio?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/advertisements/${advertisementId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                enqueueSnackbar(data.error || data.message || 'Error al eliminar anuncio', { variant: 'error' });
                return;
            }

            loadAdvertisements();
            enqueueSnackbar('Anuncio eliminado correctamente', { variant: 'success' });
        } catch (err) {
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar anuncio', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Anuncios</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Anuncio
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
                            <TableCell>ID</TableCell>
                            <TableCell>Mascota</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Fecha de Creación</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : advertisements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay anuncios disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            advertisements.map((advertisement) => (
                                <TableRow key={advertisement.id}>
                                    <TableCell>{advertisement.id}</TableCell>
                                    <TableCell>
                                        {advertisement.pet 
                                            ? `${advertisement.pet.name}${advertisement.pet.race ? ` - ${advertisement.pet.race.name}` : ''}`
                                            : `Mascota ID: ${advertisement.id_pets}`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                maxWidth: 300, 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {advertisement.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {advertisement.date 
                                            ? new Date(advertisement.date).toLocaleDateString()
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {advertisement.created_at 
                                            ? new Date(advertisement.created_at).toLocaleDateString()
                                            : '-'
                                        }
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(advertisement)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(advertisement.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
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
            <AdvertisementFormDialog
                open={openModal}
                onClose={handleCloseModal}
                advertisement={editingAdvertisement}
                onSave={handleSaveSuccess}
            />
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <AdvertisementsPage />
        </SnackbarProvider>
    );
}

