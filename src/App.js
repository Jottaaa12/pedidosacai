import React, { useContext } from 'react';
import { AppProvider, AppContext } from './context/AppContext';

// Importa os componentes principais
import Authentication from './components/Authentication';
import ProductBuilder from './components/ProductBuilder';
import DeliveryForm from './components/DeliveryForm';
import Payment from './components/Payment';
import OrderSummary from './components/OrderSummary';
import AdminPanel from './components/AdminPanel';
import MyOrders from './components/MyOrders';

// Importa componentes da UI
import CartIndicator from './components/ui/CartIndicator';
import ProgressBar from './components/ui/ProgressBar';
import PixModal from './components/ui/PixModal';
import CartModal from './components/ui/CartModal';

const MainApp = () => {
    const { state } = useContext(AppContext);

    const renderCurrentView = () => {
        if (state.currentView === 'admin') return <AdminPanel />;
        if (state.currentView === 'myOrders') return <MyOrders />;

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

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-5 font-poppins">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
        <AppProvider>
          <MainApp />
        </AppProvider>
      </div>
    </div>
  );
}