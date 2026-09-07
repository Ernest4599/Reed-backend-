import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth";

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "Reed Backend" }));

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Reed Backend (identity) listening on :${PORT}`));
