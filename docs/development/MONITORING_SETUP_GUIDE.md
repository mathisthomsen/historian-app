# Monitoring & Alerting Setup Guide

## Übersicht

Dieser Guide beschreibt die Einrichtung von **Monit** (Prozess-Monitoring) und **Logwatch** (Log-Reports) auf dem Production-Server.

---

## 1. Monit Setup

### Was macht Monit?

- **Überwacht Docker-Container:** historian-app, nginx, redis, wordpress-app, mysql
- **Auto-Restart:** Startet Container automatisch neu bei Absturz
- **Alerting:** Sendet E-Mail/Telegram bei Problemen
- **System-Monitoring:** CPU, Memory, Disk, Load

### Installation

```bash
# Auf dem Server ausführen
cd /opt/historian-app/production
bash scripts/monitoring/setup-monit.sh
```

**Während der Installation:**
- E-Mail-Adresse für Alerts eingeben
- Web-Interface Passwort setzen (optional)

### Konfiguration

**Config-Datei:** `/etc/monit/monitrc`

**Überwachte Services:**
- `historian-app` (Port 3000)
- `historian-nginx` (Port 80)
- `historian-redis` (Port 6379)
- `wordpress-app`
- `wordpress-mysql` (Port 3306)
- System (CPU, Memory, Disk)

### Nützliche Befehle

```bash
# Status aller Services
monit status

# Zusammenfassung
monit summary

# Config neu laden
monit reload

# Systemd Status
systemctl status monit

# Logs
tail -f /var/log/monit.log
```

### Web-Interface

**URL auf Server:** `http://localhost:2812` (nur lokal auf dem Server!)

**Zugriff von deinem Rechner (SSH-Tunnel):**

1. **SSH-Tunnel erstellen:**
   ```bash
   ssh -L 2812:localhost:2812 root@217.154.198.215
   ```
   (Lass diese SSH-Session offen!)

2. **Im Browser öffnen:**
   ```
   http://localhost:2812
   ```

3. **Login:**
   - User: `admin`
   - Passwort: (wurde während Setup gesetzt, Standard: `monit`)

**Alternative: Nginx Reverse Proxy (für dauerhaften Zugriff)**

Falls du das Web-Interface dauerhaft zugänglich machen willst (z.B. über `monit.evidoxa.com`), kannst du einen Nginx Reverse Proxy einrichten. **Achtung:** Dann sollte ein starkes Passwort gesetzt werden!

---

## 2. Logwatch Setup

### Was macht Logwatch?

- **Tägliche Log-Reports:** Per E-Mail um 6:00 Uhr
- **Security-Awareness:** Failed Logins, Nginx-Fehler, System-Events
- **Übersicht:** Alle wichtigen Logs kompakt zusammengefasst

### Installation

```bash
# Auf dem Server ausführen
cd /opt/historian-app/production
bash scripts/monitoring/setup-logwatch.sh
```

**Während der Installation:**
- E-Mail-Adresse für Reports eingeben

### Konfiguration

**Config-Datei:** `/etc/logwatch/conf/logwatch.conf`

**Einstellungen:**
- **Detail-Level:** Med (Medium)
- **Format:** Text
- **Range:** Yesterday (gestern)
- **Zeit:** Täglich um 6:00 Uhr (Cron)

### Manueller Report

```bash
# Report per E-Mail senden
logwatch --output mail --mailto deine@email.com --detail medium

# Report in Terminal anzeigen
logwatch --output stdout --detail high
```

### Was wird überwacht?

- **Auth-Logs:** SSH-Logins, Failed Attempts
- **Nginx-Logs:** HTTP-Errors, Access-Logs
- **System-Logs:** Kernel, Systemd, Disk
- **Docker-Logs:** (falls verlinkt)

### Logwatch/Resend-Diagnose ausführen

**Auf dem Server** (wenn das Repo dort liegt, z.B. `/opt/historian-app/production`):

```bash
cd /opt/historian-app/production
git pull   # falls nötig, damit scripts/monitoring/ vorhanden ist
sudo bash scripts/monitoring/check-logwatch-resend.sh
```

**Falls das Script nicht im Repo auf dem Server ist:** Die `scp`-Zeile muss **auf deinem Mac** in einem Terminal ausgeführt werden (nicht in der SSH-Session), damit der Pfad `/Users/.../check-logwatch-resend.sh` existiert:

```bash
# Auf dem Mac ausführen (neues Terminal, nicht per SSH eingeloggt):
scp /Users/Lily/Documents/historian_app/scripts/monitoring/check-logwatch-resend.sh root@217.154.198.215:/tmp/
ssh root@217.154.198.215 "sudo bash /tmp/check-logwatch-resend.sh"
```

---

## 3. Telegram Alerts (Optional)

### Setup

```bash
# Auf dem Server ausführen
cd /opt/historian-app/production
bash scripts/monitoring/setup-monit-telegram.sh
```

**Benötigt:**
1. **Telegram Bot Token:** Erstelle Bot via [@BotFather](https://t.me/botfather)
2. **Chat ID:** Deine Telegram Chat ID (z.B. via [@userinfobot](https://t.me/userinfobot))

### Bot erstellen

1. Öffne Telegram → Suche `@BotFather`
2. `/newbot` → Name wählen → Username wählen
3. Bot Token kopieren
4. Chat ID finden: Nachricht an Bot senden, dann:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

### Test

```bash
# Test-Alert senden
MONIT_SERVICE='Test' \
MONIT_EVENT='Test Alert' \
MONIT_DESCRIPTION='Dies ist ein Test' \
/usr/local/bin/monit-telegram-alert.sh
```

---

## 4. Monitoring-Dashboard (Optional)

### Uptime Kuma (Empfehlung)

**Was macht es?**
- HTTP(S)-Uptime-Checks für evidoxa.com, bhgv.evidoxa.com
- Status-Page
- Alerts per Telegram, E-Mail, Slack, etc.

**Installation:**
```bash
# Docker Compose
mkdir -p /opt/uptime-kuma
cd /opt/uptime-kuma

cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - ./data:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
EOF

docker-compose up -d
```

**Zugriff:** `http://217.154.198.215:3001` (oder via Nginx Reverse Proxy)

---

## 5. Checkliste

### Nach Setup prüfen:

- [ ] Monit läuft: `systemctl status monit`
- [ ] Alle Container werden überwacht: `monit status`
- [ ] Test-Alert erhalten (E-Mail oder Telegram)
- [ ] Logwatch Cron-Job aktiv: `crontab -l`
- [ ] Erster Logwatch-Report erhalten (am nächsten Tag um 6:00 Uhr)

### Regelmäßige Wartung:

- [ ] Monit-Logs prüfen: `/var/log/monit.log`
- [ ] Logwatch-Reports lesen (täglich)
- [ ] Web-Interface prüfen (wöchentlich)
- [ ] Alert-Kanäle testen (monatlich)

---

## 6. Troubleshooting

### Monit startet nicht

```bash
# Prüfe Config
monit -t

# Prüfe Logs
tail -f /var/log/monit.log

# Systemd Status
systemctl status monit
journalctl -u monit
```

### Container wird nicht überwacht

```bash
# Prüfe ob Container läuft
docker ps | grep historian-app

# Prüfe Monit Config
grep -A 5 "historian-app" /etc/monit/monitrc

# Monit neu laden
monit reload
```

### Monit Web-Interface: Login funktioniert nicht

**Diagnose auf dem Server** (wenn das Repo dort liegt):

```bash
cd /opt/historian-app/production
git pull   # falls nötig
sudo bash scripts/monitoring/check-monit-web-login.sh
```

**Falls das Script nicht auf dem Server ist:** Die folgende Zeile **auf deinem Mac** in einem Terminal ausführen (nicht in der SSH-Session), damit der Pfad existiert:

```bash
scp /Users/Lily/Documents/historian_app/scripts/monitoring/check-monit-web-login.sh root@217.154.198.215:/tmp/
ssh root@217.154.198.215 "sudo bash /tmp/check-monit-web-login.sh"
```

**Typische Ursachen:**

1. **SSH-Tunnel fehlt:** Das Interface ist nur unter `http://localhost:2812` auf dem Server erreichbar. Von deinem Rechner aus musst du einen Tunnel öffnen (auf dem **Mac** ausführen):  
   `ssh -L 2812:localhost:2812 root@217.154.198.215`  
   Session offen lassen, dann im Browser `http://localhost:2812` aufrufen.

2. **Falsches Passwort:** Standard nach Setup ist User **admin**, Passwort **monit**. Wenn du beim Setup ein anderes gewählt hast, dieses verwenden. Passwort zurücksetzen:
   ```bash
   sudo sed -i 's/^[[:space:]]*allow admin:.*/  allow admin:NEUES_PASSWORT/' /etc/monit/monitrc
   sudo monit reload
   ```

3. **User genau eingeben:** Login ist **admin** (kleingeschrieben).

Ausführlich: [MONIT_WEB_INTERFACE_ACCESS.md](MONIT_WEB_INTERFACE_ACCESS.md).

### Keine Alerts erhalten

```bash
# Prüfe E-Mail-Config
grep "set alert" /etc/monit/monitrc

# Test-Alert manuell senden
monit alert deine@email.com

# Prüfe Mail-Logs
tail -f /var/log/mail.log
```

### Logwatch sendet keine Reports / Nichts in Resend

Wenn **keine E-Mails** ankommen und in **Resend unter Logs nichts** erscheint, liegt das meist an Postfix/From-Adresse oder Cron.

**1. Diagnose-Script auf dem Server ausführen:**

```bash
cd /opt/historian-app/production
sudo bash scripts/monitoring/check-logwatch-resend.sh
```

**2. Typische Ursachen:**

- **From-Adresse:** Resend akzeptiert nur verifizierte Absender. Standard `root@hostname` oder `logwatch@hostname` wird abgelehnt.
  - **Lösung:** Postfix Generic Map einrichten (z.B. `root@$(hostname)` → `logwatch@evidoxa.com`) und in `/etc/logwatch/conf/logwatch.conf` **MailFrom = logwatch@evidoxa.com** setzen.
  - Siehe [POSTFIX_RESEND_TROUBLESHOOTING.md](POSTFIX_RESEND_TROUBLESHOOTING.md) und [LOGWATCH_RESEND_TROUBLESHOOTING.md](LOGWATCH_RESEND_TROUBLESHOOTING.md).

- **Postfix/SASL:** Relayhost oder Resend-API-Key falsch → Test: `echo "Test" | mail -s "Test" deine@email.com` und `tail -f /var/log/postfix.log` (bzw. `/var/log/mail.log`).

- **Cron:** Kein Logwatch-Eintrag → `crontab -l` prüfen.

**3. Manueller Test:**

```bash
# Test-Mail
echo "Test" | mail -s "Logwatch Test" deine@email.com

# Logwatch einmal von Hand
logwatch --output mail --mailto deine@email.com --detail medium --range yesterday
```

Ausführliche Schritte und Checkliste: **[LOGWATCH_RESEND_TROUBLESHOOTING.md](LOGWATCH_RESEND_TROUBLESHOOTING.md)**.

---

## 7. Erweiterte Konfiguration

### Zusätzliche Checks in Monit

**Beispiel: Disk-Space für spezifisches Verzeichnis**

```bash
# In /etc/monit/monitrc hinzufügen
check filesystem docker-data with path /var/lib/docker
  if space usage > 90% then alert
```

**Beispiel: Externe URL-Check**

```bash
# In /etc/monit/monitrc hinzufügen
check host evidoxa.com with address evidoxa.com
  if failed url https://evidoxa.com/api/health
    with timeout 10 seconds
    for 2 cycles
  then alert
```

### Logwatch: Zusätzliche Services

**Docker-Logs einbinden:**

```bash
# In /etc/logwatch/conf/logwatch.conf
Service = docker
```

**Nginx-Logs detaillierter:**

```bash
# In /etc/logwatch/conf/services/nginx.conf
Detail = High
```

---

## 8. Logwatch-Report: Was tun bei Auffälligkeiten?

Wenn im täglichen Logwatch-Report viele Einträge zu Fail2ban, SSHD und Kernel erscheinen:

### Fail2ban: viele blockierte IPs

**Einschätzung:** Das ist **erwartbar und positiv**. Fail2ban blockiert automatisch IPs nach fehlgeschlagenen Login-Versuchen und schützt so den Server.

**Optional:**  
- Bantime anpassen: in `/etc/fail2ban/jail.local` z.B. `bantime = 86400` (24h).  
- Status prüfen: `fail2ban-client status sshd`

### SSHD: Failed Logins, Illegal Users, Disconnects

**Einschätzung:** Typische **automatisierte Scan-/Brute-Force-Versuche** von außen. Solange Fail2ban läuft und du nur mit SSH-Key einloggst, ist das Risiko begrenzt.

**Optional (mehr Härte):**

1. **Nur noch SSH-Key, keine Passwörter:**  
   Erst SSH-Key einrichten und testen, dann auf dem Server:
   ```bash
   sudo sed -i 's/#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl reload sshd
   ```
2. **SSH auf anderen Port:** z.B. Port 2222, dann in Firewall nur 2222 öffnen und 22 schließen – reduziert Lärm in den Logs.
3. **Volles Hardening:** `sudo bash scripts/server/complete-security-hardening.sh` (Backup/SSH-Test vorher beachten).

### Kernel: „TCP: out of memory -- consider tuning tcp_mem“

**Einschätzung:** Der Kernel meldet, dass die TCP-Puffer-Limits erreicht wurden (viele Verbindungen oder Lastspitzen). Kann Performance oder Stabilität beeinträchtigen.

**Empfehlung:** Werte anheben (einmalig testen, bei Erfolg dauerhaft machen):

```bash
# Aktuelle Werte anzeigen
sysctl net.ipv4.tcp_mem

# Höhere Werte setzen (Beispiel für 1–2 GB RAM für TCP, Format: min pressure max)
sudo sysctl -w net.ipv4.tcp_mem="65536 131072 262144"

# Dauerhaft machen:
echo 'net.ipv4.tcp_mem = 65536 131072 262144' | sudo tee -a /etc/sysctl.d/99-tcp-mem.conf
sudo sysctl -p /etc/sysctl.d/99-tcp-mem.conf
```

Auf stark belasteten oder speicherarmen Servern die Werte eher vorsichtig wählen; bei 2–4 GB RAM können die obigen Werte ein guter Start sein. Nach Änderung: Logwatch/Logs beobachten, ob die Meldung seltener oder nicht mehr kommt.

---

## 9. Zusammenfassung

**Was du jetzt hast:**

✅ **Monit:** Prozess-Monitoring, Auto-Restart, Alerting  
✅ **Logwatch:** Tägliche Log-Reports, Security-Awareness  
✅ **Optional:** Telegram-Alerts, Uptime Kuma

**Nächste Schritte:**

1. Setup-Scripts auf Server ausführen
2. Alerts testen
3. Regelmäßig Reports prüfen
4. Optional: Uptime Kuma für HTTP-Monitoring

**Ressourcen:**

- Monit Docs: https://mmonit.com/monit/documentation/
- Logwatch Docs: `/usr/share/doc/logwatch/`
- Uptime Kuma: https://github.com/louislam/uptime-kuma
