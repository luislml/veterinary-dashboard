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

interface User {
    id: number;
    name: string;
    last_name: string;
    phone: string;
    email: string;
    password?: string;
    role: string;
    created_at?: string;
    updated_at?: string;
}

// Opciones de rol
const ROLE_OPTIONS = [
    { value: 'admin', label: 'Administrador' },
    { value: 'veterinary', label: 'Veterinario' },
    { value: 'user', label: 'Usuario' },
];

function UsersPage() {

    const { enqueueSnackbar } = useSnackbar();
    const handleClickVariant = (variant: VariantType) => () => {
        // variant could be success, error, warning, info, or default
        enqueueSnackbar('This is a success message!', { variant });
    };

    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openModal, setOpenModal] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<User | null>(null);
    const [formData, setFormData] = React.useState({ 
        name: '', 
        last_name: '', 
        phone: '', 
        email: '', 
        password: '', 
        role: '' 
    });
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [submitting, setSubmitting] = React.useState(false);
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const confirm = useConfirm();

    // Cargar usuarios
    const loadUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/users?page=${page}&per_page=10`);
            
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar usuarios');
            }

            // Adaptar respuesta de Laravel
            if (data.data) {
                setUsers(data.data);
                setTotal(data?.meta?.total || data.data.length);
                setTotalPages(data?.meta?.last_page || Math.ceil((data?.meta?.total || data.data.length) / 10));
            } else if (Array.isArray(data)) {
                setUsers(data);
                setTotal(data.length);
                setTotalPages(Math.ceil(data.length / 10));
            } else {
                setUsers([]);
                setTotal(0);
                setTotalPages(1);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Abrir modal para crear
    const handleCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', last_name: '', phone: '', email: '', password: '', role: '' });
        setFormErrors({});
        setOpenModal(true);
    };

    // Abrir modal para editar
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ 
            name: user.name, 
            last_name: user.last_name || '', 
            phone: user.phone || '', 
            email: user.email, 
            password: '', // No mostrar password al editar
            role: user.role || '' 
        });
        setFormErrors({});
        setOpenModal(true);
    };

    // Cerrar modal
    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingUser(null);
        setFormData({ name: '', last_name: '', phone: '', email: '', password: '', role: '' });
        setFormErrors({});
    };

    // Guardar usuario (crear o actualizar)
    const handleSave = async () => {
        setFormErrors({});
        setSubmitting(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            // Preparar datos para enviar
            const dataToSend: any = {
                name: formData.name,
                last_name: formData.last_name,
                phone: formData.phone,
                email: formData.email,
                role: formData.role,
            };

            // Solo incluir password si no está vacío (para edición) o si es creación
            if (!editingUser || formData.password) {
                dataToSend.password = formData.password;
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
                    setFormErrors({ general: data.message || data.error || 'Error al guardar usuario' });
                }
                return;
            }

            handleCloseModal();
            loadUsers();
            // Show success snackbar
            enqueueSnackbar(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', { variant: 'success' });
        } catch (err) {
            setFormErrors({ general: err instanceof Error ? err.message : 'Error al guardar usuario' });
            // Show error snackbar
            enqueueSnackbar(editingUser ? 'Error al actualizar usuario' : 'Error al crear usuario', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar usuario
    const handleDelete = async (userId: number) => {
        const { confirmed, reason } = await confirm({
            title: "Eliminar Usuario",
            description: "¿Estás seguro de que deseas eliminar este usuario?",
            confirmationText: "Eliminar",
            cancellationText: "Cancelar"
        });
    
        if (!confirmed) return;
        // console.log(reason);

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                // Show error snackbar
                enqueueSnackbar(data.error || data.message || 'Error al eliminar usuario', { variant: 'error' });
                return;
            }

            loadUsers();
            // Show success snackbar
            enqueueSnackbar('Usuario eliminado correctamente', { variant: 'success' });
        } catch (err) {
            // Show error snackbar
            enqueueSnackbar(err instanceof Error ? err.message : 'Error al eliminar usuario', { variant: 'error' });
        }
    };

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Lista de Usuarios</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo Usuario
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
                            <StyledTableCell>Apellido</StyledTableCell>
                            <StyledTableCell>Teléfono</StyledTableCell>
                            <StyledTableCell>Email</StyledTableCell>
                            <StyledTableCell>Rol</StyledTableCell>
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
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay usuarios disponibles
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <StyledTableRow key={user.id}>
                                    <StyledTableCell>{user.id}</StyledTableCell>
                                    <StyledTableCell>{user.name}</StyledTableCell>
                                    <StyledTableCell>{user.last_name || '-'}</StyledTableCell>
                                    <StyledTableCell>{user.phone || '-'}</StyledTableCell>
                                    <StyledTableCell>{user.email}</StyledTableCell>
                                    <StyledTableCell>
                                        {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                                    </StyledTableCell>
                                    <StyledTableCell align="right">
                                        <Tooltip title="Editar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(user.id)}
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
                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                    <TextField
                        label="Apellido"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        error={!!formErrors.last_name}
                        helperText={formErrors.last_name}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Teléfono"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        error={!!formErrors.phone}
                        helperText={formErrors.phone}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={!!formErrors.email}
                        helperText={formErrors.email}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label={editingUser ? "Nueva Contraseña (dejar vacío para mantener la actual)" : "Contraseña"}
                        type="password"
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        error={!!formErrors.password}
                        helperText={formErrors.password}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth size="small" error={!!formErrors.role} sx={{ mb: 2 }}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={formData.role}
                            label="Rol"
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            {ROLE_OPTIONS.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
                    </FormControl>
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
            <UsersPage />
        </SnackbarProvider>
    );
}
