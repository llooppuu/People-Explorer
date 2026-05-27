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

## Setup — Docker (Recommended)

Kogu Masin A (Postgres + backend + frontend) tõuseb ühe käsuga. Hot-reload toimib bind-mountide kaudu, nii et koodi muudatused võetakse arvesse ilma konteinerit taaskäivitamata.

```bash
docker compose up --build
```

Esmasel käivitusel teeb backend automaatselt:

1. `prisma migrate deploy` — rakendab migratsioonid
2. `prisma db seed` — lisab admin- ja test-kasutaja ning näidisandmed
3. `npm run dev` — käivitab Express'i `tsx watch`-iga

Pärast käivitust:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Postgres: `localhost:5432` (`dpe` / `dpe_password`)

Peatamine: `docker compose down`. Andmebaasi resettimine: `docker compose down -v`.

### Keskkonnamuutujad

Compose-i juurkaustas saab valikulisi muutujaid edastada `.env`-faili kaudu (juurkaustas, mitte commitida):

```env
JWT_SECRET=production_secret_here
OLLAMA_URL=http://192.168.1.42:11434   # Masin B LAN-IP
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_TIMEOUT_MS=90000
```

Kui `OLLAMA_URL` on tühi, on AI-integratsioon välja lülitatud.

## Setup — ilma Dockerita (backend)

Kui eelistad Node'i lokaalselt:

```bash
npm install
cp .env.example .env
docker compose up -d postgres     # ainult Postgres
npm run prisma:migrate -- --name init
npm run prisma:generate
npm run prisma:seed
npm run dev
```

API töötab vaikimisi aadressil `http://localhost:3000/api`. Swagger UI: `http://localhost:3000/api/docs`. OpenAPI JSON: `http://localhost:3000/api/docs.json`.

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

## Setup — ilma Dockerita (frontend)

```bash
cd frontend
npm install
npm run dev
```

Dev server töötab aadressil `http://localhost:5173` ja proksib `/api/*` päringud backendile. Backendi aadressi saab muuta keskkonnamuutujaga `BACKEND_URL` (vaikimisi `http://localhost:3000`). Docker-režiimis on see seatud `http://backend:3000` peale.

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
