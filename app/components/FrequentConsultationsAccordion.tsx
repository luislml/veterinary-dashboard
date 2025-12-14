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
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Assignment from '@mui/icons-material/Assignment';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';

interface FrequentConsultation {
    reason: string;
    count: number;
}

interface FrequentConsultationsAccordionProps {
    veterinaryId: number;
}

export default function FrequentConsultationsAccordion({ veterinaryId }: FrequentConsultationsAccordionProps) {
    const [consultations, setConsultations] = React.useState<FrequentConsultation[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Cargar consultas frecuentes
    const loadFrequentConsultations = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/frequent-consultations?veterinary_id=${veterinaryId}`);

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar consultas frecuentes');
            }

            // La respuesta puede venir como array directo o dentro de data
            let consultationsData: FrequentConsultation[] = [];
            if (Array.isArray(data)) {
                consultationsData = data;
            } else if (data.data && Array.isArray(data.data)) {
                consultationsData = data.data;
            }

            // Ordenar por count descendente
            consultationsData.sort((a, b) => b.count - a.count);
            setConsultations(consultationsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar consultas frecuentes');
            setConsultations([]);
        } finally {
            setLoading(false);
        }
    }, [veterinaryId]);

    React.useEffect(() => {
        if (veterinaryId) {
            loadFrequentConsultations();
        }
    }, [loadFrequentConsultations, veterinaryId]);

    // Calcular el total de consultas para el porcentaje
    const totalConsultations = React.useMemo(() => {
        return consultations.reduce((sum, consultation) => sum + consultation.count, 0);
    }, [consultations]);

    // Calcular porcentaje
    const calculatePercentage = (count: number): number => {
        if (totalConsultations === 0) return 0;
        return Math.round((count / totalConsultations) * 100);
    };

    // Formatear número
    const formatNumber = (num: number): string => {
        return num.toLocaleString('es-ES');
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
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
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
                    <Assignment />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Consultas Frecuentes
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Top 5 del mes
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                {consultations.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No hay consultas registradas
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: 'transparent', '& th': { color: 'black' } }}>
                                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Tipo de Consulta</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                                            Cantidad
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {consultations.map((consultation, index) => {
                                        const rank = index + 1;
                                        const percentage = calculatePercentage(consultation.count);
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: '50%',
                                                            bgcolor: rank <= 3 ? 'primary.main' : 'grey.300',
                                                            color: rank <= 3 ? 'white' : 'text.primary',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            fontSize: '0.875rem',
                                                        }}
                                                    >
                                                        {rank}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {consultation.reason}
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                mt: 0.5,
                                                                width: '100%',
                                                                height: 4,
                                                                bgcolor: 'grey.200',
                                                                borderRadius: 2,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    width: `${percentage}%`,
                                                                    height: '100%',
                                                                    bgcolor: rank <= 3 ? 'primary.main' : 'grey.400',
                                                                    transition: 'width 0.3s ease',
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            {percentage}% del total
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                        {formatNumber(consultation.count)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        consultas
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {/* Footer */}
                        <Box
                            sx={{
                                p: 2,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: 'action.hover',
                            }}
                        >
                            <Button
                                fullWidth
                                variant="text"
                                endIcon={<ArrowForwardIos fontSize="small" />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Todas las consultas
                            </Button>
                        </Box>
                    </>
                )}
            </AccordionDetails>
        </Accordion>
    );
}

