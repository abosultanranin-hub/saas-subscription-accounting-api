import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../prisma";

const router = Router();
router.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: "desc" }
    });
    res.json(customers);
  })
);

router.post(
  "/",
  validateBody(customerSchema),
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.create({
      data: { ...req.body, tenantId: req.user!.tenantId }
    });
    res.status(201).json(customer);
  })
);

router.put(
  "/:id",
  validateBody(customerSchema.partial()),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const customer = await prisma.customer.update({
      where: { id, tenantId: req.user!.tenantId },
      data: req.body
    });
    res.json(customer);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await prisma.customer.delete({ where: { id, tenantId: req.user!.tenantId } });
    res.status(204).send();
  })
);

export default router;
