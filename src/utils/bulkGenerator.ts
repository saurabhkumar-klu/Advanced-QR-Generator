import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateQRCode, QROptions } from './qrGenerator';
import { BulkQRItem } from '../types';

export const processBulkQRCodes = async (
  items: BulkQRItem[],
  options: Omit<QROptions, 'text'>,
  format: 'PNG' | 'SVG' | 'PDF' | 'JPEG',
  onProgress: (completed: number, total: number) => void
): Promise<BulkQRItem[]> => {
  const results: BulkQRItem[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const dataUrl = await generateQRCode({
        ...options,
        text: item.text
      }, format);
      
      results.push({
        ...item,
        status: 'completed',
        dataUrl
      });
    } catch (error) {
      results.push({
        ...item,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    onProgress(i + 1, items.length);
  }
  
  return results;
};

export const downloadBulkQRCodes = async (items: BulkQRItem[], format: string) => {
  const zip = new JSZip();
  
  items.forEach((item) => {
    if (item.dataUrl && item.status === 'completed') {
      const base64Data = item.dataUrl.split(',')[1];
      zip.file(`${item.filename}.${format.toLowerCase()}`, base64Data, { base64: true });
    }
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `qr-codes-${Date.now()}.zip`);
};

export const parseBulkInput = (input: string): BulkQRItem[] => {
  const lines = input.split('\n').filter(line => line.trim());
  return lines.map((line, index) => {
    const parts = line.split(',').map(p => p.trim());
    const text = parts[0] || '';
    const filename = parts[1] || `qr-code-${index + 1}`;
    
    return {
      id: `bulk-${index}`,
      text,
      filename: filename.replace(/[^a-zA-Z0-9-_]/g, '-'),
      status: 'pending' as const
    };
  });
};