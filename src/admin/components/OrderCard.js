import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

// Ícones SVG para melhor visualização
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);


const OrderCard = ({ order, index, onOpenDetails }) => {
  // Corrigindo os nomes dos campos para corresponder à estrutura de dados do Firestore
  const { clienteNome, pagamento, dataDoPedido, carrinho, entrega } = order;

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return 'N/A';
    return timestamp.toDate().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deliveryTime = entrega.time || 'N/A';
  const totalItems = carrinho?.length || 0;

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-md mb-4 border-l-4 ${
            snapshot.isDragging ? 'shadow-lg border-purple-500' : 'border-gray-200'
          }`}
        >
          <div className="p-4">
            <div className="flex items-center mb-3">
                <UserIcon />
                <h3 className="font-bold text-lg text-gray-800 truncate">{clienteNome}</h3>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                    <ClockIcon /> 
                    <span>Pedido: {formatTime(dataDoPedido)}</span>
                    <span className="mx-2">|</span>
                    <span>Entrega: {deliveryTime}</span>
                </div>
                <div className="flex items-center">
                    <BagIcon />
                    <span>{totalItems} {totalItems > 1 ? 'itens' : 'item'}</span>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="font-bold text-lg text-purple-700">
                R$ {pagamento?.finalTotal?.toFixed(2) || '0.00'}
              </p>
              <button 
                onClick={() => onOpenDetails(order)} 
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-md transition-colors"
              >
                Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default OrderCard;