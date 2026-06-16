#!/bin/sh
# Run on Synology (SSH) from /volume1/docker-projects/photodropper
# Requires: MariaDB root password, docker via sudo

set -e
cd "$(dirname "$0")"

echo "=== Photodropper Syno deploy ==="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit DATABASE_URL, secrets, then re-run."
  exit 1
fi

mkdir -p /volume1/docker-projects/photodropper/photos
chmod 777 /volume1/docker-projects/photodropper/photos 2>/dev/null || true

echo "Apply database schema (enter MariaDB root password when prompted):"
/usr/local/bin/mysql -u root -p < database/mariadb.init.sql

echo ""
echo "Create app user if not exists (adjust password to match .env DATABASE_URL):"
echo "  CREATE USER 'photodropper'@'localhost' IDENTIFIED BY 'your-password';"
echo "  GRANT ALL PRIVILEGES ON photodropper.* TO 'photodropper'@'localhost';"
echo "  FLUSH PRIVILEGES;"
echo ""

echo "Building and starting container (sudo password may be required):"
sudo docker compose build
sudo docker compose up -d

echo ""
echo "Done. Open https://photodropper.0x0001.org (or PUBLIC_BASE_URL from .env)"
echo "Logs: sudo docker compose logs -f app"
