export type Gender = "male" | "female";
export type VerificationChannel = "sms" | "whatsapp" | "email";
export type AuthProvider = "local" | "google";

export interface User {
  id: string;
  first_name: string;
  middle_name: string | null;
  surname: string;
  contact: string;
  contact_type: "phone" | "email";
  date_of_birth: string | null;
  gender: Gender | null;
  password_hash: string | null;
  is_verified: boolean;
  auth_provider: AuthProvider;
  google_id: string | null;
  created_at: string;
}
