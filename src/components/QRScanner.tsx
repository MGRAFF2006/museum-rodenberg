import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          scanner.clear();
          scannerRef.current = null;
          onClose();
        },
        (error) => {
          console.warn('QR scan error:', error);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4">
      <style dangerouslySetInnerHTML={{ __html: `
        #qr-reader {
          border: none !important;
          background: #f8fafc !important;
        }
        #qr-reader img[alt="Info icon"] { display: none; }
        #qr-reader img[alt="Camera menu icon"] { display: none; }
        #qr-reader__dashboard_section_csr button {
          background-color: #0c4a6e !important;
          color: white !important;
          border: none !important;
          padding: 10px 20px !important;
          border-radius: 8px !important;
          font-family: inherit !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          margin: 4px !important;
        }
        #qr-reader__dashboard_section_csr button:hover {
          background-color: #075985 !important;
          opacity: 0.9 !important;
        }
        #qr-reader__dashboard_section_csr select {
          padding: 8px !important;
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          margin-bottom: 12px !important;
          width: 100% !important;
          max-width: 300px !important;
          display: block !important;
        }
        /* Hide camera selection UI only when the Stop button is active (scanning) */
        #qr-reader__dashboard_section_csr:has(#html5-qrcode-button-camera-stop:not([style*="display: none"])) select,
        #qr-reader__dashboard_section_csr:has(#html5-qrcode-button-camera-stop:not([style*="display: none"])) label,
        #qr-reader__dashboard_section_csr:has(#html5-qrcode-button-camera-stop:not([style*="display: none"])) > span:not(:has(button)) {
          display: none !important;
        }
        /* Style the buttons and let the library handle their visibility */
        #html5-qrcode-button-camera-start,
        #html5-qrcode-button-camera-stop {
          margin: 8px !important;
        }
        #qr-reader__dashboard_section_csr {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          padding: 16px !important;
        }
        #qr-reader__status_span {
          display: block !important;
          padding: 12px !important;
          font-size: 14px !important;
          color: #64748b !important;
        }
      `}} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center mr-4">
                <QrCode className="h-6 w-6 text-primary-800" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 leading-tight">{t('qrScanner')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-neutral-500 text-sm leading-relaxed">
              {t('qrScannerText')}
            </p>
          </div>

          <div id="qr-reader" className="w-full overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 min-h-[300px]"></div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-neutral-100 text-neutral-600 font-medium rounded-xl hover:bg-neutral-200 transition-all text-sm"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};