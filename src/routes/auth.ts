import { Router } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { prisma } from "../prisma";
import { validateBody } from "../middleware/validate";
import { createDefaultAccounts } from "../services/accounts";

const router = Router();

const registerSchema = z.object({
  tenantName: z.string().min(2),
  tenantEmail: z.string().email(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function signToken(user: { id: string; tenantId: string; email: string; role: string }) {
  return jwt.sign(
    {
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { subject: user.id, expiresIn: "7d" }
  );
}

router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: req.body.tenantName,
          email: req.body.tenantEmail
        }
      });

      await createDefaultAccounts(tx, tenant.id);

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: req.body.adminName,
          email: req.body.adminEmail,
          passwordHash,
          role: "ADMIN"
        },
        select: { id: true, tenantId: true, email: true, role: true, name: true }
      });

      return { tenant, user };
    });

    res.status(201).json({
      tenant: result.tenant,
      user: result.user,
      token: signToken(result.user)
    });
  })
);

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { email: req.body.email },
      include: { tenant: true }
    });

    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      tenant: user.tenant,
      user: { id: user.id, tenantId: user.tenantId, email: user.email, role: user.role, name: user.name },
      token: signToken(user)
    });
  })
);

export default router;
