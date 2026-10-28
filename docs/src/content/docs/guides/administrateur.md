---
title: "Guide administrateur du mall"
description: "Valider les boutiques et administrer la plateforme."
sidebar:
  label: Administration du mall
  order: 3
---

L'administration se fait depuis **/admin/** avec un compte disposant de l'accès administration (créé par `createsuperuser`, voir le [guide de déploiement](/fleaMarketOnline/developpeur/deploiement/)).

## 1. Valider les boutiques

**Boutiques > Boutiques**, filtre **Statut : En attente de validation**.

1. Vérifiez les informations (commerçant réel du mall, local, téléphone).
2. Cochez les boutiques, puis action **Valider les boutiques sélectionnées**.
3. Le commerçant est prévenu par e-mail et sa boutique devient visible.

L'action **Suspendre les boutiques sélectionnées** retire une boutique du site (produits et réservations compris) sans supprimer ses données.

Les administrateurs déclarés dans `ADMINS` reçoivent un e-mail à chaque nouvelle boutique créée.

## 2. Mettre en avant

Cochez **Mise en avant** dans la liste des boutiques : elles apparaissent en premier sur l'accueil avec le badge « À la une ».

## 3. Types de boutique

**Boutiques > Types de boutique** : ajoutez ou modifiez les familles (nom français, nom anglais, emoji, ordre d'affichage) et leurs fonctionnalités :

| Option | Effet |
| --- | --- |
| Vend des produits | Catalogue et commandes |
| Prend des rendez-vous | Bouton « Prendre rendez-vous », prestations réservables |
| Réserve des tables | Bouton « Réserver une table » |

## 4. Utilisateurs

**Comptes > Utilisateurs** : recherche par téléphone, nom ou e-mail ; désactivation d'un compte (case **Actif**) ; attribution de l'accès administration à un membre de l'équipe du mall (case **Accès administration** et permissions).

## 5. Commandes et réservations

**Commandes** et **Réservations** donnent une vue globale, filtrable par boutique, statut et date, pour le support client ou le règlement d'un litige. Le traitement courant reste fait par chaque commerçant dans son espace.

## 6. Support aux utilisateurs

- **Mot de passe oublié sans e-mail** : dans la fiche utilisateur, utilisez le lien de changement de mot de passe et communiquez le nouveau mot de passe au titulaire après vérification de son identité.
- **Changement de propriétaire d'une boutique** : modifiez le champ **Propriétaire** de la boutique. Un commerçant peut posséder plusieurs boutiques.
