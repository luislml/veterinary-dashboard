
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
    },
});

export default theme;
  