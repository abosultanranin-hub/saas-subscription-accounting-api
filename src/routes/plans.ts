import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../prisma";

const router = Router();
router.use(requireAuth);

const planSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  interval: z.string().min(3).default("monthly"),
  active: z.boolean().optional()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const plans = await prisma.plan.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: "desc" }
    });
    res.json(plans);
  })
);

router.post(
  "/",
  validateBody(planSchema),
  asyncHandler(async (req, res) => {
    const plan = await prisma.plan.create({
      data: { ...req.body, tenantId: req.user!.tenantId }
    });
    res.status(201).json(plan);
  })
);

router.put(
  "/:id",
  validateBody(planSchema.partial()),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const plan = await prisma.plan.update({
      where: { id, tenantId: req.user!.tenantId },
      data: req.body
    });
    res.json(plan);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await prisma.plan.update({
      where: { id, tenantId: req.user!.tenantId },
      data: { active: false }
    });
    res.status(204).send();
  })
);

export default router;
