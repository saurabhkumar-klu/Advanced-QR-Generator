import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';

type CameraType = { id: string; label: string };

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const scannerInstance = useRef<any>(null);

  const initScanner = async () => {
    if (!videoRef.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      const { default: QrScanner } = await import('qr-scanner');
      QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

      const availableCameras = await QrScanner.listCameras(true);
      if (availableCameras.length === 0) {
        throw new Error('No cameras found. Please check your device has a camera.');
      }
      setCameras(availableCameras);

      // Stop and clean up previous instance if exists
      if (scannerInstance.current) {
        await scannerInstance.current.stop();
        scannerInstance.current.destroy();
      }

      scannerInstance.current = new QrScanner(
        videoRef.current,
        (result: { data: string }) => {
          onScan(result.data);
          scannerInstance.current?.stop();
          setIsScanning(false);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: availableCameras[currentCameraIndex]?.id,
          maxScansPerSecond: 5,
        }
      );

      await scannerInstance.current.start();
      setIsScanning(true);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to access camera. Please check permissions and ensure HTTPS.';
      setError(errorMessage);
      console.error('Scanner initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerInstance.current) return;
    
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    try {
      await scannerInstance.current.setCamera(cameras[nextIndex].id);
      setCurrentCameraIndex(nextIndex);
    } catch (err) {
      console.error('Camera switch error:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };

  const toggleScanning = async () => {
    if (!scannerInstance.current) return;

    try {
      if (isScanning) {
        await scannerInstance.current.stop();
      } else {
        await scannerInstance.current.start();
      }
      setIsScanning(!isScanning);
    } catch (err) {
      console.error('Scan toggle error:', err);
      setError('Failed to toggle scanning. Please try again.');
    }
  };

  useEffect(() => {
    initScanner();

    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.stop().then(() => {
          scannerInstance.current.destroy();
        }).catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (scannerInstance.current && cameras.length > 0) {
      scannerInstance.current.setCamera(cameras[currentCameraIndex]?.id)
        .catch(console.error);
    }
  }, [currentCameraIndex, cameras]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white">Initializing scanner...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-sm text-gray-400 mb-4">
              {error.includes('permission') 
                ? 'Please allow camera access in your browser settings'
                : 'Note: Camera access requires HTTPS or localhost'}
            </p>
            <button
              onClick={initScanner}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
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
                disabled={isLoading}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start
                  </>
                )}
              </button>
              
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                  title="Switch Camera"
                  disabled={isLoading}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {cameras.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Current camera: {cameras[currentCameraIndex]?.label || 'Default'}
              </p>
            )}

            <p className="text-sm text-gray-300 text-center mt-4">
              Position the QR code within the frame to scan
            </p>
          </>
        )}
      </div>
    </div>
  );
}