import React from 'react';

const CartIndicator = ({ count }) => {
  return (
    <div className={`absolute top-4 right-5 bg-primary text-white w-7 h-7 rounded-full
      flex items-center justify-center text-sm font-semibold shadow-lg
      transition-transform duration-300 ${count > 0 ? 'scale-100' : 'scale-0'}`}>
      {count}
    </div>
  );
};

export default CartIndicator;