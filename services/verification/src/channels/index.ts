export type Channel = "sms" | "whatsapp" | "email";

export interface VerificationSender {
  send(contact: string, code: string): Promise<void>;
}

// PLACEHOLDER: logs the code instead of sending it.
// Swap this out for a real provider (Resend, SendGrid, Twilio) later.
class ConsoleSender implements VerificationSender {
  async send(contact: string, code: string): Promise<void> {
    console.log(`[VERIFICATION] Sending code ${code} to ${contact}`);
  }
}

const senders: Record<Channel, VerificationSender> = {
  email: new ConsoleSender(),
  sms: new ConsoleSender(),
  whatsapp: new ConsoleSender(),
};

export function getSender(channel: Channel): VerificationSender {
  return senders[channel];
}
