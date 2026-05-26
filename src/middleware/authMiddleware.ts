import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

type TokenPayload = {
  sub: string;
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "change_me") as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, trustScore: true }
    });

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Authentication required" });
  }
}
