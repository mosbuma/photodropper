# Photodropper

Party photo wall for TV slideshow, QR guest upload, and ticker comments. Self-hosted on Synology (MariaDB + local photo storage).

## Features

- Slideshow with QR upload link per photo
- Two-row comment ticker (photo + event)
- Mobile guest upload and comments (`/action`)
- Admin management panel (`/management`)

## Stack

- Next.js 15, TypeScript, Tailwind
- Redux Toolkit + Redux Persist
- NextAuth (admin password)
- **MariaDB** via Prisma
- Local filesystem photos (`PHOTO_UPLOAD_PATH`)

## Quick start (development)

```bash
npm install
cp .env.example .env
# Set DATABASE_URL to your MariaDB, PHOTO_UPLOAD_PATH=./photos

mysql -u root -p < database/mariadb.init.sql
npm run db:push   # optional if tables already created from SQL
npm run dev
```

Open http://localhost:3000 — management password from `ADMIN_PASSWORD` (default in `.env.example`).

## Synology deployment

See **[SYNO-SETUP.md](./SYNO-SETUP.md)** — production URL **`https://photodropper.0x0001.org`** (reverse proxy to port 3011).

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MariaDB connection string |
| `NEXTAUTH_SECRET` | Session encryption |
| `NEXTAUTH_URL` | Public HTTPS URL (e.g. `https://photodropper.0x0001.org`) |
| `AUTH_TRUST_HOST` | `true` when using reverse proxy / custom hostname |
| `PUBLIC_BASE_URL` | Same as `NEXTAUTH_URL` for QR guest links |
| `ADMIN_PASSWORD` | Management login |
| `PHOTO_UPLOAD_PATH` | Directory for uploaded images |
| `PORT` | HTTP port (3011 on NAS) |
| `NEXT_PUBLIC_PLAYLIST_POLL_INTERVAL_MS` | Slideshow playlist poll interval |

## Database

Schema bootstrap: [`database/mariadb.init.sql`](database/mariadb.init.sql)

Models: `social_events`, `photos`, `comments`.

## Project layout

```
src/app/           Next.js pages and API routes
src/components/    Slideshow, ticker, upload UI
src/lib/           Prisma, auth, playlist manager
prisma/schema.prisma
database/mariadb.init.sql
docker-compose.yaml
```

## FamilyAlbum export

Planned: export event photos + comments to FamilyAlbum via import key API. Not part of Phase A.
