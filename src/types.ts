import type { User } from "@prisma/client";

export type AuthUser = Pick<User, "id" | "tenantId" | "email" | "role">;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
