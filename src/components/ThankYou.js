import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ThankYou = () => {
  const { dispatch } = useContext(AppContext);

  const handleNewOrder = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center text-center" style={{ minHeight: '400px' }}>
      <img 
        src="https://media.giphy.com/media/3o_sI2MWBG4Lu_6d56/giphy.gif" 
        alt="Obrigado" 
        className="w-48 h-auto mx-auto mb-4 rounded-lg"
      />
      <h2 className="text-2xl font-bold text-primary mb-3">🎉 Pedido Enviado!</h2>
      <p className="text-gray-600 mb-6">Obrigado por escolher o Sabor da Terra! Seu pedido foi enviado e logo será preparado.</p>
      
      <button 
        onClick={handleNewOrder}
        className="py-3 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110"
      >
        Fazer Novo Pedido
      </button>
    </div>
  );
};

export default ThankYou;
