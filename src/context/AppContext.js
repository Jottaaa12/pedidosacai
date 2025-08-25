// src/context/AppContext.js
import React, { createContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useToast } from '../hooks/useToast';
import { ADMIN_PHONE } from '../services/menu';
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

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_USER': return { ...state, user: action.payload };
        case 'SET_CUSTOMER_INFO': return { ...state, customerName: action.payload.name, customerPhone: action.payload.phone, isQuickOrder: false };
        case 'SET_QUICK_ORDER': return { ...state, customerName: action.payload.name, customerPhone: action.payload.phone, isQuickOrder: true, currentStep: 2 };
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
        case 'SHOW_MY_ORDERS': return { ...state, currentView: 'myOrders' };
        case 'SHOW_FORM': return { ...state, currentView: 'form' };
        default: return state;
    }
};

const AppProvider = ({ children }) => {
    const { toast, showToast } = useToast();

    const [state, dispatch] = useReducer(appReducer, {
        user: null,
        customerName: '',
        customerPhone: '',
        isQuickOrder: false,
        currentStep: 1,
        currentView: 'form',
        cart: [],
        delivery: {},
        payment: {},
        currentAcai: initialAcaiState,
        showCartModal: false,
        showPixModal: false
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            dispatch({ type: 'SET_USER', payload: user });

            if (user) {
                if (user.phoneNumber === ADMIN_PHONE) {
                    dispatch({ type: 'SHOW_ADMIN' });
                } else {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        const displayName = userDoc.exists() ? userDoc.data().displayName : '';
                        dispatch({ type: 'SET_CUSTOMER_INFO', payload: { name: displayName, phone: user.phoneNumber } });

                        if (displayName) {
                            dispatch({ type: 'SET_STEP', payload: 2 });
                        } else {
                            dispatch({ type: 'SET_STEP', payload: 1 });
                        }

                    } catch (error) {
                        console.error('Erro ao buscar dados do usuário:', error);
                        dispatch({ type: 'SET_STEP', payload: 1 });
                    }
                }
            } else {
                dispatch({ type: 'SET_CUSTOMER_INFO', payload: { name: '', phone: '' } });
                dispatch({ type: 'SET_STEP', payload: 1 });
                dispatch({ type: 'SHOW_FORM' });
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch, showToast }}>
            {children}
            <Toast message={toast.message} visible={toast.visible} />
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };