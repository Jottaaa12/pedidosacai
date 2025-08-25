import React from 'react';

const Toast = ({ message, visible }) => {
  return (
    <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2
      bg-gradient-to-r from-primary to-secondary text-white px-5 py-3 rounded-full
      font-medium shadow-lg transition-all duration-400 z-50
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {message}
    </div>
  );
};

export default Toast;