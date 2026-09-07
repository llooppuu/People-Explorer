import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      trustScore: number;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
