import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import verifyRoutes from "./routes/verify";
import googleRoutes from "./routes/google";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/verify", verifyRoutes);
app.use("/auth", googleRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "Reed Backend" }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Reed Backend listening on :${PORT}`));
