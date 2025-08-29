import React from 'react';
import { formatPhoneNumberForWhatsApp } from '../utils/whatsapp';

const OrderDetailsModal = ({ order, onClose, onDeleteOrder, onPrint }) => {
  if (!order) return null;

  const { clienteNome, clienteTelefone, carrinho, entrega, pagamento } = order;

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
            <p><strong>Nome:</strong> {clienteNome}</p>
            <p><strong>Telefone:</strong> 
              <a 
                href={`https://wa.me/${formatPhoneNumberForWhatsApp(clienteTelefone)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                {clienteTelefone || 'Não informado'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Entrega</h3>
            <p><strong>Local:</strong> {entrega.college}</p>
            <p><strong>Detalhes:</strong> {entrega.block} {entrega.room} {entrega.ufdparDetails} {entrega.otherDetails}</p>
            <p><strong>Horário:</strong> {entrega.time || new Date(entrega.date).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Pagamento</h3>
            <p><strong>Método:</strong> {pagamento?.method}</p>
            {pagamento?.cashChange && <p><strong>Troco para:</strong> R$ {pagamento.cashChange}</p>}
            <p className="font-bold text-xl mt-2">Total: R$ {pagamento?.finalTotal?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg mb-2 border-b pb-1">Itens do Pedido</h3>
            {carrinho.map((item, index) => (
              <div key={index} className="mb-4 p-2 border rounded">
                <p className="font-semibold">{item.size.label}</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {item.creams && item.creams.length > 0 && <li><strong>Cremes:</strong> {item.creams.map(c => c.name).join(', ')}</li>}
                  {item.toppings && item.toppings.length > 0 && <li><strong>Acompanhamentos:</strong> {item.toppings.map(t => t.name).join(', ')}</li>}
                  {item.fruits && item.fruits.length > 0 && <li><strong>Frutas:</strong> {item.fruits.map(f => f.name).join(', ')}</li>}
                  {item.syrup && item.syrup !== 'Sem cobertura' && <li><strong>Cobertura:</strong> {item.syrup.name || item.syrup}</li>}
                  {item.notes && <li className="mt-1"><strong>Observações:</strong> {item.notes}</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={onPrint}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Imprimir Comanda
          </button>
          <div className="flex space-x-4">
            <button onClick={() => onDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Excluir Pedido
            </button>
            <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;