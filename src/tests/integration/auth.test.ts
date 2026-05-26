import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  trustScore: number;
  createdAt: Date;
};

const db = vi.hoisted(() => ({
  users: [] as UserRow[],
  nextId: 1
}));

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(async ({ data, select }) => {
        if (db.users.some((user) => user.email === data.email)) {
          throw new Error("Unique constraint");
        }

        const user = {
          id: `user-${db.nextId++}`,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role ?? "USER",
          trustScore: data.trustScore ?? 0,
          createdAt: new Date()
        };
        db.users.push(user);

        if (!select) {
          return user;
        }

        return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, user[key as keyof UserRow]]));
      }),
      findUnique: vi.fn(async ({ where }) => {
        if (where.email) {
          return db.users.find((user) => user.email === where.email) ?? null;
        }

        return db.users.find((user) => user.id === where.id) ?? null;
      })
    }
  }
}));

describe("auth integration", () => {
  beforeEach(() => {
    db.users.length = 0;
    db.nextId = 1;
  });

  it("POST /api/auth/register returns 201", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "new@dpe.ee",
      password: "Password123!"
    });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("new@dpe.ee");
    expect(response.body.passwordHash).toBeUndefined();
  });

  it("POST /api/auth/login returns a token", async () => {
    await request(app).post("/api/auth/register").send({
      email: "login@dpe.ee",
      password: "Password123!"
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "login@dpe.ee",
      password: "Password123!"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("invalid Zod body returns 400", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: "short"
    });

    expect(response.status).toBe(400);
  });
});
