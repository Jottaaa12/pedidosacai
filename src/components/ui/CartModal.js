import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';

const CartModal = () => {
  const { state, dispatch } = useContext(AppContext);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (state.showCartModal) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [state.showCartModal]);

  const handleAction = (actionFn) => {
    setShow(false);
    setTimeout(() => {
      actionFn();
    }, 300); // Aguarda a animação de saída
  };

  if (!state.showCartModal) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl max-w-sm w-full text-center overflow-hidden transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <h3 className="text-lg font-semibold text-white">Copo Adicionado!</h3>
        </div>
        
        <div className="p-6">
          <p className="mb-6">O que você deseja fazer agora?</p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleAction(() => {
                dispatch({ type: 'HIDE_CART_MODAL' });
                dispatch({ type: 'SET_STEP', payload: 2 });
              })}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium transition-colors hover:bg-gray-100 hover:border-gray-400"
            >
              Montar Outro Copo
            </button>
            <button
              onClick={() => handleAction(() => {
                dispatch({ type: 'HIDE_CART_MODAL' });
                dispatch({ type: 'SET_STEP', payload: 7 });
              })}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
