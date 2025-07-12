import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export interface QROptions {
  text: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  dotType: 'square' | 'dots' | 'rounded';
  logo?: string;
}

export const generateQRCode = async (options: QROptions, format: 'PNG' | 'SVG' | 'PDF' | 'JPEG' = 'PNG'): Promise<string> => {
  const { text, size, foregroundColor, backgroundColor, errorCorrectionLevel, margin, logo } = options;

  try {
    if (format === 'SVG') {
      return await QRCode.toString(text, {
        type: 'svg',
        width: size,
        margin,
        errorCorrectionLevel,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
      });
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;

    // Generate base QR code
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin,
      errorCorrectionLevel,
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
    });

    // Draw QR code on canvas
    const qrImage = new Image();
    await new Promise((resolve) => {
      qrImage.onload = resolve;
      qrImage.src = qrDataUrl;
    });

    ctx.drawImage(qrImage, 0, 0, size, size);

    // Add logo if provided
    if (logo) {
      const logoImage = new Image();
      await new Promise((resolve, reject) => {
        logoImage.onload = resolve;
        logoImage.onerror = reject;
        logoImage.src = logo;
      });

      const logoSize = size * 0.2; // 20% of QR code size
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;

      // Draw white background for logo
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      // Draw logo
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    }

    if (format === 'PDF') {
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 50, 50);
      return pdf.output('datauristring');
    }

    return canvas.toDataURL(format === 'JPEG' ? 'image/jpeg' : 'image/png', 0.9);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const downloadFile = (dataUrl: string, filename: string, format: string) => {
  const link = document.createElement('a');
  link.download = `${filename}.${format.toLowerCase()}`;
  link.href = dataUrl;
  link.click();
};