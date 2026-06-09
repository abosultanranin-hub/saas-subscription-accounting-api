import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.tenant.upsert({
    where: { email: "demo@merp.test" },
    update: {},
    create: {
      name: "Demo Tenant",
      email: "demo@merp.test",
      users: {
        create: {
          name: "Demo Admin",
          email: "admin@demo.test",
          passwordHash
        }
      },
      accounts: {
        createMany: {
          data: [
            { code: "1000", name: "Cash", type: "ASSET" },
            { code: "1100", name: "Accounts Receivable", type: "ASSET" },
            { code: "2000", name: "Deferred Revenue", type: "LIABILITY" },
            { code: "4000", name: "Subscription Revenue", type: "REVENUE" }
          ]
        }
      }
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
