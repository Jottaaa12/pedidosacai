import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { FaShoppingCart } from 'react-icons/fa';

const CartIndicator = () => {
  const { state, dispatch } = useContext(AppContext);
  const itemCount = state.cart.length;

  if (itemCount === 0) return null;

  return (
    <button
      onClick={() => dispatch({ type: 'SHOW_CART_LIST' })}
      className="fixed bottom-6 right-6 z-40 cursor-pointer transition-transform hover:scale-110"
    >
      <div className="relative flex items-center justify-center p-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full shadow-lg">
        <FaShoppingCart size={24} />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
          {itemCount}
        </span>
      </div>
    </button>
  );
};

export default CartIndicator;
