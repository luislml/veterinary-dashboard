'use client';
import * as React from 'react';
import {
    Box,
    Grid,
    Alert,
} from '@mui/material';
import { PageContainer } from '@toolpad/core/PageContainer';
import { useSelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';
import KPISummaryCards from '../components/KPISummaryCards';
import RecentPatientsAccordion from '../components/RecentPatientsAccordion';
import TopSellingProductsAccordion from '../components/TopSellingProductsAccordion';
import FrequentConsultationsAccordion from '../components/FrequentConsultationsAccordion';
import CriticalInventoryAccordion from '../components/CriticalInventoryAccordion';
import AnalyticsCharts from '../components/AnalyticsCharts';

export default function HomePage() {
    const { selectedVeterinary } = useSelectedVeterinary();


    // Función para obtener iniciales
    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    // Función para obtener color del avatar
    const getAvatarColor = (name: string) => {
        const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <PageContainer>
            <Box sx={{ p: 3 }}>
                {/* 3 Cajas superiores */}
                {selectedVeterinary?.id ? (
                    <KPISummaryCards veterinaryId={selectedVeterinary.id} />
                ) : (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Por favor, selecciona una veterinaria para ver los KPIs.
                    </Alert>
                )}
                
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    {/* Accordion de Mascotas Atendidas */}
                    {selectedVeterinary?.id && (
                    <Grid size={{ xs: 12, md: 6 }}>
                            <RecentPatientsAccordion veterinaryId={selectedVeterinary.id} />
                    </Grid>
                    )}
                    {selectedVeterinary?.id && (
                    <Grid size={{ xs: 12, md: 6 }}>
                            <TopSellingProductsAccordion veterinaryId={selectedVeterinary.id} />
                        </Grid>
                    )}
                    {selectedVeterinary?.id && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FrequentConsultationsAccordion veterinaryId={selectedVeterinary.id} />
                    </Grid>
                    )}
                    {selectedVeterinary?.id && (
                    <Grid size={{ xs: 12, md: 6 }}>
                            <CriticalInventoryAccordion veterinaryId={selectedVeterinary.id} />
                    </Grid>
                    )}
                </Grid>

                {selectedVeterinary?.id && (
                    <AnalyticsCharts veterinaryId={selectedVeterinary.id} />
                )}

            </Box>
        </PageContainer>
    );
}
