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
import ClientFormDialog, { Client as ClientType } from '../../components/ClientFormDialog';

interface Client extends ClientType {}

function ClientsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    
    // Verificar si el usuario es admin
    const isAdmin = session?.hasRole?.('admin') || false;
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [clients, setClients] = React.useState<Client[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingClient, setEditingClient] = React.useState<Client | null>(null);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar clientes
    const loadClients = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/clients?page=${page}&per_page=10`;
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
                throw new Error(data.error || data.message || 'Error al cargar clientes');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setClients(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setClients(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setClients([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar clientes');
            setClients([]);
        } finally {
            setLoading(false);
        }
    }, [page, selectedVeterinary?.id]);

    React.useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Resetear página cuando cambie la veterinaria seleccionada
    React.useEffect(() => {
        if (selectedVeterinary?.id) {
            setPage(1);
        }
    }, [selectedVeterinary?.id]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingClient(null);
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingClient(null);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadClients();
    };

    // Eliminar cliente
    const handleDelete = async (clientId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Cliente",
            description: "¿Estás seguro de que deseas eliminar este cliente?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/clients/${clientId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar cliente', { variant: 'error' });
                return;
            }

            loadClients();
            // Show success snackbar
            enqueueSnackbar('Cliente eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar cliente', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Clientes</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Cliente
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
                            <TableCell>Apellido</TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Teléfono</TableCell>
                            <TableCell>Dirección</TableCell>
                            <TableCell>Veterinaria</TableCell>
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
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay clientes disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>{client.id}</TableCell>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.last_name || '-'}</TableCell>
                                    <TableCell>{client.ci || '-'}</TableCell>
                                    <TableCell>{client.phone || '-'}</TableCell>
                                    <TableCell>{client.address || '-'}</TableCell>
                                    <TableCell>
                                        {client.veterinaries && client.veterinaries.length > 0
                                            ? client.veterinaries.map(v => v.name).join(', ')
                                            : client.veterinary?.name || (Array.isArray(client.veterinary_id) 
                                                ? client.veterinary_id.join(', ') 
                                                : `Veterinaria ID: ${client.veterinary_id || '-'}`)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(client)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(client.id)}
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
            <ClientFormDialog
                open={openModal}
                onClose={handleCloseModal}
                client={editingClient}
                onSave={handleSaveSuccess}
            />
            
        </PageContainer>
    );
}

export default function IntegrationNotistack() {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <ClientsPage />
        </SnackbarProvider>
    );
}

