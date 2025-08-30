import React from 'react';
import { FaTimes } from 'react-icons/fa';

const MoveOrderMenu = ({ order, statuses, onMove, onClose }) => {
  if (!order) return null;

  // Filtra para não mostrar o status atual como uma opção de movimentação
  const availableStatuses = statuses.filter(status => status !== order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 truncate">Mover Pedido</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>
        
        <div className="mb-2">
            <p className="text-sm text-gray-600">Cliente: <span className="font-semibold">{order.clienteNome}</span></p>
            <p className="text-sm text-gray-600">Status Atual: <span className="font-semibold">{order.status}</span></p>
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-gray-700">Mover para:</p>
          {availableStatuses.map(status => (
            <button
              key={status}
              onClick={() => onMove(order.id, status)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoveOrderMenu;
