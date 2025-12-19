'use client';
import * as React from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Link,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import serverSignIn from './actions';
import Image from 'next/image';

export default function SignIn() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [emailFocused, setEmailFocused] = React.useState(false);
    const [emailError, setEmailError] = React.useState<string | null>(null);
    const [passwordError, setPasswordError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setEmailError(null);
        setPasswordError(null);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const result = await serverSignIn(
                { id: 'credentials', name: 'Credentials' },
                formData
            );
            console.log('result', result);

            if (result?.error) {
                // Parsear errores por campo
                const fieldErrors = (result as any).fieldErrors || {};
                
                // Establecer errores específicos por campo
                if (fieldErrors.email && Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0) {
                    setEmailError(fieldErrors.email[0]);
                }
                if (fieldErrors.password && Array.isArray(fieldErrors.password) && fieldErrors.password.length > 0) {
                    setPasswordError(fieldErrors.password[0]);
                }
                
                // Si hay un mensaje general pero no errores por campo, mostrarlo
                if (!fieldErrors.email && !fieldErrors.password) {
                    setError(result.error);
                }
            } else {
                // Login exitoso
                setEmailError(null);
                setPasswordError(null);
                setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
            }
        } catch (err) {
            // NEXT_REDIRECT es lanzado por Next.js cuando el login es exitoso
            if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
                setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } else {
                setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                width: '100%',
            }}
        >
            {/* Left Side - Illustration */}
            <Box
                sx={{
                    flex: {xs: 1, lg: 1.5},
                    backgroundColor: '#FAFAFA',
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: 4,
                }}
            >
                {/* Logo */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 32,
                        left: 32,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: '#1a1a1a',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Logo
                    </Typography>
                </Box>

                {/* Illustration Placeholder - You can replace this with an actual image */}
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 500,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Image
                        src="/images/login-bg2.svg"
                        alt="Ilustración de login"
                        width={500}
                        height={400}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </Box>
            </Box>

            {/* Right Side - Login Form */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: { xs: 3, md: 6 },
                    boxShadow: '0 10px 15px -3px #0000001a,0 4px 6px -4px #0000001a',
                    zIndex: 1,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 450,
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            mb: 1,
                            fontSize: { xs: '2rem', md: '2.5rem' },
                        }}
                    >
                        Bienvenido a Veterinaria APP
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            mb: 4,
                            fontSize: '1rem',
                        }}
                    >
                        Su panel de administración
                    </Typography>

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            {success}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                label="Correo electrónico"
                                size="small"
                                required
                                fullWidth
                                autoComplete="email"
                                type="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                disabled={loading}
                                placeholder="correo@ejemplo.com"
                                error={emailError ? true : false}
                                helperText={emailError ?? ''}
                            />
                        </Box>

                        <Box sx={{ mb: 5 }}>
                            <TextField
                                required
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                label="Contraseña"
                                placeholder="********"
                                size="small"
                                error={passwordError ? true : false}
                                helperText={passwordError ?? ''}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? (
                                                    <VisibilityOffIcon />
                                                ) : (
                                                    <VisibilityIcon />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                                ) : (
                                    'INICIAR SESIÓN'
                                )}
                            </Button>
                        </Box>
                    </form>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link
                            href="/auth/reset-password"
                            sx={{
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                },
                            }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}