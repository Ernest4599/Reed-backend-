import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth";
import verifyRoutes from "./routes/verify";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/verify", verifyRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "Reed Backend" }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Reed Backend listening on :${PORT}`));
