export type Gender = "male" | "female";
export type VerificationChannel = "sms" | "whatsapp" | "email";

export interface User {
  id: string;
  first_name: string;
  middle_name: string | null;
  surname: string;
  contact: string;
  contact_type: "phone" | "email";
  date_of_birth: string;
  gender: Gender;
  password_hash: string;
  is_verified: boolean;
  created_at: string;
}
