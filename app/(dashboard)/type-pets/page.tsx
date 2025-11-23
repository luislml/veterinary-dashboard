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
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageContainer } from '@toolpad/core/PageContainer';
import { styled } from '@mui/material/styles';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";

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

interface TypePet {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
}

function TypePetsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [typePets, setTypePets] = React.useState<TypePet[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingTypePet, setEditingTypePet] = React.useState<TypePet | null>(null);
    const [formData, setFormData] = React.useState({ name: '' });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar tipos de mascotas
    const loadTypePets = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/type-pets?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar tipos de mascotas');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setTypePets(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setTypePets(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setTypePets([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar tipos de mascotas');
            setTypePets([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadTypePets();
    }, [loadTypePets]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingTypePet(null);
        setFormData({ name: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (typePet: TypePet) => {
        setEditingTypePet(typePet);
        setFormData({ name: typePet.name });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingTypePet(null);
        setFormData({ name: '' });
        setFormErrors({});
    };

    // Guardar tipo de mascota (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingTypePet ? `/api/type-pets/${editingTypePet.id}` : '/api/type-pets';
            const method = editingTypePet ? 'PUT' : 'POST';

            const dataToSend = {
                name: formData.name,
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar tipo de mascota' });
                }
                return;
            }

            handleCloseModal();
            loadTypePets();
            // Show success snackbar
            enqueueSnackbar(editingTypePet ? 'Tipo de mascota actualizado correctamente' : 'Tipo de mascota creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar tipo de mascota' });
            // Show error snackbar
            enqueueSnackbar(editingTypePet ? 'Error al actualizar tipo de mascota' : 'Error al crear tipo de mascota', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar tipo de mascota
    const handleDelete = async (typePetId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Tipo de Mascota",
            description: "¿Estás seguro de que deseas eliminar este tipo de mascota?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/type-pets/${typePetId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar tipo de mascota', { variant: 'error' });
                return;
            }

            loadTypePets();
            // Show success snackbar
            enqueueSnackbar('Tipo de mascota eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar tipo de mascota', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Tipos de Mascotas</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Tipo de Mascota
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
                            <StyledTableCell align="right">Acciones</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : typePets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay tipos de mascotas disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            typePets.map((typePet) => (
                                <StyledTableRow key={typePet.id}>
                                    <StyledTableCell>{typePet.id}</StyledTableCell>
                                    <StyledTableCell>{typePet.name}</StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(typePet)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(typePet.id)}
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
                    {editingTypePet ? 'Editar Tipo de Mascota' : 'Nuevo Tipo de Mascota'}
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
            <TypePetsPage />
        </SnackbarProvider>
    );
}

