import type { Prisma } from "@prisma/client";

export const ACCOUNT_CODES = {
  cash: "1000",
  receivable: "1100",
  deferredRevenue: "2000",
  subscriptionRevenue: "4000"
} as const;

export async function createDefaultAccounts(tx: Prisma.TransactionClient, tenantId: string) {
  await tx.account.createMany({
    data: [
      { tenantId, code: ACCOUNT_CODES.cash, name: "Cash", type: "ASSET" },
      { tenantId, code: ACCOUNT_CODES.receivable, name: "Accounts Receivable", type: "ASSET" },
      { tenantId, code: ACCOUNT_CODES.deferredRevenue, name: "Deferred Revenue", type: "LIABILITY" },
      { tenantId, code: ACCOUNT_CODES.subscriptionRevenue, name: "Subscription Revenue", type: "REVENUE" }
    ],
    skipDuplicates: true
  });
}

export async function getAccountMap(tx: Prisma.TransactionClient, tenantId: string) {
  const accounts = await tx.account.findMany({ where: { tenantId } });
  return new Map(accounts.map((account) => [account.code, account]));
}
