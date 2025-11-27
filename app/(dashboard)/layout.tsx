'use client';
import * as React from 'react';
import { DashboardLayout, ThemeSwitcher } from '@toolpad/core/DashboardLayout';
import { Account } from '@toolpad/core/Account';
import { Stack, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Backdrop } from '@mui/material';
import { EmojiNature } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useSessionWithPermissions } from '../../lib/hooks/useSessionWithPermissions';
import { useSelectedVeterinary, SelectedVeterinary } from '../../lib/contexts/SelectedVeterinaryContext';


function CustomAppTitle() {
    return (
      <Stack direction="row" alignItems="center" spacing={2}>
        <EmojiNature fontSize="large" color="primary" />
        <Typography variant="h6">My App</Typography>
      </Stack>
    );
}

function ToolbarActionsSearch() {
    const { data: session, status } = useSessionWithPermissions();
    const { selectedVeterinary, setSelectedVeterinary } = useSelectedVeterinary();
    const [veterinaries, setVeterinaries] = React.useState<SelectedVeterinary[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const isVeterinary = session?.hasRole?.('veterinary') || false;

    // Cargar veterinarias cuando el usuario tenga rol veterinary
    React.useEffect(() => {
        // Esperar a que la sesión esté cargada
        if (status === 'loading') {
            return;
        }

        if (isVeterinary) {
            const fetchVeterinaries = async () => {
                setLoading(true);
                setError(null);
                try {
                    // Primero intentar usar las veterinarias de la sesión si están disponibles
                    const sessionVeterinaries = session?.veterinaries || [];
                    
                    if (sessionVeterinaries.length > 0) {
                        // Formatear veterinarias de la sesión
                        const formattedVeterinaries = sessionVeterinaries.map((v: any) => ({
                            id: v.id,
                            slug: v.slug,
                            name: v.name,
                        }));
                        setVeterinaries(formattedVeterinaries);
                        
                        // Si no hay una veterinaria seleccionada, seleccionar la primera
                        if (!selectedVeterinary && formattedVeterinaries.length > 0) {
                            setSelectedVeterinary(formattedVeterinaries[0]);
                        }
                        setLoading(false);
                        return;
                    }

                    // Si no hay en la sesión, hacer fetch a la API
                    const response = await fetch('/api/veterinaries?per_page=100');
                    
                    let data;
                    try {
                        data = await response.json();
                    } catch (jsonError) {
                        throw new Error('Respuesta inválida del servidor');
                    }

                    if (!response.ok) {
                        throw new Error(data.error || data.message || 'Error al cargar veterinarias');
                    }

                    // Adaptar respuesta de Laravel (puede venir como data.data o como array directo)
                    let veterinariesList: any[] = [];
                    if (data.data && Array.isArray(data.data)) {
                        veterinariesList = data.data;
                    } else if (Array.isArray(data)) {
                        veterinariesList = data;
                    }

                    // Extraer solo id, slug y name de cada veterinaria
                    const formattedVeterinaries = veterinariesList.map((v: any) => ({
                        id: v.id,
                        slug: v.slug || '',
                        name: v.name || '',
                    })).filter((v: any) => v.id && v.name); // Filtrar elementos inválidos

                    setVeterinaries(formattedVeterinaries);
                    
                    // Si no hay una veterinaria seleccionada y hay veterinarias disponibles, seleccionar la primera
                    if (!selectedVeterinary && formattedVeterinaries.length > 0) {
                        setSelectedVeterinary(formattedVeterinaries[0]);
                    }

                    if (formattedVeterinaries.length === 0) {
                        setError('No se encontraron veterinarias');
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Error al cargar veterinarias';
                    console.error('Error al cargar veterinarias:', err);
                    setError(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            fetchVeterinaries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVeterinary, status, session?.veterinaries]);

    const handleVeterinaryChange = (event: any) => {
        const veterinaryId = event.target.value;
        const veterinary = veterinaries.find(v => v.id === veterinaryId);
        if (veterinary) {
            setSelectedVeterinary(veterinary);
        }
    };

    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {isVeterinary && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="veterinary-select-label">Veterinaria</InputLabel>
                <Select
                    labelId="veterinary-select-label"
                    id="veterinary-select"
                    value={selectedVeterinary?.id || ''}
                    label="Veterinaria"
                    onChange={handleVeterinaryChange}
                    disabled={loading}
                    error={!!error}
                >
                    {loading ? (
                        <MenuItem disabled>
                            <CircularProgress size={20} />
                        </MenuItem>
                    ) : error ? (
                        <MenuItem disabled>
                            {error}
                        </MenuItem>
                    ) : veterinaries.length === 0 ? (
                        <MenuItem disabled>
                            No hay veterinarias disponibles
                        </MenuItem>
                    ) : (
                        veterinaries.map((veterinary) => (
                            <MenuItem key={veterinary.id} value={veterinary.id}>
                                {veterinary.name}
                            </MenuItem>
                        ))
                    )}
                </Select>
            </FormControl>
        )}
        <ThemeSwitcher />
        <Account />
      </Stack>
    );
}

export default function Layout(props: { children: React.ReactNode }) {
    const { isChanging } = useSelectedVeterinary();

    return (
        <>
            <DashboardLayout
                slots={{
                    appTitle: CustomAppTitle,
                    toolbarActions: ToolbarActionsSearch,
                }}
            >
                {props.children}
            </DashboardLayout>
            <Backdrop
                open={isChanging}
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress color="inherit" />
                    <Typography variant="h6">Cambiando...</Typography>
                </Box>
            </Backdrop>
        </>
    );
}  
