#!/bin/bash
# VPS health check – run on the VPS to verify SSH, processes, and containers.
# Usage: ssh root@217.154.198.215 'bash -s' < scripts/server/health-check-vps.sh
# Or copy to VPS and run: bash health-check-vps.sh
set -e
echo "=== authorized_keys ==="
cat ~/.ssh/authorized_keys
echo ""
echo "=== Listening ports ==="
ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null
echo ""
echo "=== Docker containers ==="
docker ps -a 2>/dev/null || true
echo ""
echo "=== Top processes (host) ==="
ps aux --sort=-%mem 2>/dev/null | head -15
echo ""
echo "=== Recent logins ==="
last -10 2>/dev/null || true
echo ""
echo "=== Crontabs ==="
crontab -l 2>/dev/null || echo "(none)"
ls -la /etc/cron.d/ 2>/dev/null || true
