#!/bin/bash
set -euo pipefail

echo "Building Photodropper Docker image (host networking for Synology DNS)..."
docker build --network=host -t photodropper-app .

echo ""
echo "Build OK. Start with:"
echo "  docker compose up -d"
echo ""
echo "Logs:"
echo "  docker logs -f photodropper-app"
