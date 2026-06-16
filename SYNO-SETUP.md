# Synology NAS setup (Photodropper)

Self-hosted party photo wall on the same NAS as FamilyAlbum: **Docker Compose**, **host network**, **MariaDB** on `localhost`, photos on a bind mount.

---

## Overview

| Piece | Where |
|-------|--------|
| Git / Docker project | `/volume1/docker-projects/photodropper` |
| Photos | `/volume1/docker-projects/photodropper/photos` → container `/data/photos` |
| MariaDB | NAS MariaDB package, database `photodropper` |
| App URL | `http://babylon2024.local:3011` |

FamilyAlbum runs separately on port **3010**. Export to FamilyAlbum is a later phase.

---

## 1. MariaDB

On the NAS (SSH or phpMyAdmin):

```bash
mysql -u root -p < database/mariadb.init.sql
```

Create app user (pick a strong password):

```sql
CREATE USER 'photodropper'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'localhost';
FLUSH PRIVILEGES;
```

Connection string:

```env
DATABASE_URL=mysql://photodropper:your-password@127.0.0.1:3306/photodropper
```

---

## 2. Shared folder for photos

1. **Control Panel → Shared Folder** — optional dedicated `photodropper` share; or use `docker-projects/photodropper/photos` (default in compose).
2. Create host path: `mkdir -p /volume1/docker-projects/photodropper/photos`

Grant the Docker user write access (see FamilyAlbum SYNO-SETUP — root container user is simplest).

---

## 3. Deploy (Synology Container Manager UI)

Recommended: launch the stack from **Container Manager** instead of SSH.

### 3.1 Prepare files

1. Project folder on the NAS: `/volume1/docker-projects/photodropper` (contains `docker-compose.yaml`, `Dockerfile`, source).
2. Copy [`.env.example`](.env.example) → `.env` in the same folder (File Station → edit, or SSH).
3. Set in `.env`:
   - `DATABASE_URL` — from step 1
   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`
   - `ADMIN_PASSWORD` / `NEXT_PUBLIC_ADMIN_PASSWORD`
   - `NEXTAUTH_URL` and `PUBLIC_BASE_URL` — `http://babylon2024.local:3011`
4. Create photos folder: `/volume1/docker-projects/photodropper/photos` (empty is fine).

### 3.2 Create project in Container Manager

1. **Container Manager → Project → Create**
2. **Project name:** `photodropper`
3. **Path:** `/volume1/docker-projects/photodropper`
4. **Source:** use existing `docker-compose.yaml` in that folder
5. Confirm settings (service `app`, **host network** — required for MariaDB on `127.0.0.1`):
   - Port env: `3011`
   - Volume: host `.../photodropper/photos` → container `/data/photos`
   - Env file: `.env` in project directory
6. **Build** the image (first time), then **Start**

Logs: Container Manager → Project → photodropper → **Logs**.

### 3.3 CLI alternative

```bash
cd /volume1/docker-projects/photodropper
sudo docker compose build && sudo docker compose up -d
```

Prisma schema is applied via `database/mariadb.init.sql`. After schema changes run `npm run db:push` on a dev machine or re-run the SQL migration.

---

## 4. Verify

1. Open `http://babylon2024.local:3011` — slideshow (create event in management first).
2. Open `/management` — sign in with `ADMIN_PASSWORD`.
3. Create an event, upload a test photo (bulk upload or mobile `/action` flow).
4. Confirm file appears under `/volume1/docker-projects/photodropper/photos`.
5. `GET /api/local-ip` should return the LAN base URL for QR codes.

---

## 5. Dev laptop

Mount NAS photos optional; for local dev:

```env
DATABASE_URL=mysql://photodropper:pass@babylon2024.local:3306/photodropper
PHOTO_UPLOAD_PATH=./photos
NEXTAUTH_URL=http://localhost:3000
npm run dev
```

Ensure MariaDB on the NAS allows remote connections from your laptop, or run MariaDB locally with the same init SQL.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| DB connection refused | MariaDB running; `127.0.0.1:3306` from host network container |
| Upload fails | `PHOTOS_HOST_DIR` writable; `PHOTO_UPLOAD_PATH=/data/photos` in compose |
| QR wrong host | Set `PUBLIC_BASE_URL` in `.env` |
| Blank slideshow | Event selected; photos `visible=true`; playlist polling in browser console |
