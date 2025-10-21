import React, { createContext, useReducer, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/ui/Toast';
import { auth, rtdb } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, set, onDisconnect, serverTimestamp } from 'firebase/database';

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
    showPixModal: false,
    user: null
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
        case 'SET_USER': return { ...state, user: action.payload };
        // Ação para resetar o estado ao finalizar o pedido
        case 'RESET_STATE':
            return {
                ...initialState,
                // Mantém o nome e telefone para facilitar novos pedidos
                customerName: state.customerName,
                customerPhone: state.customerPhone,
                user: state.user,
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
        const stateToPersist = { ...state, showCartModal: false, showPixModal: false, user: null };
        localStorage.setItem('acaiOrderState', JSON.stringify(stateToPersist));
    }, [state]);

    // NOVO HOOK DE EFEITO PARA PRESENÇA
    useEffect(() => {
        // Ouve o estado de autenticação
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Usuário está logado (ou anônimo)
                dispatch({ type: 'SET_USER', payload: user });

                // Define a referência de presença no Realtime Database
                const userStatusRef = ref(rtdb, 'onlineUsers/' + user.uid);

                // Cria o registro quando online
                set(userStatusRef, {
                    online: true,
                    lastSeen: serverTimestamp()
                });

                // Define o que fazer quando o usuário desconectar
                onDisconnect(userStatusRef).remove();

            } else {
                // Usuário está deslogado
                dispatch({ type: 'SET_USER', payload: null });
            }
        });

        // Limpa o listener de autenticação ao desmontar
        return () => unsubscribeAuth();
    }, []); // O array vazio garante que isso rode apenas uma vez

    return (
        <AppContext.Provider value={{ state, dispatch, showToast }}>
            {children}
            <Toast message={toast.message} visible={toast.visible} />
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };
