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
    TextField,
    Alert,
    CircularProgress,
    Pagination,
    Tooltip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    ListItemIcon,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PetsIcon from '@mui/icons-material/Pets';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { PageContainer } from '@toolpad/core/PageContainer';
import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';
import { useConfirm } from "material-ui-confirm";
import { useSelectedVeterinary } from '../../../lib/contexts/SelectedVeterinaryContext';
import { useSessionWithPermissions } from '../../../lib/hooks/useSessionWithPermissions';
import { useRouter } from 'next/navigation';
import ClientFormDialog, { Client as ClientType } from '../../components/ClientFormDialog';

interface Client extends ClientType {
    pets?: {
        id: number;
        name: string;
    }[];
}

function ClientsPage() {

    const { enqueueSnackbar } = useSnackbar();
    const { selectedVeterinary } = useSelectedVeterinary();
    const { data: session } = useSessionWithPermissions();
    const router = useRouter();
    
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

    // Buscar clientes
    const [searchTerm, setSearchTerm] = React.useState('');

    // Cargar clientes
    const loadClients = React.useCallback(async (searchTerm: string) => {
        console.log('searchTerm', searchTerm);
        try {
            setLoading(true);
            setError(null);
            
            // Construir URL con filtro de veterinary_id si está disponible
            let url = `/api/clients?page=${page}&search=${searchTerm}`;
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
        loadClients('');
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

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingClient(null);
    };

    // Callback después de guardar exitosamente
    const handleSaveSuccess = () => {
        loadClients('');
    };

    function stringToColor(string: string) {
        let hash = 0;
        let i;
      
        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
      
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */
      
        return color;
      }
      
    function stringAvatar(name: string) {
        return {
          sx: {
            bgcolor: stringToColor(name),
            textTransform: 'uppercase',
          },
          children: `${name.split(' ')[0][0]}`,
        };
    }

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <p>&nbsp;</p>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Formulario de búsqueda */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <TextField
                    label="Buscar"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    placeholder="Buscar cliente, teléfono, CI, nombre de la mascota"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            loadClients(searchTerm);
                        }
                    }}
                />
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
                            <TableCell>Propietario</TableCell>
                            <TableCell>Teléfono</TableCell>
                            <TableCell>CI</TableCell>
                            <TableCell>Mascotas</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay clientes disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <ListItem sx={{ padding: 0 }}>
                                            <ListItemAvatar>
                                            <Avatar variant="square" {...stringAvatar(client.name)}/>
                                            </ListItemAvatar>
                                            <ListItemText primary={client.name + ' ' + (client.last_name || '-')} />
                                        </ListItem>
                                    </TableCell>
                                    <TableCell>{client.phone || '-'}</TableCell>
                                    <TableCell>{client.ci || '-'}</TableCell>
                                    <TableCell>
                                        <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'transparent' }}>
                                            {client?.pets?.map((pet: any) => (
                                                <><ListItem key={pet.id} sx={{ padding: 0 }}>
                                                    {/* icono de la mascota */}
                                                    <ListItemIcon>
                                                        <PetsIcon />
                                                    </ListItemIcon>
                                                    <ListItemText primary={pet.name} secondary={pet.race?.type_pet?.name || '-'} />
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                                </>
                                            )) || '-'}
                                        </List>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ver detalles" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => router.push(`/clients/${client.id}`)}
                                            >
                                                <AssignmentIcon />
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

