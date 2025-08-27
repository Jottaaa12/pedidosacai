import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ADMIN_PHONE } from './services/menu';

// Importa os componentes principais da loja
import Authentication from './components/Authentication';
import ProductBuilder from './components/ProductBuilder';
import DeliveryForm from './components/DeliveryForm';
import Payment from './components/Payment';
import OrderSummary from './components/OrderSummary';

// Importa os componentes do painel de administração
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminLogin from './admin/pages/AdminLogin';
import GerenciarCardapio from './admin/pages/GerenciarCardapio';

// Importa componentes da UI
import CartIndicator from './components/ui/CartIndicator';
import ProgressBar from './components/ui/ProgressBar';
import PixModal from './components/ui/PixModal';
import CartModal from './components/ui/CartModal';

// Componente para a loja principal
const Store = () => {
    const { state } = useContext(AppContext);

    const renderCurrentView = () => {
        switch (state.currentStep) {
            case 1: return <Authentication />;
            case 2:
            case 3:
            case 4:
            case 5:
            case 6: return <ProductBuilder />;
            case 7: return <DeliveryForm />;
            case 8: return <Payment />;
            case 9: return <OrderSummary />;
            default: return <Authentication />;
        }
    };

    return (
        <>
            <CartIndicator count={state.cart.length} />
            <ProgressBar currentStep={state.currentStep} />
            
            <div className="relative">
                {renderCurrentView()}
            </div>

            <div className="text-center p-4 bg-gray-100 text-xs text-gray-600 border-t">
                Gerenciamento de pedidos, feito por{' '}
                <a href="https://instagram.com/jottaaa0" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                    @jottaaa0
                </a>
            </div>

            <PixModal />
            <CartModal />
        </>
    );
};

// Componente de Rota Privada para o Admin
const PrivateRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.phoneNumber === ADMIN_PHONE) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Verificando autenticação...</div>; // Ou um spinner
    }

    return isAdmin ? children : <Navigate to="/admin/login" />;
};


const AppContent = () => (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-5 font-poppins">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
            <AppProvider>
                <Store />
            </AppProvider>
        </div>
    </div>
);

export default function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
                path="/admin/dashboard" 
                element={
                    <PrivateRoute>
                        <AdminLayout>
                            <AdminDashboard />
                        </AdminLayout>
                    </PrivateRoute>
                } 
            />
            <Route 
                path="/admin/cardapio" 
                element={
                    <PrivateRoute>
                        <AdminLayout>
                            <GerenciarCardapio />
                        </AdminLayout>
                    </PrivateRoute>
                } 
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
    </Router>
  );
}