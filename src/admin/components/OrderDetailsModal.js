import React from 'react';

const OrderDetailsModal = ({ order, onClose, onDeleteOrder }) => {
  if (!order) return null;

  const { userName, userPhone, cart, deliveryInfo, paymentInfo, total } = order;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Detalhes do Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Cliente</h3>
            <p><strong>Nome:</strong> {userName}</p>
            <p><strong>Telefone:</strong> {userPhone}</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Entrega</h3>
            <p><strong>Local:</strong> {deliveryInfo.location}</p>
            <p><strong>Detalhes:</strong> {deliveryInfo.details}</p>
            <p><strong>Horário:</strong> {deliveryInfo.time}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Pagamento</h3>
            <p><strong>Método:</strong> {paymentInfo.method}</p>
            {paymentInfo.change && <p><strong>Troco para:</strong> R$ {paymentInfo.change}</p>}
            <p className="font-bold text-xl mt-2">Total: R$ {total.toFixed(2)}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Itens do Pedido</h3>
            {cart.map((item, index) => (
              <div key={index} className="mb-4 p-2 border rounded">
                <p className="font-semibold">{item.name} ({item.size})</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {item.cremes && <li><strong>Cremes:</strong> {item.cremes.join(', ')}</li>}
                  {item.acompanhamentos && <li><strong>Acompanhamentos:</strong> {item.acompanhamentos.join(', ')}</li>}
                  {item.frutas && <li><strong>Frutas:</strong> {item.frutas.join(', ')}</li>}
                  {item.cobertura && <li><strong>Cobertura:</strong> {item.cobertura}</li>}
                  {item.observacoes && <li className="mt-1"><strong>Observações:</strong> {item.observacoes}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={() => onDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Excluir Pedido
          </button>
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
