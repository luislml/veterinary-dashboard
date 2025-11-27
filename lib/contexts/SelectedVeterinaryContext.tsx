'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SelectedVeterinary {
    id: number;
    slug: string;
    name: string;
}

interface SelectedVeterinaryContextType {
    selectedVeterinary: SelectedVeterinary | null;
    setSelectedVeterinary: (veterinary: SelectedVeterinary | null) => void;
    isChanging: boolean;
}

const SelectedVeterinaryContext = createContext<SelectedVeterinaryContextType | undefined>(undefined);

export function SelectedVeterinaryProvider({ children }: { children: ReactNode }) {
    const [selectedVeterinary, setSelectedVeterinaryState] = useState<SelectedVeterinary | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    // Cargar la veterinaria seleccionada del localStorage al iniciar
    useEffect(() => {
        const stored = localStorage.getItem('selectedVeterinary');
        if (stored) {
            try {
                setSelectedVeterinaryState(JSON.parse(stored));
            } catch (error) {
                console.error('Error al cargar veterinaria seleccionada:', error);
            }
        }
    }, []);

    // Guardar en localStorage cuando cambie
    const setSelectedVeterinary = (veterinary: SelectedVeterinary | null) => {
        setIsChanging(true);
        setSelectedVeterinaryState(veterinary);
        if (veterinary) {
            localStorage.setItem('selectedVeterinary', JSON.stringify(veterinary));
        } else {
            localStorage.removeItem('selectedVeterinary');
        }
        // Desactivar el estado de cambio después de un breve delay para permitir que los componentes se actualicen
        setTimeout(() => {
            setIsChanging(false);
        }, 500);
    };

    return (
        <SelectedVeterinaryContext.Provider value={{ selectedVeterinary, setSelectedVeterinary, isChanging }}>
            {children}
        </SelectedVeterinaryContext.Provider>
    );
}

export function useSelectedVeterinary() {
    const context = useContext(SelectedVeterinaryContext);
    if (context === undefined) {
        throw new Error('useSelectedVeterinary debe ser usado dentro de un SelectedVeterinaryProvider');
    }
    return context;
}

