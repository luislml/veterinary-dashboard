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
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import { API_CONFIG } from '../../../lib/config';
import { formatAgeFromBirthday } from '../../../utils/pet-date-utils';
import PetFormDialog, { Pet as PetType } from '../../components/PetFormDialog';

interface Pet extends PetType {
    client?: {
        id: number;
        name: string;
        last_name: string;
    };
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
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingPet, setEditingPet] = React.useState<Pet | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();


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
    }, [loadPets]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (isVeterinary && selectedVeterinary?.id) {
            setPage(1);
        }
    }, [isVeterinary, selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingPet(null);
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (pet: Pet) => {
        setEditingPet(pet);
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingPet(null);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadPets();
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
                            <TableCell>ID</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Raza</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell>Género</TableCell>
                            <TableCell>Edad</TableCell>
                            <TableCell align="right">Acciones</TableCell>
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
                                <TableRow key={pet.id}>
                                    <TableCell>{pet.id}</TableCell>
                                    <TableCell>{pet.name}</TableCell>
                                    <TableCell>
                                        {pet.race?.name || `Raza ID: ${pet.race_id}`}
                                    </TableCell>
                                    <TableCell>
                                        {pet.client ? `${pet.client.name} ${pet.client.last_name || ''}`.trim() : `Cliente ID: ${pet.client_id}`}
                                    </TableCell>
                                    <TableCell>{pet.color || '-'}</TableCell>
                                    <TableCell>
                                        {GENDER_OPTIONS.find(g => g.value === pet.gender)?.label || pet.gender}
                                    </TableCell>
                                    <TableCell>{formatAgeFromBirthday(pet.birthday) || '-'}</TableCell>
                                    <TableCell align="right">
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
            <PetFormDialog
                open={openModal}
                onClose={handleCloseModal}
                pet={editingPet}
                onSave={handleSaveSuccess}
            />
            
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

