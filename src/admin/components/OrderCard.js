import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { generateWhatsAppLink } from '../utils/whatsapp'; // Importa a função

// Ícone do WhatsApp
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.651 4.383 1.803 6.147l-.992 3.628 3.746-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

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


const OrderCard = ({ order, index, onOpenDetails, status }) => { // Recebe o status
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

  // Gera o link do WhatsApp
  const whatsAppLink = generateWhatsAppLink(order, status);

  const handleWhatsAppClick = (e) => {
    e.stopPropagation(); // Impede que o modal de detalhes seja aberto
    if (whatsAppLink) {
      window.open(whatsAppLink, '_blank');
    }
  };

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
              <div className="flex items-center space-x-2">
                {whatsAppLink && (
                  <button
                    onClick={handleWhatsAppClick}
                    className="flex items-center text-sm bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                  >
                    <WhatsAppIcon />
                    <span>Enviar</span>
                  </button>
                )}
                <button 
                  onClick={() => onOpenDetails(order)} 
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-md transition-colors"
                >
                  Detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default OrderCard;