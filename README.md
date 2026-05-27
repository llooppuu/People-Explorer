# Dynamic People Explorer

Veebipõhine andmete agregeerimisplatvorm Eesti avalike isikute kohta. Repo sisaldab kahte rakendust:

- **Backend** (`/`, `src/`, `prisma/`) — Express.js REST API + PostgreSQL + Prisma ORM, Swagger UI `/api/docs`. Christopheri osa katab Prisma andmemudeli, service-kihi ja ärireeglid; Lauri osa katab API integratsioonid ning Swagger dokumentatsiooni.
- **Frontend** (`frontend/`) — React + Vite + TypeScript SPA, mis kasutab backendi API-d. Kasutajaliides on eestikeelne (ET) ja ingliskeelne (EN) ning toetab kahte teemat (Register / Dossier).

## Tehnoloogiad

### Backend

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

### Frontend

- React 18
- Vite
- TypeScript
- react-router-dom
- axios

## Setup (backend)

```bash
npm install
```

Loo lokaalne `.env` fail `.env.example` põhjal:

```env
DATABASE_URL="postgresql://dpe:dpe_password@localhost:5432/dpe_db?schema=public"
JWT_SECRET="change_me"
PORT=3000
PUBLIC_API_TIMEOUT_MS=5000
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

Swagger UI on saadaval aadressil `http://localhost:3000/api/docs`.
OpenAPI JSON on saadaval aadressil `http://localhost:3000/api/docs.json`.

Avalike API-de päringute timeout on seadistatav muutujaga:

```env
PUBLIC_API_TIMEOUT_MS=5000
```

## Kontrollid

```bash
npm run typecheck
npm run test:run
npm run build
npx prisma validate
```

## API Endpointid

- `GET /api/health`
- `GET /api/docs`
- `GET /api/docs.json`
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

## Setup (frontend)

```bash
cd frontend
npm install
npm run dev
```

Dev server töötab aadressil `http://localhost:5173` ja proksib `/api/*` päringud backendile (`http://localhost:3000`). Backend peab samaaegselt jooksma.

Tootmisbuildi loomine:

```bash
cd frontend
npm run build
```

Buildi väljund läheb kausta `frontend/dist/` ja on serveeritav Nginx-i kaudu.

## Frontend vaated

- `/` — avaleht, otsing ja soovitatud isikud
- `/persons` — kõigi avalikustatud isikute nimekiri (grid/list, filtrid)
- `/persons/:id` — isiku detailvaade, allikaviited, sildid
- `/login`, `/register` — autentimine
- `/requests/new` — uue isiku lisamise päring (autenditud kasutajatele)
- `/watchlist` — kasutaja jälgimisnimekiri
- `/admin` — admini päringute ülevaade ja haldus
- `/sources` — kasutatud andmeallikate loetelu
