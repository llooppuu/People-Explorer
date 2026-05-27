import bcrypt from "bcrypt";
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

type RequestRow = {
  id: string;
  requesterId: string;
  targetPersonName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
};

type ReferenceCandidate = {
  sourceName: string;
  baseUrl: string;
  sourceType: "API" | "RSS" | "MANUAL";
  url: string;
  content?: string;
};

const db = vi.hoisted(() => ({
  users: [] as UserRow[],
  persons: [
    { id: "person-1", fullName: "Ada Lovelace", role: "Mathematician", category: "Science", isPublic: true, references: [{}, {}] },
    { id: "person-2", fullName: "Private Person", role: "Analyst", category: "Research", isPublic: false, references: [] }
  ],
  dataSources: [] as Array<{ id: string; name: string; baseUrl: string; sourceType: "API" | "RSS" | "MANUAL" }>,
  references: [] as Array<{ id: string; personId: string; dataSourceId: string; url: string; content?: string; fetchedAt: Date }>,
  requests: [] as RequestRow[],
  watchlist: [] as Array<{ id: string; userId: string; personId: string; note?: string; createdAt: Date }>,
  nextId: 1
}));

const externalSources = vi.hoisted(() => ({
  fetchReferencesForPerson: vi.fn<() => Promise<ReferenceCandidate[]>>()
}));

vi.mock("../../integrations/publicSourceService", () => externalSources);

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.email) {
          return db.users.find((user) => user.email === where.email) ?? null;
        }

        return db.users.find((user) => user.id === where.id) ?? null;
      })
    },
    person: {
      findUnique: vi.fn(async ({ where }) => db.persons.find((person) => person.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }) => db.persons.filter((person) => person.isPublic === where.isPublic)),
      findFirst: vi.fn(async ({ where }) => {
        if (where.id) {
          return db.persons.find((person) => person.id === where.id && (where.isPublic === undefined || person.isPublic === where.isPublic)) ?? null;
        }

        const expected = where.fullName.equals.toLowerCase();
        return db.persons.find((person) => person.fullName.toLowerCase() === expected) ?? null;
      }),
      create: vi.fn(async ({ data }) => {
        const person = {
          id: `person-${db.persons.length + 1}`,
          createdAt: new Date(),
          references: [],
          biography: null,
          ...data
        };
        db.persons.push(person);
        return person;
      }),
      update: vi.fn(async ({ where, data }) => {
        const person = db.persons.find((item) => item.id === where.id);
        if (person) {
          Object.assign(person, data);
        }
        return person;
      }),
      updateMany: vi.fn(async ({ where, data }) => {
        const expected = where.fullName.equals.toLowerCase();
        let count = 0;
        for (const person of db.persons) {
          if (person.fullName.toLowerCase() === expected) {
            Object.assign(person, data);
            count += 1;
          }
        }
        return { count };
      })
    },
    dataSource: {
      findFirst: vi.fn(async ({ where }) =>
        db.dataSources.find((source) => source.name === where.name && source.baseUrl === where.baseUrl) ?? null
      ),
      create: vi.fn(async ({ data }) => {
        const row = { id: `source-${db.nextId++}`, ...data };
        db.dataSources.push(row);
        return row;
      })
    },
    reference: {
      findFirst: vi.fn(async ({ where }) => db.references.find((item) => item.personId === where.personId && item.url === where.url) ?? null),
      create: vi.fn(async ({ data }) => {
        const row = { id: `reference-${db.nextId++}`, fetchedAt: new Date(), ...data };
        db.references.push(row);
        const person = db.persons.find((item) => item.id === row.personId);
        person?.references.push(row);
        return row;
      })
    },
    request: {
      create: vi.fn(async ({ data }) => {
        const row = {
          id: `request-${db.nextId++}`,
          createdAt: new Date(),
          ...data
        };
        db.requests.push(row);
        return row;
      }),
      findMany: vi.fn(async ({ where }) => db.requests.filter((item) => item.status === where.status)),
      findUnique: vi.fn(async ({ where }) => db.requests.find((item) => item.id === where.id) ?? null),
      update: vi.fn(async ({ where, data }) => {
        const row = db.requests.find((item) => item.id === where.id);
        if (!row) {
          return null;
        }

        Object.assign(row, data);
        return row;
      })
    },
    watchlist: {
      findUnique: vi.fn(async ({ where }) =>
        db.watchlist.find((item) => item.userId === where.userId_personId.userId && item.personId === where.userId_personId.personId) ?? null
      ),
      findMany: vi.fn(async ({ where }) =>
        db.watchlist
          .filter((item) => item.userId === where.userId)
          .map((item) => ({ ...item, person: db.persons.find((person) => person.id === item.personId) }))
      ),
      create: vi.fn(async ({ data }) => {
        const row = { id: `watch-${db.nextId++}`, createdAt: new Date(), ...data };
        db.watchlist.push(row);
        return { ...row, person: db.persons.find((person) => person.id === row.personId) };
      }),
      deleteMany: vi.fn(async ({ where }) => {
        const before = db.watchlist.length;
        db.watchlist = db.watchlist.filter((item) => item.id !== where.id || item.userId !== where.userId);
        return { count: before - db.watchlist.length };
      })
    }
  }
}));

async function tokenFor(email: string, password: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.body.token as string;
}

describe("requests integration", () => {
  beforeEach(async () => {
    db.requests.length = 0;
    db.watchlist.length = 0;
    db.dataSources.length = 0;
    db.references.length = 0;
    db.nextId = 1;
    db.persons[0].isPublic = true;
    db.persons[1].isPublic = false;
    db.persons.splice(2);
    db.persons[0].references = [{}, {}];
    db.persons[1].references = [];
    externalSources.fetchReferencesForPerson.mockResolvedValue([]);
    db.users = [
      {
        id: "user-1",
        email: "user@dpe.ee",
        passwordHash: await bcrypt.hash("Password123!", 4),
        role: "USER",
        trustScore: 20,
        createdAt: new Date()
      },
      {
        id: "admin-1",
        email: "admin@dpe.ee",
        passwordHash: await bcrypt.hash("Admin1234!", 4),
        role: "ADMIN",
        trustScore: 100,
        createdAt: new Date()
      },
      {
        id: "trusted-1",
        email: "trusted@dpe.ee",
        passwordHash: await bcrypt.hash("Trusted123!", 4),
        role: "USER",
        trustScore: 90,
        createdAt: new Date()
      }
    ];
  });

  it("POST /api/requests without token returns 401", async () => {
    const response = await request(app).post("/api/requests").send({ targetPersonName: "Ada Lovelace" });
    expect(response.status).toBe(401);
  });

  it("POST /api/requests with token creates a request", async () => {
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const response = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send({ targetPersonName: "Ada Lovelace" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("PENDING");
  });

  it("POST /api/requests creates a request when external sources return no references", async () => {
    externalSources.fetchReferencesForPerson.mockResolvedValue([]);
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const response = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send({ targetPersonName: "New Person" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("PENDING");
    expect(db.persons.some((person) => person.fullName === "New Person")).toBe(false);
  });

  it("POST /api/requests uses the public source service", async () => {
    const token = await tokenFor("user@dpe.ee", "Password123!");
    await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send({ targetPersonName: "Ada Lovelace" });

    expect(externalSources.fetchReferencesForPerson).toHaveBeenCalledWith("Ada Lovelace");
  });

  it("POST /api/requests does not return 500 when external source clients fail internally", async () => {
    externalSources.fetchReferencesForPerson.mockResolvedValue([]);
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const response = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send({ targetPersonName: "Broken Source" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("PENDING");
  });

  it("POST /api/requests auto-approves trusted users when external sources add at least 2 references", async () => {
    externalSources.fetchReferencesForPerson.mockResolvedValue([
      {
        sourceName: "Wikidata",
        baseUrl: "https://www.wikidata.org",
        sourceType: "API",
        url: "https://www.wikidata.org/wiki/Q1",
        content: "Trusted Person"
      },
      {
        sourceName: "Riigikogu API",
        baseUrl: "https://api.riigikogu.ee",
        sourceType: "API",
        url: "https://api.riigikogu.ee/api/search?query=Trusted%20Person#1",
        content: "Trusted Person"
      }
    ]);
    const token = await tokenFor("trusted@dpe.ee", "Trusted123!");
    const response = await request(app).post("/api/requests").set("Authorization", `Bearer ${token}`).send({ targetPersonName: "Trusted Person" });
    const person = db.persons.find((item) => item.fullName === "Trusted Person");

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("APPROVED");
    expect(person?.isPublic).toBe(true);
    expect(person?.references).toHaveLength(2);
  });

  it("USER cannot GET /api/requests", async () => {
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const response = await request(app).get("/api/requests").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("ADMIN can GET /api/requests", async () => {
    const token = await tokenFor("admin@dpe.ee", "Admin1234!");
    const response = await request(app).get("/api/requests").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("PUT /api/requests/:id approves with admin", async () => {
    db.requests.push({
      id: "request-1",
      requesterId: "user-1",
      targetPersonName: "Private Person",
      status: "PENDING",
      createdAt: new Date()
    });
    const token = await tokenFor("admin@dpe.ee", "Admin1234!");
    const response = await request(app).put("/api/requests/request-1").set("Authorization", `Bearer ${token}`).send({ status: "APPROVED" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
    expect(db.persons[1].isPublic).toBe(true);
  });

  it("PUT /api/requests/:id returns 403 for USER role", async () => {
    db.requests.push({
      id: "request-1",
      requesterId: "user-1",
      targetPersonName: "Private Person",
      status: "PENDING",
      createdAt: new Date()
    });
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const response = await request(app).put("/api/requests/request-1").set("Authorization", `Bearer ${token}`).send({ status: "APPROVED" });

    expect(response.status).toBe(403);
  });

  it("GET /api/persons returns public persons", async () => {
    const response = await request(app).get("/api/persons");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].isPublic).toBe(true);
  });

  it("POST and DELETE /api/watchlist work", async () => {
    const token = await tokenFor("user@dpe.ee", "Password123!");
    const createResponse = await request(app)
      .post("/api/watchlist")
      .set("Authorization", `Bearer ${token}`)
      .send({ personId: "person-1", note: "Follow" });

    expect(createResponse.status).toBe(201);

    const deleteResponse = await request(app).delete(`/api/watchlist/${createResponse.body.id}`).set("Authorization", `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });
});
