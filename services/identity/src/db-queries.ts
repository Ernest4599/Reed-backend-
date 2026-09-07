import { pool } from "@reed/shared";
import type { User, Gender } from "@reed/shared";

export async function findUserByContact(contact: string): Promise<User | null> {
  const result = await pool.query<User>(
    "SELECT * FROM users WHERE contact = $1",
    [contact]
  );
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  first_name: string;
  middle_name: string | null;
  surname: string;
  contact: string;
  contact_type: "phone" | "email";
  date_of_birth: string;
  gender: Gender;
  password_hash: string;
}): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users
      (first_name, middle_name, surname, contact, contact_type, date_of_birth, gender, password_hash, is_verified)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
     RETURNING *`,
    [
      input.first_name,
      input.middle_name,
      input.surname,
      input.contact,
      input.contact_type,
      input.date_of_birth,
      input.gender,
      input.password_hash,
    ]
  );
  return result.rows[0];
}

export async function markUserVerified(userId: string): Promise<void> {
  await pool.query("UPDATE users SET is_verified = true WHERE id = $1", [userId]);
}

export async function contactExists(contact: string): Promise<boolean> {
  const result = await pool.query("SELECT id FROM users WHERE contact = $1", [contact]);
  return (result.rowCount ?? 0) > 0;
}

export async function storeCode(contact: string, code: string, channel: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    `INSERT INTO verification_codes (contact, code, channel, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [contact, code, channel, expiresAt]
  );
}

export async function checkCode(contact: string, code: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM verification_codes
     WHERE contact = $1 AND code = $2 AND consumed = false AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [contact, code]
  );
  if ((result.rowCount ?? 0) === 0) return false;

  await pool.query(`UPDATE verification_codes SET consumed = true WHERE id = $1`, [result.rows[0].id]);
  return true;
}

export async function updatePassword(contact: string, password_hash: string): Promise<void> {
  await pool.query("UPDATE users SET password_hash = $1 WHERE contact = $2", [password_hash, contact]);
}
