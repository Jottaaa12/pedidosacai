import React, { useState, useEffect, useContext } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { AppContext } from '../context/AppContext';
import { auth, db } from '../services/firebase';
import { ADMIN_PHONE } from '../services/menu';

const Authentication = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const [loginData, setLoginData] = useState({
    phone: '',
    fullName: state.customerName || ''
  });

  const [quickOrderData, setQuickOrderData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (state.customerName) {
        setLoginData(prev => ({...prev, fullName: state.customerName}));
    }
  }, [state.customerName]);

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
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {}
      });

      const result = await signInWithPhoneNumber(auth, `+${phoneNumber}`, verifier);
      setConfirmationResult(result);
      setShowCodeInput(true);
      showToast('Código SMS enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      showToast('Erro ao enviar SMS. Tente novamente.');
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
      showToast('Código inválido. Tente novamente.');
    }
  };

  const continueQuickOrder = () => {
    dispatch({
      type: 'SET_QUICK_ORDER',
      payload: { name: quickOrderData.name, phone: quickOrderData.phone }
    });
  };

  const continueWithUser = async () => {
    if (state.user && loginData.fullName) {
      try {
        await setDoc(doc(db, 'users', state.user.uid), {
          displayName: loginData.fullName,
          phoneNumber: state.user.phoneNumber
        }, { merge: true });

        dispatch({
          type: 'SET_CUSTOMER_INFO',
          payload: { name: loginData.fullName, phone: state.user.phoneNumber }
        });
        dispatch({ type: 'NEXT_STEP' });
      } catch (error) {
        showToast('Erro ao salvar nome do usuário.');
      }
    }
  };

  if (state.user) {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
            <img src="https://i.imgur.com/9VzcNVM.png" alt="Logo" className="max-w-30 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-primary mb-2">Açaí Sabor da Terra</h1>
            <p><a href="https://instagram.com/acaisabordaterra_" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-medium">@acaisabordaterra_</a></p>
        </div>
        <div className="bg-white rounded-lg p-6">
            <p className="text-center mb-4">Olá! Você está logado com:<br /><strong>{state.user.phoneNumber}</strong></p>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Seu nome (para o pedido)</label>
                <input type="text" value={loginData.fullName} onChange={(e) => setLoginData({ ...loginData, fullName: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Digite seu nome completo"/>
            </div>
            <div className="flex gap-3">
                <button onClick={() => signOut(auth)} className="flex-1 py-3 px-4 border rounded-lg">Sair</button>
                <button onClick={continueWithUser} disabled={!loginData.fullName} className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50">Iniciar Pedido</button>
            </div>
            {state.user.phoneNumber !== ADMIN_PHONE && (
                <button onClick={() => dispatch({ type: 'SHOW_MY_ORDERS' })} className="w-full mt-3 py-2 text-sm border border-secondary text-secondary rounded-full hover:bg-purple-50">Meus Pedidos</button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div id="recaptcha-container"></div>
      <div className="text-center mb-6">
        <img src="https://i.imgur.com/9VzcNVM.png" alt="Logo" className="max-w-30 mx-auto mb-4"/>
        <h1 className="text-3xl font-bold text-primary mb-2">Açaí Sabor da Terra</h1>
        <p><a href="https://instagram.com/acaisabordaterra_" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline font-medium">@acaisabordaterra_</a></p>
      </div>

      {!showQuickOrder ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Telefone (com DDD)</label>
            <input type="tel" value={loginData.phone} onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Ex: 88912345678"/>
          </div>
          <button id="send-code-btn" onClick={sendSMSCode} disabled={isSending} className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50">{isSending ? 'Enviando...' : 'Enviar SMS'}</button>
          {showCodeInput && (
            <div className="mt-4 space-y-4">
              <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Código de 6 dígitos"/>
              <button onClick={verifyCode} className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg">Confirmar</button>
            </div>
          )}
          <div className="relative flex py-2 items-center"><div className="flex-grow border-t"></div><span className="flex-shrink mx-4 text-sm">OU</span><div className="flex-grow border-t"></div></div>
          <button onClick={() => setShowQuickOrder(true)} className="w-full py-3 border rounded-lg">Pedido rápido (sem login)</button>
        </div>
      ) : (
        <div className="space-y-4">
          <input type="text" value={quickOrderData.name} onChange={(e) => setQuickOrderData({ ...quickOrderData, name: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Seu nome"/>
          <input type="tel" value={quickOrderData.phone} onChange={(e) => setQuickOrderData({ ...quickOrderData, phone: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Seu telefone"/>
          <div className="flex gap-3">
            <button onClick={() => setShowQuickOrder(false)} className="flex-1 py-3 border rounded-lg">Voltar</button>
            <button onClick={continueQuickOrder} disabled={!quickOrderData.name || quickOrderData.phone.length < 10} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg disabled:opacity-50">Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Authentication;