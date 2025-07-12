import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, History, Palette, Settings, Type, Link2, Camera, 
  Upload, FileText, Layers, Scan, Zap, Grid, RotateCcw, 
  Copy, Share2, Eye, EyeOff, Trash2, Star, Archive
} from 'lucide-react';
import { QRHistory, QRTemplate } from '../types';
import { generateQRCode, downloadFile, QROptions } from '../utils/qrGenerator';
import QRScannerComponent from './QRScanner';
import BulkGenerator from './BulkGenerator';
import TemplateSelector from './TemplateSelector';
import { qrTemplates } from '../utils/qrTemplates';

export default function QRGenerator() {
  const [text, setText] = useState('https://example.com');
  const [originalText, setOriginalText] = useState('');
  const [showConvertButton, setShowConvertButton] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [foregroundColor, setForegroundColor] = useState('#1f2937');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [size, setSize] = useState(256);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState(2);
  const [dotType, setDotType] = useState<'square' | 'dots' | 'rounded'>('square');
  const [format, setFormat] = useState<'PNG' | 'SVG' | 'PDF' | 'JPEG'>('PNG');
  const [logo, setLogo] = useState<string>('');
  const [history, setHistory] = useState<QRHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const qrOptions: QROptions = {
    text,
    size,
    foregroundColor,
    backgroundColor,
    errorCorrectionLevel,
    margin,
    dotType,
    logo
  };

  const generateQR = async () => {
    if (!text.trim()) {
      setQrDataUrl('');
      setGenerationStatus('idle');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStatus('generating');
    setValidationError('');
    
    try {
      const dataUrl = await generateQRCode(qrOptions, format);
      setQrDataUrl(dataUrl);
      setGenerationStatus('success');
      
      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 1000);
      
      // Optional: Play success sound (uncomment if desired)
      // const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      // audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (error) {
      console.error('Error generating QR code:', error);
      setValidationError('Failed to generate QR code. Please check your input.');
      setGenerationStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateQR();
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [text, foregroundColor, backgroundColor, size, errorCorrectionLevel, margin, dotType, format, logo]);

  // Check if text looks like a URL that was pasted
  useEffect(() => {
    const urlPattern = /^(https?:\/\/|www\.)/i;
    if (text !== originalText && urlPattern.test(text) && !text.startsWith('http')) {
      setShowConvertButton(true);
      setOriginalText(text);
    } else {
      setShowConvertButton(false);
    }
  }, [text, originalText]);

  const convertToHttps = () => {
    if (!text.startsWith('http')) {
      setText(text.startsWith('www.') ? `https://${text}` : `https://www.${text}`);
    }
    setShowConvertButton(false);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    const filename = `qr-code-${Date.now()}`;
    downloadFile(qrDataUrl, filename, format);

    // Add to history
    const newEntry: QRHistory = {
      id: Date.now().toString(),
      text,
      foregroundColor,
      backgroundColor,
      size,
      errorCorrectionLevel,
      margin,
      dotType,
      dataUrl: qrDataUrl,
      format,
      timestamp: new Date(),
      logo,
      scanCount: 0
    };
    setHistory(prev => [newEntry, ...prev.slice(0, 19)]); // Keep last 20
  };

  const loadFromHistory = (entry: QRHistory) => {
    setText(entry.text);
    setForegroundColor(entry.foregroundColor);
    setBackgroundColor(entry.backgroundColor);
    setSize(entry.size);
    setErrorCorrectionLevel(entry.errorCorrectionLevel);
    setMargin(entry.margin);
    setDotType(entry.dotType);
    setFormat(entry.format);
    setLogo(entry.logo || '');
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    setFavorites(new Set());
  };

  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const copyToClipboard = async () => {
    if (!qrDataUrl) return;
    
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanResult = (result: string) => {
    setText(result);
    setShowScanner(false);
  };

  const handleTemplateSelect = (template: QRTemplate) => {
    setText(template.placeholder);
    setShowTemplates(false);
  };

  const validateInput = (input: string): boolean => {
    if (input.length > 4296) {
      setValidationError('Text is too long. QR codes support up to 4,296 characters.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleTextChange = (value: string) => {
    if (validateInput(value)) {
      setText(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Advanced QR Generator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create, customize, and manage QR codes with professional features. Scan, bulk generate, and export in multiple formats.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-purple-300 backdrop-blur-sm"
            >
              <Grid className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-purple-300 backdrop-blur-sm"
            >
              <Scan className="w-4 h-4" />
              Scan & Decode
            </button>
            <button
              onClick={() => setShowBulkGenerator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-purple-300 backdrop-blur-sm"
            >
              <Layers className="w-4 h-4" />
              Bulk Generate
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!qrDataUrl}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-purple-300 backdrop-blur-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Text Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Type className="w-5 h-5 text-purple-300" />
                <h2 className="text-xl font-semibold text-white">Enter Your Content</h2>
              </div>
              <textarea
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text, URL, or any content..."
                className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  Character count: {text.length}/4296
                </div>
                {showConvertButton && (
                  <button
                    onClick={convertToHttps}
                    className="flex items-center gap-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-green-300 text-sm"
                  >
                    <Zap className="w-3 h-3" />
                    Convert to HTTPS
                  </button>
                )}
              </div>
              {validationError && (
                <p className="text-red-400 text-sm mt-2">{validationError}</p>
              )}
            </div>

            {/* Advanced Settings Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-purple-300" />
                  <h2 className="text-xl font-semibold text-white">Advanced Settings</h2>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Palette className="w-4 h-4 text-purple-300" />
                </button>
              </div>

              {/* Basic Settings - Always Visible */}
              <div className="space-y-4">
                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Foreground Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border-2 border-white/20 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['PNG', 'JPEG', 'SVG', 'PDF'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          format === fmt
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Settings - Collapsible */}
              {showSettings && (
                <div className="space-y-4 mt-6 pt-6 border-t border-white/20 animate-in slide-in-from-top duration-300">
                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Size: {size}px
                    </label>
                    <input
                      type="range"
                      min="128"
                      max="1024"
                      step="32"
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>128px</span>
                      <span>576px</span>
                      <span>1024px</span>
                    </div>
                  </div>

                  {/* Error Correction Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Error Correction Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setErrorCorrectionLevel(level)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            errorCorrectionLevel === level
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                          title={`${level} - ${level === 'L' ? 'Low' : level === 'M' ? 'Medium' : level === 'Q' ? 'Quartile' : 'High'} (${level === 'L' ? '~7%' : level === 'M' ? '~15%' : level === 'Q' ? '~25%' : '~30%'} recovery)`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Higher levels allow more damage recovery but create denser codes
                    </p>
                  </div>

                  {/* Margin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Margin: {margin}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Logo Overlay
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-purple-300"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </button>
                      {logo && (
                        <button
                          onClick={() => setLogo('')}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {logo && (
                      <div className="mt-2">
                        <img src={logo} alt="Logo preview" className="w-12 h-12 rounded border border-white/20" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* History Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-purple-300" />
                  <h2 className="text-xl font-semibold text-white">History</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-purple-300"
                  >
                    {showHistory ? 'Hide' : 'Show'}
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {showHistory && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No QR codes generated yet
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <img
                          src={entry.dataUrl}
                          alt="QR Code"
                          className="w-10 h-10 rounded border border-white/20 cursor-pointer"
                          onClick={() => loadFromHistory(entry)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate font-medium">
                            {entry.text}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{entry.timestamp.toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{entry.format}</span>
                            <span>•</span>
                            <span>{entry.size}px</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleFavorite(entry.id)}
                            className={`p-1 rounded transition-colors ${
                              favorites.has(entry.id)
                                ? 'text-yellow-400 hover:text-yellow-300'
                                : 'text-gray-400 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => loadFromHistory(entry)}
                            className="p-1 rounded text-purple-300 hover:text-purple-200 transition-colors"
                          >
                            <Link2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {/* QR Code Preview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6 text-center">
                QR Code Preview
              </h2>
              
              <div className="flex justify-center mb-6">
                <div className={`bg-white p-6 rounded-2xl shadow-2xl relative transition-all duration-500 ${
                  showSuccessAnimation ? 'ring-4 ring-green-400 ring-opacity-75 scale-105' : ''
                } ${generationStatus === 'generating' ? 'animate-pulse' : ''}`}>
                  {isGenerating ? (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                      <p className="text-gray-600 text-sm font-medium">Generating QR Code...</p>
                    </div>
                  ) : qrDataUrl ? (
                    <div className="relative">
                      <img
                        src={qrDataUrl}
                        alt="Generated QR Code"
                        className="w-64 h-64 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      {generationStatus === 'success' && showSuccessAnimation && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce">
                            ✓ Generated!
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500 text-center">Enter text to generate QR code</p>
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="absolute -top-2 -right-2">
                    {generationStatus === 'generating' && (
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    {generationStatus === 'success' && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {generationStatus === 'error' && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={downloadQR}
                  disabled={!qrDataUrl || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Download className="w-5 h-5" />
                  Download {format}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={copyToClipboard}
                    disabled={!qrDataUrl}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={() => navigator.share?.({ url: qrDataUrl })}
                    disabled={!qrDataUrl || !navigator.share}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-300">
                <div className="flex items-center justify-center gap-2">
                  <span>{size}×{size}px • {format} format • Error correction: {errorCorrectionLevel}</span>
                  {generationStatus === 'success' && (
                    <span className="inline-flex items-center gap-1 text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Ready
                    </span>
                  )}
                  {generationStatus === 'generating' && (
                    <span className="inline-flex items-center gap-1 text-yellow-400">
                      <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      Generating
                    </span>
                  )}
                  {generationStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-red-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Error
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Tips & Features</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Templates:</strong> Use pre-built formats for WiFi, contacts, emails, etc.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Scanner:</strong> Decode any QR code using your device camera</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Error Correction:</strong> Higher levels allow scanning even when damaged</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Logo Overlay:</strong> Add branding (recommended: 20% of QR size)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Bulk Generator:</strong> Create multiple QR codes from CSV/text files</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p><strong>Universal Support:</strong> Works with any content - text, URLs, data, etc.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScanner && (
        <QRScannerComponent
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showBulkGenerator && (
        <BulkGenerator
          qrOptions={qrOptions}
          format={format}
          onClose={() => setShowBulkGenerator(false)}
        />
      )}

      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}