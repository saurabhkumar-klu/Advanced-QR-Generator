import React, { useState } from 'react';
import { Upload, Download, FileText, Trash2, Play, Pause } from 'lucide-react';
import { BulkQRItem } from '../types';
import { parseBulkInput, processBulkQRCodes, downloadBulkQRCodes } from '../utils/bulkGenerator';
import { QROptions } from '../utils/qrGenerator';

interface BulkGeneratorProps {
  qrOptions: Omit<QROptions, 'text'>;
  format: 'PNG' | 'SVG' | 'PDF' | 'JPEG';
  onClose: () => void;
}

export default function BulkGenerator({ qrOptions, format, onClose }: BulkGeneratorProps) {
  const [input, setInput] = useState('');
  const [items, setItems] = useState<BulkQRItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) {
      const parsedItems = parseBulkInput(value);
      setItems(parsedItems);
    } else {
      setItems([]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleInputChange(content);
    };
    reader.readAsText(file);
  };

  const startProcessing = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setProgress({ completed: 0, total: items.length });

    try {
      const results = await processBulkQRCodes(
        items,
        qrOptions,
        format,
        (completed, total) => setProgress({ completed, total })
      );
      setItems(results);
    } catch (error) {
      console.error('Bulk processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    const completedItems = items.filter(item => item.status === 'completed');
    if (completedItems.length === 0) return;

    await downloadBulkQRCodes(completedItems, format);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    const newInput = items
      .filter(item => item.id !== id)
      .map(item => `${item.text}, ${item.filename}`)
      .join('\n');
    setInput(newInput);
  };

  const getStatusColor = (status: BulkQRItem['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'generating': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: BulkQRItem['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'error': return '✗';
      case 'generating': return '⟳';
      default: return '○';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-white">Bulk QR Generator</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Input Data
              </label>
              <div className="flex gap-2 mb-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors text-sm text-purple-300">
                  <Upload className="w-4 h-4" />
                  Upload CSV/TXT
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => handleInputChange('')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter one item per line:&#10;https://example.com, website-qr&#10;Contact info, contact-card&#10;WiFi password, wifi-qr"
                className="w-full h-48 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">
                Format: "content, filename" (one per line)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startProcessing}
                disabled={items.length === 0 || isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300"
              >
                {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isProcessing ? 'Processing...' : 'Generate All'}
              </button>
              
              <button
                onClick={downloadAll}
                disabled={!items.some(item => item.status === 'completed')}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                Download ZIP
              </button>
            </div>

            {isProcessing && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>{progress.completed}/{progress.total}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">
                Items ({items.length})
              </h4>
              <div className="text-sm text-gray-300">
                Format: {format}
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No items to process</p>
                    <p className="text-sm">Add content above to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                      <div className={`text-lg ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate font-medium">
                          {item.filename}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {item.text}
                        </p>
                        {item.error && (
                          <p className="text-red-400 text-xs">
                            Error: {item.error}
                          </p>
                        )}
                      </div>

                      {item.dataUrl && (
                        <img
                          src={item.dataUrl}
                          alt="QR Preview"
                          className="w-8 h-8 rounded border border-white/20"
                        />
                      )}

                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-all text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}