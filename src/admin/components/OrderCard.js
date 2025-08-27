import React from 'react';

const OrderCard = ({ order, onOpenDetails, onUpdateStatus, onCancelOrder }) => {
  const { userName, total, status, timestamp } = order;

  const getStatusClass = (status) => {
    switch (status) {
      case 'Novo':
        return 'bg-blue-500';
      case 'Em Preparo':
        return 'bg-yellow-500';
      case 'Saiu para Entrega':
        return 'bg-green-500';
      case 'Finalizado':
        return 'bg-gray-500';
      case 'Cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      <div className="flex-grow mb-4">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{userName}</h3>
          <span className={`px-2 py-1 text-xs font-bold text-white rounded ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>
        <p className="text-gray-600">Total: R$ {total.toFixed(2)}</p>
        <p className="text-gray-500 text-sm">
          {new Date(timestamp?.toDate()).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <button onClick={() => onOpenDetails(order)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
          Ver Detalhes
        </button>
        <select 
          onChange={(e) => onUpdateStatus(order.id, e.target.value)} 
          value={status}
          className="w-full bg-gray-200 border-gray-300 rounded"
        >
          <option value="Novo">Novo</option>
          <option value="Em Preparo">Em Preparo</option>
          <option value="Saiu para Entrega">Saiu para Entrega</option>
          <option value="Finalizado">Finalizado</option>
        </select>
        <button onClick={() => onCancelOrder(order.id)} className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">
          Cancelar Pedido
        </button>
      </div>
    </div>
  );
};

export default OrderCard;
