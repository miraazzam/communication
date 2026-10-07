export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  hours: number;
  hourlyRate: number;
  totalPrice: number; // Client proposed price
  specialRequest: string;
  status: 'pending' | 'accepted' | 'declined';
  ownerDecisionReason?: string;
  ownerDecisionAt?: string;
  createdAt: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  ratePerHour: number;
  popular?: boolean;
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  type: 'owner_notification' | 'client_submission' | 'client_decision';
  html: string;
  text: string;
  bookingId: string;
  status: 'sent' | 'simulated';
  previewUrl?: string;
  createdAt: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string;
}

export interface AppConfig {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  currency: string;
  hourlyRate?: number;
  hasSmtpConfigured?: boolean;
  smtp?: SmtpConfig;
}
