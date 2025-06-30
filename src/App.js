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
  setDoc
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
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // Dados dos formulários
  const [loginData, setLoginData] = useState({
    phone: '',
    fullName: ''
  });
  
  const [quickOrderData, setQuickOrderData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    // Configurar reCAPTCHA
    const setupRecaptcha = () => {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'normal',
          'callback': () => {
            document.getElementById('send-code-btn').disabled = false;
          },
          'expired-callback': () => {
            document.getElementById('send-code-btn').disabled = true;
          }
        });
        setRecaptchaVerifier(verifier);
        verifier.render();
      } catch (error) {
        console.error('Erro ao configurar reCAPTCHA:', error);
        showToast('Erro ao carregar verificador SMS');
      }
    };

    if (!showQuickOrder && !state.user) {
      setTimeout(setupRecaptcha, 100);
    }
  }, [showQuickOrder, state.user, showToast]);

  const sendSMSCode = async () => {
    let phoneNumber = loginData.phone.replace(/\D/g, '');
    if (phoneNumber.length < 10) {
      showToast('Digite um número válido com DDD');
      return;
    }
    if (!phoneNumber.startsWith('55')) {
      phoneNumber = '55' + phoneNumber;
    }

    try {
      const result = await signInWithPhoneNumber(auth, `+${phoneNumber}`, recaptchaVerifier);
      setConfirmationResult(result);
      setShowCodeInput(true);
      showToast('Código SMS enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      showToast('Erro ao enviar SMS. Tente novamente.');
      try {
        recaptchaVerifier.clear();
        document.getElementById('send-code-btn').disabled = true;
      } catch (e) {
        console.error('Erro ao resetar reCAPTCHA', e);
      }
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

          <div id="recaptcha-container" className="flex justify-center mb-4"></div>

          <button
            id="send-code-btn"
            onClick={sendSMSCode}
            disabled={true}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold 
              disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            Enviar SMS de Verificação
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

// Continuará com mais componentes...
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-5">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl overflow-hidden relative">
        <AppProvider>
          <MainApp />
        </AppProvider>
      </div>
    </div>
  );
}