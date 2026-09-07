import { pool } from "@reed/shared";

export async function contactExists(contact: string): Promise<boolean> {
  const result = await pool.query("SELECT id FROM users WHERE contact = $1", [contact]);
  return (result.rowCount ?? 0) > 0;
}

export async function storeCode(contact: string, code: string, channel: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
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

  await pool.query(
    `UPDATE verification_codes SET consumed = true WHERE id = $1`,
    [result.rows[0].id]
  );
  return true;
}
