import { QRTemplate } from '../types';
import { Wifi, Mail, Phone, MapPin, Calendar, CreditCard, User, Globe } from 'lucide-react';

export const qrTemplates: QRTemplate[] = [
  {
    id: 'url',
    name: 'Website URL',
    description: 'Link to any website',
    icon: 'Globe',
    placeholder: 'https://example.com',
    format: (input: string) => {
      if (!input.startsWith('http://') && !input.startsWith('https://')) {
        return `https://${input}`;
      }
      return input;
    },
    validation: (input: string) => {
      try {
        new URL(input.startsWith('http') ? input : `https://${input}`);
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'wifi',
    name: 'WiFi Network',
    description: 'Connect to WiFi automatically',
    icon: 'Wifi',
    placeholder: 'Network: MyWiFi, Password: password123, Security: WPA',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const network = parts.find(p => p.toLowerCase().startsWith('network:'))?.split(':')[1]?.trim() || 'MyNetwork';
      const password = parts.find(p => p.toLowerCase().startsWith('password:'))?.split(':')[1]?.trim() || '';
      const security = parts.find(p => p.toLowerCase().startsWith('security:'))?.split(':')[1]?.trim() || 'WPA';
      return `WIFI:T:${security};S:${network};P:${password};;`;
    }
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send email with pre-filled content',
    icon: 'Mail',
    placeholder: 'To: user@example.com, Subject: Hello, Body: Message content',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const to = parts.find(p => p.toLowerCase().startsWith('to:'))?.split(':')[1]?.trim() || '';
      const subject = parts.find(p => p.toLowerCase().startsWith('subject:'))?.split(':')[1]?.trim() || '';
      const body = parts.find(p => p.toLowerCase().startsWith('body:'))?.split(':')[1]?.trim() || '';
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  },
  {
    id: 'phone',
    name: 'Phone Number',
    description: 'Call a phone number',
    icon: 'Phone',
    placeholder: '+1234567890',
    format: (input: string) => `tel:${input.replace(/[^\d+]/g, '')}`,
    validation: (input: string) => /^[\d+\-\s()]+$/.test(input)
  },
  {
    id: 'sms',
    name: 'SMS Message',
    description: 'Send SMS with pre-filled text',
    icon: 'Phone',
    placeholder: 'Phone: +1234567890, Message: Hello there!',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const phone = parts.find(p => p.toLowerCase().startsWith('phone:'))?.split(':')[1]?.trim() || '';
      const message = parts.find(p => p.toLowerCase().startsWith('message:'))?.split(':')[1]?.trim() || '';
      return `sms:${phone.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(message)}`;
    }
  },
  {
    id: 'location',
    name: 'Location',
    description: 'Share GPS coordinates',
    icon: 'MapPin',
    placeholder: 'Latitude: 40.7128, Longitude: -74.0060',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const lat = parts.find(p => p.toLowerCase().startsWith('latitude:'))?.split(':')[1]?.trim() || '0';
      const lng = parts.find(p => p.toLowerCase().startsWith('longitude:'))?.split(':')[1]?.trim() || '0';
      return `geo:${lat},${lng}`;
    }
  },
  {
    id: 'vcard',
    name: 'Contact Card',
    description: 'Share contact information',
    icon: 'User',
    placeholder: 'Name: John Doe, Phone: +1234567890, Email: john@example.com',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const name = parts.find(p => p.toLowerCase().startsWith('name:'))?.split(':')[1]?.trim() || '';
      const phone = parts.find(p => p.toLowerCase().startsWith('phone:'))?.split(':')[1]?.trim() || '';
      const email = parts.find(p => p.toLowerCase().startsWith('email:'))?.split(':')[1]?.trim() || '';
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    }
  },
  {
    id: 'event',
    name: 'Calendar Event',
    description: 'Add event to calendar',
    icon: 'Calendar',
    placeholder: 'Title: Meeting, Start: 2024-01-15T10:00, End: 2024-01-15T11:00',
    format: (input: string) => {
      const parts = input.split(',').map(p => p.trim());
      const title = parts.find(p => p.toLowerCase().startsWith('title:'))?.split(':')[1]?.trim() || '';
      const start = parts.find(p => p.toLowerCase().startsWith('start:'))?.split(':')[1]?.trim() || '';
      const end = parts.find(p => p.toLowerCase().startsWith('end:'))?.split(':')[1]?.trim() || '';
      return `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start.replace(/[-:]/g, '')}\nDTEND:${end.replace(/[-:]/g, '')}\nEND:VEVENT`;
    }
  }
];

export const getTemplateIcon = (iconName: string) => {
  const icons: { [key: string]: any } = {
    Globe,
    Wifi,
    Mail,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    User
  };
  return icons[iconName] || Globe;
};