// Em: src/admin/components/ComandaParaImpressao.js
import React from 'react';

export const ComandaParaImpressao = React.forwardRef(({ order }, ref) => {
  if (!order) {
    return null;
  }

  const { clienteNome, carrinho, pagamento, dataDoPedido, id } = order;

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return new Date().toLocaleString('pt-BR');
    return timestamp.toDate().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={ref} className="p-4 font-mono text-black bg-white">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">Açaí Sabor da Terra</h1>
        <p className="text-xs">Comanda do Pedido</p>
      </div>
      <div className="border-t border-b border-dashed border-black py-2 mb-4 text-sm">
        <p><strong>Pedido:</strong> #{id.substring(0, 8).toUpperCase()}</p>
        <p><strong>Data:</strong> {formatTime(dataDoPedido)}</p>
        <p><strong>Cliente:</strong> {clienteNome}</p>
      </div>
      <div>
        <h2 className="text-base font-bold border-b border-dashed border-black mb-2">ITENS</h2>
        {carrinho.map((item, index) => (
          <div key={index} className="mb-3 text-sm">
            <p className="font-semibold">{item.size.label}</p>
            <ul className="list-none pl-2">
              {item.creams && item.creams.length > 0 && <li>- Cremes: {item.creams.map(c => c.name).join(', ')}</li>}
              {item.toppings && item.toppings.length > 0 && <li>- Acomps: {item.toppings.map(t => t.name).join(', ')}</li>}
              {item.fruits && item.fruits.length > 0 && <li>- Frutas: {item.fruits.map(f => f.name).join(', ')}</li>}
              {item.syrup && item.syrup !== 'Sem cobertura' && <li>- Cobertura: {item.syrup.name || item.syrup}</li>}
              {item.notes && <li className="mt-1">- Obs: {item.notes}</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-black pt-2 mt-4 text-sm">
        <p><strong>Pagamento:</strong> {pagamento?.method}</p>
        <p className="text-base font-bold">Total: R$ {pagamento?.finalTotal?.toFixed(2) || '0.00'}</p>
      </div>
    </div>
  );
});