import nodemailer from "nodemailer";

export type Channel = "sms" | "whatsapp" | "email";

export interface VerificationSender {
  send(contact: string, code: string): Promise<void>;
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

class EmailSender implements VerificationSender {
  async send(contact: string, code: string): Promise<void> {
    await transporter.sendMail({
      from: `"Reed" <${process.env.GMAIL_USER}>`,
      to: contact,
      subject: "Your Reed verification code",
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
  }
}

// Still placeholders until SMS/WhatsApp providers are added
class ConsoleSender implements VerificationSender {
  async send(contact: string, code: string): Promise<void> {
    console.log(`[VERIFICATION] Sending code ${code} to ${contact} (no real provider yet)`);
  }
}

const senders: Record<Channel, VerificationSender> = {
  email: new EmailSender(),
  sms: new ConsoleSender(),
  whatsapp: new ConsoleSender(),
};

export function getSender(channel: Channel): VerificationSender {
  return senders[channel];
}
