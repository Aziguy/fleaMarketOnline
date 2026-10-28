---
title: "Déploiement"
description: "Mise en production sur un VPS avec Docker Compose."
sidebar:
  order: 5
---

Cible : un VPS Linux (Ubuntu 22.04 ou plus) avec Docker. Architecture :

```
Internet ─▶ Nginx (port 80/443) ─▶ Gunicorn / Django (web:8000) ─▶ PostgreSQL (db)
              │
              └─ sert /static/ et /media/ directement
```

## 1. Préparer le serveur

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Pointer le domaine (enregistrement DNS A) vers l'adresse IP du serveur.

## 2. Récupérer le code et configurer

```bash
git clone https://github.com/Aziguy/fleaMarketOnline.git /opt/mfoundi
cd /opt/mfoundi
cp .env.example .env
```

Éditer `.env` : `SECRET_KEY`, `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, mots de passe PostgreSQL (identiques dans `POSTGRES_PASSWORD` et `DATABASE_URL`), SMTP, `ADMINS`. Voir [Configuration](/fleaMarketOnline/developpeur/configuration/).

## 3. Lancer

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Au démarrage, le conteneur `web` applique les migrations puis collecte les fichiers statiques (désactivable avec `RUN_MIGRATIONS=0` / `COLLECTSTATIC=0`).

Créer le compte administrateur du mall :

```bash
docker compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
```

## 4. HTTPS

Le plus simple : placer un reverse proxy TLS devant Nginx (Caddy, Traefik) ou utiliser Certbot sur l'hôte. Exemple avec Certbot et Nginx sur l'hôte : faire écouter le conteneur Nginx en local uniquement (`HTTP_PORT=127.0.0.1:8080` dans `.env`), puis :

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d mfoundimall.cm -d www.mfoundimall.cm
```

avec un bloc `location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }`.

Une fois HTTPS validé, définir `SECURE_HSTS_SECONDS=31536000`.

## 5. Mettre à jour

```bash
cd /opt/mfoundi
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Sauvegardes

Base de données :

```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U mfoundi mfoundi | gzip > backup-$(date +%F).sql.gz
```

Fichiers envoyés (volume `media`) :

```bash
docker run --rm -v mfoundi_media:/data -v $PWD:/backup alpine tar czf /backup/media-$(date +%F).tar.gz -C /data .
```

Restauration de la base :

```bash
gunzip -c backup-AAAA-MM-JJ.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U mfoundi mfoundi
```

Planifier ces commandes (cron) et copier les archives hors du serveur.

## 7. Surveillance

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

```bash
docker compose -f docker-compose.prod.yml ps
```

Les erreurs 500 sont envoyées par e-mail aux `ADMINS` si le SMTP est configuré.

## Liste de vérification

- [ ] `SECRET_KEY` unique et secrète, `.env` non versionné
- [ ] `ALLOWED_HOSTS` et `CSRF_TRUSTED_ORIGINS` renseignés
- [ ] SMTP testé (mot de passe oublié)
- [ ] HTTPS actif, puis HSTS
- [ ] Sauvegardes planifiées et restauration testée
- [ ] `python manage.py check --deploy` sans erreur
