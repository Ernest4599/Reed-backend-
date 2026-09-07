import nodemailer from "nodemailer";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

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

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

class SmsSender implements VerificationSender {
  async send(contact: string, code: string): Promise<void> {
    await snsClient.send(
      new PublishCommand({
        PhoneNumber: contact, // must be E.164 format, e.g. +14155552671
        Message: `Your Reed verification code is: ${code}`,
      })
    );
  }
}

// Still a placeholder until a WhatsApp provider is added
class ConsoleSender implements VerificationSender {
  async send(contact: string, code: string): Promise<void> {
    console.log(`[VERIFICATION] Sending code ${code} to ${contact} (no real provider yet)`);
  }
}

const senders: Record<Channel, VerificationSender> = {
  email: new EmailSender(),
  sms: new SmsSender(),
  whatsapp: new ConsoleSender(),
};

export function getSender(channel: Channel): VerificationSender {
  return senders[channel];
}
