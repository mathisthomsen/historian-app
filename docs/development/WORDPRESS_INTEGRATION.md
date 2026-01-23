# WordPress Integration - bhgv.evidoxa.com

## Übersicht

WordPress wird als separates Docker Compose Stack auf der Subdomain `bhgv.evidoxa.com` betrieben.

## Architektur

```
┌─────────────────────────────────────────────────┐
│              VPS Server                         │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Nginx Reverse Proxy (Port 80/443)        │  │
│  │  - evidoxa.com → historian-app:3000      │  │
│  │  - bhgv.evidoxa.com → wordpress:80       │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Historian Stack  │  │ WordPress Stack  │   │
│  ├──────────────────┤  ├──────────────────┤   │
│  │ historian-app    │  │ wordpress        │   │
│  │ historian-redis  │  │ mysql            │   │
│  │                  │  │ php-fpm          │   │
│  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Verzeichnisstruktur

```
/opt/
├── historian-app/
│   └── production/          # Historian App
│       ├── docker/
│       │   └── nginx/
│       │       └── nginx-ssl.conf  # Multi-Domain Config
│       └── docker-compose.production.yml
│
└── wordpress-client/
    └── production/           # WordPress Projekt
        ├── docker-compose.yml
        ├── wordpress/
        │   └── wp-content/
        ├── mysql/
        │   └── data/
        └── .env
```

## Deployment

### Historian App Repo
- Nginx Config wird erweitert (Multi-Domain)
- Deployed nach: `/opt/historian-app/production`

### WordPress Repo (separat)
- Eigene Docker Compose Datei
- Deployed nach: `/opt/wordpress-client/production`

## Nächste Schritte

1. WordPress Docker Compose erstellen
2. Nginx Config erweitern
3. SSL-Zertifikat für Subdomain einrichten
4. Deployment-Scripts erstellen
