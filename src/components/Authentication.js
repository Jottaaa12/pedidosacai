import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Authentication = () => {
  const { dispatch } = useContext(AppContext);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const startOrder = () => {
    dispatch({
      type: 'SET_CUSTOMER_INFO',
      payload: { name: customerData.name, phone: customerData.phone }
    });
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <img src="https://i.imgur.com/9VzcNVM.png" alt="Logo" className="max-w-30 mx-auto mb-4"/>
        <h1 className="text-3xl font-bold text-primary mb-2">Açaí Sabor da Terra</h1>
        <p><a href="https://instagram.com/acaisabordaterra_" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-medium">@acaisabordaterra_</a></p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nome Completo</label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg"
            placeholder="Digite seu nome completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Telefone (com DDD)</label>
          <input
            type="tel"
            name="phone"
            value={customerData.phone}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg"
            placeholder="Ex: 88912345678"
          />
        </div>
        <button
          onClick={startOrder}
          disabled={!customerData.name || customerData.phone.length < 10}
          className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50"
        >
          Iniciar Pedido
        </button>
      </div>
    </div>
  );
};

export default Authentication;
