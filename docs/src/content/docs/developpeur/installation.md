---
title: "Installation"
description: "Installer le projet en local, avec ou sans Docker."
sidebar:
  order: 1
---

## Prérequis

| Outil | Version | Rôle |
| --- | --- | --- |
| Python | 3.12 ou plus | Application Django |
| Node.js | 20 ou plus | Compilation du CSS Tailwind uniquement |
| gettext | toute version récente | Compilation des traductions (`msgfmt`) |
| PostgreSQL | 16 (recommandé) | Base de données. SQLite suffit en local |
| Docker + Compose | facultatif | Environnement complet en conteneurs |

Sous Debian/Ubuntu : `sudo apt install python3-venv gettext nodejs npm`.

## Installation locale (sans Docker)

```bash
git clone https://github.com/Aziguy/fleaMarketOnline.git
cd fleaMarketOnline
python3 -m venv .venv
source .venv/bin/activate
```

```bash
make install
```

```bash
make css
python manage.py compilemessages --ignore=node_modules
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
make run
```

Le site est disponible sur `http://127.0.0.1:8000` et l'administration sur `http://127.0.0.1:8000/admin/`.

Sans fichier `.env`, le projet utilise `config.settings.dev` et une base SQLite (`db.sqlite3`). Pour utiliser PostgreSQL, définir `DATABASE_URL` (voir [Configuration](/fleaMarketOnline/developpeur/configuration/)).

:::note
`createsuperuser` demande un **numéro de téléphone** (identifiant de connexion) et un prénom.
:::

## Installation avec Docker

```bash
docker compose up --build
```

Ce fichier lance trois services :

- `db` : PostgreSQL 16 (données dans le volume `pgdata`) ;
- `web` : Django en mode développement, code monté en volume, rechargement automatique ;
- `css` : Tailwind en mode `watch`.

Dans un autre terminal :

```bash
docker compose exec web python manage.py seed_demo
```

```bash
docker compose exec web python manage.py createsuperuser
```

## Comptes de démonstration

`seed_demo` crée six boutiques validées avec produits et prestations.

| Rôle | Identifiant | Mot de passe |
| --- | --- | --- |
| Client | `670000000` | `demo12345` |
| Commerçants | `650000001` à `650000006` | `demo12345` |

Ne jamais exécuter `seed_demo` en production.
