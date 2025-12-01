'use client';
import * as React from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    Avatar,
    Divider,
    IconButton,
    Button,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import SpaIcon from '@mui/icons-material/Spa';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CommitIcon from '@mui/icons-material/Commit';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useRouter, useParams } from 'next/navigation';
import { API_CONFIG } from '../../../../lib/config';
import PetFormDialog from '../../../components/PetFormDialog';

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
    client?: {
        id: number;
        name: string;
        last_name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Consultation {
    id: number;
    description: string;
    pet_id: number;
    date: string;
    created_at?: string;
    updated_at?: string;
}

interface Vaccine {
    id: number;
    name: string;
    pet_id: number;
    date: string;
    created_at?: string;
    updated_at?: string;
}

const GENDER_OPTIONS: Record<string, string> = {
    'male': 'Macho',
    'female': 'Hembra',
};

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
      children: `${name[0]}`,
    };
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`pet-tabpanel-${index}`}
            aria-labelledby={`pet-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function PetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const petId = params?.id as string;

    const [pet, setPet] = React.useState<Pet | null>(null);
    const [consultations, setConsultations] = React.useState<Consultation[]>([]);
    const [vaccines, setVaccines] = React.useState<Vaccine[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [openPetModal, setOpenPetModal] = React.useState(false);
    const [tabValue, setTabValue] = React.useState(0);
    const [loadingConsultations, setLoadingConsultations] = React.useState(false);
    const [loadingVaccines, setLoadingVaccines] = React.useState(false);
    const [errorConsultations, setErrorConsultations] = React.useState<string | null>(null);
    const [errorVaccines, setErrorVaccines] = React.useState<string | null>(null);

    // Cargar datos de la mascota
    const loadPet = React.useCallback(async () => {
        if (!petId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/pets/${petId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar mascota');
            }

            setPet(data.data || data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar mascota');
        } finally {
            setLoading(false);
        }
    }, [petId]);

    // Cargar consultas
    const loadConsultations = React.useCallback(async () => {
        if (!petId) return;

        try {
            setLoadingConsultations(true);
            setErrorConsultations(null);

            const response = await fetch(`/api/consultations?pet_id=${petId}&paginate=false`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar consultas');
            }

            if (data.data) {
                setConsultations(Array.isArray(data.data) ? data.data : []);
            } else if (Array.isArray(data)) {
                setConsultations(data);
            } else {
                setConsultations([]);
            }
        } catch (err) {
            console.error('Error al cargar consultas:', err);
            setErrorConsultations(err instanceof Error ? err.message : 'Error al cargar consultas');
            setConsultations([]);
        } finally {
            setLoadingConsultations(false);
        }
    }, [petId]);

    // Cargar vacunas
    const loadVaccines = React.useCallback(async () => {
        if (!petId) return;

        try {
            setLoadingVaccines(true);
            setErrorVaccines(null);

            const response = await fetch(`/api/vaccines?pet_id=${petId}&paginate=false`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar vacunas');
            }

            if (data.data) {
                setVaccines(Array.isArray(data.data) ? data.data : []);
            } else if (Array.isArray(data)) {
                setVaccines(data);
            } else {
                setVaccines([]);
            }
        } catch (err) {
            console.error('Error al cargar vacunas:', err);
            setErrorVaccines(err instanceof Error ? err.message : 'Error al cargar vacunas');
            setVaccines([]);
        } finally {
            setLoadingVaccines(false);
        }
    }, [petId]);

    React.useEffect(() => {
        loadPet();
        loadConsultations();
        loadVaccines();
    }, [loadPet, loadConsultations, loadVaccines]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    if (error || !pet) {
        return (
            <PageContainer>
                <Box sx={{ mb: 2 }}>
                    <IconButton onClick={() => router.back()} sx={{ mb: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
                <Alert severity="error">{error || 'Mascota no encontrada'}</Alert>
            </PageContainer>
        );
    }

    const imageUrl = pet.images && pet.images.length > 0 
        ? `${API_CONFIG.baseURL.replace('/api', '')}/${(pet.images as any)[pet.images.length - 1].url}`
        : undefined;

    return (
        <PageContainer>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">Detalles de la Mascota</Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Panel izquierdo - Información de la mascota */}
                <Grid size={{xs: 12, md: 4}}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    src={imageUrl || undefined}
                                    {...stringAvatar(pet.name)}
                                />
                                <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', mb: 2 }}>
                                    {pet.name}
                                </Typography>
                                {/* editar mascota */}
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    size="small" 
                                    startIcon={<EditIcon />}
                                    onClick={() => setOpenPetModal(true)}
                                >
                                    Editar datos
                                </Button>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {pet.race?.type_pet && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmojiNatureIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Especie:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {pet.race.type_pet.name}
                                        </Typography>
                                    </Box>
                                )}

                                {pet.race && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SpaIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Raza:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {pet.race.name}
                                        </Typography>
                                    </Box>
                                )}

                                {pet.color && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ColorLensIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Color:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {pet.color}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CommitIcon color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        Género:
                                    </Typography>
                                    <Typography variant="body1" sx={{ ml: 1 }}>
                                        {GENDER_OPTIONS[pet.gender] || pet.gender}
                                    </Typography>
                                </Box>

                                {pet.age && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DateRangeIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Edad:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {pet.age}
                                        </Typography>
                                    </Box>
                                )}

                                {pet.client && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Cliente:
                                        </Typography>
                                        <Typography variant="body1" sx={{ ml: 1 }}>
                                            {`${pet.client.name} ${pet.client.last_name || ''}`.trim()}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Panel derecho - Tabs con consultas y vacunas */}
                <Grid size={{xs: 12, md: 8}}>
                    <Card>
                        <CardContent>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={tabValue} onChange={handleTabChange} aria-label="pet details tabs">
                                    <Tab label={`Consultas (${consultations.length})`} />
                                    <Tab label={`Vacunas (${vaccines.length})`} />
                                </Tabs>
                            </Box>

                            <TabPanel value={tabValue} index={0}>
                                {loadingConsultations ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : errorConsultations ? (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errorConsultations}
                                    </Alert>
                                ) : consultations.length === 0 ? (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Esta mascota no tiene consultas registradas.
                                    </Alert>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Fecha</strong></TableCell>
                                                    <TableCell><strong>Descripción</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {consultations.map((consultation) => (
                                                    <TableRow key={consultation.id}>
                                                        <TableCell>
                                                            {consultation.date 
                                                                ? new Date(consultation.date).toLocaleDateString()
                                                                : consultation.created_at
                                                                ? new Date(consultation.created_at).toLocaleDateString()
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell>{consultation.description || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                {loadingVaccines ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : errorVaccines ? (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errorVaccines}
                                    </Alert>
                                ) : vaccines.length === 0 ? (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Esta mascota no tiene vacunas registradas.
                                    </Alert>
                                ) : (
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Fecha</strong></TableCell>
                                                    <TableCell><strong>Nombre</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {vaccines.map((vaccine) => (
                                                    <TableRow key={vaccine.id}>
                                                        <TableCell>
                                                            {vaccine.date 
                                                                ? new Date(vaccine.date).toLocaleDateString()
                                                                : vaccine.created_at
                                                                ? new Date(vaccine.created_at).toLocaleDateString()
                                                                : '-'}
                                                        </TableCell>
                                                        <TableCell>{vaccine.name || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </TabPanel>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Modal para editar mascota */}
            <PetFormDialog
                open={openPetModal}
                onClose={() => setOpenPetModal(false)}
                pet={pet}
                onSave={() => {
                    loadPet();
                }}
            />
        </PageContainer>
    );
}

