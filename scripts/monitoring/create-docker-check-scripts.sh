#!/bin/bash

# Create Monit Docker Check Scripts
# Diese Scripts prüfen ob Docker-Container laufen

set -e

SCRIPT_DIR="/usr/local/bin"

echo "Erstelle Docker Check-Scripts..."

# Historian App
cat > "$SCRIPT_DIR/check-historian-app.sh" << 'EOF'
#!/bin/bash
docker ps --format "{{.Names}}" | grep -q "^historian-app$" && docker inspect historian-app --format "{{.State.Status}}" | grep -q running
EOF

# Nginx
cat > "$SCRIPT_DIR/check-historian-nginx.sh" << 'EOF'
#!/bin/bash
docker ps --format "{{.Names}}" | grep -q "^historian-nginx$" && docker inspect historian-nginx --format "{{.State.Status}}" | grep -q running
EOF

# Redis
cat > "$SCRIPT_DIR/check-historian-redis.sh" << 'EOF'
#!/bin/bash
docker ps --format "{{.Names}}" | grep -q "^historian-redis$" && docker inspect historian-redis --format "{{.State.Status}}" | grep -q running
EOF

# WordPress App
cat > "$SCRIPT_DIR/check-wordpress-app.sh" << 'EOF'
#!/bin/bash
docker ps --format "{{.Names}}" | grep -q "^wordpress-app$" && docker inspect wordpress-app --format "{{.State.Status}}" | grep -q running
EOF

# WordPress MySQL
cat > "$SCRIPT_DIR/check-wordpress-mysql.sh" << 'EOF'
#!/bin/bash
docker ps --format "{{.Names}}" | grep -q "^wordpress-mysql$" && docker inspect wordpress-mysql --format "{{.State.Status}}" | grep -q running
EOF

chmod +x "$SCRIPT_DIR"/check-*.sh

echo "✓ Check-Scripts erstellt in $SCRIPT_DIR"
