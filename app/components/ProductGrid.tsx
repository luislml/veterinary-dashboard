'use client';
import * as React from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    CardMedia,
    Button,
    Avatar,
    Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { API_CONFIG } from '../../lib/config';

export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    code: string;
    image?: string;
    images?: object[] | null;
}

interface ProductGridProps {
    onAddToCart: (product: Product) => void;
    disabled?: boolean;
    veterinaryId?: number;
    open?: boolean; // Para saber cuándo cargar productos
}

export default function ProductGrid({ 
    onAddToCart,
    disabled = false,
    veterinaryId,
    open = true
}: ProductGridProps) {
    const [products, setProducts] = React.useState<Product[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [searchInput, setSearchInput] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    // Cargar productos
    const loadProducts = React.useCallback(async () => {
        if (!open) return;
        
        try {
            setLoading(true);
            let url = `/api/products?page=${page}&per_page=12`;
            if (veterinaryId) {
                url += `&veterinary_id=${veterinaryId}`;
            }
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            
            const response = await fetch(url);
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Respuesta inválida del servidor');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cargar productos');
            }

            if (data.data) {
                setProducts(data.data);
                setTotalPages(data.meta?.last_page || 1);
            } else if (Array.isArray(data)) {
                setProducts(data);
                setTotalPages(1);
            } else {
                setProducts([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error al cargar productos:', err);
            setProducts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [open, veterinaryId, page, searchTerm]);

    // Cargar productos cuando cambia la página, término de búsqueda o se abre
    React.useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Resetear página cuando cambia el término de búsqueda
    React.useEffect(() => {
        if (searchTerm !== undefined) {
            setPage(1);
        }
    }, [searchTerm]);

    // Resetear cuando se abre/cierra
    React.useEffect(() => {
        if (open) {
            setPage(1);
            setSearchInput('');
            setSearchTerm('');
        }
    }, [open]);

    // Manejar búsqueda al presionar Enter
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setSearchTerm(searchInput);
        }
    };

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Productos</Typography>
            
            {/* Buscador */}
            <TextField
                fullWidth
                size="small"
                placeholder="Buscar productos... (Presiona Enter para buscar)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            {/* Grid de productos */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : products.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        No hay productos disponibles
                    </Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        {products.map((product) => {
                        const baseUrl = API_CONFIG.baseURL.replace('/api', '');
                        const imageUrl = product.images && product.images.length > 0 
                            ? `${baseUrl}/${(product.images as any)[product.images.length - 1].url}`
                            : null;
                        
                        return (
                            <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {imageUrl ? (
                                    <CardMedia
                                        component="img"
                                        height="120"
                                        image={imageUrl}
                                        alt={product.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <Avatar
                                        src={imageUrl || undefined}
                                        sx={{ width: '100%', height: 120 }}
                                        variant="square"
                                    >
                                        {product.name[0]}
                                    </Avatar>
                                )}
                                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                    <Typography variant="subtitle2" noWrap>
                                        {product.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Código: {product.code}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                        bs/{Number(product.price).toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Stock: {product.stock}
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 1 }}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => onAddToCart(product)}
                                        disabled={disabled || product.stock <= 0}
                                    >
                                        Agregar
                                    </Button>
                                </Box>
                            </Card>
                        );
                    })}
                    </Box>
                    
                    {/* Paginación */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, newPage) => setPage(newPage)}
                                color="primary"
                                size="small"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
}

