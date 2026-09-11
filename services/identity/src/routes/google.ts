import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { findUserByGoogleId, findUserByContact, createGoogleUser } from "../db-queries";

const router = Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

async function resolveGoogleUser(payload: { email?: string | null; sub: string; given_name?: string | null; family_name?: string | null }) {
  if (!payload.email) {
    throw new Error("NO_EMAIL");
  }

  let user = await findUserByGoogleId(payload.sub);

  if (!user) {
    const existingByEmail = await findUserByContact(payload.email);
    if (existingByEmail) {
      throw new Error("ACCOUNT_EXISTS");
    }

    user = await createGoogleUser({
      first_name: payload.given_name || "Reed",
      surname: payload.family_name || "User",
      contact: payload.email,
      google_id: payload.sub,
    });
  }

  return user;
}

// Redirect-based flow (kept for reference / fallback)
router.get("/google", (_req, res) => {
  const url = client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: "Could not verify Google account" });
    }

    const user = await resolveGoogleUser(payload);
    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        contact: user.contact,
        is_verified: user.is_verified,
      },
    });
  } catch (err: any) {
    if (err?.message === "ACCOUNT_EXISTS") {
      return res.status(409).json({
        error: "An account already exists with this email. Please log in normally.",
      });
    }
    console.error("Google OAuth error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// Popup-based flow: frontend sends the ID token from Google Identity Services directly
router.post("/google/token", async (req, res) => {
  const idToken = req.body?.id_token as string | undefined;
  if (!idToken) {
    return res.status(400).json({ error: "Missing id_token" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: "Could not verify Google account" });
    }

    const user = await resolveGoogleUser(payload);
    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        contact: user.contact,
        is_verified: user.is_verified,
      },
    });
  } catch (err: any) {
    if (err?.message === "ACCOUNT_EXISTS") {
      return res.status(409).json({
        error: "An account already exists with this email. Please log in normally.",
      });
    }
    console.error("Google token verification error:", err);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

export default router;
