'use client';
import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Avatar,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PetsIcon from '@mui/icons-material/Pets';
import AddIcon from '@mui/icons-material/Add';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useRouter, useParams } from 'next/navigation';
import { API_CONFIG } from '../../../../lib/config';
import PetFormDialog from '../../../components/PetFormDialog';

interface Client {
    id: number;
    name: string;
    last_name: string;
    ci: string;
    phone: string;
    address: string;
    veterinary_id?: number | number[];
    veterinaries?: {
        id: number;
        name: string;
    }[];
    created_at?: string;
    updated_at?: string;
}

interface Pet {
    id: number;
    name: string;
    race_id: number;
    client_id: number;
    color: string;
    gender: string;
    age: string | number;
    images?: object[] | null;
    race?: {
        id: number;
        name: string;
        type_pet?: {
            id: number;
            name: string;
        };
    };
    created_at?: string;
    updated_at?: string;
}

function stringToColor(string: string) {
    let hash = 0;
    let i;
  
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
  
    let color = '#';
  
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
  
    return color;
}

function stringAvatar(name: string) {
    return {
      sx: {
        bgcolor: stringToColor(name),
        textTransform: 'uppercase',
        width: 80,
        height: 80,
        fontSize: 32,
      },
      children: `${name.split(' ')[0][0]}${name.split(' ')[1]?.[0] || ''}`,
    };
}

const GENDER_OPTIONS: Record<string, string> = {
    'male': 'Macho',
    'female': 'Hembra',
};

export default function ClientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const clientId = params?.id as string;

    const [client, setClient] = React.useState<Client | null>(null);
    const [pets, setPets] = React.useState<Pet[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openPetModal, setOpenPetModal] = React.useState(false);

    // Cargar datos del cliente
    const loadClient = React.useCallback(async () => {
        if (!clientId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/clients/${clientId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar cliente');
            }

            setClient(data.data || data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar cliente');
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    // Cargar mascotas del cliente
    const loadPets = React.useCallback(async () => {
        if (!clientId) return;

        try {
            const response = await fetch(`/api/pets?client_id=${clientId}&paginate=false`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar mascotas');
            }

            if (data.data) {
                setPets(data.data);
            } else if (Array.isArray(data)) {
                setPets(data);
            } else {
                setPets([]);
            }
        } catch (err) {
            console.error('Error al cargar mascotas:', err);
            setPets([]);
        }
    }, [clientId]);

    React.useEffect(() => {
        loadClient();
        loadPets();
    }, [loadClient, loadPets]);

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    if (error || !client) {
        return (
            <PageContainer>
                <Box sx={{ mb: 2 }}>
                    <IconButton onClick={() => router.back()} sx={{ mb: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
                <Alert severity="error">{error || 'Cliente no encontrado'}</Alert>
            </PageContainer>
        );
    }

    const fullName = `${client.name} ${client.last_name || ''}`.trim();

    return (
        <PageContainer>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">Detalles del Cliente</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Panel izquierdo - Información del cliente */}
                <Grid size={{xs: 12, md: 4}}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar {...stringAvatar(fullName)} />
                                <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                                    {fullName}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {client.ci && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ContactEmergencyIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            CI:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {client.ci}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        Teléfono:
                                    </Typography>
                                    <Typography variant="body1" sx={{ ml: 1 }}>
                                        {client.phone || 'No especificado'}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon color="action" sx={{ mt: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Dirección:
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                                        {client.address || 'No especificada'}
                                    </Typography>
                                </Box>

                                {client.veterinaries && client.veterinaries.length > 0 && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Veterinarias:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {client.veterinaries.map((vet) => (
                                                <Chip key={vet.id} label={vet.name} size="small" color="primary" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Panel derecho - Listado de mascotas */}
                <Grid size={{xs: 12, md: 8}}>
                    <Box sx={{ display: 'flex', justifyContent: 'end', gap: 1, mb: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenPetModal(true)}
                        >
                            Nueva Mascota
                        </Button>
                    </Box>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <PetsIcon color="primary" />
                                <Typography variant="h6">
                                    Mascotas ({pets.length})
                                </Typography>
                            </Box>

                            {pets.length === 0 ? (
                                <Alert severity="info">
                                    Este cliente no tiene mascotas registradas.
                                </Alert>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Foto</strong></TableCell>
                                                <TableCell><strong>Nombre</strong></TableCell>
                                                <TableCell><strong>Especie</strong></TableCell>
                                                <TableCell><strong>Raza</strong></TableCell>
                                                <TableCell><strong>Color</strong></TableCell>
                                                <TableCell><strong>Género</strong></TableCell>
                                                <TableCell><strong>Edad</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pets.map((pet) => {
                                                const imageUrl = pet.images && pet.images.length > 0 
                                                    ? `${API_CONFIG.baseURL.replace('/api', '')}/${(pet.images as any)[pet.images.length - 1].url}`
                                                    : undefined;
                                                
                                                return (
                                                    <TableRow key={pet.id}>
                                                        <TableCell>
                                                            <Avatar
                                                                src={imageUrl || undefined}
                                                                sx={{ width: 50, height: 50 }}
                                                            >
                                                                {pet.name[0]}
                                                            </Avatar>
                                                        </TableCell>
                                                        <TableCell>{pet.name}</TableCell>
                                                        <TableCell>{pet.race?.type_pet?.name || '-'}</TableCell>
                                                        <TableCell>{pet.race?.name || `Raza ID: ${pet.race_id}`}</TableCell>
                                                        <TableCell>{pet.color || '-'}</TableCell>
                                                        <TableCell>
                                                            {GENDER_OPTIONS[pet.gender] || pet.gender}
                                                        </TableCell>
                                                        <TableCell>{pet.age || '-'}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Modal para crear mascota */}
            <PetFormDialog
                open={openPetModal}
                onClose={() => setOpenPetModal(false)}
                defaultClientId={clientId}
                onSave={() => {
                    loadPets();
                }}
            />
        </PageContainer>
    );
}

