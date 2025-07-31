import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Camera } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (qrCode: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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
      setIsScanning(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:max-w-md md:w-full md:h-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <QrCode className="h-6 w-6 text-blue-800 mr-3" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900">QR-Code Scanner</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Richten Sie Ihre Kamera auf den QR-Code eines Exponats, um direkt zu dessen Informationen zu gelangen.
            </p>
            
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg mb-4">
              <Camera className="h-8 w-8 text-gray-400 mr-3" />
              <span className="text-gray-600 text-base">Kamera wird geladen...</span>
            </div>
          </div>

          <div id="qr-reader" className="w-full"></div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};