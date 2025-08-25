import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const CartModal = () => {
  const { state, dispatch } = useContext(AppContext);

  if (!state.showCartModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-primary mb-4">Copo Adicionado!</h3>
        <p className="mb-6">O que você deseja fazer agora?</p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              dispatch({ type: 'HIDE_CART_MODAL' });
              dispatch({ type: 'SET_STEP', payload: 2 });
            }}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Montar Outro Copo
          </button>
          <button
            onClick={() => {
              dispatch({ type: 'HIDE_CART_MODAL' });
              dispatch({ type: 'SET_STEP', payload: 7 });
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;