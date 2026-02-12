# Deploy- und SSL-Ablauf (evidoxa.com + bhgv.evidoxa.com)

Kurze Übersicht, damit SSL/Deploy nicht wieder „im Kreis“ dreht.

## Wichtige Prinzipien

1. **`nginx.active.conf` wird nicht per rsync überschrieben**  
   Die Datei liegt auf dem Server und wird vom Workflow ausgeschlossen (`--exclude 'docker/nginx/nginx.active.conf'`). So bleibt die aktuelle (SSL-)Config nach jedem Deploy erhalten, bis der SSL-Schritt sie gezielt austauscht.

2. **SSL-Schritt setzt immer eine gültige Config**  
   - Wenn ein Zertifikat für die Hauptdomain existiert: es wird entweder die volle SSL-Config oder die evidoxa-only-Config gesetzt und Nginx neu gestartet.  
   - Wenn Nginx danach nicht auf 443 antwortet (z. B. volle Config, aber bhgv-Zertifikat fehlt): automatischer Fallback auf evidoxa-only.

3. **ssl-bhgv nimmt die Seite nicht mehr „mit runter“**  
   Schlägt die Zertifikatsanforderung für bhgv.evidoxa.com fehl, wird **evidoxa-only** wiederhergestellt (nicht HTTP-only). evidoxa.com bleibt mit HTTPS erreichbar.

## Ablauf beim normalen Deploy (GitHub Actions)

1. Rsync kopiert Code auf den Server, **ohne** `docker/nginx/nginx.active.conf`.  
2. Wenn `nginx.active.conf` auf dem Server fehlt: sie wird aus `nginx-ssl-evidoxa-only.conf` (oder nginx.conf) erzeugt.  
3. `docker-compose up -d app redis nginx` startet mit der **bestehenden** aktiven Config.  
4. **Setup SSL certificates** führt `deploy-production.sh ssl` aus:  
   - Nginx wird kurz auf HTTP-only gestellt (für ACME-Challenge).  
   - Certbot läuft für die Hauptdomain (evidoxa.com); Fehler beenden das Skript nicht.  
   - Wenn ein Zertifikat für die Hauptdomain existiert:  
     - Bei vorhandenem bhgv-Zertifikat → volle SSL-Config.  
     - Sonst → evidoxa-only-Config.  
   - Nginx wird neu gestartet. Wenn 443 nicht antwortet → Fallback auf evidoxa-only, Nginx erneut starten.

## Manuell: SSL nur für bhgv nachziehen

```bash
cd /opt/historian-app/production
./scripts/build/deploy-production.sh ssl-bhgv
```

- Holt ein Zertifikat für bhgv.evidoxa.com (wenn möglich).  
- Bei Erfolg: volle SSL-Config wird aktiviert.  
- Bei Misserfolg: evidoxa-only wird wiederhergestellt, evidoxa.com bleibt per HTTPS erreichbar.

## Wenn beide Seiten „down“ sind

1. Auf dem Server prüfen:  
   `docker ps` (Nginx läuft?), `docker logs historian-nginx --tail 30` (Fehler? z. B. „cannot load certificate“).  
2. Aktive Config prüfen:  
   `grep -E 'listen|server_name' docker/nginx/nginx.active.conf`  
   – sollte `listen 443` und `server_name evidoxa.com` (und ggf. bhgv) enthalten.  
3. Schnell wiederherstellen (nur evidoxa.com mit HTTPS):  
   ```bash
   cp docker/nginx/nginx-ssl-evidoxa-only.conf docker/nginx/nginx.active.conf
   docker restart historian-nginx
   ```

## Config-Dateien (Überblick)

| Datei | Verwendung |
|-------|------------|
| `nginx.conf` | Nur HTTP (Port 80), für ACME-Challenge; keine Zertifikate. |
| `nginx-ssl-evidoxa-only.conf` | HTTPS nur für evidoxa.com. Wird genutzt, wenn kein bhgv-Zertifikat im Volume ist. |
| `nginx-ssl.conf` | HTTPS für evidoxa.com und bhgv.evidoxa.com. Erfordert beide Zertifikate im Certbot-Volume. |
| `nginx.active.conf` | Wird auf dem Server gesetzt; nicht im Repo mit rsync syncen. |
