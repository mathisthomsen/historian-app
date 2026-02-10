# Server Status Check Scripts

Diese Scripts helfen dabei, den aktuellen Status des VPS-Servers zu prüfen.

## Option 1: Direkt auf dem Server ausführen

**SSH zum Server:**
```bash
ssh root@217.154.198.215
```

**Dann das Script ausführen:**
```bash
# Vollständige Analyse
bash /opt/historian-app/production/scripts/server/check-server-status.sh

# Oder einfache Version
bash /opt/historian-app/production/scripts/server/check-server-status-remote.sh
```

## Option 2: Von lokalem Rechner via SSH

**Einfache Version (empfohlen für schnellen Überblick):**
```bash
ssh root@217.154.198.215 'bash -s' < scripts/server/check-server-status-remote.sh
```

**Vollständige Version:**
```bash
# Script zuerst auf Server kopieren
scp scripts/server/check-server-status.sh root@217.154.198.215:/tmp/
ssh root@217.154.198.215 'bash /tmp/check-server-status.sh'
```

## Option 3: Manuelle Prüfung (wenn Scripts nicht verfügbar)

**Basis-Checks direkt auf dem Server:**

```bash
# 1. Docker Container Status
docker ps -a

# 2. Historian App Verzeichnis
ls -la /opt/historian-app/production/

# 3. Docker Compose Status
cd /opt/historian-app/production
docker-compose -f docker/docker-compose.production.yml ps

# 4. Nginx Config
cat docker/nginx/nginx-ssl.conf

# 5. SSL Zertifikate
ls -la /etc/letsencrypt/live/

# 6. Offene Ports
netstat -tuln | grep -E ':(80|443|3000)'

# 7. Container Logs
docker logs historian-app --tail 50
docker logs historian-nginx --tail 50

# 8. System Ressourcen
free -h
df -h
docker stats --no-stream
```

## Was die Scripts prüfen

1. ✅ **System Information** - Hostname, Uptime, Disk, Memory
2. ✅ **Docker Status** - Container, Images, Networks, Volumes
3. ✅ **Historian App** - Verzeichnisstruktur, Config-Dateien
4. ✅ **Container Health** - Status aller Historian-Container
5. ✅ **Network & Ports** - Offene Ports und Docker Port-Mappings
6. ✅ **SSL Certificates** - Let's Encrypt Zertifikate und Ablaufdaten
7. ✅ **Logs** - Aktuelle Log-Dateien und Fehler
8. ✅ **Resource Usage** - CPU, Memory, Network der Container
9. ✅ **Git Status** - Aktueller Branch und letzter Commit
10. ✅ **Other Projects** - Andere Projekte auf dem Server (z.B. WordPress)

## Nächste Schritte nach der Prüfung

1. **Container nicht laufend?**
   ```bash
   cd /opt/historian-app/production
   docker-compose -f docker/docker-compose.production.yml up -d
   ```

2. **Nginx Config prüfen?**
   ```bash
   cat docker/nginx/nginx-ssl.conf
   ```

3. **Logs ansehen?**
   ```bash
   docker logs historian-app --tail 100 -f
   ```

4. **Container neu starten?**
   ```bash
   cd /opt/historian-app/production
   docker-compose -f docker/docker-compose.production.yml restart
   ```
