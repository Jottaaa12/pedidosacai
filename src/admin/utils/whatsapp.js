// Adiciona o código do país (55) a um número de telefone se necessário
export const formatPhoneNumberForWhatsApp = (phoneString) => {
  if (!phoneString) return '';
  // Remove todos os caracteres não numéricos
  let phoneNumber = phoneString.replace(/\D/g, '');
  // Adiciona o código do país (55) se for um número brasileiro e ainda não o tiver
  if (phoneNumber.length >= 10 && !phoneNumber.startsWith('55')) {
    phoneNumber = '55' + phoneNumber;
  }
  return phoneNumber;
};

// Adaptação da função generateSummary de OrderSummary.js
const generateOrderSummaryText = (order) => {
  const { clienteNome, clienteTelefone, carrinho, entrega, pagamento } = order;
  
  // Fallbacks para garantir que os dados existam
  const cart = carrinho || [];
  const delivery = entrega || {};
  const payment = pagamento || {};
  const customerName = clienteNome || 'Cliente não informado';
  const customerPhone = clienteTelefone || 'Telefone não informado';

  let summary = [
    `*Novo Pedido - Açaí Sabor da Terra*`,
    `*Nome:* ${customerName}`,
    `*Telefone:* ${customerPhone}`,
    '---'
  ];

  cart.forEach((item, i) => {
    summary.push(`*COPO ${i + 1}*`);
    if (item.size) {
      summary.push(`- *Tamanho:* ${item.size.label || item.size.name}`);
    }
    if (item.creams && item.creams.length > 0) {
      summary.push(`- *Cremes:* ${item.creams.map(c => c.name).join(', ')}`);
    }
    if (item.toppings && item.toppings.length > 0) {
      summary.push(`- *Acompanhamentos:* ${item.toppings.map(t => t.name).join(', ')}`);
    }
    if (item.fruits && item.fruits.length > 0) {
      summary.push(`- *Frutas:* ${item.fruits.map(f => f.name).join(', ')}`);
    }
    if (item.syrup && item.syrup.name !== 'Sem cobertura') {
      summary.push(`- *Cobertura:* ${item.syrup.name}`);
    }
    if (item.notes) {
      summary.push(`- *Obs:* ${item.notes}`);
    }
    summary.push('---');
  });

  if (delivery.college) {
    let deliveryLocation = delivery.college;
    if (delivery.college === 'UNINASSAU') {
      deliveryLocation += ` - ${delivery.block} - ${delivery.room}`;
    }
    const deliveryTime = delivery.date ? `para ${new Date(delivery.date).toLocaleDateString('pt-BR')}` : `às ${delivery.time}`;
    summary.push(`*Entrega:* ${deliveryLocation} ${deliveryTime}`);
  }

  if (payment.method) {
    let paymentLine = `*Pagamento:* ${payment.method}`;
    if (payment.cashChange) {
      paymentLine += ` (Troco para R$ ${payment.cashChange})`;
    }
    summary.push(paymentLine, `*Total: R$ ${(payment.finalTotal || 0).toFixed(2)}*`);
  }

  return summary.join('\n');
};

// Gera a mensagem e o link do WhatsApp com base no status do pedido
export const generateWhatsAppLink = (order, status) => {
  if (!order || !order.clienteTelefone) return null;

  const phoneNumber = formatPhoneNumberForWhatsApp(order.clienteTelefone);
  let message = '';

  switch (status) {
    case 'Novo':
      message = generateOrderSummaryText(order);
      break;
    case 'Em Preparo':
      message = `Olá, ${order.clienteNome}! Seu pedido foi confirmado e já está em preparo. Avisaremos quando sair para entrega!`;
      break;
    case 'Saiu para Entrega':
      message = `Olá, ${order.clienteNome}! Seu açaí já saiu para entrega e logo chegará até você!`;
      break;
    default:
      return null; // Não gera link para outros status
  }

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
};