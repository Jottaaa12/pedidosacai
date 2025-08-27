import React, { useState, useEffect, useContext } from 'react';
import QRCode from 'qrcode';
import { AppContext } from '../../context/AppContext';
import { crc16 } from '../../utils/crc16';

const PixModal = () => {
  const { state, dispatch, showToast } = useContext(AppContext);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

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
    if (state.showPixModal && state.payment?.baseTotal > 0) {
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
      generateQRCode();
    }
  }, [state.showPixModal, state.payment?.baseTotal, showToast]);

  if (!state.showPixModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-primary mb-4">Pague com Pix</h3>
        
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code Pix" className="mx-auto border rounded mb-4" />
        ) : (
          <p>Gerando QR Code...</p>
        )}
        
        <p className="mb-2">Valor: <strong>R$ {state.payment?.baseTotal?.toFixed(2) || '0.00'}</strong></p>
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

export default PixModal;