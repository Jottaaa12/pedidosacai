import React, { useContext } from 'react';
import { AppContext } from '../../../src/context/AppContext';
import { FaTrashAlt } from 'react-icons/fa';

const CartListModal = () => {
  const { state, dispatch } = useContext(AppContext);
  const { isCartListOpen, cart } = state;

  if (!isCartListOpen) return null;

  const getAcaiSummary = (item) => {
    let summary = [];
    if (item.size) summary.push(`Tamanho: ${item.size.label || item.size.name}`);
    if (item.creams && item.creams.length) summary.push(`Cremes: ${item.creams.map(c => c.name).join(', ')}`);
    if (item.toppings && item.toppings.length) summary.push(`Acompanhamentos: ${item.toppings.map(t => t.name).join(', ')}`);
    if (item.fruits && item.fruits.length) summary.push(`Frutas: ${item.fruits.map(f => f.name).join(', ')}`);
    if (item.syrup && item.syrup.name !== 'Sem cobertura') summary.push(`Cobertura: ${item.syrup.name}`);
    if (item.notes) summary.push(`Obs: ${item.notes}`);
    return summary.join(' | ');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
      onClick={() => dispatch({ type: 'HIDE_CART_LIST' })}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-11/12 max-w-md max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()} // Evita fechar o modal ao clicar dentro dele
      >
        <h2 className="text-2xl font-bold text-primary mb-4">Meu Pedido</h2>

        <div className="flex-grow overflow-y-auto mb-4 pr-2">
          {cart.length === 0 ? (
            <p className="text-gray-600">Seu carrinho está vazio.</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b py-2 last:border-b-0">
                <div className="flex-grow">
                  <p className="font-semibold">Copo {index + 1}</p>
                  <p className="text-sm text-gray-700">{getAcaiSummary(item)}</p>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: index })}
                  className="ml-4 p-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Excluir item"
                >
                  <FaTrashAlt size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => dispatch({ type: 'HIDE_CART_LIST' })}
            className="py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Continuar Montando Copos
          </button>
          {cart.length > 0 && (
            <button
              onClick={() => { dispatch({ type: 'HIDE_CART_LIST' }); dispatch({ type: 'SET_STEP', payload: 7 }); }}
              className="py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-lg hover:from-secondary hover:to-primary transition-all"
            >
              Finalizar Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartListModal;
