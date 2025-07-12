import React from 'react';
import { qrTemplates, getTemplateIcon } from '../utils/qrTemplates';
import { QRTemplate } from '../types';

interface TemplateSelectorProps {
  onSelectTemplate: (template: QRTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-white">QR Code Templates</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh]">
          {qrTemplates.map((template) => {
            const IconComponent = getTemplateIcon(template.icon);
            
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <IconComponent className="w-5 h-5 text-purple-300" />
                  </div>
                  <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {template.name}
                  </h4>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">
                  {template.description}
                </p>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Example:</p>
                  <p className="text-xs text-purple-300 font-mono">
                    {template.placeholder}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-300">
            <strong>Tip:</strong> Templates help you format content correctly for different QR code types. 
            Each template provides the proper structure and validation for optimal scanning results.
          </p>
        </div>
      </div>
    </div>
  );
}