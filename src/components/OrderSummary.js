import React, { useContext } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { db } from '../services/firebase';
import { WHATSAPP_NUMBER } from '../services/menu';

const OrderSummary = () => {
  const { state, dispatch, showToast } = useContext(AppContext);

  const generateSummary = () => {
    const { customerName, customerPhone, cart, delivery, payment } = state;
    let summary = [`*Novo Pedido - Açaí Sabor da Terra*`, `*Nome:* ${customerName}`, `*Telefone:* ${customerPhone}`, '---'];
    cart.forEach((item, i) => {
      summary.push(`*COPO ${i + 1}*`, `- *Tamanho:* ${item.size.label}`);
      if(item.creams.length) summary.push(`- *Cremes:* ${item.creams.join(', ')}`);
      if(item.toppings.length) summary.push(`- *Acompanhamentos:* ${item.toppings.join(', ')}`);
      if(item.fruits.length) summary.push(`- *Frutas:* ${item.fruits.join(', ')}`);
      if(item.syrup !== 'Sem cobertura') summary.push(`- *Cobertura:* ${item.syrup}`);
      if(item.notes) summary.push(`- *Obs:* ${item.notes}`);
      summary.push('---');
    });
    let deliveryLocation = delivery.college === 'UNINASSAU' ? `${delivery.college} - ${delivery.block} - ${delivery.room}` : delivery.college;
    const deliveryTime = delivery.date ? `para ${new Date(delivery.date).toLocaleDateString('pt-BR')}` : `às ${delivery.time}`;
    summary.push(`*Entrega:* ${deliveryLocation} ${deliveryTime}`);
    let paymentLine = `*Pagamento:* ${payment.method}`;
    if(payment.cashChange) paymentLine += ` (Troco para R$ ${payment.cashChange})`;
    summary.push(paymentLine, `*Total: R$ ${payment.finalTotal.toFixed(2)}*`);
    if (payment.method === 'Pix') summary.push('*Chave Pix (Celular):* 88981905006');
    return summary.join('\n');
  };

  const sendToWhatsApp = async () => {
    try {
      await addDoc(collection(db, 'pedidos'), {
        clienteId: state.user?.uid || null,
        clienteNome: state.customerName,
        dataDoPedido: serverTimestamp(),
        carrinho: state.cart,
        entrega: state.delivery,
        pagamento: state.payment,
        status: "Novo"
      });
      showToast('Pedido salvo! Abrindo WhatsApp...');
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generateSummary())}`, '_blank');
    } catch (error) {
      showToast('Erro ao salvar o pedido.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">🧾 Resumo do Pedido</h2>
      <div className="bg-purple-50 p-4 rounded-lg mb-6 whitespace-pre-wrap font-mono text-sm">{generateSummary()}</div>
      <div className="flex gap-3">
        <button onClick={() => dispatch({ type: 'PREV_STEP' })} className="flex-1 py-3 border rounded-lg">Corrigir</button>
        <button onClick={sendToWhatsApp} className="flex-2 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Enviar Pedido</button>
      </div>
    </div>
  );
};

export default OrderSummary;