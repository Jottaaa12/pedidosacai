// ===== SCRIPT PRINCIPAL - INICIALIZAÇÃO E FUNCIONALIDADES ESPECÍFICAS =====

// ===== FUNÇÕES DE INICIALIZAÇÃO =====

function initializeApp() {
    initializeRecaptcha();
    setupEventListeners();
    setupCheckboxGroups();
    setupSurpriseButton();
    setupPixButtons();
    setupSummaryGeneration();
    setupAdminPanel();
    setupMyOrdersPanel();
    updateCartIndicator();
    renderCartSummary();
}

function setupEventListeners() {
    // Listener para mudança de estado de autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            document.getElementById('phone-login-form').classList.add('hidden');
            document.getElementById('user-logged-in-form').classList.remove('hidden');
            document.getElementById('logged-in-phone').textContent = formatPhone(user.phoneNumber || '');
        } else {
            document.getElementById('user-logged-in-form').classList.add('hidden');
            document.getElementById('phone-login-form').classList.remove('hidden');
        }
    });
}

// ===== FUNCIONALIDADES ESPECÍFICAS =====

function setupCheckboxGroups() {
    // Grupos com limite máximo
    document.querySelectorAll('.checkbox-group[data-max]').forEach(group => {
        const max = parseInt(group.dataset.max);
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checked = group.querySelectorAll('input[type="checkbox"]:checked');
                if (checked.length > max) {
                    checkbox.checked = false;
                    showToast(`Você pode selecionar no máximo ${max} opções.`);
                }
                
                // Atualizar classes visuais
                checkboxes.forEach(cb => {
                    cb.parentElement.classList.toggle('checked', cb.checked);
                });
            });
        });
    });
    
    // Grupo de acompanhamentos (sem limite, mas com contador)
    const toppingsGroup = document.getElementById('toppings-group');
    const toppingInfo = document.getElementById('topping-info');
    
    toppingsGroup.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = toppingsGroup.querySelectorAll('input[type="checkbox"]:checked');
            const freeToppings = 4;
            const additional = Math.max(0, checked.length - freeToppings);
            
            if (additional > 0) {
                toppingInfo.textContent = `Você tem ${freeToppings} acompanhamentos grátis. +${additional} adicional(is) = R$ ${(additional * 1.00).toFixed(2)}`;
            } else {
                toppingInfo.textContent = `Você tem ${freeToppings} acompanhamentos grátis.`;
            }
            
            checkbox.parentElement.classList.toggle('checked', checkbox.checked);
        });
    });
}

function setupSurpriseButton() {
    document.querySelector('.surprise-btn').onclick = () => {
        const toppings = [
            'Leite em pó', 'Castanha Caramelizada', 'Granola', 'Castanha',
            'Gotas de Chocolate', 'Paçoquita', 'Amendoim', 'Chocoball',
            'Canudinho Biju', 'Cereja', 'Sucrilhos', 'M&M', 'Ovomaltine',
            'Cookies Branco', 'Cookies Preto', 'Farinha de tapioca'
        ];
        
        // Limpar seleção atual
        document.querySelectorAll('#toppings-group input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('checked');
        });
        
        // Selecionar 4 aleatórios
        const shuffled = toppings.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);
        
        selected.forEach(topping => {
            const checkbox = document.querySelector(`input[value="${topping}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.parentElement.classList.add('checked');
            }
        });
        
        document.getElementById('topping-info').textContent = 'Você tem 4 acompanhamentos grátis.';
        showToast('Acompanhamentos selecionados automaticamente! ✨');
    };
}

function setupPixButtons() {
    document.getElementById('generate-qr-btn').onclick = () => {
        const { finalTotal } = calculateCartTotal(AppState.order.cart, 'Pix');
        const qrContainer = document.getElementById('qrcode-container');
        const modalValue = document.getElementById('modal-pix-value');
        
        qrContainer.innerHTML = '';
        modalValue.textContent = `R$ ${finalTotal.toFixed(2)}`;
        
        if (AppState.qrCodeInstance) {
            AppState.qrCodeInstance.clear();
        }
        
        const pixData = `00020126580014br.gov.bcb.pix01368898190500652040000530398654040.005802BR5913Açai Sabor da Terra6008Parnaiba62070503***6304`;
        
        AppState.qrCodeInstance = new QRCode(qrContainer, {
            text: pixData,
            width: 200,
            height: 200
        });
        
        showModal('modal-pix');
    };
    
    document.getElementById('copy-br-code-btn').onclick = () => {
        navigator.clipboard.writeText('88981905006').then(() => {
            showToast('Chave Pix copiada!');
        }).catch(() => {
            showToast('Erro ao copiar chave. Chave: 88981905006');
        });
    };
}

function setupSummaryGeneration() {
    document.getElementById('send-whatsapp').onclick = async (e) => {
        e.preventDefault();
        
        try {
            // Coletar dados do pedido
            const orderData = collectOrderData();
            
            // Salvar no Firebase
            const orderId = await saveOrder(orderData);
            
            // Gerar mensagem WhatsApp
            const message = generateWhatsAppMessage(orderData, orderId);
            
            // Abrir WhatsApp
            const whatsappUrl = `https://wa.me/${AppState.whatsAppNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            // Mostrar confirmação
            showModal('modal-finalize');
            
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            showToast('Erro ao finalizar pedido. Tente novamente.');
        }
    };
}

function collectOrderData() {
    const customerName = AppState.isQuickOrder ? 
        document.getElementById('quick-fullName').value.trim() : 
        document.getElementById('fullName').value.trim();
    
    const customerPhone = AppState.isQuickOrder ? 
        document.getElementById('quick-phone').value.trim() : 
        document.getElementById('phone').value.trim();
    
    const location = document.getElementById('college-location').value;
    const deliveryDetails = getDeliveryDetails(location);
    const paymentMethod = document.getElementById('payment-method').value;
    const { baseTotal, finalTotal } = calculateCartTotal(AppState.order.cart, paymentMethod);
    
    return {
        customerName,
        customerPhone: customerPhone.replace(/\D/g, ''),
        cart: AppState.order.cart,
        location,
        deliveryDetails,
        paymentMethod,
        baseTotal,
        finalTotal,
        cashChange: paymentMethod === 'Dinheiro' ? document.getElementById('cash-change').value : null,
        isQuickOrder: AppState.isQuickOrder
    };
}

function getDeliveryDetails(location) {
    switch(location) {
        case 'UNINASSAU':
            return {
                block: document.getElementById('delivery-block').value,
                room: document.getElementById('room-number').value.trim()
            };
        case 'UFDPAR':
            return {
                info: document.getElementById('ufdpar-info').value.trim()
            };
        case 'OUTRA':
            return {
                info: document.getElementById('other-college-info').value.trim()
            };
        default:
            return {};
    }
}

function generateWhatsAppMessage(orderData, orderId) {
    const { cart, customerName, location, deliveryDetails, paymentMethod, finalTotal, cashChange } = orderData;
    
    let message = `🍧 *NOVO PEDIDO - Açaí Sabor da Terra* 🍧\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Pedido #${orderId.slice(-6)}*\n\n`;
    
    // Itens do carrinho
    cart.forEach((item, idx) => {
        message += `*Copo ${idx + 1}:* ${item.size.name}\n`;
        if (item.creams && item.creams.length) message += `Cremes: ${item.creams.join(', ')}\n`;
        if (item.toppings && item.toppings.length) message += `Acompanhamentos: ${item.toppings.join(', ')}\n`;
        if (item.fruits && item.fruits.length) message += `Frutas: ${item.fruits.join(', ')}\n`;
        if (item.syrup && item.syrup !== 'Sem cobertura') message += `Cobertura: ${item.syrup}\n`;
        if (item.notes) message += `Obs: ${item.notes}\n`;
        if (item.additionalToppingCost > 0) message += `Adicionais: R$ ${item.additionalToppingCost.toFixed(2)}\n`;
        message += `\n`;
    });
    
    // Local de entrega
    message += `*Local:* ${location}\n`;
    if (location === 'UNINASSAU') {
        message += `Bloco: ${deliveryDetails.block}\n`;
        message += `Sala: ${deliveryDetails.room}\n`;
    } else if (location === 'UFDPAR') {
        message += `Detalhes: ${deliveryDetails.info}\n`;
    } else if (location === 'OUTRA') {
        message += `Detalhes: ${deliveryDetails.info}\n`;
    }
    
    // Pagamento
    message += `*Pagamento:* ${paymentMethod}\n`;
    if (paymentMethod === 'Dinheiro' && cashChange) {
        message += `Troco para: R$ ${cashChange}\n`;
    }
    message += `*Total: R$ ${finalTotal.toFixed(2)}*\n\n`;
    
    message += `Pedido enviado via sistema web.`;
    
    return message;
}

function setupAdminPanel() {
    // Botão para acessar painel admin (triplo clique no footer)
    let clickCount = 0;
    let clickTimer;
    
    document.querySelector('.footer-credits').onclick = () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
            if (clickCount === 3) {
                showAdminPanel();
            }
            clickCount = 0;
        }, 500);
    };
    
    document.getElementById('back-to-form-btn').onclick = () => {
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('form-content').classList.remove('hidden');
    };
}

async function showAdminPanel() {
    try {
        document.getElementById('form-content').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        
        const orders = await getAllOrders();
        renderAdminOrders(orders);
        
    } catch (error) {
        showToast('Erro ao carregar pedidos: ' + error.message);
    }
}

function renderAdminOrders(orders) {
    const container = document.getElementById('admin-orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>Nenhum pedido encontrado.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="admin-order-item">
            <div class="admin-order-header">
                <h4>Pedido #${order.id.slice(-6)}</h4>
                <span class="status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="admin-order-details">
                <p><strong>Cliente:</strong> ${order.customerName}</p>
                <p><strong>Telefone:</strong> ${formatPhone(order.customerPhone)}</p>
                <p><strong>Total:</strong> R$ ${order.finalTotal.toFixed(2)}</p>
                <p><strong>Data:</strong> ${formatDate(order.createdAt)}</p>
            </div>
            <div class="admin-order-actions">
                <button onclick="updateOrderStatus('${order.id}', 'preparing')" class="btn--small">Preparando</button>
                <button onclick="updateOrderStatus('${order.id}', 'ready')" class="btn--small">Pronto</button>
                <button onclick="updateOrderStatus('${order.id}', 'delivered')" class="btn--small">Entregue</button>
                <button onclick="updateOrderStatus('${order.id}', 'cancelled')" class="btn--small btn--danger">Cancelar</button>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'preparing': 'Preparando',
        'ready': 'Pronto',
        'delivered': 'Entregue',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Data não disponível';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-BR');
}

function setupMyOrdersPanel() {
    // Botão para acessar meus pedidos (duplo clique no header)
    let clickCount = 0;
    let clickTimer;
    
    document.querySelector('.main-header').onclick = () => {
        clickCount++;
        clearTimeout(clickTimer);
        
        clickTimer = setTimeout(() => {
            if (clickCount === 2) {
                showMyOrdersPanel();
            }
            clickCount = 0;
        }, 500);
    };
    
    document.getElementById('back-to-form-from-my-orders-btn').onclick = () => {
        document.getElementById('my-orders-panel').classList.add('hidden');
        document.getElementById('form-content').classList.remove('hidden');
    };
}

async function showMyOrdersPanel() {
    try {
        const userPhone = AppState.isQuickOrder ? 
            document.getElementById('quick-phone').value.trim() : 
            document.getElementById('phone').value.trim();
        
        if (!userPhone) {
            showToast('Faça login para ver seus pedidos.');
            return;
        }
        
        document.getElementById('form-content').classList.add('hidden');
        document.getElementById('my-orders-panel').classList.remove('hidden');
        
        const orders = await getUserOrders(userPhone);
        renderMyOrders(orders);
        
    } catch (error) {
        showToast('Erro ao carregar pedidos: ' + error.message);
    }
}

function renderMyOrders(orders) {
    const container = document.getElementById('my-orders-list');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="my-order-item">
            <div class="my-order-header">
                <h4>Pedido #${order.id.slice(-6)}</h4>
                <span class="status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="my-order-details">
                <p><strong>Total:</strong> R$ ${order.finalTotal.toFixed(2)}</p>
                <p><strong>Data:</strong> ${formatDate(order.createdAt)}</p>
                <p><strong>Pagamento:</strong> ${order.paymentMethod}</p>
            </div>
        </div>
    `).join('');
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', initializeApp); 