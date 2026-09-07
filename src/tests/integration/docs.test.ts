import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app";

describe("API docs", () => {
  it("GET /api/docs returns 200", async () => {
    const response = await request(app).get("/api/docs");

    expect(response.status).toBe(200);
    expect(response.text).toContain("/api/docs.json");
  });

  it("GET /api/docs.json returns OpenAPI JSON", async () => {
    const response = await request(app).get("/api/docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(response.body.paths["/requests"]).toBeDefined();
  });
});

