// ===== FUNÇÕES DO FIREBASE =====

let recaptchaVerifier;
let confirmationResult;

// Inicializar reCAPTCHA
function initializeRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
                document.getElementById('send-code-btn').disabled = false;
            }
        });
    }
    window.recaptchaVerifier.render();
}

// Enviar código SMS
async function sendSMSCode(phoneNumber) {
    try {
        const formattedPhone = phoneNumber.startsWith('+55') ? phoneNumber : `+55${phoneNumber}`;
        const appVerifier = window.recaptchaVerifier;
        confirmationResult = await auth.signInWithPhoneNumber(formattedPhone, appVerifier);
        showToast('Código SMS enviado! Verifique seu telefone.');
        document.getElementById('code-verification-group').classList.remove('hidden');
        document.getElementById('send-code-btn').disabled = true;
    } catch (error) {
        console.error('Erro ao enviar SMS:', error);
        showToast('Erro ao enviar SMS. Tente novamente.');
        window.recaptchaVerifier.render();
    }
}

// Verificar código SMS
async function verifySMSCode(code) {
    try {
        await confirmationResult.confirm(code);
        showToast('Login realizado com sucesso!');
        document.getElementById('phone-login-form').classList.add('hidden');
        document.getElementById('user-logged-in-form').classList.remove('hidden');
        document.getElementById('logged-in-phone').textContent = formatPhone(document.getElementById('phone').value);
        document.getElementById('fullName').focus();
    } catch (error) {
        console.error('Erro ao verificar código:', error);
        showToast('Código inválido. Tente novamente.');
    }
}

// Fazer logout
async function logout() {
    try {
        await auth.signOut();
        showToast('Logout realizado com sucesso!');
        document.getElementById('user-logged-in-form').classList.add('hidden');
        document.getElementById('phone-login-form').classList.remove('hidden');
        document.getElementById('phone').value = '';
        document.getElementById('fullName').value = '';
        document.getElementById('verification-code').value = '';
        document.getElementById('code-verification-group').classList.add('hidden');
        document.getElementById('btn-step1').disabled = true;
        window.recaptchaVerifier.render();
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao fazer logout.');
    }
}

// Salvar pedido no Firestore
async function saveOrder(orderData) {
    try {
        const orderRef = await db.collection('orders').add({
            ...orderData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        return orderRef.id;
    } catch (error) {
        console.error('Erro ao salvar pedido:', error);
        throw new Error('Falha ao salvar pedido no banco de dados');
    }
}

// Buscar pedidos do usuário
async function getUserOrders(userPhone) {
    try {
        const cleanPhone = userPhone.replace(/\D/g, '');
        const snapshot = await db.collection('orders')
            .where('customerPhone', '==', cleanPhone)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw new Error('Falha ao carregar pedidos');
    }
}

// Buscar todos os pedidos (admin)
async function getAllOrders() {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw new Error('Falha ao carregar pedidos');
    }
}

// Atualizar status do pedido
async function updateOrderStatus(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        throw new Error('Falha ao atualizar status do pedido');
    }
}

// ===== LISTENERS DO FIREBASE =====

// Enviar código SMS
document.getElementById('send-code-btn').onclick = () => {
    const phone = document.getElementById('phone').value.trim();
    if (!validatePhone(phone)) {
        showToast('Por favor, insira um telefone válido.');
        return;
    }
    sendSMSCode(phone);
};

// Verificar código SMS
document.getElementById('verify-code-btn').onclick = () => {
    const code = document.getElementById('verification-code').value.trim();
    if (code.length !== 6) {
        showToast('Por favor, insira o código de 6 dígitos.');
        return;
    }
    verifySMSCode(code);
};

// Logout
document.getElementById('logout-btn').onclick = logout;

// Pedido rápido
document.getElementById('show-quick-order-btn').onclick = () => {
    AppState.isQuickOrder = true;
    document.getElementById('phone-login-container').classList.add('hidden');
    document.getElementById('quick-order-form').classList.remove('hidden');
};

document.getElementById('back-to-login-btn').onclick = () => {
    AppState.isQuickOrder = false;
    document.getElementById('quick-order-form').classList.add('hidden');
    document.getElementById('phone-login-container').classList.remove('hidden');
    document.getElementById('quick-fullName').value = '';
    document.getElementById('quick-phone').value = '';
    document.getElementById('quick-order-submit-btn').disabled = true;
};

document.getElementById('quick-order-submit-btn').onclick = () => {
    if (validateStep(1)) {
        AppState.currentStep = 2;
        showStep(AppState.currentStep);
    }
}; 