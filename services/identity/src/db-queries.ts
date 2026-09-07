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
      (first_name, middle_name, surname, contact, contact_type, date_of_birth, gender, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
