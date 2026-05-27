export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Dynamic People Explorer API",
    version: "1.0.0",
    description: "Backend API for public person profiles, requests, watchlists and references."
  },
  servers: [{ url: "/api" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Persons" },
    { name: "Requests" },
    { name: "Watchlist" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "user-1" },
          email: { type: "string", format: "email", example: "user@dpe.ee" },
          role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
          trustScore: { type: "integer", example: 80 },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      DataSource: {
        type: "object",
        properties: {
          id: { type: "string", example: "source-1" },
          name: { type: "string", example: "Wikidata" },
          baseUrl: { type: "string", format: "uri", example: "https://www.wikidata.org" },
          sourceType: { type: "string", enum: ["API", "RSS", "MANUAL"], example: "API" }
        }
      },
      Reference: {
        type: "object",
        properties: {
          id: { type: "string", example: "ref-1" },
          personId: { type: "string", example: "person-1" },
          dataSourceId: { type: "string", example: "source-1" },
          url: { type: "string", format: "uri", example: "https://www.wikidata.org/wiki/Q7259" },
          content: { type: "string", nullable: true, example: "Ada Lovelace - English mathematician" },
          fetchedAt: { type: "string", format: "date-time" },
          dataSource: { $ref: "#/components/schemas/DataSource" }
        }
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "string", example: "tag-1" },
          name: { type: "string", example: "science" },
          color: { type: "string", nullable: true, example: "#10B981" }
        }
      },
      Person: {
        type: "object",
        properties: {
          id: { type: "string", example: "person-1" },
          fullName: { type: "string", example: "Ada Lovelace" },
          role: { type: "string", example: "Mathematician" },
          category: { type: "string", example: "Science" },
          isPublic: { type: "boolean", example: true },
          biography: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          references: {
            type: "array",
            items: { $ref: "#/components/schemas/Reference" }
          },
          tags: {
            type: "array",
            items: { $ref: "#/components/schemas/Tag" }
          }
        }
      },
      Request: {
        type: "object",
        properties: {
          id: { type: "string", example: "request-1" },
          requesterId: { type: "string", example: "user-1" },
          targetPersonName: { type: "string", example: "Ada Lovelace" },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "PENDING" },
          createdAt: { type: "string", format: "date-time" },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          reviewerId: { type: "string", nullable: true, example: "admin-1" }
        }
      },
      Watchlist: {
        type: "object",
        properties: {
          id: { type: "string", example: "watch-1" },
          userId: { type: "string", example: "user-1" },
          personId: { type: "string", example: "person-1" },
          note: { type: "string", nullable: true, example: "Follow later" },
          createdAt: { type: "string", format: "date-time" },
          person: { $ref: "#/components/schemas/Person" }
        }
      },
      AuthBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@dpe.ee" },
          password: { type: "string", format: "password", example: "Password123!" }
        }
      },
      CreateRequestBody: {
        type: "object",
        required: ["targetPersonName"],
        properties: {
          targetPersonName: { type: "string", example: "Ada Lovelace" }
        }
      },
      UpdateRequestBody: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["APPROVED", "REJECTED"], example: "APPROVED" }
        }
      },
      AddTagBody: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "science" },
          color: { type: "string", example: "#10B981" }
        }
      },
      AddWatchlistBody: {
        type: "object",
        required: ["personId"],
        properties: {
          personId: { type: "string", example: "person-1" },
          note: { type: "string", example: "Follow later" }
        }
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Validation error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      Unauthorized: {
        description: "Authentication required",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      Forbidden: {
        description: "Forbidden",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      Conflict: {
        description: "Conflict",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      },
      ServerError: {
        description: "Internal server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is healthy",
            content: { "application/json": { example: { status: "ok" } } }
          },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthBody" } } }
        },
        responses: {
          "201": {
            description: "User created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive a JWT",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthBody" } } }
        },
        responses: {
          "200": {
            description: "JWT returned",
            content: {
              "application/json": {
                example: { token: "jwt-token", user: { id: "user-1", email: "user@dpe.ee", role: "USER", trustScore: 0 } }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/persons": {
      get: {
        tags: ["Persons"],
        summary: "List public persons",
        parameters: [
          { in: "query", name: "role", schema: { type: "string" } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "tag", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          "200": {
            description: "Public persons",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Person" } }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/persons/{id}": {
      get: {
        tags: ["Persons"],
        summary: "Get one public person",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Person details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Person" } } }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/persons/{id}/tags": {
      post: {
        tags: ["Persons"],
        summary: "Add a tag to a person",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AddTagBody" } } }
        },
        responses: {
          "201": {
            description: "Tag relation created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Tag" } } }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/requests": {
      post: {
        tags: ["Requests"],
        summary: "Create a request for a new person",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateRequestBody" } } }
        },
        responses: {
          "201": {
            description: "Request created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Request" } } }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      get: {
        tags: ["Requests"],
        summary: "List requests for admin review",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" } }
        ],
        responses: {
          "200": {
            description: "Requests",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Request" } }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/requests/{id}": {
      put: {
        tags: ["Requests"],
        summary: "Approve or reject a request",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateRequestBody" } } }
        },
        responses: {
          "200": {
            description: "Request updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Request" } } }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/watchlist": {
      get: {
        tags: ["Watchlist"],
        summary: "List authenticated user's watchlist",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Watchlist items",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Watchlist" } }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      post: {
        tags: ["Watchlist"],
        summary: "Add a person to watchlist",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AddWatchlistBody" } } }
        },
        responses: {
          "201": {
            description: "Watchlist item created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Watchlist" } } }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/watchlist/{id}": {
      delete: {
        tags: ["Watchlist"],
        summary: "Remove a watchlist item",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Watchlist item removed" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    }
  }
} as const;

export function renderSwaggerHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dynamic People Explorer API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/docs.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      });
    </script>
  </body>
</html>`;
}
