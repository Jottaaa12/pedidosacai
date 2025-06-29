// ===== FUNÇÕES DE INTERFACE (UI) =====

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(AppState.toastTimeout);
    AppState.toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        modal.setAttribute('aria-modal', 'true');
        // Foco no primeiro botão do modal
        const btn = modal.querySelector('button, [tabindex="0"]');
        if (btn) btn.focus();
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
    }
}

function confirmAction(message, title = 'Confirmar Ação') {
    return new Promise((resolve, reject) => {
        const modal = document.getElementById('modal-confirmation');
        document.getElementById('confirmation-title').textContent = title;
        document.getElementById('confirmation-message').textContent = message;
        showModal('modal-confirmation');
        AppState.modals.confirmation.resolve = () => {
            hideModal('modal-confirmation');
            resolve(true);
        };
        AppState.modals.confirmation.reject = () => {
            hideModal('modal-confirmation');
            resolve(false);
        };
    });
}

// ===== LISTENERS DOS MODAIS =====

// Modal de confirmação
document.getElementById('confirmation-cancel').onclick = () => {
    if (AppState.modals.confirmation.reject) AppState.modals.confirmation.reject();
};

document.getElementById('confirmation-confirm').onclick = () => {
    if (AppState.modals.confirmation.resolve) AppState.modals.confirmation.resolve();
};

// Modal Pix
document.getElementById('modal-pix-close').onclick = () => hideModal('modal-pix');

// Modal Carrinho
document.getElementById('add-another-btn').onclick = () => {
    hideModal('modal-cart');
    resetCupBuilder();
    AppState.currentStep = 2;
    showStep(AppState.currentStep);
};

document.getElementById('finish-order-btn').onclick = () => {
    hideModal('modal-cart');
    AppState.currentStep = 7;
    showStep(AppState.currentStep);
};

// Modal Finalize
document.getElementById('modal-finalize-close').onclick = () => hideModal('modal-finalize'); 