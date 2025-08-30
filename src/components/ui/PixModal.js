import React, { useState, useEffect, useContext } from 'react';
import QRCode from 'qrcode';
import { AppContext } from '../../context/AppContext';
import { crc16 } from '../../utils/crc16';

const PixModal = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [show, setShow] = useState(false);

  const generateBrCode = () => {
    const formatField = (id, value) => `${id}${String(value).length.toString().padStart(2, '0')}${value}`;
    const baseTotal = state.payment?.baseTotal || 0;
    
    if (baseTotal <= 0) {
      console.error('Valor do pedido inválido para o Pix.');
      return '';
    }

    const payload = [
      formatField('00', '01'),
      formatField('26', `${formatField('00', 'br.gov.bcb.pix')}${formatField('01', '+5588981905006')}`),
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
  
  useEffect(() => {
    if (state.showPixModal) {
      setShow(true);
      if (state.payment?.baseTotal > 0) {
        const generateQRCode = async () => {
          try {
            const brCode = generateBrCode();
            if (brCode) {
              const url = await QRCode.toDataURL(brCode, { width: 256, margin: 1 });
              setQrCodeUrl(url);
            }
          } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            showToast('Erro ao gerar QR Code');
          }
        };
        generateQRCode();
      }
    } else {
      setShow(false);
    }
  }, [state.showPixModal, state.payment?.baseTotal, showToast]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      dispatch({ type: 'HIDE_PIX_MODAL' });
    }, 300); // Aguarda a animação de saída
  };

  if (!state.showPixModal) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl max-w-sm w-full text-center overflow-hidden transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-gradient-to-r from-primary to-secondary p-4">
          <h3 className="text-lg font-semibold text-white">Pague com Pix</h3>
        </div>
        
        <div className="p-6">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code Pix" className="mx-auto border rounded mb-4" />
          ) : (
            <div className="flex justify-center items-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-3 text-gray-600">Gerando QR Code...</p>
            </div>
          )}
          
          <p className="mb-2">Valor: <strong>R$ {state.payment?.baseTotal?.toFixed(2) || '0.00'}</strong></p>
          <p className="text-xs text-gray-600 mb-4 break-all">Chave: +5588981905006</p>
          
          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold transition-transform transform hover:scale-105 hover:brightness-110"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixModal;
