import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../prisma";
import { toDate } from "../utils/dates";

const router = Router();
router.use(requireAuth);

const subscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string().datetime()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { customer: true, plan: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(subscriptions);
  })
);

router.post(
  "/",
  validateBody(subscriptionSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const [customer, plan] = await Promise.all([
      prisma.customer.findFirst({ where: { id: req.body.customerId, tenantId } }),
      prisma.plan.findFirst({ where: { id: req.body.planId, tenantId, active: true } })
    ]);

    if (!customer || !plan) {
      res.status(404).json({ message: "Customer or active plan not found" });
      return;
    }

    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        customerId: customer.id,
        planId: plan.id,
        startDate: toDate(req.body.startDate)
      },
      include: { customer: true, plan: true }
    });

    res.status(201).json(subscription);
  })
);

router.patch(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const subscription = await prisma.subscription.update({
      where: { id, tenantId: req.user!.tenantId },
      data: { status: "CANCELLED" },
      include: { customer: true, plan: true }
    });
    res.json(subscription);
  })
);

export default router;
