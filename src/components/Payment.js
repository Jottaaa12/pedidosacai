import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { PAYMENT_METHODS } from '../services/menu';

const Payment = () => {
    const { state, dispatch, showToast } = useContext(AppContext);
    const [paymentData, setPaymentData] = useState(state.payment || { method: '', cashChange: '' });

    const baseTotal = state.cart.reduce((total, item) => total + item.size.price + item.additionalToppingCost, 0);
    const calculateTotal = (method) => {
        const currentMethod = method || paymentData.method;
        if (currentMethod === 'Cartão de Crédito') return baseTotal * 1.034;
        if (currentMethod === 'Cartão de Débito') return baseTotal * 1.014;
        return baseTotal;
    };
    
    const handleNext = () => {
        if (!paymentData.method) { showToast('Selecione uma forma de pagamento'); return; }
        dispatch({ type: 'SET_PAYMENT', payload: { ...paymentData, baseTotal, finalTotal: calculateTotal() } });
        dispatch({ type: 'NEXT_STEP' });
    };

    const handlePixButtonClick = () => {
        const finalTotal = calculateTotal('Pix');
        dispatch({ type: 'SET_PAYMENT', payload: { ...paymentData, method: 'Pix', baseTotal, finalTotal } });
        dispatch({ type: 'SHOW_PIX_MODAL' });
    };
    
    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-primary mb-4">💳 Pagamento</h2>
            <select value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})} className="w-full p-3 border rounded-lg mb-4">
                <option value="">Selecione a forma de pagamento</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {paymentData.method === 'Pix' && <button onClick={handlePixButtonClick} className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110">Gerar QR Code</button>}
            {paymentData.method === 'Dinheiro' && <input type="number" value={paymentData.cashChange} onChange={(e) => setPaymentData({...paymentData, cashChange: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="Troco para?"/>}
            {(paymentData.method === 'Cartão de Crédito' || paymentData.method === 'Cartão de Débito') && <p className="text-sm bg-blue-50 p-2 rounded">Total com taxa: R$ {calculateTotal().toFixed(2)}</p>}
            <div className="flex gap-3 mt-4"><button onClick={() => dispatch({ type: 'PREV_STEP' })} className="flex-1 py-3 border rounded-lg transition-colors hover:bg-gray-100 hover:border-gray-400">Voltar</button><button onClick={handleNext} disabled={!paymentData.method} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50 font-semibold transition-transform transform hover:scale-105 hover:brightness-110">Ver Resumo</button></div>
        </div>
    );
};

export default Payment;