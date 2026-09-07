import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { findUserByContact, createUser } from "../db-queries";
import { hashPassword, verifyPassword } from "../util/hash";
import { calculateAge } from "../util/age";

const router = Router();

const signupSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional().nullable(),
  surname: z.string().min(1),
  contact: z.string().min(3),
  contact_type: z.enum(["phone", "email"]),
  date_of_birth: z.string(), // YYYY-MM-DD
  gender: z.enum(["male", "female"]),
  password: z.string().min(8),
  verified_token: z.string(),
});

const loginSchema = z.object({
  contact: z.string(),
  password: z.string(),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  let tokenPayload: { contact: string; purpose: string };
  try {
    tokenPayload = jwt.verify(data.verified_token, process.env.JWT_SECRET!) as any;
  } catch {
    return res.status(401).json({ error: "Invalid or expired verification token" });
  }
  if (tokenPayload.purpose !== "contact_verified" || tokenPayload.contact !== data.contact) {
    return res.status(401).json({ error: "Contact was not verified" });
  }

  const existing = await findUserByContact(data.contact);
  if (existing) {
    return res.status(409).json({ error: "Account already exists for this contact" });
  }

  const password_hash = await hashPassword(data.password);
  const user = await createUser({
    first_name: data.first_name,
    middle_name: data.middle_name ?? null,
    surname: data.surname,
    contact: data.contact,
    contact_type: data.contact_type,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    password_hash,
  });

  const token = signToken(user.id);

  res.status(201).json({
    token,
    user: { id: user.id, first_name: user.first_name, contact: user.contact, is_verified: user.is_verified, age: calculateAge(user.date_of_birth) },
    
  });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { contact, password } = parsed.data;

  const user = await findUserByContact(contact);
  if (!user || !(await verifyPassword(user.password_hash, password))) {
    return res.status(401).json({ error: "Incorrect email/phone or password" });
  }

  if (!user.is_verified) {
    return res.status(403).json({ error: "Account not verified", next_step: "verify_contact" });
  }

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, first_name: user.first_name, contact: user.contact },
  });
});

export default router;
