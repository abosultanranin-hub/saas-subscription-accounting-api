import { Router } from "express";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const entries = await prisma.journalEntry.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { lines: { include: { account: true } }, invoice: true, payment: true },
      orderBy: { entryDate: "desc" }
    });
    res.json(entries);
  })
);

export default router;
