import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';

// Dynamic import for QR Scanner to handle potential loading issues
let QrScanner: any = null;

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  type CameraType = { id: string; label: string };
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Dynamic import of QR Scanner
        if (!QrScanner) {
          const module = await import('qr-scanner');
          QrScanner = module.default;
        }

        setIsLoading(false);
        const availableCameras = await QrScanner.listCameras(true);
        setCameras(availableCameras);

        const qrScanner = new QrScanner(
          videoRef.current,
          (result: { data: string }) => {
            onScan(result.data);
            qrScanner.stop();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: availableCameras[currentCameraIndex]?.id || 'environment'
          }
        );

        setScanner(qrScanner);
        await qrScanner.start();
        setIsScanning(true);
      } catch (err) {
        setIsLoading(false);
        setError('Failed to access camera. Please check permissions and ensure you\'re using HTTPS.');
        console.error('Scanner error:', err);
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, [currentCameraIndex]);

  const switchCamera = async () => {
    if (cameras.length > 1) {
      const nextIndex = (currentCameraIndex + 1) % cameras.length;
      setCurrentCameraIndex(nextIndex);
    }
  };

  const toggleScanning = async () => {
    if (!scanner) return;

    if (isScanning) {
      await scanner.stop();
      setIsScanning(false);
    } else {
      await scanner.start();
      setIsScanning(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white">Loading camera...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400 mb-4">
              Note: Camera access requires HTTPS or localhost
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-300"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-4 rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-2 border-purple-400 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-purple-400"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-purple-400"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-400"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-400"></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleScanning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
              >
                {isScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {isScanning ? 'Stop' : 'Start'}
              </button>
              
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-sm text-gray-300 text-center mt-4">
              Position the QR code within the frame to scan
            </p>
            <p className="text-xs text-gray-400 text-center mt-2">
              Works with any QR code content: URLs, text, WiFi, contacts, etc.
            </p>
          </>
        )}
      </div>
    </div>
  );
}