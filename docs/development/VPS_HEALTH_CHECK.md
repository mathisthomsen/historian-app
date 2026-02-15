# VPS and container health check (post-incident)

Run these on the VPS (as root or with sudo) to check for signs of compromise and verify containers are healthy. Use after key rotation or if you suspect malware.

---

## 1. SSH in

```bash
ssh root@217.154.198.215
```

---

## 2. VPS-level checks

### 2.1 Who can log in and what’s running

```bash
# Only keys you expect (no unknown keys)
cat ~/.ssh/authorized_keys

# No unexpected cron jobs (check root and /etc/cron.*)
crontab -l
ls -la /etc/cron.d/ /etc/cron.daily/
cat /etc/cron.d/* 2>/dev/null

# Listening ports – only what you expect (22, 80, 443, 3000, 6379, etc.)
ss -tlnp
# or: netstat -tlnp 2>/dev/null
```

### 2.2 Suspicious processes and logins

```bash
# Top memory/CPU – any unknown processes?
ps aux --sort=-%mem | head -20
ps aux --sort=-%cpu | head -20

# Recent logins (should match you and maybe GitHub Actions)
last -20

# Failed login attempts
grep "Failed password" /var/log/auth.log 2>/dev/null | tail -30
```

### 2.3 Unusual files and changes

```bash
# Recently modified files in /tmp and /var/tmp
find /tmp /var/tmp -type f -mtime -7 -ls 2>/dev/null

# Setuid/setgid binaries (known ones only)
find /usr -perm -4000 -o -perm -2000 2>/dev/null | head -30
```

### 2.4 Updates

```bash
# Apply security updates (Debian/Ubuntu)
apt update && apt list --upgradable
# apt upgrade -y   # run when you're ready
```

---

## 3. Container-level checks

### 3.1 What’s running

```bash
cd /opt/historian-app/production
docker ps -a
docker-compose -f docker/docker-compose.production.yml --env-file .env ps -a
```

Only your app, Redis, Nginx, WordPress, certbot, etc. should be there – no unknown images or names.

### 3.2 App container health

```bash
# Historian app container (name may vary, e.g. historian-app or production-app-1)
docker ps --format '{{.Names}}' | grep -E 'historian|app'

# Check one app container (replace CONTAINER with actual name)
CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'historian|app' | head -1)
echo "Using container: $CONTAINER"

# Processes inside – should be Node/Next.js, no shells or miners
docker exec $CONTAINER ps aux

# Listening ports inside container
docker exec $CONTAINER ss -tlnp 2>/dev/null || docker exec $CONTAINER netstat -tlnp 2>/dev/null
```

### 3.3 Image and mounts

```bash
# No untrusted or old images you don’t recognise
docker images

# Mounts for app container – no unexpected volumes
docker inspect $CONTAINER --format '{{json .Mounts}}' | jq .
```

### 3.4 Logs (errors and odd activity)

```bash
# Last 100 lines of app logs
docker logs $CONTAINER --tail 100

# Nginx access/error – look for weird paths or 4xx/5xx spikes
docker logs historian-nginx --tail 50 2>/dev/null || docker logs nginx --tail 50 2>/dev/null
```

---

## 4. Application health

```bash
# From the VPS
curl -s -o /dev/null -w "%{http_code}" https://evidoxa.com/api/health
# Expect 200

# Optional: full response
curl -s https://evidoxa.com/api/health | jq .
```

---

## 5. One-shot script

From your machine (run the script over SSH):

```bash
ssh root@217.154.198.215 'bash -s' < scripts/server/health-check-vps.sh
```

Or copy the script to the VPS and run it there: `bash health-check-vps.sh`

---

## 6. If you find something wrong

- **Unknown key in `authorized_keys`:** Remove it: `nano ~/.ssh/authorized_keys`, delete the line, save. Rotate your own keys again.
- **Unknown process or cron:** Note the command and path, stop/disable it, remove the file or cron job if safe. Consider rebuilding the VPS or restoring from a clean backup if you had a compromise.
- **Unknown container/image:** Stop and remove the container; remove the image if not needed. Rebuild from your known Dockerfile/compose.
- **App not responding:** Check `docker logs` and `curl .../api/health`; restart containers if needed:  
  `docker-compose -f docker/docker-compose.production.yml --env-file .env restart app`

---

## 7. Keeping things clean

- Rotate SSH and app secrets periodically (see KEY_ROTATION.md).
- Keep the OS and Docker images updated.
- Only run services you need; close unused ports (firewall/security group).
- Prefer running the app in containers (as you do) so the host is less exposed.
