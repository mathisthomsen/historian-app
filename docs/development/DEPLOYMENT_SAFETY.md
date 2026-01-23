# Deployment Safety - WordPress Protection

## ✅ Was wurde implementiert

### GitHub Actions Erweiterung

Ein neuer Step wurde hinzugefügt, der **vor** dem Deployment prüft und erstellt:

1. **Docker Network:** `wordpress-network`
   - Wird erstellt falls nicht vorhanden
   - Wird nicht gelöscht wenn vorhanden

2. **Docker Volume:** `production_wordpress_data`
   - Wird erstellt falls nicht vorhanden
   - Wird nicht gelöscht wenn vorhanden

### Warum das wichtig ist

Das `docker-compose.production.yml` referenziert:
- `wordpress-network` als **external network**
- `production_wordpress_data` als **external volume**

Wenn diese beim Deployment fehlen, würde `docker-compose up` fehlschlagen mit:
```
ERROR: network wordpress-network declared as external, but could not be found
ERROR: volume production_wordpress_data declared as external, but could not be found
```

## 🔒 WordPress-Schutz

### Was beim Deployment passiert

1. **`docker-compose down --remove-orphans`**
   - Stoppt **nur** Container aus `docker-compose.production.yml`:
     - `historian-app`
     - `historian-redis`
     - `historian-nginx`
     - `historian-certbot`
   - **NICHT betroffen:** WordPress Container (laufen in separatem Stack)

2. **WordPress Container bleiben unberührt**
   - WordPress läuft in `/opt/wordpress-client/production/`
   - Separates `docker-compose.yml`
   - Eigene Container: `wordpress-app`, `wordpress-mysql`
   - Werden **nicht** von `docker-compose down` gestoppt

3. **Network & Volume bleiben erhalten**
   - `wordpress-network` wird nicht gelöscht
   - `production_wordpress_data` wird nicht gelöscht
   - WordPress Container können weiter kommunizieren

### Warum WordPress sicher ist

**Separate Docker Compose Stacks:**
```
/opt/historian-app/production/
  └── docker-compose.production.yml  # Historian App Stack

/opt/wordpress-client/production/
  └── docker-compose.yml             # WordPress Stack (separat!)
```

**Shared Resources (sicher):**
- `wordpress-network` - Shared Network (wird nicht gelöscht)
- `production_wordpress_data` - Shared Volume (wird nicht gelöscht)

**Keine Container-Überschneidung:**
- Historian App Container: `historian-*`
- WordPress Container: `wordpress-*`
- Keine Namenskonflikte

## ✅ Deployment-Ablauf

### Vor dem Deployment (neu)
```yaml
- name: Ensure WordPress network and volume exist
  # Prüft und erstellt wordpress-network und production_wordpress_data
```

### Während des Deployments
```bash
# Stoppt nur Historian App Container
docker-compose -f docker-compose.production.yml down --remove-orphans

# Startet nur Historian App Container neu
docker-compose -f docker-compose.production.yml up -d
```

### Nach dem Deployment
- ✅ Historian App läuft mit neuer Config
- ✅ WordPress läuft weiter (unberührt)
- ✅ Beide können über `wordpress-network` kommunizieren

## 🧪 Test-Szenario

### Was passiert wenn:

**1. Network/Volume existieren bereits:**
- ✅ Deployment prüft, findet sie, macht nichts
- ✅ Deployment läuft normal durch

**2. Network/Volume fehlen:**
- ✅ Deployment erstellt sie automatisch
- ✅ Deployment läuft normal durch
- ⚠️ WordPress Container müssen neu gestartet werden (falls sie laufen)

**3. WordPress Container laufen während Deployment:**
- ✅ Werden **nicht** gestoppt (separater Stack)
- ✅ Können weiter kommunizieren (Network bleibt)
- ✅ Daten bleiben erhalten (Volume bleibt)

## 📝 Zusammenfassung

✅ **WordPress ist geschützt:**
- Separate Docker Compose Stacks
- Network/Volume werden nicht gelöscht
- Container werden nicht gestoppt

✅ **Deployment ist sicher:**
- Network/Volume werden automatisch erstellt falls fehlend
- Keine Deployment-Fehler mehr
- Historian App und WordPress können parallel laufen

## 🚀 Nächste Schritte

Wenn zu `main` gemerged wird:
1. GitHub Actions prüft/erstellt Network/Volume
2. Historian App wird deployed
3. WordPress bleibt unberührt
4. Beide laufen parallel
