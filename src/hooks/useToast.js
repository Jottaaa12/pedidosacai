// src/hooks/useToast.js
import { useState } from 'react';

export const useToast = () => {
    const [toast, setToast] = useState({ message: '', visible: false });

    const showToast = (message) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 2500);
    };

    return { toast, showToast };
};