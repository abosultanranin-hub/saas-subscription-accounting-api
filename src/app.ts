import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customers";
import invoiceRoutes from "./routes/invoices";
import journalRoutes from "./routes/journal";
import planRoutes from "./routes/plans";
import reportRoutes from "./routes/reports";
import subscriptionRoutes from "./routes/subscriptions";
import { docsHtml } from "./docs";
import { errorHandler } from "./middleware/errors";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.type("html").send(docsHtml);
});

app.get("/docs", (_req, res) => {
  res.type("html").send(docsHtml);
});

app.get("/api", (_req, res) => {
  res.json({
    name: "SaaS Subscription Accounting API",
    status: "ok",
    docs: "/docs",
    health: "/health"
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/journal-entries", journalRoutes);

app.use(errorHandler);
