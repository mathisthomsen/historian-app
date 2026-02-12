# Pre-Merge-Checkliste: feature/project-integration → main

Vor dem Merge und vor dem richtigen Betrieb von WordPress soll alles „wasserdicht“ sein. Diese Checkliste führt dich Schritt für Schritt durch.

---

## 1. Lokal prüfen (vor dem Merge)

Auf deinem Rechner im Projektordner:

```bash
cd /Users/Lily/Documents/historian_app
git checkout feature/project-integration
git pull origin feature/project-integration
```

### 1.1 Lint & Type-Check

```bash
npm run lint
npm run type-check
```

Beide sollten ohne Fehler durchlaufen.

### 1.2 Tests

```bash
npm test
```

Falls Tests fehlschlagen: Nach dem Refactor können einzelne Tests veraltet sein (z. B. UI-Texte wie „Lebensereignisse“). Entweder Tests anpassen oder vor dem Merge im Workflow Schritt „Run tests“ vorübergehend auskommentieren – auf Dauer Tests fixen.

### 1.3 Build (optional, dauert länger)

```bash
npm run build
```

Sicherstellen, dass der Production-Build durchläuft.

---

## 2. Merge durchführen

### 2.1 main aktualisieren

```bash
git fetch origin main
git checkout main
git pull origin main
```

### 2.2 Feature-Branch einmergeen

```bash
git merge feature/project-integration -m "Merge feature/project-integration: project structure, projects API, monitoring, WordPress integration"
```

Bei Konflikten: Konflikte auflösen, dann `git add` und `git commit` (oder `git merge --continue`).

### 2.3 Auf main pushen

```bash
git push origin main
```

---

## 3. Nach dem Push: CI/CD

Der GitHub-Actions-Workflow (`.github/workflows/deploy-production.yml`) startet bei Push auf **main**. Er:

1. Führt **Lint**, **Type-Check** und **Tests** aus
2. Kopiert den Code per rsync auf den Server
3. Führt **Prisma-Migrationen** aus
4. Baut und startet die **Docker-Container** (inkl. WordPress-Netzwerk/Volume)
5. Führt **SSL-Setup** aus (`scripts/build/deploy-production.sh ssl`)
6. Prüft den **Health-Endpoint** (evidoxa.com/api/health)

**Wichtig:** Der Workflow nutzt die **neue Ordnerstruktur** (`docker/`, `scripts/build/`). Wenn du weitere Änderungen an Pfaden machst, den Workflow anpassen.

- Workflow-Status: **GitHub → Actions** prüfen
- Bei Fehlschlag: Logs in GitHub Actions ansehen (oft Lint/Test oder SSH/Deploy)

---

## 4. WordPress „wasserdicht“ vor Inbetriebnahme

Vor dem richtigen Betrieb von WordPress (bhgv.evidoxa.com) prüfen:

### 4.1 Server & Docker

- [ ] Nach Deploy: auf dem Server `./scripts/build/compose-production.sh ps` (oder `docker-compose -f docker/docker-compose.production.yml --env-file .env ps`) – alle erwarteten Container „Up“, keine Variablen-Warnungen
- [ ] Historian App erreichbar: https://evidoxa.com  
  **Hinweis:** Die „variable is not set“-Warnungen beim manuellen `docker-compose ps` erklären **nicht**, warum die Seite nicht erreichbar ist (die Container wurden vom Workflow mit `.env` gestartet). Wenn evidoxa.com nicht erreichbar ist, prüfen:
  - **DNS:** `evidoxa.com` und ggf. `www.evidoxa.com` zeigen auf die Server-IP (z. B. 217.154.198.215).
  - **Firewall:** Ports 80 und 443 vom Internet zum Server offen (Provider/Cloud Security Groups). Bei „Connection refused“ von außen (z. B. `curl -vI https://evidoxa.com`): auf dem Server `sudo ufw status` prüfen; falls 80/443 fehlen: `sudo ufw allow 80/tcp`, `sudo ufw allow 443/tcp`, `sudo ufw reload`. Zusätzlich beim VPS-Provider (Hetzner, AWS, etc.) Security Groups / Firewall-Regeln prüfen – eingehend TCP 80 und 443 von 0.0.0.0/0 (oder deinem Zugangsnetz) erlauben.
  - **SSL-Schritt:** Wenn der Schritt „Setup SSL certificates“ im Deploy fehlgeschlagen ist, nutzt Nginx nur die HTTP-Config (Port 80 → Redirect auf HTTPS, aber **kein** `listen 443`). Dann ist **https://** evidoxa.com nicht erreichbar. Lösung: SSL-Step im Workflow erfolgreich durchlaufen lassen oder auf dem Server manuell `./scripts/build/deploy-production.sh ssl` ausführen; danach wechselt Nginx auf die SSL-Config.
  - **Nginx-Config auf dem Server:** `cat docker/nginx/nginx.active.conf | grep -E 'listen|server_name'` – sollte `listen 443` und `server_name evidoxa.com` enthalten, wenn SSL aktiv ist.
  - **Falls Nginx „cannot load certificate … fullchain.pem“ loggt:** Beim Start waren die Zertifikate im Container nicht auffindbar (Volume-Zeitpunkt, Symlinks). Prüfen: `docker exec historian-nginx ls -la /etc/letsencrypt/archive/evidoxa.com/`. Wenn die Dateien existieren: Nginx neu starten (`docker restart historian-nginx` oder per compose). Wenn die Dateien fehlen: SSL erneut einrichten (`./scripts/build/deploy-production.sh ssl`).
  - **Zwei Domains, ein Nginx:** Die volle SSL-Config (`nginx-ssl.conf`) verlangt Zertifikate für **evidoxa.com und bhgv.evidoxa.com**. Fehlt eines, startet Nginx nicht. Das Deploy-Skript verwendet in dem Fall automatisch `nginx-ssl-evidoxa-only.conf` (nur evidoxa.com). **„This connection is not private“ bei bhgv.evidoxa.com:** Dann wird für bhgv das falsche Zertifikat ausgeliefert (evidoxa.com) oder das bhgv-Zertifikat ist ungültig. **Option A (empfohlen):** Wildcard-Zertifikat – [SSL_WILDCARD_IONOS.md](SSL_WILDCARD_IONOS.md), dann auf dem Server `./scripts/build/deploy-production.sh ssl-wildcard`. **Option B:** Einzelzertifikat für bhgv: `./scripts/build/deploy-production.sh ssl-bhgv`.
- [ ] WordPress-Container (falls schon im gleichen Stack): erreichbar unter der vorgesehenen URL (z. B. bhgv.evidoxa.com), sobald DNS und Nginx dafür konfiguriert sind

### 4.2 SSL & Domain

- [ ] SSL für evidoxa.com gültig (Browser oder `curl -vI https://evidoxa.com`)
- [ ] SSL für bhgv.evidoxa.com (Subdomain für WordPress), sobald konfiguriert
- [ ] DNS für bhgv.evidoxa.com zeigt auf den richtigen Server

### 4.3 WordPress-spezifisch (vor Live-Gang)

- [ ] WordPress-Theme und -Inhalt wie gewünscht (Staging/Test)
- [ ] Backups: DB und ggf. WordPress-Uploads/Theme gesichert
- [ ] Dokumentation: [FINAL_WORDPRESS_SETUP.md](FINAL_WORDPRESS_SETUP.md), [WORDPRESS_INTEGRATION.md](WORDPRESS_INTEGRATION.md) durchgelesen

### 4.4 Monitoring (bereits eingerichtet)

- [ ] Monit läuft: `systemctl status monit` auf dem Server
- [ ] Logwatch-Reports kommen an (E-Mail/Resend)
- [ ] Bei Bedarf: [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md) durchgehen

---

## 5. Kurzüberblick

| Schritt | Aktion |
|--------|--------|
| 1 | Lint, type-check, Tests (und optional Build) lokal auf feature/project-integration |
| 2 | main auschecken, feature-Branch mergen, main pushen |
| 3 | GitHub Actions prüfen, bei Erfolg: Deploy läuft automatisch |
| 4 | Server prüfen (Container, evidoxa.com, SSL, WordPress-URL/DNS), Backups, dann WordPress in Betrieb nehmen |

---

## 6. Wichtige Pfade nach dem Refactor

- Docker: `docker/docker-compose.production.yml`, `docker/nginx/`
- Deploy-Script: `scripts/build/deploy-production.sh`
- Config (Jest, Next, etc.): `config/`
- Doku: `docs/development/`

Wenn du etwas davon verschiebst, bitte auch den GitHub-Workflow und ggf. Server-Scripts anpassen.

**SSL/Deploy-Ablauf (evidoxa + bhgv):** [DEPLOY_SSL_FLOW.md](DEPLOY_SSL_FLOW.md) – Ablauf, Fallbacks, was bei „beide Seiten down“ zu tun ist.
