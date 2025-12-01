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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

export interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    code: string;
    image?: string;
}

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAddToCart: (product: Product) => void;
    disabled?: boolean;
}

export default function ProductGrid({ 
    products, 
    loading, 
    searchTerm, 
    onSearchChange, 
    onAddToCart,
    disabled = false 
}: ProductGridProps) {
    // Filtrar productos por búsqueda
    const filteredProducts = React.useMemo(() => {
        if (!searchTerm) return products;
        const term = searchTerm.toLowerCase();
        return products.filter(p => {
            const name = p.name?.toLowerCase() || '';
            const code = p.code?.toLowerCase() || '';
            return name.includes(term) || code.includes(term);
        });
    }, [products, searchTerm]);

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Productos</Typography>
            
            {/* Buscador */}
            <TextField
                fullWidth
                size="small"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
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
            ) : filteredProducts.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        No hay productos disponibles
                    </Typography>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {filteredProducts.map((product) => {
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
                        const imageUrl = product.image 
                            ? (product.image.startsWith('http') 
                                ? product.image 
                                : `${baseUrl}/storage/${product.image}`)
                            : null;
                        
                        return (
                            <Card key={product.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                {imageUrl && (
                                    <CardMedia
                                        component="img"
                                        height="120"
                                        image={imageUrl}
                                        alt={product.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
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
            )}
        </Box>
    );
}

