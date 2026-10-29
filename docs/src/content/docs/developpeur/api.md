---
title: "API REST"
description: "Utiliser l'API v1 : authentification par jeton, catalogue, commandes, avis, favoris, espace commerçant."
sidebar:
  order: 6
---

L'API v1 expose le catalogue public, le compte client et l'espace commerçant. Elle réutilise exactement les règles du site (validation, stock, code de retrait, transitions de statut).

- Documentation interactive : `/api/v1/docs`
- Schéma OpenAPI : `/api/v1/openapi.json`
- Montants en FCFA (entiers), téléphones au format `+237XXXXXXXXX`, dates ISO 8601.

## Authentification

Obtenez un jeton avec votre téléphone (ou e-mail) et votre mot de passe. Il n'est affiché qu'une fois : seule son empreinte est stockée.

```bash
curl -X POST https://mfoundimall.cm/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "677123456", "password": "...", "name": "Application caisse"}'
```

```json
{"token": "mm_...", "prefix": "mm_Ab3dEf"}
```

Envoyez-le ensuite dans chaque requête :

```bash
curl https://mfoundimall.cm/api/v1/me -H "Authorization: Bearer mm_..."
```

Si la double authentification est active sur le compte, ajoutez le champ `otp` : code à 6 chiffres de l'application d'authentification ou code de secours. Sans lui, la réponse est `401` avec `"Code de double authentification requis (champ otp)."`. Les comptes protégés uniquement par code e-mail utilisent un code de secours. Après 5 échecs, la demande est bloquée 15 minutes (`429`).

```bash
curl -X POST https://mfoundimall.cm/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "677123456", "password": "...", "otp": "492817"}'
```

`DELETE /api/v1/auth/token` révoque le jeton utilisé. L'administration du mall peut aussi révoquer les jetons depuis `/admin/`.

## Points d'accès

| Méthode | Chemin | Accès | Rôle |
| --- | --- | --- | --- |
| GET | `/shop-types` | public | Types de boutique |
| GET | `/shops?type=&q=&level=&page=` | public | Boutiques validées (paginé) |
| GET | `/shops/{slug}` | public | Détail, horaires, note moyenne (`rating`, `reviews_count`) |
| GET | `/shops/{slug}/products?category=&q=` | public | Produits (paginé) |
| GET | `/shops/{slug}/services` | public | Prestations |
| GET | `/products/{boutique}/{slug}` | public | Détail produit |
| GET | `/search?q=&smart=` | public | Recherche ; `smart=true` l'élargit avec l'assistant IA |
| GET | `/shops/{slug}/reviews` | public | Avis publiés (paginé) |
| POST | `/shops/{slug}/reviews` | jeton | Créer ou modifier mon avis (403 si je n'ai pas été servi) |
| GET | `/me` | jeton | Profil |
| GET / POST | `/orders` | jeton | Mes commandes / passer une commande |
| POST | `/orders/{ref}/cancel` | jeton | Annuler |
| GET / POST | `/bookings` | jeton | Mes réservations / réserver |
| POST | `/bookings/{ref}/cancel` | jeton | Annuler |
| GET | `/favorites` | jeton | Boutiques et produits suivis |
| PUT / DELETE | `/favorites/shops/{slug}` | jeton | Suivre / ne plus suivre une boutique |
| PUT / DELETE | `/favorites/products/{id}` | jeton | Ajouter / retirer un produit favori |
| GET | `/notifications` | jeton | Mes notifications (paginé) |
| POST | `/notifications/read` | jeton | Tout marquer comme lu |
| GET | `/merchant/shops` | jeton commerçant | Mes boutiques |
| GET | `/merchant/shops/{slug}/orders?status=` | jeton commerçant | Commandes reçues |
| POST | `/merchant/shops/{slug}/orders/{ref}/status` | jeton commerçant | Changer le statut |
| GET | `/merchant/shops/{slug}/bookings?status=` | jeton commerçant | Réservations reçues |
| POST | `/merchant/shops/{slug}/bookings/{ref}/status` | jeton commerçant | Confirmer, refuser, honorer |
| GET | `/merchant/shops/{slug}/stats?days=` | jeton commerçant | Statistiques sur 7, 30 ou 90 jours |
| GET | `/merchant/shops/{slug}/reviews` | jeton commerçant | Tous les avis de la boutique |
| POST | `/merchant/shops/{slug}/reviews/{id}/reply` | jeton commerçant | Répondre publiquement à un avis |

## Passer une commande

```bash
curl -X POST https://mfoundimall.cm/api/v1/orders \
  -H "Authorization: Bearer mm_..." -H "Content-Type: application/json" \
  -d '{"shop": "mfoundi-tech", "items": [{"product_id": 12, "quantity": 1}],
       "fulfillment": "pickup", "payment_method": "mtn_momo"}'
```

La réponse contient la référence et le `pickup_code` à présenter en boutique.

## Clôturer une commande (commerçant)

```bash
curl -X POST https://mfoundimall.cm/api/v1/merchant/shops/mfoundi-tech/orders/CMD-7K3PQX/status \
  -H "Authorization: Bearer mm_..." -H "Content-Type: application/json" \
  -d '{"status": "completed", "pickup_code": "482913", "paid_with": "mtn_momo"}'
```

## Noter une boutique

```bash
curl -X POST https://mfoundimall.cm/api/v1/shops/le-bon-ndole/reviews \
  -H "Authorization: Bearer mm_..." -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Accueil chaleureux"}'
```

Réservé aux clients dont une commande a été remise ou un rendez-vous honoré ; un second appel met à jour l'avis existant.

## Statistiques (commerçant)

```bash
curl "https://mfoundimall.cm/api/v1/merchant/shops/mfoundi-tech/stats?days=30" \
  -H "Authorization: Bearer mm_..."
```

```json
{"days": 30, "revenue": 138700, "orders": 20, "basket": 6935, "trend": 12,
 "cancel_rate": 0, "bookings_done": 0,
 "series": [{"day": "2026-09-30", "revenue": 0, "orders": 0}],
 "top_products": [{"product_name": "Riz parfumé 5 kg", "sold": 18, "revenue": 81000}],
 "payments": [{"paid_with": "mtn_momo", "label": "MTN Mobile Money", "revenue": 91300, "orders": 13, "percent": 66}]}
```

## Codes de réponse

| Code | Signification |
| --- | --- |
| 401 | Jeton absent ou invalide |
| 403 | Action réservée (ex. avis sans commande remise ni rendez-vous honoré) |
| 404 | Ressource inexistante ou appartenant à une autre boutique |
| 409 | Règle métier refusée (stock insuffisant, transition impossible, code de retrait faux) ; `detail` explique pourquoi |
| 422 | Données invalides ; `detail` donne les erreurs par champ |
| 429 | Limite de débit atteinte (`API_ANON_RATE`, `API_AUTH_RATE`) ou trop d'essais de connexion |
