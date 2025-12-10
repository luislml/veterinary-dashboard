
"use client";
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: { light: true, dark: true },
    // palette: {
    //     primary: {
    //         main: '#48cb7f'
    //     },
    //     secondary: {
    //         main: '#84f0b1'
    //     }
    // },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiTableContainer: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1876d3',
                    'th': {
                        color: 'white',
                        fontWeight: 'bold',
                    },
                },
            },
        },
        MuiTableRow:{
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    'transition': 'background-color 0.2s',
                },
            },
        }
    },
});

export default theme;
  