# Dynamic People Explorer

Backend API for Dynamic People Explorer. Christopheri osa katab Prisma andmemudeli, PostgreSQL migratsioonid, service-kihi, trust score auto-approve ärireegli, Prisma ORM päringud ning Vitest/Supertest testid.

## Tehnoloogiad

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- Zod
- JWT
- bcrypt
- Vitest
- Supertest
- Docker Compose

## Setup

```bash
npm install
```

Loo lokaalne `.env` fail `.env.example` põhjal:

```env
DATABASE_URL="postgresql://dpe:dpe_password@localhost:5432/dpe_db?schema=public"
JWT_SECRET="change_me"
PORT=3000
```

Käivita PostgreSQL:

```bash
docker compose up -d
```

Rakenda Prisma migratsioonid ja genereeri klient:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

Lisa seed data:

```bash
npm run prisma:seed
```

Käivita dev server:

```bash
npm run dev
```

API töötab vaikimisi aadressil `http://localhost:3000/api`.

## Kontrollid

```bash
npm run typecheck
npm run test:run
npm run build
npx prisma validate
```

## API Endpointid

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/persons`
- `GET /api/persons/:id`
- `POST /api/persons/:id/tags`
- `POST /api/requests`
- `GET /api/requests`
- `PUT /api/requests/:id`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:id`

## Ärireegel

`POST /api/requests` auto-approve reegel:

- kasutaja `trustScore >= 80`
- sihtisikul on vähemalt 2 reference kirjet

Kui mõlemad tingimused kehtivad, luuakse request `APPROVED` staatusega ja seotud `Person` muudetakse publicuks.

## Testkasutajad

Seed loob järgmised kasutajad:

- Admin: `admin@dpe.ee` / `Admin1234!`
- Testkasutaja: `testkasutaja@dpe.ee` / `Test1234!`
