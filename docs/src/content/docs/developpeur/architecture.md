---
title: "Architecture"
description: "Applications Django, modèle de données et règles métier."
sidebar:
  order: 3
---

Monolithe Django 5 servi en **ASGI** (Uvicorn), rendu côté serveur et enrichi par HTMX : pages légères, adaptées aux connexions mobiles, installables comme une application (PWA). Une **API REST** documentée expose les mêmes fonctions aux applications tierces.

## Principe : une seule source de vérité

Les règles métier vivent dans des modules `services.py`. Les pages, l'API et le temps réel les appellent ; aucun ne réimplémente une règle.

```mermaid
flowchart LR
    Pages["Pages HTML + HTMX"] --> Services
    API["API REST /api/v1"] --> Services
    Live["Flux temps réel (SSE)"] --> Models
    Services["services.py\norders · bookings · shops"] --> Models[(Modèles Django)]
    Search["core.search\nrecherche partagée"] --> Models
    AI["ai.services\n(Claude)"] -.->|mots-clés| Search
    Pages --> Search
    API --> Search
```

| Règle | Module |
| --- | --- |
| Créer une commande, transitions de statut, stock, code de retrait | `apps/orders/services.py` |
| Créer, annuler, confirmer une réservation | `apps/bookings/services.py` |
| Créer une boutique, valider ou suspendre | `apps/shops/services.py` |
| Recherche catalogue (pages, palette, API) et recherche élargie | `apps/core/search.py` |
| Validation des saisies (commande, réservation) | Formulaires Django, réutilisés tels quels par l'API |

## Applications

| Application | Responsabilité |
| --- | --- |
| `core` | Accueil, recherche, pages d'information, utilitaires (téléphone, FCFA, champs), commande `seed_demo` |
| `accounts` | Utilisateur personnalisé (connexion par téléphone ou e-mail), inscription, profil, mot de passe |
| `shops` | Types de boutique, boutiques, horaires, validation par l'administration |
| `catalog` | Rayons, produits, photos, prestations |
| `cart` | Panier en session, regroupé par boutique, lien WhatsApp pré-rempli |
| `orders` | Commandes par boutique, code de retrait, statuts, stock |
| `bookings` | Rendez-vous (coiffure, services) et réservations de tables (restaurants, bars) |
| `dashboard` | Espace commerçant : statistiques, catalogue, commandes, réservations, réglages, flux temps réel |
| `api` | API REST v1 (Django Ninja) : catalogue, compte client, espace commerçant, jetons d'accès |
| `ai` | Assistant IA (API Claude) : descriptions produits, mots-clés de recherche |

## Modèle de données

```mermaid
erDiagram
    User ||--o{ Shop : "possède"
    ShopType ||--o{ Shop : "classe"
    Shop ||--o{ OpeningHour : "a"
    Shop ||--o{ Category : "a"
    Shop ||--o{ Product : "vend"
    Category ||--o{ Product : "regroupe"
    Product ||--o{ ProductImage : "a"
    Shop ||--o{ Service : "propose"
    User ||--o{ Order : "passe"
    Shop ||--o{ Order : "reçoit"
    Order ||--|{ OrderItem : "contient"
    User ||--o{ Booking : "réserve"
    Shop ||--o{ Booking : "reçoit"
    Service ||--o{ Booking : "concerne"
```

Points clés :

- **User** : `USERNAME_FIELD = "phone"`, e-mail facultatif et unique. Rôles : client, commerçant, administrateur.
- **ShopType** : définit les fonctionnalités d'une famille de boutique (produits, rendez-vous, tables). 16 types sont créés par la migration `shops.0002`.
- **Shop** : un commerçant peut posséder plusieurs boutiques (`ForeignKey`, `user.shops`). Dans l'espace commerçant, la boutique courante est mémorisée en session (`dashboard_shop_id`) et exposée par le décorateur `merchant_required` (`request.shop`, `request.shops`). Statut `pending` à la création, `approved` après validation, `suspended` en cas de problème. Seules les boutiques `approved` sont publiques (`Shop.objects.public()`).
- **Product** : prix en FCFA, ancien prix facultatif (promotion), stock facultatif (`None` = non suivi).
- **Order** : une commande concerne **une seule boutique**. Les lignes copient le nom et le prix du produit au moment de la commande.
- **Booking** : `kind` = `appointment` (avec prestation) ou `table` (avec nombre de personnes).

## Paiement sur place

Il n'y a **aucun paiement en ligne**. Le client choisit à la commande le moyen prévu (espèces, MTN MoMo, Orange Money) parmi ceux acceptés par la boutique. Les numéros Mobile Money de la boutique sont affichés pour un transfert fait devant le commerçant ou le livreur. Le commerçant enregistre le moyen réellement utilisé lors de la clôture (`paid_with`, `paid_at`).

## Cycle de vie d'une commande

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> confirmed
    confirmed --> ready : retrait
    confirmed --> shipped : livraison
    ready --> completed : code de retrait + paiement
    shipped --> completed : paiement
    pending --> cancelled
    confirmed --> cancelled
    ready --> cancelled
    shipped --> cancelled
```

Règles (`apps/orders/services.py`) :

- `place_order` verrouille les produits (`select_for_update`), vérifie le stock, crée la commande et décrémente le stock dans une transaction.
- `change_status` refuse toute transition non prévue par `Order.next_statuses()`.
- Clôturer une commande en retrait exige le **code à 6 chiffres** donné au client.
- Une annulation remet les quantités en stock.
- Le client peut annuler tant que la commande est `pending` ou `confirmed`.

## Réservations

- Créneau au moins 30 minutes à l'avance et au plus 60 jours.
- Refusé si la boutique est fermée à ce moment selon ses horaires.
- Le commerçant confirme ou refuse, puis marque « honorée » ou « absent ».

## Fuseau horaire et langue

- `TIME_ZONE = "Africa/Douala"` (UTC+1, sans heure d'été).
- `LANGUAGE_CODE = "fr"`, anglais disponible via le sélecteur FR/EN (`/i18n/setlang/`).

## Temps réel commerçant

`apps/dashboard/realtime.py` expose `/espace-boutique/flux/`, un flux **Server-Sent Events**. Le serveur interroge la base toutes les `REALTIME_POLL_SECONDS` secondes et envoie chaque nouvelle commande ou réservation de la boutique courante. Aucune infrastructure supplémentaire (ni Redis, ni WebSocket) n'est nécessaire.

- Chaque événement porte un identifiant `commande:réservation` (`id: 42:7`). À la reconnexion, le navigateur renvoie `Last-Event-ID` et ne perd aucun événement.
- Le flux se ferme au bout de `REALTIME_STREAM_SECONDS` ; `EventSource` se reconnecte seul.
- Sous ASGI (production), le flux ne bloque aucun worker. Sous `runserver`, il occupe un thread.
- Côté navigateur (`static/js/live.js`) : badge, toast, son, notification système, et rafraîchissement HTMX des listes (`live:order`, `live:booking`).

## Application installable (PWA)

| Élément | Rôle |
| --- | --- |
| `/manifest.webmanifest` | Nom, icônes (dont masquable), couleurs, raccourcis |
| `/sw.js` | Service worker : statiques en cache, pages publiques en réseau d'abord avec repli, page `/hors-ligne/` |
| `PrivateCacheMiddleware` | Ajoute `Cache-Control: private` aux réponses des utilisateurs connectés : ni les proxys ni le service worker ne les gardent |

Les préfixes privés (`/compte/`, `/panier/`, `/commandes/`, `/espace-boutique/`, `/api/`...) ne sont jamais mis en cache.

## Assistant IA

`apps/ai/services.py` appelle l'API Claude avec des **sorties structurées** (schéma JSON validé par Pydantic) et le **repli serveur** `fallbacks: "default"` en cas de refus. Sans `ANTHROPIC_API_KEY`, l'assistant est désactivé et l'interface masque ses boutons ; toute erreur (réseau, quota, refus, réponse invalide) devient `AIUnavailable` et l'application continue sans lui.

| Fonction | Usage |
| --- | --- |
| `describe_product()` | Bouton « Rédiger avec l'IA » de la fiche produit (texte, rayon, prix, notes et photo) ; quota par commerçant |
| `expand_search()` | Quand une recherche trouve moins de 3 produits, propose des mots-clés (synonymes, termes locaux) ; résultat mis en cache 24 h |

## Observabilité

- `/healthz` : état de la base et du cache (200 ou 503), version de l'application. `python manage.py healthcheck` fait la même vérification (healthcheck Docker).
- Chaque requête reçoit un identifiant (`X-Request-ID`, repris s'il est fourni) présent dans tous les logs.
- Logs **JSON** en production (`LOG_FORMAT=json`), texte en développement.
- Typage statique strict (mypy + django-stubs) vérifié en CI ; des tests bornent le nombre de requêtes SQL des pages principales.
