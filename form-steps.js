// ===== FUNÇÕES DAS ETAPAS DO FORMULÁRIO =====

function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    updateProgressBar(stepNumber);
    AppState.currentStep = stepNumber;
}

function updateProgressBar(step) {
    const progressBar = document.getElementById('progress-bar');
    const totalSteps = 9;
    const progress = ((step - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = progress + '%';
}

function validateStep(step) {
    switch(step) {
        case 1:
            if (AppState.isQuickOrder) {
                const name = document.getElementById('quick-fullName').value.trim();
                const phone = document.getElementById('quick-phone').value.trim();
                return name.length > 0 && validatePhone(phone);
            } else {
                const name = document.getElementById('fullName').value.trim();
                return name.length > 0;
            }
        case 2:
            return document.querySelector('input[name="size"]:checked') !== null;
        case 7:
            const location = document.getElementById('college-location').value;
            const time = document.getElementById('delivery-time').value;
            const date = document.getElementById('delivery-date').value;
            
            if (!location) return false;
            if (location === 'UNINASSAU') {
                const block = document.getElementById('delivery-block').value;
                const room = document.getElementById('room-number').value.trim();
                return block && room.length > 0;
            }
            if (location === 'UFDPAR') {
                const info = document.getElementById('ufdpar-info').value.trim();
                return info.length > 0;
            }
            if (location === 'OUTRA') {
                const info = document.getElementById('other-college-info').value.trim();
                return info.length > 0;
            }
            return time || date;
        case 8:
            return document.getElementById('payment-method').value !== '';
        default:
            return true;
    }
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

function formatPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
        return `(${cleanPhone.slice(0,2)}) ${cleanPhone.slice(2,7)}-${cleanPhone.slice(7)}`;
    }
    return phone;
}

// ===== LISTENERS DAS ETAPAS =====

// Navegação entre etapas
document.querySelectorAll('.next-btn').forEach(btn => {
    btn.onclick = () => {
        if (validateStep(AppState.currentStep)) {
            AppState.currentStep++;
            showStep(AppState.currentStep);
        } else {
            showToast('Por favor, preencha todos os campos obrigatórios.');
        }
    };
});

document.querySelectorAll('.js-back-btn').forEach(btn => {
    btn.onclick = () => {
        AppState.currentStep--;
        showStep(AppState.currentStep);
    };
});

// Validação em tempo real
document.getElementById('fullName').oninput = () => {
    document.getElementById('btn-step1').disabled = !validateStep(1);
};

document.getElementById('quick-fullName').oninput = () => {
    document.getElementById('quick-order-submit-btn').disabled = !validateStep(1);
};

document.getElementById('quick-phone').oninput = () => {
    document.getElementById('quick-order-submit-btn').disabled = !validateStep(1);
};

// Tamanho customizado
document.querySelectorAll('input[name="size"]').forEach(radio => {
    radio.onchange = () => {
        const customGroup = document.getElementById('custom-value-group');
        if (radio.value === 'custom') {
            customGroup.classList.remove('hidden');
        } else {
            customGroup.classList.add('hidden');
        }
        document.getElementById('btn-step2').disabled = !validateStep(2);
    };
});

document.getElementById('custom-value-input').oninput = () => {
    document.getElementById('btn-step2').disabled = !validateStep(2);
};

// Local de entrega
document.getElementById('college-location').onchange = () => {
    const location = document.getElementById('college-location').value;
    
    // Esconder todos os detalhes
    ['uninassau-details', 'ufdpar-details', 'other-college-details', 'bitu-bus-note'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Mostrar detalhes específicos
    if (location === 'UNINASSAU') {
        document.getElementById('uninassau-details').classList.remove('hidden');
    } else if (location === 'UFDPAR') {
        document.getElementById('ufdpar-details').classList.remove('hidden');
    } else if (location === 'OUTRA') {
        document.getElementById('other-college-details').classList.remove('hidden');
    } else if (location === 'ONIBUS BITU') {
        document.getElementById('bitu-bus-note').classList.remove('hidden');
    }
    
    document.getElementById('btn-step7').disabled = !validateStep(7);
};

// Validação dos campos de local
['delivery-block', 'room-number', 'ufdpar-info', 'other-college-info', 'delivery-time', 'delivery-date'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.oninput = () => {
            document.getElementById('btn-step7').disabled = !validateStep(7);
        };
    }
});

// Método de pagamento
document.getElementById('payment-method').onchange = () => {
    const method = document.getElementById('payment-method').value;
    
    // Esconder todos os detalhes
    ['pix-info', 'cash-info', 'credit-card-info', 'debit-card-info'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    
    // Mostrar detalhes específicos
    if (method === 'Pix') {
        document.getElementById('pix-info').classList.remove('hidden');
    } else if (method === 'Dinheiro') {
        document.getElementById('cash-info').classList.remove('hidden');
    } else if (method === 'Cartão Crédito') {
        document.getElementById('credit-card-info').classList.remove('hidden');
        updateCardPrices();
    } else if (method === 'Cartão Débito') {
        document.getElementById('debit-card-info').classList.remove('hidden');
        updateCardPrices();
    }
    
    document.getElementById('btn-step8').disabled = !validateStep(8);
    renderCartSummary();
};

function updateCardPrices() {
    const { baseTotal, finalTotal } = calculateCartTotal(AppState.order.cart, document.getElementById('payment-method').value);
    document.getElementById('cc-original-price').textContent = `R$ ${baseTotal.toFixed(2)}`;
    document.getElementById('cc-total-price').textContent = `R$ ${finalTotal.toFixed(2)}`;
    document.getElementById('dc-original-price').textContent = `R$ ${baseTotal.toFixed(2)}`;
    document.getElementById('dc-total-price').textContent = `R$ ${finalTotal.toFixed(2)}`;
} 