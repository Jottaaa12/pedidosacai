// ===== FUNÇÕES DO CARRINHO =====

function calculateCartTotal(cart, paymentMethod) {
    let baseTotal = cart.reduce((total, item) => total + item.size.price + item.additionalToppingCost, 0);
    let finalTotal = baseTotal;
    let taxa = 0;
    if (paymentMethod === 'Cartão Crédito' || paymentMethod === 'Cartão Débito') {
        taxa = 0.0315;
        finalTotal = +(baseTotal * (1 + taxa)).toFixed(2);
    }
    return { baseTotal: +baseTotal.toFixed(2), finalTotal, taxa };
}

function renderCartSummary() {
    const cart = AppState.order.cart;
    const cartSummary = document.getElementById('cart-summary');
    const cartList = document.getElementById('cart-items-list');
    const cartTotal = document.getElementById('cart-total-price');
    
    if (!cart || cart.length === 0) {
        cartSummary.classList.add('hidden');
        cartSummary.classList.remove('show');
        cartList.innerHTML = '<p>Seu carrinho está vazio.</p>';
        cartTotal.textContent = 'R$ 0,00';
        return;
    }
    
    cartSummary.classList.remove('hidden');
    cartSummary.classList.add('show');
    cartList.innerHTML = '';
    
    cart.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item__header">
                <span class="cart-item__title">Copo ${idx + 1} - ${item.size.name}</span>
                <button class="cart-item__remove" aria-label="Remover copo do carrinho" data-idx="${idx}">&times;</button>
            </div>
            <div class="cart-item__details">
                ${item.creams && item.creams.length ? `<div><strong>Cremes:</strong> ${item.creams.join(', ')}</div>` : ''}
                ${item.toppings && item.toppings.length ? `<div><strong>Acompanhamentos:</strong> ${item.toppings.join(', ')}</div>` : ''}
                ${item.fruits && item.fruits.length ? `<div><strong>Frutas:</strong> ${item.fruits.join(', ')}</div>` : ''}
                ${item.syrup && item.syrup !== 'Sem cobertura' ? `<div><strong>Cobertura:</strong> ${item.syrup}</div>` : ''}
                ${item.notes ? `<div><strong>Obs:</strong> ${item.notes}</div>` : ''}
                ${item.additionalToppingCost > 0 ? `<div><strong>Adicionais:</strong> R$ ${item.additionalToppingCost.toFixed(2)}</div>` : ''}
            </div>
        `;
        cartList.appendChild(div);
    });
    
    // Remover item
    cartList.querySelectorAll('.cart-item__remove').forEach(btn => {
        btn.onclick = async (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const ok = await confirmAction('Deseja remover este copo do carrinho?');
            if (ok) {
                AppState.order.cart.splice(idx, 1);
                updateCartIndicator();
                renderCartSummary();
            }
        };
    });
    
    // Total
    const { finalTotal } = calculateCartTotal(cart, document.getElementById('payment-method')?.value || '');
    cartTotal.textContent = `R$ ${finalTotal.toFixed(2)}`;
}

function updateCartIndicator() {
    const indicator = document.getElementById('cart-indicator');
    indicator.textContent = AppState.order.cart.length;
    indicator.classList.toggle('show', AppState.order.cart.length > 0);
    renderCartSummary();
}

function resetCupBuilder() {
    ['size-group', 'creams-group', 'toppings-group', 'fruits-group', 'syrup-group'].forEach(groupId => {
        document.getElementById(groupId).querySelectorAll('input').forEach(input => {
            input.checked = false;
            input.parentElement.classList.remove('checked');
        });
    });
    document.getElementById('observations').value = '';
    document.getElementById('topping-info').textContent = 'Você tem 4 acompanhamentos grátis.';
    AppState.currentAcai = {};
}

function saveCurrentAcaiData() {
    const sizeRadio = document.querySelector('input[name="size"]:checked');
    
    if (!sizeRadio) {
        showToast("Erro: Tamanho não selecionado. Por favor, volte e escolha um tamanho.");
        AppState.currentStep = 2;
        showStep(AppState.currentStep);
        return;
    }

    if (sizeRadio.value === 'custom') { 
        const customPrice = parseFloat(document.getElementById('custom-value-input').value) || 0; 
        AppState.currentAcai.size = { name: `Valor de R$ ${customPrice.toFixed(2)}`, price: customPrice }; 
    } else { 
        AppState.currentAcai.size = { name: sizeRadio.value, price: parseFloat(sizeRadio.dataset.price) }; 
    }
    
    AppState.currentAcai.creams = getCheckedValues('creme');
    AppState.currentAcai.toppings = getCheckedValues('topping');
    AppState.currentAcai.additionalToppingCost = Math.max(0, AppState.currentAcai.toppings.length - 4) * 1.00;
    AppState.currentAcai.fruits = getCheckedValues('fruit');
    AppState.currentAcai.syrup = document.querySelector('input[name="syrup"]:checked')?.value || 'Nenhuma';
    AppState.currentAcai.notes = document.getElementById('observations').value.trim();
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
}

// ===== LISTENERS DO CARRINHO =====

// Botão limpar carrinho
document.getElementById('clear-cart-btn').onclick = async () => {
    if (AppState.order.cart.length === 0) return;
    const ok = await confirmAction('Deseja realmente esvaziar todo o carrinho?', 'Limpar Carrinho');
    if (ok) {
        AppState.order.cart = [];
        updateCartIndicator();
        renderCartSummary();
    }
};

// Adicionar copo ao carrinho
document.getElementById('add-to-cart-btn').onclick = () => {
    saveCurrentAcaiData();
    if (AppState.currentAcai.size) {
        AppState.order.cart.push(JSON.parse(JSON.stringify(AppState.currentAcai)));
        AppState.currentAcai = {};
        updateCartIndicator();
        renderCartSummary();
        showModal('modal-cart');
    }
}; 