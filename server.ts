import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Persistent storage setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM"
  hours: number;
  hourlyRate: number;
  totalPrice: number; // Client proposed price
  specialRequest: string;
  status: 'pending' | 'accepted' | 'declined';
  ownerDecisionReason?: string;
  ownerDecisionAt?: string;
  createdAt: string;
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
  hourlyRate: number;
  smtp?: SmtpConfig;
}

const defaultConfig: AppConfig = {
  ownerEmail: 'mira.azzam137@gmail.com',
  ownerName: 'Mira Azzam',
  businessName: 'Appointments with Mira Azzam',
  currency: '$',
  hourlyRate: 75,
};

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Mailer helper
async function getTransporter(config: AppConfig) {
  if (config.smtp && config.smtp.host && config.smtp.user && config.smtp.pass) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: Number(config.smtp.port) || 465,
      secure: config.smtp.secure ?? (Number(config.smtp.port) === 465),
      auth: {
        user: config.smtp.user.trim(),
        pass: config.smtp.pass.trim(),
      },
    });
  }

  // Fallback to test / json-log transporter so it never crashes
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  bookingId: string;
  type: 'owner_notification' | 'client_submission' | 'client_decision';
}): Promise<SentEmail> {
  const config = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
  const emails = readJsonFile<SentEmail[]>(EMAILS_FILE, []);

  const isRealSmtp = Boolean(config.smtp && config.smtp.host && config.smtp.user && config.smtp.pass);

  const emailRecord: SentEmail = {
    id: `EM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    to: params.to,
    subject: params.subject,
    type: params.type,
    html: params.html,
    text: params.text,
    bookingId: params.bookingId,
    status: isRealSmtp ? 'sent' : 'simulated',
    createdAt: new Date().toISOString(),
  };

  try {
    const transporter = await getTransporter(config);
    const fromAddress = config.smtp?.from || (config.smtp?.user ? `"${config.businessName}" <${config.smtp.user}>` : `"${config.businessName}" <notifications@bookease.app>`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      emailRecord.previewUrl = preview;
    }
    console.log(`[Email Dispatched] To: ${params.to} | Subject: ${params.subject} | Status: ${emailRecord.status}`);
  } catch (err: any) {
    console.error('Failed to send mail via SMTP, recorded in log:', err.message);
    emailRecord.status = 'simulated';
  }

  emails.unshift(emailRecord);
  writeJsonFile(EMAILS_FILE, emails.slice(0, 100));
  return emailRecord;
}

// Structured email generators
function createOwnerBookingEmailHtml(booking: Booking, config: AppConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
    .header p { margin: 0; color: #94a3b8; font-size: 13px; }
    .body { padding: 32px; }
    .alert-banner { background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #065f46; }
    .field-grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .field-grid th { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; font-weight: 600; }
    .field-grid td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 500; }
    .highlight-price { font-size: 20px; font-weight: 700; color: #059669; }
    .request-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 14px; color: #334155; line-height: 1.5; margin-bottom: 28px; white-space: pre-wrap; }
    .actions { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; }
    .btn { display: inline-block; padding: 10px 22px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; margin: 0 6px; }
    .btn-portal { background: #0f172a; color: #ffffff; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Booking Request Received</h1>
      <p>${config.businessName} &middot; Notification for ${config.ownerName}</p>
    </div>
    <div class="body">
      <div class="alert-banner">
        <strong>Action Needed:</strong> A client submitted a booking and proposed their price. You can review, accept, or decline with a custom message.
      </div>
      
      <table class="field-grid">
        <tr>
          <th>Reference ID</th>
          <td><strong>#${booking.id}</strong></td>
        </tr>
        <tr>
          <th>Client Name</th>
          <td>${booking.clientName}</td>
        </tr>
        <tr>
          <th>Client Email</th>
          <td><a href="mailto:${booking.clientEmail}" style="color: #2563eb; text-decoration: none;">${booking.clientEmail}</a></td>
        </tr>
        <tr>
          <th>Client Phone</th>
          <td>${booking.clientPhone || 'Not provided'}</td>
        </tr>
        <tr>
          <th>Date</th>
          <td><strong>${booking.date}</strong></td>
        </tr>
        <tr>
          <th>What Hour</th>
          <td><strong>${booking.timeSlot}</strong> (${booking.hours} hour${booking.hours > 1 ? 's' : ''})</td>
        </tr>
        <tr>
          <th>Client Proposed Price</th>
          <td><span class="highlight-price">${config.currency}${booking.totalPrice}</span></td>
        </tr>
      </table>

      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 8px;">
        Special Request / Notes from Client:
      </div>
      <div class="request-box">
        ${booking.specialRequest ? booking.specialRequest : '<em>No special requests provided.</em>'}
      </div>
    </div>
    <div class="actions">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">Respond with Accept or Decline and your custom message:</p>
      <a href="#owner" class="btn btn-portal">Open Host Portal to Respond</a>
    </div>
    <div class="footer">
      Sent directly to ${config.ownerEmail} &middot; Received on ${new Date(booking.createdAt).toLocaleString()}
    </div>
  </div>
</body>
</html>
`;
}

function createDecisionEmailHtml(booking: Booking, config: AppConfig): string {
  const isAccepted = booking.status === 'accepted';
  const statusColor = isAccepted ? '#059669' : '#dc2626';
  const statusBg = isAccepted ? '#ecfdf5' : '#fef2f2';
  const statusBorder = isAccepted ? '#a7f3d0' : '#fecaca';
  const title = isAccepted ? 'Booking Request Accepted!' : 'Booking Request Update';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 600; }
    .header p { margin: 0; color: #94a3b8; font-size: 13px; }
    .body { padding: 32px; }
    .status-badge-container { text-align: center; margin-bottom: 24px; padding: 18px; background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; }
    .status-badge-container h2 { margin: 0 0 4px 0; font-size: 18px; color: ${statusColor}; font-weight: 700; }
    .status-badge-container p { margin: 0; font-size: 13px; color: #475569; }
    .reason-box { background: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid ${statusColor}; border-radius: 6px; padding: 16px; margin: 24px 0; }
    .reason-box h4 { margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .reason-box p { margin: 0; font-size: 15px; color: #0f172a; line-height: 1.5; white-space: pre-wrap; font-style: italic; }
    .field-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .field-grid th { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 35%; font-weight: 600; }
    .field-grid td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 500; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${config.businessName}</h1>
      <p>Appointment Update &middot; Reference #${booking.id}</p>
    </div>
    <div class="body">
      <div class="status-badge-container">
        <h2>${title}</h2>
        <p>Dear ${booking.clientName}, ${isAccepted ? 'your requested appointment has been confirmed.' : 'we are unable to accommodate your booking request at this time.'}</p>
      </div>

      <div class="reason-box">
        <h4>Message from ${config.ownerName}:</h4>
        <p>${booking.ownerDecisionReason || (isAccepted ? 'Accepted with pleasure. Looking forward to our session.' : 'Sorry, I am unable to accept this request.')}</p>
      </div>

      <div style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 12px;">
        Appointment Summary:
      </div>
      <table class="field-grid">
        <tr>
          <th>Date</th>
          <td><strong>${booking.date}</strong></td>
        </tr>
        <tr>
          <th>What Hour</th>
          <td>${booking.timeSlot} (${booking.hours} hr)</td>
        </tr>
        <tr>
          <th>Agreed Price</th>
          <td><strong>${config.currency}${booking.totalPrice}</strong></td>
        </tr>
        <tr>
          <th>Special Request</th>
          <td>${booking.specialRequest || 'None'}</td>
        </tr>
      </table>

      ${
        !isAccepted
          ? `<p style="font-size: 13px; color: #64748b; line-height: 1.5;">You are warmly invited to submit a new reservation request for an alternative date, hour, or price offer.</p>`
          : `<p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you have any questions before our session, feel free to reply directly to this email or write to <a href="mailto:${config.ownerEmail}">${config.ownerEmail}</a>.</p>`
      }
    </div>
    <div class="footer">
      ${config.businessName} &middot; Contact: ${config.ownerEmail}
    </div>
  </div>
</body>
</html>
`;
}

// Initial sample seed if empty
const initialBookings = readJsonFile<Booking[]>(BOOKINGS_FILE, []);
if (initialBookings.length === 0) {
  const seedBooking: Booking = {
    id: 'BK-SAMPLE',
    clientName: 'Sarah Jenkins',
    clientEmail: 'sarah.j@example.com',
    clientPhone: '+1 (555) 349-2810',
    serviceId: 'appointment',
    serviceName: 'Appointment Booking',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '02:00 PM',
    hours: 1,
    hourlyRate: 75,
    totalPrice: 65,
    specialRequest: 'Would love to discuss consultation materials and workflow setup.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  writeJsonFile(BOOKINGS_FILE, [seedBooking]);
}

// API Endpoints

// 1. Get configuration
app.get('/api/config', (_req, res) => {
  const config = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
  res.json({
    ownerEmail: config.ownerEmail,
    ownerName: config.ownerName,
    businessName: config.businessName,
    currency: config.currency,
    hourlyRate: config.hourlyRate || 75,
    hasSmtpConfigured: Boolean(config.smtp && config.smtp.host && config.smtp.user && config.smtp.pass),
    smtp: config.smtp ? {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      user: config.smtp.user,
      pass: config.smtp.pass ? '********' : '',
      from: config.smtp.from,
    } : undefined,
  });
});

// 2. Update configuration (including SMTP for real email delivery!)
app.post('/api/config', (req, res) => {
  const current = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
  const updated: AppConfig = {
    ...current,
    ...req.body,
    smtp: req.body.smtp
      ? {
          host: req.body.smtp.host || 'smtp.gmail.com',
          port: Number(req.body.smtp.port) || 465,
          secure: req.body.smtp.secure ?? true,
          user: req.body.smtp.user,
          pass: req.body.smtp.pass === '********' ? current.smtp?.pass || '' : req.body.smtp.pass,
          from: req.body.smtp.from,
        }
      : current.smtp,
  };
  writeJsonFile(CONFIG_FILE, updated);
  res.json({ success: true, config: updated });
});

// 3. Test Email Delivery directly to owner email
app.post('/api/test-email', async (_req, res) => {
  const config = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
  try {
    const isRealSmtp = Boolean(config.smtp && config.smtp.host && config.smtp.user && config.smtp.pass);
    const transporter = await getTransporter(config);
    const fromAddress = config.smtp?.from || (config.smtp?.user ? `"${config.businessName}" <${config.smtp.user}>` : `"${config.businessName}" <notifications@bookease.app>`);

    await transporter.sendMail({
      from: fromAddress,
      to: config.ownerEmail,
      subject: `[Test] Email Delivery Verified for ${config.businessName}`,
      text: `Hello ${config.ownerName},\n\nThis is a verification test confirming that your email notifications are operational and will be sent to ${config.ownerEmail}.\n\nMode: ${isRealSmtp ? 'Live SMTP Delivery' : 'Simulated (configure SMTP in Host Access to receive directly in Gmail)'}\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #0f172a; margin-top: 0;">Email Delivery Test Verified</h2>
          <p style="color: #334155;">Hello <strong>${config.ownerName}</strong>,</p>
          <p style="color: #334155;">This test confirms that your booking notification system is configured to deliver messages to: <br/><strong>${config.ownerEmail}</strong>.</p>
          <div style="padding: 12px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px; font-size: 13px; color: #065f46; margin: 16px 0;">
            Status: ${isRealSmtp ? 'Delivered via live SMTP' : 'Simulated Outbox (Add Gmail App Password in Host Access to receive real emails in Gmail)'}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: isRealSmtp
        ? `Live test email dispatched to ${config.ownerEmail} via SMTP!`
        : `Simulated test email created in Sent Outbox. Connect Gmail App Password to receive real emails in your personal inbox.`,
    });
  } catch (err: any) {
    console.error('Failed to send test email:', err);
    res.status(500).json({ error: err.message || 'Failed to send test email' });
  }
});

// 4. Download entire project as a ZIP file!
app.get('/api/download-zip', (_req, res) => {
  try {
    const zip = new AdmZip();
    const rootDir = __dirname;
    const ignoreList = ['node_modules', 'dist', '.git', '.cache', 'bun.lock'];

    function addDirToZip(currentDir: string, zipPath: string) {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        if (ignoreList.includes(item)) continue;
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(fullPath, path.join(zipPath, item));
        } else {
          const content = fs.readFileSync(fullPath);
          zip.addFile(path.join(zipPath, item), content);
        }
      }
    }

    addDirToZip(rootDir, '');
    const buffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="appointment-booking-project.zip"');
    res.send(buffer);
  } catch (err: any) {
    console.error('Error generating zip:', err);
    res.status(500).json({ error: 'Failed to create zip file' });
  }
});

// 5. Get bookings
app.get('/api/bookings', (_req, res) => {
  const bookings = readJsonFile<Booking[]>(BOOKINGS_FILE, []);
  res.json(bookings);
});

// 6. Create new booking (with client-decided price!)
app.post('/api/bookings', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, date, timeSlot, hours, totalPrice, specialRequest } = req.body;

    if (!clientName || !clientEmail || !date || !timeSlot) {
      return res.status(400).json({ error: 'Missing required booking fields (name, email, date, hour)' });
    }

    const config = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
    const bookings = readJsonFile<Booking[]>(BOOKINGS_FILE, []);

    // The person booking decides the price!
    const clientPrice = Number(totalPrice) > 0 ? Number(totalPrice) : (config.hourlyRate || 75);

    const newBooking: Booking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: String(clientName).trim(),
      clientEmail: String(clientEmail).trim().toLowerCase(),
      clientPhone: String(clientPhone || '').trim(),
      serviceId: 'appointment',
      serviceName: 'Appointment Booking',
      date: String(date),
      timeSlot: String(timeSlot),
      hours: Number(hours) || 1,
      hourlyRate: clientPrice,
      totalPrice: clientPrice,
      specialRequest: String(specialRequest || '').trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save booking
    bookings.unshift(newBooking);
    writeJsonFile(BOOKINGS_FILE, bookings);

    // 1. Send structured notification email directly to the owner's email address
    const ownerEmailHtml = createOwnerBookingEmailHtml(newBooking, config);
    const ownerEmailText = `
NEW BOOKING REQUEST RECEIVED
============================
Ref ID: #${newBooking.id}
Client: ${newBooking.clientName}
Email: ${newBooking.clientEmail}
Phone: ${newBooking.clientPhone || 'N/A'}
Date: ${newBooking.date}
What Hour: ${newBooking.timeSlot} (${newBooking.hours} hr)
Client Proposed Price: ${config.currency}${newBooking.totalPrice}

Special Request:
${newBooking.specialRequest || 'None'}

Log into Host Access to review and respond (Accept or Decline).
`;

    await dispatchEmail({
      to: config.ownerEmail,
      subject: `New Booking Request #${newBooking.id}: ${newBooking.clientName} on ${newBooking.date} at ${newBooking.timeSlot} (${config.currency}${newBooking.totalPrice})`,
      html: ownerEmailHtml,
      text: ownerEmailText,
      bookingId: newBooking.id,
      type: 'owner_notification',
    });

    // 2. Also send client confirmation receipt email
    const clientReceiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
    .head { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
    .tag { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .title { font-size: 20px; font-weight: 700; margin: 6px 0 0 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
    .label { color: #64748b; }
    .val { font-weight: 600; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="tag">${config.businessName}</div>
      <h1 class="title">Booking Request Received!</h1>
      <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Hi ${newBooking.clientName}, your request (#${newBooking.id}) has been sent to ${config.ownerName}.</p>
    </div>
    <div class="row"><span class="label">Date:</span><span class="val">${newBooking.date}</span></div>
    <div class="row"><span class="label">Hour:</span><span class="val">${newBooking.timeSlot}</span></div>
    <div class="row"><span class="label">Duration:</span><span class="val">${newBooking.hours} hr</span></div>
    <div class="row"><span class="label">Your Proposed Price:</span><span class="val">${config.currency}${newBooking.totalPrice}</span></div>
    <div class="row"><span class="label">Special Request:</span><span class="val">${newBooking.specialRequest || 'None'}</span></div>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b; line-height: 1.5;">You will receive an official decision email (accepted or declined with the host's notes) shortly.</p>
  </div>
</body>
</html>`;

    await dispatchEmail({
      to: newBooking.clientEmail,
      subject: `Booking Request Received (#${newBooking.id}) - ${config.businessName}`,
      html: clientReceiptHtml,
      text: `Hello ${newBooking.clientName},\n\nWe received your booking request (#${newBooking.id}) for ${newBooking.date} at ${newBooking.timeSlot} with proposed price ${config.currency}${newBooking.totalPrice}. You will receive a follow-up email when the host reviews your request.\n\nThank you!\n${config.businessName}`,
      bookingId: newBooking.id,
      type: 'client_submission',
    });

    res.status(201).json({
      success: true,
      booking: newBooking,
      message: `Booking submitted successfully! Notification dispatched to ${config.ownerEmail}`,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message || 'Failed to submit booking' });
  }
});

// 7. Accept or decline a booking with reason / custom message
app.post('/api/bookings/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "accepted" or "declined"' });
    }

    const config = readJsonFile<AppConfig>(CONFIG_FILE, defaultConfig);
    const bookings = readJsonFile<Booking[]>(BOOKINGS_FILE, []);
    const bookingIndex = bookings.findIndex((b) => b.id === id);

    if (bookingIndex === -1) {
      return res.status(400).json({ error: 'Booking not found' });
    }

    const booking = bookings[bookingIndex];
    booking.status = status;
    booking.ownerDecisionReason = reason || (status === 'accepted' ? 'Accepted with pleasure.' : 'Declined due to scheduling constraints.');
    booking.ownerDecisionAt = new Date().toISOString();

    bookings[bookingIndex] = booking;
    writeJsonFile(BOOKINGS_FILE, bookings);

    // Send decision email directly to the client's email address!
    const decisionHtml = createDecisionEmailHtml(booking, config);
    const decisionText = `
APPOINTMENT UPDATE from ${config.businessName}
=============================================
Status: ${booking.status.toUpperCase()}
Reference: #${booking.id}
Client: ${booking.clientName}

Message from ${config.ownerName}:
"${booking.ownerDecisionReason}"

Booking Summary:
- Date: ${booking.date}
- Time: ${booking.timeSlot} (${booking.hours} hr)
- Agreed Price: ${config.currency}${booking.totalPrice}
- Special Request: ${booking.specialRequest || 'None'}

Contact: ${config.ownerEmail}
`;

    const subject = booking.status === 'accepted'
      ? `Booking Accepted: Your appointment on ${booking.date} at ${booking.timeSlot} is confirmed!`
      : `Booking Update: Regarding your appointment on ${booking.date}`;

    await dispatchEmail({
      to: booking.clientEmail,
      subject,
      html: decisionHtml,
      text: decisionText,
      bookingId: booking.id,
      type: 'client_decision',
    });

    res.json({
      success: true,
      booking,
      message: `Booking ${status}. Notification email sent to ${booking.clientEmail}`,
    });
  } catch (error: any) {
    console.error('Error responding to booking:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to booking' });
  }
});

// 8. Get sent email history (inspector/outbox)
app.get('/api/emails', (_req, res) => {
  const emails = readJsonFile<SentEmail[]>(EMAILS_FILE, []);
  res.json(emails);
});

// 9. Delete booking
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const bookings = readJsonFile<Booking[]>(BOOKINGS_FILE, []);
  const filtered = bookings.filter((b) => b.id !== id);
  writeJsonFile(BOOKINGS_FILE, filtered);
  res.json({ success: true, count: filtered.length });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
