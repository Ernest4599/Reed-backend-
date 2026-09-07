import "dotenv/config";
import express from "express";
import verifyRoutes from "./routes/verify";

const app = express();
app.use(express.json());
app.use("/verify", verifyRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "Reed Backend" }));

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Reed Backend (verification) listening on :${PORT}`));
