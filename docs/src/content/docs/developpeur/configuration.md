---
title: "Configuration"
description: "Variables d'environnement et réglages."
sidebar:
  order: 4
---

Les réglages sont lus depuis les variables d'environnement, ou depuis un fichier `.env` à la racine (modèle : `.env.example`).

## Modules de réglages

| Module | Usage |
| --- | --- |
| `config.settings.dev` | Développement (par défaut pour `manage.py`), `DEBUG=True` |
| `config.settings.test` | Tests (SQLite en mémoire) |
| `config.settings.prod` | Production (par défaut pour WSGI/ASGI), sécurité HTTPS activée |

Choisir avec `DJANGO_SETTINGS_MODULE`.

## Variables

| Variable | Défaut | Description |
| --- | --- | --- |
| `SECRET_KEY` | clé de dev | **Obligatoire en production.** Chaîne aléatoire longue |
| `DEBUG` | `False` | Forcé à `True` en dev, `False` en prod |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Domaines autorisés, séparés par des virgules |
| `CSRF_TRUSTED_ORIGINS` | vide | Origines HTTPS, ex. `https://mfoundimall.cm` |
| `DATABASE_URL` | SQLite local | Ex. `postgres://user:pass@db:5432/mfoundi` |
| `DB_CONN_MAX_AGE` | `60` | Durée de vie des connexions (secondes) |
| `MEDIA_ROOT` | `./media` | Dossier des fichiers envoyés (logos, photos) |
| `EMAIL_BACKEND` | console | `django.core.mail.backends.smtp.EmailBackend` en prod |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | | Serveur SMTP |
| `DEFAULT_FROM_EMAIL` | `Mfoundi Mall <no-reply@mfoundimall.cm>` | Expéditeur |
| `ADMINS` | vide | `Nom:email,Nom2:email2`. Reçoivent les erreurs et les nouvelles boutiques à valider |
| `SITE_NAME` | `Mfoundi Mall` | Nom affiché |
| `SITE_PHONE`, `SITE_EMAIL`, `MALL_ADDRESS` | | Coordonnées du mall (pied de page) |
| `SECURE_SSL_REDIRECT` | `True` | Redirection HTTP vers HTTPS (prod) |
| `SECURE_HSTS_SECONDS` | `0` | Activer (ex. `31536000`) une fois HTTPS stable |
| `LOG_LEVEL` | `INFO` | Niveau de journalisation |

Générer une clé secrète :

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

## E-mails envoyés

| Événement | Destinataire |
| --- | --- |
| Nouvelle boutique créée | `ADMINS` |
| Boutique validée ou suspendue | e-mail de la boutique, sinon du propriétaire |
| Nouvelle commande | e-mail de la boutique (si renseigné) |
| Mot de passe oublié | e-mail du compte |

Un échec d'envoi n'empêche jamais une commande d'être enregistrée.
