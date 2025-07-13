import React from 'react';
import { 
  Globe, Wifi, Mail, Phone, MessageSquare, MapPin, User, Calendar 
} from 'lucide-react';
import { qrTemplates } from '../utils/qrTemplates';
import { QRTemplate } from '../types';

interface TemplateSelectorProps {
  onSelectTemplate: (template: QRTemplate) => void;
  onClose: () => void;
}

const iconComponents = {
  Globe,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  User,
  Calendar
};

export default function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  const handleTemplateClick = (template: QRTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-2xl font-semibold text-white">QR Templates</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto max-h-[75vh]">
          {qrTemplates.map((template) => {
            const IconComponent = iconComponents[template.icon as keyof typeof iconComponents] || Globe;
            
            return (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="p-4 sm:p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-purple-400/50 transition-all duration-300 text-left group hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <IconComponent className="w-5 h-5 text-purple-300" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {template.name}
                  </h4>
                </div>
                
                <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
                  {template.description}
                </p>
                
                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-gray-400 mb-1">Example format:</p>
                  <p className="text-xs text-purple-300 font-mono break-all leading-tight">
                    {template.placeholder}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">How to use templates:</h4>
          <div className="text-xs sm:text-sm text-gray-300 space-y-1">
            <p>• <strong>Click any template</strong> to auto-fill the input field</p>
            <p>• <strong>Modify the content</strong> to match your specific needs</p>
            <p>• <strong>Auto-formatting</strong> optimizes content for QR scanning</p>
            <p>• <strong>Universal compatibility</strong> with all QR scanner apps</p>
          </div>
        </div>
      </div>
    </div>
  );
}