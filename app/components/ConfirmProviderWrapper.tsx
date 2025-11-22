'use client';

import { ConfirmProvider } from "material-ui-confirm";
import { ReactNode } from "react";

interface ConfirmProviderWrapperProps {
    children: ReactNode;
}

export default function ConfirmProviderWrapper({ children }: ConfirmProviderWrapperProps) {
    return <ConfirmProvider
        defaultOptions={{
            confirmationButtonProps: {
                color: "primary",
                variant: "contained",
            },
            cancellationButtonProps: {
                color: "error",
            },
            dialogProps: {
                maxWidth: 'xs'
            },
        }}
    >{children}</ConfirmProvider>;
}

