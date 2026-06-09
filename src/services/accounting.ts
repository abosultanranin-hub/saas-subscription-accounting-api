import type { Prisma } from "@prisma/client";
import { ACCOUNT_CODES, getAccountMap } from "./accounts";

type JournalLineInput = {
  accountCode: string;
  debitCents?: number;
  creditCents?: number;
};

type JournalEntryInput = {
  tenantId: string;
  description: string;
  entryDate?: Date;
  invoiceId?: string;
  paymentId?: string;
  lines: JournalLineInput[];
};

export async function createJournalEntry(tx: Prisma.TransactionClient, input: JournalEntryInput) {
  const debitTotal = input.lines.reduce((sum, line) => sum + (line.debitCents ?? 0), 0);
  const creditTotal = input.lines.reduce((sum, line) => sum + (line.creditCents ?? 0), 0);

  if (debitTotal <= 0 || debitTotal !== creditTotal) {
    throw Object.assign(new Error("Journal entry must be balanced"), { statusCode: 400 });
  }

  const accounts = await getAccountMap(tx, input.tenantId);

  return tx.journalEntry.create({
    data: {
      tenantId: input.tenantId,
      description: input.description,
      entryDate: input.entryDate,
      invoiceId: input.invoiceId,
      paymentId: input.paymentId,
      lines: {
        create: input.lines.map((line) => {
          const account = accounts.get(line.accountCode);
          if (!account) {
            throw Object.assign(new Error(`Missing account ${line.accountCode}`), { statusCode: 400 });
          }

          return {
            accountId: account.id,
            debitCents: line.debitCents ?? 0,
            creditCents: line.creditCents ?? 0
          };
        })
      }
    },
    include: { lines: { include: { account: true } } }
  });
}

export async function recordInvoiceJournal(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceId: string,
  amountCents: number,
  entryDate = new Date()
) {
  return createJournalEntry(tx, {
    tenantId,
    invoiceId,
    entryDate,
    description: "Invoice created: recognize receivable and deferred revenue",
    lines: [
      { accountCode: ACCOUNT_CODES.receivable, debitCents: amountCents },
      { accountCode: ACCOUNT_CODES.deferredRevenue, creditCents: amountCents }
    ]
  });
}

export async function recordPaymentJournal(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceId: string,
  paymentId: string,
  amountCents: number,
  entryDate = new Date()
) {
  return createJournalEntry(tx, {
    tenantId,
    invoiceId,
    paymentId,
    entryDate,
    description: "Payment received: cash collected against receivable",
    lines: [
      { accountCode: ACCOUNT_CODES.cash, debitCents: amountCents },
      { accountCode: ACCOUNT_CODES.receivable, creditCents: amountCents }
    ]
  });
}

export async function recordRevenueRecognitionJournal(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceId: string,
  amountCents: number,
  entryDate = new Date()
) {
  return createJournalEntry(tx, {
    tenantId,
    invoiceId,
    entryDate,
    description: "Revenue recognized: deferred revenue released to subscription revenue",
    lines: [
      { accountCode: ACCOUNT_CODES.deferredRevenue, debitCents: amountCents },
      { accountCode: ACCOUNT_CODES.subscriptionRevenue, creditCents: amountCents }
    ]
  });
}
