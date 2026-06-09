import { Router } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { prisma } from "../prisma";
import { monthStart, nextMonthStart, toDate } from "../utils/dates";
import {
  recordInvoiceJournal,
  recordPaymentJournal,
  recordRevenueRecognitionJournal
} from "../services/accounting";

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  period: z.string().datetime().optional()
});

const paymentSchema = z.object({
  amountCents: z.number().int().positive(),
  paidAt: z.string().datetime().optional()
});

const recognitionSchema = z.object({
  periodEnd: z.string().datetime().optional()
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { customer: true, subscription: { include: { plan: true } }, payments: true, items: true },
      orderBy: { issuedAt: "desc" }
    });
    res.json(invoices);
  })
);

router.post(
  "/generate-monthly",
  validateBody(generateSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const periodStart = monthStart(req.body.period ? toDate(req.body.period) : new Date());
    const periodEnd = nextMonthStart(periodStart);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        startDate: { lte: periodEnd }
      },
      include: { customer: true, plan: true }
    });

    const created = [];

    for (const subscription of subscriptions) {
      const exists = await prisma.invoice.findFirst({
        where: { tenantId, subscriptionId: subscription.id, periodStart }
      });

      if (exists) {
        continue;
      }

      const invoice = await prisma.$transaction(async (tx) => {
        const newInvoice = await tx.invoice.create({
          data: {
            tenantId,
            customerId: subscription.customerId,
            subscriptionId: subscription.id,
            periodStart,
            periodEnd,
            totalCents: subscription.plan.priceCents,
            items: {
              create: {
                planId: subscription.planId,
                description: `${subscription.plan.name} subscription`,
                amountCents: subscription.plan.priceCents
              }
            }
          },
          include: { customer: true, subscription: { include: { plan: true } }, items: true }
        });

        await recordInvoiceJournal(tx, tenantId, newInvoice.id, newInvoice.totalCents, newInvoice.issuedAt);
        return newInvoice;
      });

      created.push(invoice);
    }

    res.status(201).json({
      periodStart,
      periodEnd,
      createdCount: created.length,
      invoices: created
    });
  })
);

router.post(
  "/:id/payments",
  validateBody(paymentSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const id = String(req.params.id);
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId }
    });

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    const remainingCents = invoice.totalCents - invoice.paidCents;
    if (req.body.amountCents > remainingCents) {
      res.status(400).json({ message: "Payment exceeds invoice balance" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          amountCents: req.body.amountCents,
          paidAt: req.body.paidAt ? toDate(req.body.paidAt) : new Date()
        }
      });

      const paidCents = invoice.paidCents + payment.amountCents;
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidCents,
          status: paidCents === invoice.totalCents ? "PAID" : "OPEN"
        }
      });

      await recordPaymentJournal(tx, tenantId, invoice.id, payment.id, payment.amountCents, payment.paidAt);

      return { payment, invoice: updatedInvoice };
    });

    res.status(201).json(result);
  })
);

router.post(
  "/recognize-revenue",
  validateBody(recognitionSchema),
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const recognitionDate = req.body.periodEnd ? toDate(req.body.periodEnd) : new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { not: "VOID" },
        periodEnd: { lte: recognitionDate },
        journalEntries: {
          none: {
            description: {
              startsWith: "Revenue recognized"
            }
          }
        }
      }
    });

    const entries = [];

    for (const invoice of invoices) {
      const entry = await prisma.$transaction(async (tx) =>
        recordRevenueRecognitionJournal(tx, tenantId, invoice.id, invoice.totalCents, recognitionDate)
      );
      entries.push(entry);
    }

    res.status(201).json({
      recognizedCount: entries.length,
      entries
    });
  })
);

export default router;
