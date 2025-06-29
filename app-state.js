// ===== ESTADO GLOBAL DA APLICAÇÃO =====
window.AppState = {
    currentStep: 1,
    currentAcai: {},
    order: { cart: [] },
    isQuickOrder: false,
    whatsAppNumber: '5588981905006',
    adminPhoneNumber: '+5588981905006',
    toastTimeout: null,
    qrCodeInstance: null,
    fruitToastShown: false,
    modals: {
        confirmation: {
            resolve: null,
            reject: null
        }
    }
}; 