import React, { useState, useEffect, useContext, createContext } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import QRCode from 'qrcode';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAh4RSV0gQ1KL9-Pmu-AJ9PE5s8mLIvthw",
  authDomain: "acai-sabor-da-terra.firebaseapp.com",
  projectId: "acai-sabor-da-terra",
  storageBucket: "acai-sabor-da-terra.appspot.com",
  messagingSenderId: "251748448639",
  appId: "1:251748448639:web:af23fa70969dfdadb6024a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Context para o estado global
const AppContext = createContext();

// Dados do cardápio
const SIZES = [
  { label: "300g – R$ 15,00", price: 15.00 },
  { label: "360g – R$ 18,00", price: 18.00 },
  { label: "400g – R$ 20,00", price: 20.00 },
  { label: "440g – R$ 22,00", price: 22.00 },
  { label: "500g – R$ 25,00", price: 25.00 },
  { label: "Outro valor", type: "custom" }
];

const CREAMS = [
  "Creme de maracujá", "Creme de morango", "Creme de ninho", "Creme de cupuaçu"
];

const TOPPINGS = [
  "Leite em pó", "Castanha Caramelizada", "Granola", "Castanha", 
  "Gotas de Chocolate", "Paçoquita", "Amendoim", "Chocoball", 
  "Canudinho Biju", "Cereja", "Sucrilhos", "M&M", "Ovomaltine", 
  "Cookies Branco", "Cookies Preto", "Farinha de tapioca"
];

const FRUITS = ["Morango", "Kiwi", "Uva"];

const SYRUPS = ["Sem cobertura", "Morango", "Chocolate", "Maracujá"];

const COLLEGES = [
  { value: "UNINASSAU", label: "FACULDADE UNINASSAU" },
  { value: "UFDPAR", label: "UFDPAR" },
  { value: "ONIBUS BITU", label: "ÔNIBUS BITU" },
  { value: "OUTRA", label: "OUTRA FACULDADE" }
];

const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de Crédito", "Cartão de Débito"];

const ADMIN_PHONE = '+5588981905006';
const WHATSAPP_NUMBER = '5588981905006';

// Componente Toast
const Toast = ({ message, visible }) => {
  return (
    <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 
      bg-gradient-to-r from-primary to-secondary text-white px-5 py-3 rounded-full
      font-medium shadow-lg transition-all duration-400 z-50
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {message}
    </div>
  );
};

// Componente ProgressBar
const ProgressBar = ({ currentStep, totalSteps = 9 }) => {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="w-full bg-gray-300">
      <div 
        className="h-2 bg-gradient-to-r from-primary to-secondary transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// Componente CartIndicator
const CartIndicator = ({ count }) => {
  return (
    <div className={`absolute top-4 right-5 bg-primary text-white w-7 h-7 rounded-full
      flex items-center justify-center text-sm font-semibold shadow-lg
      transition-transform duration-300 ${count > 0 ? 'scale-100' : 'scale-0'}`}>
      {count}
    </div>
  );
};

// Hook customizado para Toast
const useToast = () => {
  const [toast, setToast] = useState({ message: '', visible: false });
  
  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };
  
  return { toast, showToast };
};

// Função CRC16 para PIX
const crc16 = (payload) => {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ('0000' + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
};

// Componente Authentication
const Authentication = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Dados dos formulários
  const [loginData, setLoginData] = useState({
    phone: '',
    fullName: ''
  });
  
  const [quickOrderData, setQuickOrderData] = useState({
    name: '',
    phone: ''
  });

  const sendSMSCode = async () => {
    setIsSending(true);
    let phoneNumber = loginData.phone.replace(/\D/g, '');
    if (phoneNumber.length < 10) {
      showToast('Digite um número válido com DDD');
      setIsSending(false);
      return;
    }
    if (!phoneNumber.startsWith('55')) {
      phoneNumber = '55' + phoneNumber;
    }

    try {
      // Abordagem mais robusta: criar um novo verificador a cada clique.
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // O reCAPTCHA foi resolvido, o envio de SMS pode prosseguir.
        }
      });
      
      const result = await signInWithPhoneNumber(auth, `+${phoneNumber}`, verifier);
      setConfirmationResult(result);
      setShowCodeInput(true);
      showToast('Código SMS enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      showToast('Erro ao enviar SMS. Verifique o número e tente novamente.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode) return;
    
    try {
      await confirmationResult.confirm(verificationCode);
      showToast('Login efetuado com sucesso!');
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      showToast('Código inválido. Tente novamente.');
    }
  };

  const continueQuickOrder = () => {
    dispatch({
      type: 'SET_QUICK_ORDER',
      payload: {
        name: quickOrderData.name,
        phone: quickOrderData.phone
      }
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  const continueWithUser = async () => {
    if (state.user && loginData.fullName) {
      try {
        await setDoc(doc(db, 'users', state.user.uid), {
          displayName: loginData.fullName,
          phoneNumber: state.user.phoneNumber
        }, { merge: true });
        
        dispatch({
          type: 'SET_USER_NAME',
          payload: loginData.fullName
        });
        dispatch({ type: 'NEXT_STEP' });
      } catch (error) {
        console.error('Erro ao salvar nome:', error);
      }
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (state.user) {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <img 
            src="https://i.imgur.com/9VzcNVM.png" 
            alt="Logo Açaí Sabor da Terra" 
            className="max-w-30 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Açaí Sabor da Terra</h1>
          <p>
            <a 
              href="https://instagram.com/acaisabordaterra_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-secondary hover:underline font-medium"
            >
              @acaisabordaterra_
            </a>
          </p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <p className="text-center mb-4">
            Olá! Você está logado com o número:<br />
            <strong>{state.user.phoneNumber}</strong>
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Seu nome (para o pedido)
            </label>
            <input
              type="text"
              value={loginData.fullName}
              onChange={(e) => setLoginData({...loginData, fullName: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={logout}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Sair
            </button>
            <button
              onClick={continueWithUser}
              disabled={!loginData.fullName}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
                disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              Iniciar Pedido
            </button>
          </div>

          {state.user.phoneNumber !== ADMIN_PHONE && (
            <button
              onClick={() => dispatch({ type: 'SHOW_MY_ORDERS' })}
              className="w-full mt-3 py-2 px-4 text-sm border border-secondary text-secondary rounded-full hover:bg-purple-50"
            >
              Meus Pedidos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-4 border-red-500">
      {/* O container do reCAPTCHA continua aqui, essencial para o verifier. */}
      <div id="recaptcha-container"></div>

      <div className="text-center mb-6">
        <img 
          src="https://i.imgur.com/9VzcNVM.png" 
          alt="Logo Açaí Sabor da Terra" 
          className="max-w-30 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-primary mb-2">Açaí Sabor da Terra</h1>
        <p>
          <a 
            href="https://instagram.com/acaisabordaterra_" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-secondary hover:underline font-medium"
          >
            @acaisabordaterra_
          </a>
        </p>
      </div>

      {!showQuickOrder ? (
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Telefone (com DDD)
            </label>
            <input
              type="tel"
              value={loginData.phone}
              onChange={(e) => setLoginData({...loginData, phone: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: 88912345678"
            />
          </div>

          <button
            id="send-code-btn"
            onClick={sendSMSCode}
            disabled={isSending}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
              disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {isSending ? 'Enviando...' : 'Enviar SMS de Verificação'}
          </button>

          {showCodeInput && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Código de verificação
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="******"
                />
              </div>
              <button
                onClick={verifyCode}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Confirmar e Entrar
              </button>
            </div>
          )}

          <button
            onClick={() => setShowQuickOrder(true)}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Fazer pedido rápido (sem login)
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Seu nome
            </label>
            <input
              type="text"
              value={quickOrderData.name}
              onChange={(e) => setQuickOrderData({...quickOrderData, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Seu telefone (com DDD)
            </label>
            <input
              type="tel"
              value={quickOrderData.phone}
              onChange={(e) => setQuickOrderData({...quickOrderData, phone: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: 88912345678"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowQuickOrder(false)}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Voltar para Login
            </button>
            <button
              onClick={continueQuickOrder}
              disabled={!quickOrderData.name || quickOrderData.phone.length < 10}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
                disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              Continuar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente ProductBuilder - Construção do Açaí
const ProductBuilder = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [currentAcai, setCurrentAcai] = useState({
    size: null,
    customPrice: '',
    creams: [],
    toppings: [],
    fruits: [],
    syrup: 'Sem cobertura',
    notes: ''
  });

  const resetBuilder = () => {
    setCurrentAcai({
      size: null,
      customPrice: '',
      creams: [],
      toppings: [],
      fruits: [],
      syrup: 'Sem cobertura',
      notes: ''
    });
  };

  const handleSizeChange = (size) => {
    setCurrentAcai({ ...currentAcai, size });
  };

  const handleItemToggle = (category, item) => {
    const maxLimits = { creams: 2, fruits: 2 };
    const current = currentAcai[category];
    
    if (current.includes(item)) {
      setCurrentAcai({
        ...currentAcai,
        [category]: current.filter(i => i !== item)
      });
    } else {
      const limit = maxLimits[category];
      if (limit && current.length >= limit) {
        showToast(`Máximo ${limit} ${category === 'creams' ? 'cremes' : 'frutas'}`);
        return;
      }
      setCurrentAcai({
        ...currentAcai,
        [category]: [...current, item]
      });
    }
  };

  const addToCart = () => {
    if (!currentAcai.size) {
      showToast('Selecione um tamanho primeiro');
      return;
    }

    let finalAcai = { ...currentAcai };
    
    if (currentAcai.size.type === 'custom') {
      const customPrice = parseFloat(currentAcai.customPrice);
      if (!customPrice || customPrice < 26 || customPrice > 50) {
        showToast('Digite um valor entre R$ 26 e R$ 50');
        return;
      }
      finalAcai.size = {
        label: `Valor de R$ ${customPrice.toFixed(2)}`,
        price: customPrice
      };
    }

    finalAcai.additionalToppingCost = Math.max(0, currentAcai.toppings.length - 4) * 1.00;
    
    dispatch({ type: 'ADD_TO_CART', payload: finalAcai });
    dispatch({ type: 'SHOW_CART_MODAL' });
    resetBuilder();
  };

  const surpriseMe = () => {
    const shuffled = [...TOPPINGS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setCurrentAcai({ ...currentAcai, toppings: selected });
    showToast('Combo surpresa selecionado! 🎲');
  };

  if (state.currentStep === 2) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">📦 Escolha o tamanho</h2>
        
        <div className="space-y-3 mb-6">
          {SIZES.map((size, index) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
              ${currentAcai.size === size ? 'border-primary bg-purple-50' : 'border-gray-300 hover:border-secondary'}`}>
              <input
                type="radio"
                name="size"
                checked={currentAcai.size === size}
                onChange={() => handleSizeChange(size)}
                className="mr-3 text-primary"
              />
              {size.label}
            </label>
          ))}
        </div>

        {currentAcai.size?.type === 'custom' && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Qual valor (R$ 26 a R$ 50)?
            </label>
            <input
              type="number"
              min="26"
              max="50"
              value={currentAcai.customPrice}
              onChange={(e) => setCurrentAcai({ ...currentAcai, customPrice: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: 30"
            />
            <p className="text-xs text-gray-500 mt-1">Calculado a R$ 50/kg.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            disabled={!currentAcai.size || (currentAcai.size?.type === 'custom' && !currentAcai.customPrice)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
              disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  }

  if (state.currentStep === 3) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">🍦 Escolha até 2</h2>
          <button
            onClick={() => setCurrentAcai({ ...currentAcai, creams: [] })}
            className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
          >
            Limpar
          </button>
        </div>
        
        <div className="space-y-3 mb-6">
          {CREAMS.map((cream, index) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
              ${currentAcai.creams.includes(cream) ? 'border-primary bg-purple-50' : 'border-gray-300 hover:border-secondary'}`}>
              <input
                type="checkbox"
                checked={currentAcai.creams.includes(cream)}
                onChange={() => handleItemToggle('creams', cream)}
                className="mr-3 text-primary"
              />
              {cream}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  }

  if (state.currentStep === 4) {
    const extraToppings = Math.max(0, currentAcai.toppings.length - 4);
    const freeLeft = Math.max(0, 4 - currentAcai.toppings.length);

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">🥣 Acompanhamentos</h2>
          <div className="flex gap-2">
            <button
              onClick={surpriseMe}
              className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
            >
              ✨ Surpreenda-me!
            </button>
            <button
              onClick={() => setCurrentAcai({ ...currentAcai, toppings: [] })}
              className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="text-center text-sm font-medium text-secondary mb-4">
          {extraToppings > 0 
            ? `Adicionais: ${extraToppings} (R$ ${extraToppings.toFixed(2)})`
            : `Você tem ${freeLeft} acompanhamento(s) grátis.`
          }
        </div>
        
        <div className="grid grid-cols-1 gap-2 mb-6">
          {TOPPINGS.map((topping, index) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
              ${currentAcai.toppings.includes(topping) ? 'border-primary bg-purple-50' : 'border-gray-300 hover:border-secondary'}`}>
              <input
                type="checkbox"
                checked={currentAcai.toppings.includes(topping)}
                onChange={() => handleItemToggle('toppings', topping)}
                className="mr-3 text-primary"
              />
              {topping}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  }

  if (state.currentStep === 5) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">🍓 Escolha até 2</h2>
          <button
            onClick={() => setCurrentAcai({ ...currentAcai, fruits: [] })}
            className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
          >
            Limpar
          </button>
        </div>
        
        <div className="space-y-3 mb-4">
          {FRUITS.map((fruit, index) => (
            <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
              ${currentAcai.fruits.includes(fruit) ? 'border-primary bg-purple-50' : 'border-gray-300 hover:border-secondary'}`}>
              <input
                type="checkbox"
                checked={currentAcai.fruits.includes(fruit)}
                onChange={() => handleItemToggle('fruits', fruit)}
                className="mr-3 text-primary"
              />
              {fruit}
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center mb-6 bg-gray-50 p-2 rounded">
          Atenção: A disponibilidade das frutas pode variar.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  }

  if (state.currentStep === 6) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">✨ Toques Finais</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Cobertura</label>
          <div className="space-y-3">
            {SYRUPS.map((syrup, index) => (
              <label key={index} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
                ${currentAcai.syrup === syrup ? 'border-primary bg-purple-50' : 'border-gray-300 hover:border-secondary'}`}>
                <input
                  type="radio"
                  name="syrup"
                  checked={currentAcai.syrup === syrup}
                  onChange={() => setCurrentAcai({ ...currentAcai, syrup })}
                  className="mr-3 text-primary"
                />
                {syrup}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Observações (opcional)
          </label>
          <textarea
            value={currentAcai.notes}
            onChange={(e) => setCurrentAcai({ ...currentAcai, notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows="3"
            placeholder="Alguma observação especial?"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={addToCart}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Adicionar Copo ao Pedido
          </button>
        </div>
      </div>
    );
  }

  return null;
};

// Componente DeliveryForm
const DeliveryForm = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [deliveryData, setDeliveryData] = useState({
    college: '',
    block: '',
    room: '',
    ufdparDetails: '',
    otherDetails: '',
    time: '',
    date: ''
  });

  useEffect(() => {
    const now = new Date();
    const isAfterCutOff = now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() >= 30);
    
    if (isAfterCutOff) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryData(prev => ({ ...prev, date: tomorrow.toISOString().split('T')[0] }));
    }
  }, []);

  const isAfterCutOff = () => {
    const now = new Date();
    return now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() >= 30);
  };

  const isValidDelivery = () => {
    if (!deliveryData.college) return false;
    
    switch (deliveryData.college) {
      case 'UNINASSAU':
        return deliveryData.block && deliveryData.room;
      case 'UFDPAR':
        return deliveryData.ufdparDetails;
      case 'ONIBUS BITU':
        return true;
      case 'OUTRA':
        return deliveryData.otherDetails;
      default:
        return false;
    }
  };

  const isValidSchedule = () => {
    return isAfterCutOff() ? deliveryData.date : deliveryData.time;
  };

  const handleNext = () => {
    if (!isValidDelivery() || !isValidSchedule()) {
      showToast('Complete todos os campos obrigatórios');
      return;
    }
    
    dispatch({
      type: 'SET_DELIVERY',
      payload: deliveryData
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">📍 Local e Horário</h2>
      
      {isAfterCutOff() && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Pedidos para hoje encerrados!</strong><br />
            Para garantir a montagem e entrega, recebemos pedidos para o mesmo dia somente até às 14:30. 
            Seu pedido será agendado.
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Faculdade / Local de Entrega
        </label>
        <select
          value={deliveryData.college}
          onChange={(e) => setDeliveryData({ ...deliveryData, college: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecione uma opção</option>
          {COLLEGES.map((college) => (
            <option key={college.value} value={college.value}>
              {college.label}
            </option>
          ))}
        </select>
      </div>

      {/* Detalhes UNINASSAU */}
      {deliveryData.college === 'UNINASSAU' && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bloco</label>
            <select
              value={deliveryData.block}
              onChange={(e) => setDeliveryData({ ...deliveryData, block: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione o Bloco</option>
              <option value="Bloco A">Bloco A</option>
              <option value="Bloco B">Bloco B</option>
              <option value="Bloco C">Bloco C</option>
              <option value="Bloco D">Bloco D</option>
              <option value="Cantina da Nassau">Cantina da Nassau</option>
              <option value="Restaurante Dunas">Restaurante Dunas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Número da sala</label>
            <input
              type="text"
              value={deliveryData.room}
              onChange={(e) => setDeliveryData({ ...deliveryData, room: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Digite o número da sua sala"
            />
          </div>
        </div>
      )}

      {/* Detalhes UFDPAR */}
      {deliveryData.college === 'UFDPAR' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Detalhe onde deseja receber dentro da UFDPAR
          </label>
          <input
            type="text"
            value={deliveryData.ufdparDetails}
            onChange={(e) => setDeliveryData({ ...deliveryData, ufdparDetails: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: No portão principal, na biblioteca, etc."
          />
        </div>
      )}

      {/* Aviso ÔNIBUS BITU */}
      {deliveryData.college === 'ONIBUS BITU' && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <p className="text-gray-700 text-sm">
            Opção exclusiva para alunos do ônibus de Bitupitá.
          </p>
        </div>
      )}

      {/* Detalhes OUTRA FACULDADE */}
      {deliveryData.college === 'OUTRA' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Qual faculdade e local de entrega?
          </label>
          <input
            type="text"
            value={deliveryData.otherDetails}
            onChange={(e) => setDeliveryData({ ...deliveryData, otherDetails: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ex: FAP, na entrada principal"
          />
          <p className="text-xs text-gray-500 mt-2">
            Entrega em outras faculdades depende de confirmação. Aguarde contato.
          </p>
        </div>
      )}

      {/* Horário ou Data */}
      <div className="mb-4">
        {!isAfterCutOff() ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Horário de entrega (hoje)
            </label>
            <select
              value={deliveryData.time}
              onChange={(e) => setDeliveryData({ ...deliveryData, time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Selecione</option>
              <option value="18h00">18h00</option>
              <option value="19h00">19h00</option>
              <option value="20h00">20h00</option>
              <option value="21h00">21h00</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Escolha a data da entrega
            </label>
            <input
              type="date"
              value={deliveryData.date}
              onChange={(e) => setDeliveryData({ ...deliveryData, date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center mb-6 bg-gray-50 p-2 rounded">
        A data/horário é flexível e está sujeita a confirmação via WhatsApp.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          disabled={!isValidDelivery() || !isValidSchedule()}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
            disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

// Componente Payment
const Payment = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [paymentData, setPaymentData] = useState({
    method: '',
    cashChange: ''
  });

  const baseTotal = state.cart.reduce((total, item) => total + item.size.price + item.additionalToppingCost, 0);
  
  const calculateTotal = () => {
    switch (paymentData.method) {
      case 'Cartão Crédito':
        return baseTotal * 1.034;
      case 'Cartão Débito':
        return baseTotal * 1.014;
      default:
        return baseTotal;
    }
  };

  const generateBrCode = () => {
    const formatField = (id, value) => `${id}${value.length.toString().padStart(2, '0')}${value}`;
    const payload = [
      formatField('00', '01'),
      formatField('26', formatField('00', 'br.gov.bcb.pix') + formatField('01', '+5588981905006')),
      formatField('52', '0000'),
      formatField('53', '986'),
      formatField('54', baseTotal.toFixed(2)),
      formatField('58', 'BR'),
      formatField('59', 'JOAO PEDRO CARVALHO TORRE'.substring(0, 25)),
      formatField('60', 'BARROQUINHA'),
      formatField('62', formatField('05', '***'))
    ].join('');
    const finalPayload = `${payload}6304`;
    return finalPayload + crc16(finalPayload);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(generateBrCode())
      .then(() => showToast('Código Pix copiado!'))
      .catch(() => showToast('Erro ao copiar código'));
  };

  const handleNext = () => {
    if (!paymentData.method) {
      showToast('Selecione uma forma de pagamento');
      return;
    }

    dispatch({
      type: 'SET_PAYMENT',
      payload: {
        method: paymentData.method,
        cashChange: paymentData.cashChange,
        baseTotal,
        finalTotal: calculateTotal()
      }
    });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">💳 Pagamento</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Forma de pagamento
        </label>
        <select
          value={paymentData.method}
          onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecione</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      {/* Informações do Pix */}
      {paymentData.method === 'Pix' && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
          <p className="mb-3">Pague de forma rápida e segura com Pix.</p>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'SHOW_PIX_MODAL' })}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium text-sm"
            >
              Gerar QR Code
            </button>
            <button
              onClick={copyPixKey}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium text-sm"
            >
              Copiar Chave
            </button>
          </div>
        </div>
      )}

      {/* Campo de troco para dinheiro */}
      {paymentData.method === 'Dinheiro' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Troco para:
          </label>
          <input
            type="number"
            value={paymentData.cashChange}
            onChange={(e) => setPaymentData({ ...paymentData, cashChange: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Digite o valor"
          />
        </div>
      )}

      {/* Informações de taxa para cartões */}
      {paymentData.method === 'Cartão Crédito' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <p className="text-sm">Taxa de <strong>3,40%</strong> aplicada.</p>
          <p className="text-sm">Valor do pedido: <span>R$ {baseTotal.toFixed(2)}</span></p>
          <p className="text-sm font-semibold">Valor com taxa: <span>R$ {calculateTotal().toFixed(2)}</span></p>
        </div>
      )}

      {paymentData.method === 'Cartão Débito' && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <p className="text-sm">Taxa de <strong>1,40%</strong> aplicada.</p>
          <p className="text-sm">Valor do pedido: <span>R$ {baseTotal.toFixed(2)}</span></p>
          <p className="text-sm font-semibold">Valor com taxa: <span>R$ {calculateTotal().toFixed(2)}</span></p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={handleNext}
          disabled={!paymentData.method}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
            disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          Ver Resumo
        </button>
      </div>
    </div>
  );
};

// Componente OrderSummary
const OrderSummary = () => {
  const { state, dispatch, showToast } = useContext(AppContext);

  const generateSummary = () => {
    const { customerName, customerPhone, cart, delivery, payment } = state;
    
    let summaryArray = [
      '> Novo Pedido - Açaí Sabor da Terra <',
      `> Nome: ${customerName}`,
      `> Telefone: ${customerPhone}`,
      '---'
    ];
    
    cart.forEach((item, index) => {
      summaryArray.push(`COPO ${index + 1}`);
      summaryArray.push(`> Tamanho: ${item.size.label}`);
      if (item.creams.length > 0) summaryArray.push(`> Cremes: ${item.creams.join(', ')}`);
      if (item.toppings.length > 0) summaryArray.push(`> Acompanhamentos: ${item.toppings.join(', ')}`);
      if (item.fruits.length > 0) summaryArray.push(`> Frutas: ${item.fruits.join(', ')}`);
      if (item.syrup && item.syrup !== 'Sem cobertura') summaryArray.push(`> Cobertura: ${item.syrup}`);
      if (item.notes) summaryArray.push(`> Observações: ${item.notes}`);
      summaryArray.push('---');
    });

    if (summaryArray[summaryArray.length - 1] === '---') {
      summaryArray.pop();
    }

    // Montagem da linha de entrega
    let deliveryLocation = delivery.college;
    if (delivery.college === 'UNINASSAU') {
      deliveryLocation = `UNINASSAU - ${delivery.block}`;
      if (delivery.room) deliveryLocation += ` - ${delivery.room}`;
    } else if (delivery.college === 'UFDPAR' && delivery.ufdparDetails) {
      deliveryLocation += ` - ${delivery.ufdparDetails}`;
    } else if (delivery.college === 'OUTRA' && delivery.otherDetails) {
      deliveryLocation += ` - ${delivery.otherDetails}`;
    }

    let deliveryLine;
    if (delivery.date) {
      const [year, month, day] = delivery.date.split('-');
      deliveryLine = `> Entrega: ${deliveryLocation} para ${day}/${month}/${year}`;
    } else {
      deliveryLine = `> Entrega: ${deliveryLocation} às ${delivery.time}`;
    }
    summaryArray.push(deliveryLine);

    let paymentLine = `> Pagamento: ${payment.method}`;
    if (payment.cashChange) {
      paymentLine += ` (Troco para: R$ ${parseFloat(payment.cashChange).toFixed(2)})`;
    }
    summaryArray.push(paymentLine);

    summaryArray.push(`> Total: R$ ${payment.finalTotal.toFixed(2)}`);

    if (payment.method === 'Pix') {
      summaryArray.push('> Chave Pix (Celular): 88981905006');
    }

    return summaryArray.join('\n');
  };

  const saveOrderToFirestore = async () => {
    const orderData = {
      clienteId: state.user?.uid || null,
      clienteNome: state.customerName,
      clienteTelefone: state.customerPhone,
      dataDoPedido: serverTimestamp(),
      carrinho: state.cart,
      entrega: state.delivery,
      pagamento: state.payment,
      status: "Recebido"
    };

    try {
      await addDoc(collection(db, 'pedidos'), orderData);
      return true;
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      showToast('Erro ao salvar o pedido');
      return false;
    }
  };

  const sendToWhatsApp = async () => {
    try {
      await saveOrderToFirestore();
      showToast('Pedido salvo com sucesso!');
    } catch (error) {
      showToast('Erro ao salvar, mas pode enviar no WhatsApp');
    }

    const summary = generateSummary();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(summary)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">🧾 Resumo do Pedido</h2>
      
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-6 whitespace-pre-wrap font-mono text-sm">
        {generateSummary()}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
        >
          Corrigir
        </button>
        <button
          onClick={sendToWhatsApp}
          className="flex-2 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          style={{ flex: 2 }}
        >
          Enviar e Salvar Pedido
        </button>
      </div>
    </div>
  );
};

// Componente Modal para Pix
const PixModal = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (state.showPixModal) {
      generateQRCode();
    }
  }, [state.showPixModal]);

  const generateBrCode = () => {
    const formatField = (id, value) => `${id}${value.length.toString().padStart(2, '0')}${value}`;
    const payload = [
      formatField('00', '01'),
      formatField('26', formatField('00', 'br.gov.bcb.pix') + formatField('01', '+5588981905006')),
      formatField('52', '0000'),
      formatField('53', '986'),
      formatField('54', state.payment.baseTotal.toFixed(2)),
      formatField('58', 'BR'),
      formatField('59', 'JOAO PEDRO CARVALHO TORRE'.substring(0, 25)),
      formatField('60', 'BARROQUINHA'),
      formatField('62', formatField('05', '***'))
    ].join('');
    const finalPayload = `${payload}6304`;
    return finalPayload + crc16(finalPayload);
  };

  const generateQRCode = async () => {
    try {
      const brCode = generateBrCode();
      const url = await QRCode.toDataURL(brCode, { width: 256, margin: 1 });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      showToast('Erro ao gerar QR Code');
    }
  };

  if (!state.showPixModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-primary mb-4">Pague com Pix</h3>
        
        {qrCodeUrl && (
          <div className="mb-4">
            <img src={qrCodeUrl} alt="QR Code Pix" className="mx-auto border rounded" />
          </div>
        )}
        
        <p className="mb-2">Valor: <strong>R$ {state.payment.baseTotal.toFixed(2)}</strong></p>
        <p className="text-xs text-gray-600 mb-4 break-all">Chave: 88981905006</p>
        
        <button
          onClick={() => dispatch({ type: 'HIDE_PIX_MODAL' })}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

// Componente Modal para adicionar outro copo
const CartModal = () => {
  const { state, dispatch } = useContext(AppContext);

  if (!state.showCartModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-primary mb-4">Copo Adicionado!</h3>
        <p className="mb-6">O que você deseja fazer agora?</p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              dispatch({ type: 'HIDE_CART_MODAL' });
              dispatch({ type: 'SET_STEP', payload: 2 });
            }}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Montar Outro Copo
          </button>
          <button
            onClick={() => {
              dispatch({ type: 'HIDE_CART_MODAL' });
              dispatch({ type: 'SET_STEP', payload: 7 });
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold"
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente AdminPanel
const AdminPanel = () => {
  const { dispatch, showToast } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'pedidos'),
      orderBy('dataDoPedido', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar pedidos:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'pedidos', orderId), { status: newStatus });
      showToast('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary">📋 Gerenciamento de Pedidos</h2>
        <button
          onClick={() => dispatch({ type: 'SHOW_FORM' })}
          className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
        >
          Voltar ao Formulário
        </button>
      </div>

      {loading ? (
        <p className="text-center">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-center">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-300 rounded-lg p-4 border-l-4 border-l-primary">
              <h3 className="font-semibold text-primary mb-2">
                Pedido de: {order.clienteNome || 'Nome não informado'}
              </h3>
              <p className="text-sm mb-1"><strong>Telefone:</strong> {order.clienteTelefone}</p>
              <p className="text-sm mb-1">
                <strong>Data:</strong> {
                  order.dataDoPedido?.toDate?.()?.toLocaleString('pt-BR') || 'Data não disponível'
                }
              </p>
              <p className="text-sm mb-3">
                <strong>Total:</strong> R$ {order.pagamento?.total?.toFixed(2)} ({order.pagamento?.method})
              </p>
              
              <div className="bg-gray-50 p-3 rounded border-l-2 border-gray-300 mb-3">
                {order.carrinho?.map((item, index) => (
                  <p key={index} className="text-sm">
                    <strong>Copo {index + 1}:</strong> {item.size?.label}
                  </p>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <select
                  value={order.status || 'Recebido'}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="Recebido">Recebido</option>
                  <option value="Em preparo">Em preparo</option>
                  <option value="Saiu para entrega">Saiu para entrega</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente MyOrders
const MyOrders = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'pedidos'),
      where('clienteId', '==', state.user.uid),
      orderBy('dataDoPedido', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao buscar pedidos:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [state.user]);

  const repeatOrder = (order) => {
    dispatch({ type: 'REPEAT_ORDER', payload: order.carrinho });
    dispatch({ type: 'SET_STEP', payload: 7 });
    dispatch({ type: 'SHOW_FORM' });
    showToast('Pedido carregado! Complete a entrega e pagamento.');
  };

  const editAndRepeat = (order) => {
    dispatch({ type: 'REPEAT_ORDER', payload: order.carrinho });
    dispatch({ type: 'SET_STEP', payload: 2 });
    dispatch({ type: 'SHOW_FORM' });
    showToast('Pedido carregado! Faça suas alterações.');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-secondary">🍧 Meus Pedidos Anteriores</h2>
        <button
          onClick={() => dispatch({ type: 'SHOW_FORM' })}
          className="text-sm border border-secondary text-secondary px-3 py-1 rounded-full hover:bg-purple-50"
        >
          Voltar
        </button>
      </div>

      {!state.user ? (
        <p className="text-center">Você precisa estar logado para ver seus pedidos.</p>
      ) : loading ? (
        <p className="text-center">Carregando seus pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-center">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-300 rounded-lg p-4 border-l-4 border-l-secondary">
              <h3 className="font-semibold text-secondary mb-2">
                Pedido de {order.dataDoPedido?.toDate?.()?.toLocaleDateString('pt-BR') || 'Data indisponível'}
              </h3>
              <p className="text-sm mb-1"><strong>Status:</strong> {order.status || 'Recebido'}</p>
              <p className="text-sm mb-3">
                <strong>Total:</strong> R$ {order.pagamento?.total?.toFixed(2)}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => repeatOrder(order)}
                  className="flex-1 py-2 px-3 text-sm bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium"
                >
                  Repetir Pedido
                </button>
                <button
                  onClick={() => editAndRepeat(order)}
                  className="flex-1 py-2 px-3 text-sm border border-secondary text-secondary rounded-lg font-medium hover:bg-purple-50"
                >
                  Editar e Repetir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Reducer para gerenciar o estado da aplicação
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    
    case 'SET_USER_NAME':
      return { ...state, customerName: action.payload };
    
    case 'SET_QUICK_ORDER':
      return { 
        ...state, 
        customerName: action.payload.name,
        customerPhone: action.payload.phone,
        isQuickOrder: true,
        currentStep: 2
      };
    
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    
    case 'REPEAT_ORDER':
      return { ...state, cart: action.payload };
    
    case 'SET_DELIVERY':
      return { ...state, delivery: action.payload };
    
    case 'SET_PAYMENT':
      return { ...state, payment: action.payload };
    
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) };
    
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SHOW_CART_MODAL':
      return { ...state, showCartModal: true };
    
    case 'HIDE_CART_MODAL':
      return { ...state, showCartModal: false };
    
    case 'SHOW_PIX_MODAL':
      return { ...state, showPixModal: true };
    
    case 'HIDE_PIX_MODAL':
      return { ...state, showPixModal: false };
    
    case 'SHOW_ADMIN':
      return { ...state, currentView: 'admin' };
    
    case 'SHOW_MY_ORDERS':
      return { ...state, currentView: 'myOrders' };
    
    case 'SHOW_FORM':
      return { ...state, currentView: 'form' };
    
    default:
      return state;
  }
};

// Provider do Context
const AppProvider = ({ children }) => {
  const { toast, showToast } = useToast();
  
  const [state, dispatch] = React.useReducer(appReducer, {
    user: null,
    customerName: '',
    customerPhone: '',
    isQuickOrder: false,
    currentStep: 1,
    currentView: 'form', // 'form', 'admin', 'myOrders'
    cart: [],
    delivery: {},
    payment: {},
    showCartModal: false,
    showPixModal: false
  });

  // Listener de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user) {
        if (user.phoneNumber === ADMIN_PHONE) {
          dispatch({ type: 'SHOW_ADMIN' });
        } else {
          dispatch({ type: 'SHOW_FORM' });
          // Tentar buscar nome salvo
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().displayName) {
              dispatch({ type: 'SET_USER_NAME', payload: userDoc.data().displayName });
              dispatch({ type: 'SET_STEP', payload: 2 });
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
          }
        }
        
        dispatch({ 
          type: 'SET_QUICK_ORDER', 
          payload: { 
            name: state.customerName || '', 
            phone: user.phoneNumber 
          }
        });
      } else if (!state.isQuickOrder) {
        dispatch({ type: 'SHOW_FORM' });
        dispatch({ type: 'SET_STEP', payload: 1 });
      }
    });

    return () => unsubscribe();
  }, [state.customerName, state.isQuickOrder]);

  return (
    <AppContext.Provider value={{ state, dispatch, showToast }}>
      {children}
      <Toast message={toast.message} visible={toast.visible} />
    </AppContext.Provider>
  );
};

// Componente principal da aplicação
const MainApp = () => {
  const { state } = useContext(AppContext);

  const renderCurrentView = () => {
    if (state.currentView === 'admin') {
      return <AdminPanel />;
    }
    
    if (state.currentView === 'myOrders') {
      return <MyOrders />;
    }

    // Renderizar formulário baseado na etapa
    switch (state.currentStep) {
      case 1:
        return <Authentication />;
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        return <ProductBuilder />;
      case 7:
        return <DeliveryForm />;
      case 8:
        return <Payment />;
      case 9:
        return <OrderSummary />;
      default:
        return <Authentication />;
    }
  };

  return (
    <>
      <CartIndicator count={state.cart.length} />
      <ProgressBar currentStep={state.currentStep} />
      
      <div className="relative">
        {renderCurrentView()}
      </div>

      {/* Footer */}
      <div className="text-center p-4 bg-gray-100 text-xs text-gray-600 border-t">
        Gerenciamento de pedidos, feito por{' '}
        <a 
          href="https://instagram.com/jottaaa0" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary font-semibold hover:underline"
        >
          @jottaaa0
        </a>
      </div>

      {/* Modais */}
      <PixModal />
      <CartModal />
    </>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-5 font-poppins">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
        <AppProvider>
          <MainApp />
        </AppProvider>
      </div>
    </div>
  );
}