'use client';
import * as React from 'react';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Pets from '@mui/icons-material/Pets';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import { useRouter } from 'next/navigation';

interface RecentPatient {
    date: string;
    pet_name: string;
    client_name: string;
    client_last_name: string;
    species: string;
}

interface RecentPatientsAccordionProps {
    veterinaryId: number;
}

export default function RecentPatientsAccordion({ veterinaryId }: RecentPatientsAccordionProps) {
    const [patients, setPatients] = React.useState<RecentPatient[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const router = useRouter();
    // Cargar pacientes recientes
    const loadRecentPatients = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/recent-patients?veterinary_id=${veterinaryId}`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar pacientes recientes');
            }

            // La respuesta puede venir como array directo o dentro de data
            if (Array.isArray(data)) {
                setPatients(data);
            } else if (data.data && Array.isArray(data.data)) {
                setPatients(data.data);
            } else {
                setPatients([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar pacientes recientes');
            setPatients([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadRecentPatients();
        }
    }, [loadRecentPatients, veterinaryId]);

    // Formatear fecha relativa
    const formatRelativeDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Hace menos de un minuto';
        } else if (diffMins < 60) {
            return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else {
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }
    };

    // Determinar si es canino o felino
    const getSpeciesType = (species: string): 'Canino' | 'Felino' => {
        const lowerSpecies = species.toLowerCase();
        return lowerSpecies.includes('perro') || lowerSpecies.includes('canino') || lowerSpecies.includes('dog') 
            ? 'Canino' 
            : 'Felino';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Accordion
            defaultExpanded={false}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: 3,
                '&:before': {
                    display: 'none',
                },
                '&.Mui-expanded': {
                    margin: 0,
                },
            }}
        >
            <AccordionSummary
                expandIcon={
                    <ExpandMore sx={{ color: 'white' }} />
                }
                sx={{
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    color: 'white',
                    p: 2.5,
                    minHeight: 72,
                    '&.Mui-expanded': {
                        minHeight: 72,
                        margin: '0px 0px !important',
                    },
                    '& .MuiAccordionSummary-content': {
                        margin: 0,
                        alignItems: 'center',
                        gap: 2,
                    },
                }}
            >
                <Avatar
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        width: 48,
                        height: 48,
                    }}
                >
                    <Pets />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Mascotas Atendidas
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Recientemente
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {patients.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No hay pacientes recientes
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: 'transparent', '& th': { color: 'black' } }}>
                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Mascota</TableCell>
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Especie</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                        Acción
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {patients.map((patient, index) => {
                                    const speciesType = getSpeciesType(patient.species);
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {patient.pet_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatRelativeDate(patient.date)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={patient.species}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: speciesType === 'Canino' ? '#e3f2fd' : '#fce4ec',
                                                        color: speciesType === 'Canino' ? '#1976d2' : '#c2185b',
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: 'primary.main',
                                                            '&:hover': {
                                                                bgcolor: 'primary.light',
                                                                color: 'white',
                                                            },
                                                        }}
                                                    >
                                                        <ArrowForwardIos fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </AccordionDetails>
        </Accordion>
    );
}

