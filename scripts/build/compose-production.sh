#!/bin/bash
# Run docker-compose for production with .env loaded (avoids "variable is not set" warnings).
# Usage: from repo root (e.g. /opt/historian-app/production): ./scripts/build/compose-production.sh [compose args...]
# Example: ./scripts/build/compose-production.sh ps
# Example: ./scripts/build/compose-production.sh up -d app redis nginx

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="docker/docker-compose.production.yml"
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found in $(pwd). Run from repo root (e.g. /opt/historian-app/production)." >&2
    exit 1
fi

exec docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
