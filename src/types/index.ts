export interface QRHistory {
  id: string;
  text: string;
  foregroundColor: string;
  backgroundColor: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  dotType: 'square' | 'dots' | 'rounded';
  dataUrl: string;
  format: 'PNG' | 'SVG' | 'PDF' | 'JPEG';
  timestamp: Date;
  scanCount?: number;
  logo?: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  placeholder: string;
  format: (input: string) => string;
  validation?: (input: string) => boolean;
}

export interface BulkQRItem {
  id: string;
  text: string;
  filename: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  dataUrl?: string;
  error?: string;
}