import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { contactExists, storeCode, checkCode } from "../db-queries";
import { generateCode } from "../util/code";
import { getSender, type Channel } from "../channels";

const router = Router();

router.post("/check", async (req, res) => {
  const schema = z.object({ contact: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const exists = await contactExists(parsed.data.contact);
  res.json({ already_registered: exists });
});

router.post("/send", async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    channel: z.enum(["sms", "whatsapp", "email"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { contact, channel } = parsed.data;
  const code = generateCode();
  await storeCode(contact, code, channel);
  await getSender(channel as Channel).send(contact, code);

  res.json({ sent: true });
});

router.post("/confirm", async (req, res) => {
  const schema = z.object({
    contact: z.string().min(3),
    code: z.string().length(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { contact, code } = parsed.data;
  const valid = await checkCode(contact, code);
  if (!valid) return res.status(400).json({ error: "Invalid or expired code" });

  // Short-lived token proving this contact was just verified.
  // Identity service will require this to finalize account creation.
  const verifiedToken = jwt.sign(
    { contact, purpose: "contact_verified" },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  res.json({ verified: true, verified_token: verifiedToken });
});

export default router;
