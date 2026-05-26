import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthInput } from "../validators/authSchemas";

const userSelect = {
  id: true,
  email: true,
  role: true,
  trustScore: true,
  createdAt: true
};

export async function register(input: AuthInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    return await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        role: "USER"
      },
      select: userSelect
    });
  } catch {
    throw new AppError(409, "Email already registered");
  }
}

export async function login(input: AuthInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET ?? "change_me", { expiresIn: "24h" });
  const { passwordHash: _passwordHash, ...safeUser } = user;

  return { token, user: safeUser };
}
