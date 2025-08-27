import React, { createContext, useReducer, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';

const AppContext = createContext();

const initialAcaiState = {
    size: null,
    customPrice: '',
    creams: [],
    toppings: [],
    fruits: [],
    syrup: 'Sem cobertura',
    notes: ''
};

const initialState = {
    customerName: '',
    customerPhone: '',
    currentStep: 1,
    currentView: 'form',
    cart: [],
    delivery: {},
    payment: {},
    currentAcai: initialAcaiState,
    showCartModal: false,
    showPixModal: false
};

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CUSTOMER_INFO':
            return {
                ...state,
                customerName: action.payload.name,
                customerPhone: action.payload.phone,
                currentStep: 2
            };
        case 'ADD_TO_CART': return { ...state, cart: [...state.cart, action.payload] };
        case 'UPDATE_CURRENT_ACAI': return { ...state, currentAcai: action.payload };
        case 'RESET_CURRENT_ACAI': return { ...state, currentAcai: initialAcaiState };
        case 'REPEAT_ORDER': return { ...state, cart: action.payload };
        case 'SET_DELIVERY': return { ...state, delivery: action.payload };
        case 'SET_PAYMENT': return { ...state, payment: action.payload };
        case 'NEXT_STEP': return { ...state, currentStep: state.currentStep + 1 };
        case 'PREV_STEP': return { ...state, currentStep: Math.max(1, state.currentStep - 1) };
        case 'SET_STEP': return { ...state, currentStep: action.payload };
        case 'SHOW_CART_MODAL': return { ...state, showCartModal: true };
        case 'HIDE_CART_MODAL': return { ...state, showCartModal: false };
        case 'SHOW_PIX_MODAL': return { ...state, showPixModal: true };
        case 'HIDE_PIX_MODAL': return { ...state, showPixModal: false };
        case 'SHOW_ADMIN': return { ...state, currentView: 'admin' };
        case 'SHOW_FORM': return { ...state, currentView: 'form' };
        // Ação para resetar o estado ao finalizar o pedido
        case 'RESET_STATE':
            return {
                ...initialState,
                // Mantém o nome e telefone para facilitar novos pedidos
                customerName: state.customerName,
                customerPhone: state.customerPhone,
            };
        default: return state;
    }
};

const AppProvider = ({ children }) => {
    const { toast, showToast } = useToast();

    // Carrega o estado do localStorage na inicialização
    const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
        try {
            const persisted = localStorage.getItem('acaiOrderState');
            if (!persisted) return initial;
            
            const persistedState = JSON.parse(persisted);
            // Garante que o estado de modais e o passo inicial estejam corretos
            return {
                ...persistedState,
                currentStep: persistedState.currentStep > 1 ? persistedState.currentStep : 1,
                showCartModal: false,
                showPixModal: false,
            };
        } catch (error) {
            console.error("Failed to parse state from localStorage", error);
            return initial;
        }
    });

    // Salva o estado no localStorage a cada mudança
    useEffect(() => {
        // Não salva o estado de modais abertos
        const stateToPersist = { ...state, showCartModal: false, showPixModal: false };
        localStorage.setItem('acaiOrderState', JSON.stringify(stateToPersist));
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch, showToast }}>
            {children}
            <Toast message={toast.message} visible={toast.visible} />
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };