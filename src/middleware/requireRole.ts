import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
