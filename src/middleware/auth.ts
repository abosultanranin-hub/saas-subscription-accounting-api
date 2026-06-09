import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../prisma";

type TokenPayload = {
  sub: string;
  tenantId: string;
};

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
  const user = await prisma.user.findFirst({
    where: { id: payload.sub, tenantId: payload.tenantId },
    select: { id: true, tenantId: true, email: true, role: true }
  });

  if (!user) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  req.user = user;
  next();
});
