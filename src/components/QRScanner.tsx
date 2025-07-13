import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, RotateCcw, X, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [jsQRLoaded, setJsQRLoaded] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load jsQR library
  useEffect(() => {
    if (window.jsQR) {
      setJsQRLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.onload = () => {
      setJsQRLoaded(true);
      console.log('jsQR library loaded successfully');
    };
    script.onerror = () => {
      console.warn('jsQR library failed to load');
      setError('QR scanning library failed to load. Please try refreshing the page.');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // QR Code detection using canvas and image processing
  const detectQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !jsQRLoaded || !window.jsQR) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR to detect QR code
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code && code.data) {
        console.log('QR Code detected:', code.data);
        onScan(code.data);
        stopScanning();
        return;
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }
  };

  // Detect QR code from uploaded image
  const detectQRFromImage = async (file: File) => {
    if (!jsQRLoaded || !window.jsQR) {
      setError('QR scanning library not loaded yet. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (!canvas || !ctx) {
        throw new Error('Canvas not available');
      }

      // Create image element
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Detect QR code
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      if (code && code.data) {
        console.log('QR Code detected from image:', code.data);
        onScan(code.data);
        onClose();
      } else {
        setError('No QR code found in the uploaded image. Please try a clearer image.');
      }

      // Clean up
      URL.revokeObjectURL(img.src);
    } catch (err) {
      console.error('Image QR detection error:', err);
      setError('Failed to process the uploaded image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      setHasPermission(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser. Please use a modern browser or try uploading an image instead.');
      }

      // Request camera permission with timeout
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      console.log('Requesting camera access...');
      const mediaStream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Camera access timeout')), 10000)
        )
      ]) as MediaStream;

      console.log('Camera access granted');
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current?.play().then(() => {
            console.log('Video playing');
            setIsLoading(false);
            startScanning();
          }).catch((err) => {
            console.error('Video play error:', err);
            setError('Failed to start video playback. Please try again.');
            setIsLoading(false);
          });
        };

        videoRef.current.onerror = (err) => {
          console.error('Video error:', err);
          setError('Video playback error. Please try again.');
          setIsLoading(false);
        };
      }

    } catch (err) {
      console.error('Camera initialization error:', err);
      setIsLoading(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setHasPermission(false);
          setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device. Please try uploading an image instead.');
        } else if (err.name === 'NotSupportedError') {
          setError('Camera is not supported in this browser. Please try uploading an image instead.');
        } else if (err.message.includes('timeout')) {
          setError('Camera access timed out. Please check your camera permissions and try again.');
        } else {
          setError(err.message || 'Failed to access camera. Please try uploading an image instead.');
        }
      } else {
        setError('Unknown error occurred while accessing camera. Please try uploading an image instead.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    if (!jsQRLoaded) {
      setError('QR scanning library not loaded yet. Please wait and try again.');
      return;
    }
    
    setIsScanning(true);
    // Start QR detection interval
    scanIntervalRef.current = setInterval(detectQRCode, 100); // Check every 100ms
    console.log('Started QR scanning');
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    console.log('Stopped QR scanning');
  };

  const switchCamera = async () => {
    stopCamera();
    stopScanning();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    detectQRFromImage(file);
  };

  const retryCamera = () => {
    setError('');
    setHasPermission(null);
    setIsLoading(true);
    startCamera();
  };

  // Auto-start camera when component mounts and jsQR is loaded
  useEffect(() => {
    if (jsQRLoaded && scanMode === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
      stopScanning();
    };
  }, [jsQRLoaded, facingMode, scanMode]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl max-w-md w-full max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScanMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setScanMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              scanMode === 'upload'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Upload
          </button>
        </div>

        {scanMode === 'camera' ? (
          // Camera Mode
          <>
            {!jsQRLoaded ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-white mb-2">Loading QR scanner...</p>
                <p className="text-sm text-gray-400">Please wait while we prepare the camera</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-white mb-2">Initializing camera...</p>
                <p className="text-sm text-gray-400">Please allow camera access when prompted</p>
              </div>
            ) : hasPermission === false ? (
              <div className="text-center py-8">
                <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-300 mb-4">Camera permission required</p>
                <p className="text-sm text-gray-400 mb-4">
                  Please allow camera access to scan QR codes, or try uploading an image instead
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={retryCamera}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setScanMode('upload')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white"
                  >
                    Upload Image
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-300 mb-4 text-sm">{error}</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    Make sure you're using HTTPS or localhost
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={retryCamera}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-sm"
                    >
                      Retry Camera
                    </button>
                    <button
                      onClick={() => setScanMode('upload')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-white text-sm"
                    >
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative mb-4 rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-48 sm:h-64 object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  
                  {/* Hidden canvas for QR detection */}
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scan overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner markers */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-lg"></div>
                    
                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border border-purple-400 rounded-full bg-purple-400/20"></div>
                    </div>
                    
                    {/* Scanning animation */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 sm:w-48 h-32 sm:h-48 border-2 border-purple-400 rounded-lg animate-pulse"></div>
                      </div>
                    )}
                    
                    {/* Status indicator */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                      {isScanning ? '🔍 Scanning...' : '📷 Ready'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-sm"
                  >
                    {isScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    {isScanning ? 'Stop' : 'Start'}
                  </button>
                  
                  <button
                    onClick={switchCamera}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                    title="Switch Camera"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-300">
                    Position the QR code within the frame to scan
                  </p>
                  <p className="text-xs text-gray-400">
                    Camera: {facingMode === 'environment' ? 'Back' : 'Front'}
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          // Upload Mode
          <div className="text-center py-8">
            <div className="mb-6">
              <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Upload QR Code Image</h4>
              <p className="text-sm text-gray-300 mb-4">
                Select an image file containing a QR code to decode
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 mx-auto"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose Image
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-6 text-xs text-gray-400 space-y-1">
              <p>• Supports JPG, PNG, GIF, WebP formats</p>
              <p>• Works with any QR code content</p>
              <p>• No internet required for processing</p>
            </div>

            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}

// Extend Window interface for jsQR
declare global {
  interface Window {
    jsQR: any;
  }
}