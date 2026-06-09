import { Router } from "express";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../prisma";
import { ACCOUNT_CODES } from "../services/accounts";
import { toDate } from "../utils/dates";

const router = Router();
router.use(requireAuth);

async function accountBalance(tenantId: string, accountCode: string, until?: Date) {
  const account = await prisma.account.findFirstOrThrow({
    where: { tenantId, code: accountCode },
    include: {
      journalLines: {
        where: until ? { journalEntry: { entryDate: { lte: until } } } : undefined
      }
    }
  });

  const debit = account.journalLines.reduce((sum, line) => sum + line.debitCents, 0);
  const credit = account.journalLines.reduce((sum, line) => sum + line.creditCents, 0);
  const normalDebit = account.type === "ASSET";

  return {
    code: account.code,
    name: account.name,
    type: account.type,
    balanceCents: normalDebit ? debit - credit : credit - debit
  };
}

router.get(
  "/income-statement",
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const from = req.query.from ? toDate(String(req.query.from)) : new Date("1970-01-01T00:00:00.000Z");
    const to = req.query.to ? toDate(String(req.query.to)) : new Date();

    const revenueAccount = await prisma.account.findFirstOrThrow({
      where: { tenantId, code: ACCOUNT_CODES.subscriptionRevenue },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              entryDate: { gte: from, lte: to }
            }
          },
          include: { journalEntry: true }
        }
      }
    });

    const subscriptionRevenueCents = revenueAccount.journalLines.reduce(
      (sum, line) => sum + line.creditCents - line.debitCents,
      0
    );

    res.json({
      from,
      to,
      subscriptionRevenueCents,
      netIncomeCents: subscriptionRevenueCents
    });
  })
);

router.get(
  "/balance-sheet",
  asyncHandler(async (req, res) => {
    const tenantId = req.user!.tenantId;
    const asOf = req.query.asOf ? toDate(String(req.query.asOf)) : new Date();

    const accounts = await Promise.all([
      accountBalance(tenantId, ACCOUNT_CODES.cash, asOf),
      accountBalance(tenantId, ACCOUNT_CODES.receivable, asOf),
      accountBalance(tenantId, ACCOUNT_CODES.deferredRevenue, asOf)
    ]);

    res.json({
      asOf,
      accounts
    });
  })
);

export default router;
