# Synology NAS setup (Photodropper)

Self-hosted party photo wall on the same NAS as FamilyAlbum: **Docker Compose**, **host network**, **MariaDB** on `localhost`, photos on a bind mount.

---

## Overview

| Piece | Where |
|-------|--------|
| Git / Docker project | `/volume1/docker-projects/photodropper` |
| Photos | `/volume1/docker-projects/photodropper/photos` → container `/data/photos` |
| MariaDB | NAS MariaDB package, database `photodropper` |
| App (public) | `https://photodropper.0x0001.org` (reverse proxy → `127.0.0.1:3011`) |
| App (LAN direct) | `http://babylon2024.local:3011` (optional, bypasses proxy) |

FamilyAlbum: `https://album.0x0001.org`. Export bridge is a later phase.

---

## 1. MariaDB

On the NAS (SSH or phpMyAdmin):

```bash
mysql -u root -p < database/mariadb.init.sql
```

Create app user (pick a strong password; use the **same host patterns as FamilyAlbum**):

```sql
-- App on NAS (Container Manager, host network)
CREATE USER IF NOT EXISTS 'photodropper'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'localhost';

-- TCP to MariaDB on the NAS (Prisma / Node)
CREATE USER IF NOT EXISTS 'photodropper'@'127.0.0.1' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'127.0.0.1';

-- Home LAN (dev laptop, e.g. gozo @ 192.168.178.x)
CREATE USER IF NOT EXISTS 'photodropper'@'192.168.178.%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'192.168.178.%';

-- Docker bridge (if anything connects from 172.27.x)
CREATE USER IF NOT EXISTS 'photodropper'@'172.27.0.%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'172.27.0.%';

-- VPN (WireGuard / 10.8.0.x)
CREATE USER IF NOT EXISTS 'photodropper'@'10.8.0.%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'10.8.0.%';

FLUSH PRIVILEGES;
```

In phpMyAdmin **User accounts** you should see `photodropper` for each host, with **ALL PRIVILEGES** on `photodropper.*` (not USAGE only). If you only see USAGE, run the `GRANT ALL` lines again.

Connection string for the **Docker stack on the NAS**:

```env
DATABASE_URL=mysql://photodropper:YOUR_STRONG_PASSWORD@127.0.0.1:3306/photodropper
```

For **dev on your laptop** (remote to NAS):

```env
DATABASE_URL=mysql://photodropper:YOUR_STRONG_PASSWORD@babylon2024.local:3306/photodropper
```

URL-encode special characters in the password (`!` → `%21`, etc.).

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
3. Set in `.env` (or copy [`.env.synology.example`](.env.synology.example)):
   - `DATABASE_URL` — from step 1
   - `NEXTAUTH_SECRET` — e.g. `openssl rand -base64 32`
   - `ADMIN_PASSWORD`
   - `NEXTAUTH_URL` and `PUBLIC_BASE_URL` — `https://photodropper.0x0001.org`
   - `AUTH_TRUST_HOST=true`
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

## 4. Reverse proxy (HTTPS)

Same pattern as FamilyAlbum (`album.0x0001.org`):

1. **Control Panel → Login Portal → Advanced → Reverse Proxy**
2. Add rule:
   - **Source:** `https://photodropper.0x0001.org` (port 443)
   - **Destination:** `http://localhost:3011` (or NAS LAN IP + `3011`)
3. Ensure DNS for `photodropper.0x0001.org` points at the NAS (or your front door).
4. In `.env`:

```env
NEXTAUTH_URL=https://photodropper.0x0001.org
PUBLIC_BASE_URL=https://photodropper.0x0001.org
AUTH_TRUST_HOST=true
```

`PUBLIC_BASE_URL` drives QR guest links; `NEXTAUTH_URL` drives admin sign-in. Use the same HTTPS URL for both when everything goes through the proxy.

Restart the container after changing `.env`.

---

## 5. Verify

1. Open `https://photodropper.0x0001.org` — slideshow (create event in management first).
2. Open `/management` — sign in with `ADMIN_PASSWORD`.
3. Create an event, upload a test photo (bulk upload or mobile `/action` flow).
4. Confirm file appears under `/volume1/docker-projects/photodropper/photos`.
5. QR codes should link to `https://photodropper.0x0001.org/action?...` (check `/api/local-ip` returns the same base URL).

---

## 6. Dev laptop

Mount NAS photos optional; for local dev:

```env
DATABASE_URL=mysql://photodropper:pass@babylon2024.local:3306/photodropper
PHOTO_UPLOAD_PATH=./photos
NEXTAUTH_URL=http://localhost:3000
npm run dev
```

Ensure MariaDB on the NAS allows remote connections from your laptop, or run MariaDB locally with the same init SQL.

---

## 7. Troubleshooting

| Issue | Check |
|-------|--------|
| DB connection refused | MariaDB running; `127.0.0.1:3306` from host network container |
| Upload fails | `PHOTOS_HOST_DIR` writable; `PHOTO_UPLOAD_PATH=/data/photos` in compose |
| QR wrong host | `PUBLIC_BASE_URL=https://photodropper.0x0001.org` |
| Auth redirect loop | `NEXTAUTH_URL` must match browser URL; `AUTH_TRUST_HOST=true` |
| Blank slideshow | Event selected; photos `visible=true`; playlist polling in browser console |
