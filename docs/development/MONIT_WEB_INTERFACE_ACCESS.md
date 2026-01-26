# Monit Web-Interface Zugriff

## Problem

Das Monit Web-Interface läuft auf `http://localhost:2812` - das bedeutet **nur auf dem Server selbst**, nicht von außen erreichbar.

## Lösung: SSH-Tunnel

### Schritt 1: SSH-Tunnel erstellen

Auf deinem **lokalen Rechner** (nicht auf dem Server):

```bash
ssh -L 2812:localhost:2812 root@217.154.198.215
```

**Was macht das?**
- `-L 2812:localhost:2812` = Port-Forwarding: Lokaler Port 2812 → Server Port 2812
- Die SSH-Session muss **offen bleiben** während du das Interface nutzt

### Schritt 2: Browser öffnen

Während der SSH-Tunnel läuft, öffne in deinem Browser:

```
http://localhost:2812
```

**Login:**
- **User:** `admin`
- **Passwort:** (wurde während Setup gesetzt, Standard: `monit`)

### Schritt 3: Tunnel beenden

Wenn du fertig bist, beende die SSH-Session mit `Ctrl+C` oder `exit`.

---

## Alternative: Dauerhafter Zugriff über Nginx

Falls du das Interface dauerhaft zugänglich machen willst (z.B. `monit.evidoxa.com`):

### 1. Nginx Config erweitern

```nginx
# In /opt/historian-app/production/docker/nginx/nginx-ssl.conf

# Monit Web-Interface (optional)
server {
    listen 443 ssl http2;
    server_name monit.evidoxa.com;  # Oder subdomain

    ssl_certificate /etc/letsencrypt/live/monit.evidoxa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monit.evidoxa.com/privkey.pem;

    # Basic Auth (WICHTIG für Sicherheit!)
    auth_basic "Monit Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        proxy_pass http://host.docker.internal:2812;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Basic Auth einrichten

```bash
# Passwort-Datei erstellen
docker exec historian-nginx sh -c "apk add --no-cache apache2-utils && htpasswd -c /etc/nginx/.htpasswd admin"
```

### 3. SSL-Zertifikat erstellen

```bash
certbot certonly --webroot -w /var/www/certbot -d monit.evidoxa.com
```

### 4. Nginx neu laden

```bash
docker exec historian-nginx nginx -s reload
```

**⚠️ WICHTIG:** 
- Setze ein **starkes Passwort**!
- Überlege, ob öffentlicher Zugriff wirklich nötig ist
- SSH-Tunnel ist sicherer!

---

## Schnellzugriff: Alias erstellen

Füge in deine `~/.bashrc` oder `~/.zshrc` hinzu:

```bash
alias monit-tunnel='ssh -L 2812:localhost:2812 root@217.154.198.215'
```

Dann einfach:
```bash
monit-tunnel
# Browser: http://localhost:2812
```

---

## Troubleshooting

### "Connection refused"

- Prüfe ob Monit läuft: `systemctl status monit`
- Prüfe ob Port 2812 offen ist: `netstat -tlnp | grep 2812`

### "Can't connect to localhost:2812"

- SSH-Tunnel läuft nicht → Starte ihn neu
- Falscher Port → Prüfe `-L 2812:localhost:2812`

### Passwort vergessen

```bash
# Auf dem Server
sudo htpasswd -c /etc/monit/htpasswd admin
# Oder in /etc/monit/monitrc ändern: allow admin:neues-passwort
monit reload
```

---

## Zusammenfassung

**Einfachste Methode (empfohlen):**
```bash
# Lokaler Rechner
ssh -L 2812:localhost:2812 root@217.154.198.215

# Browser
http://localhost:2812
```

**Login:** `admin` / `monit` (oder dein gesetztes Passwort)
