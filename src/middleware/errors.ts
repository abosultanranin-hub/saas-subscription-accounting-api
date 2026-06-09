import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: ErrorRequestHandler = (_err, _req, res, _next) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Validation error", issues: err.issues });
    return;
  }

  if (err?.message === "Invalid date") {
    res.status(400).json({ message: err.message });
    return;
  }

  const status = Number(err?.statusCode ?? err?.status ?? 500);
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message
  });
};
