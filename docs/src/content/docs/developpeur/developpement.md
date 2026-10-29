---
title: "Développement"
description: "Commandes, conventions, tests, traductions et interface."
sidebar:
  order: 2
---

## Commandes courantes

| Commande | Effet |
| --- | --- |
| `make run` | Serveur de développement |
| `make css-watch` | Recompile le CSS à chaque modification de template |
| `make icons` | Met à jour les icônes Lucide embarquées (`apps/core/icons.json`) |
| `make test` | Lance la suite de tests (pytest) |
| `make lint` | Vérifie le style (ruff) |
| `make typecheck` | Typage statique (mypy) |
| `make run-asgi` | Serveur ASGI Uvicorn, comme en production |
| `make format` | Corrige et formate le code |
| `make messages` | Met à jour puis compile les traductions |
| `make seed` | Charge les données de démonstration (boutiques, produits, 30 jours de ventes, avis) |

## Arborescence

```
apps/            Applications Django (voir architecture.md)
config/          Réglages (settings/base, dev, test, prod), URLs, WSGI
templates/       Gabarits communs : base, en-tête, pied de page, composants
static/src/      Source CSS Tailwind (app.css, tokens.css) et icons.json (icônes à embarquer)
scripts/         icons.mjs : extraction des icônes Lucide
static/css/      CSS compilé (généré, non versionné)
static/js/       htmx.min.js et app.js
locale/en/       Traduction anglaise
docker/          Entrypoint et configuration Nginx
docs/            Site de documentation (Astro Starlight, publié sur GitHub Pages)
```

## Conventions

- **Langue** : le code (noms, identifiants) est en anglais, les textes affichés sont écrits en français puis traduits en anglais via `gettext`. Toute chaîne visible passe par `gettext_lazy` (modèles, formulaires) ou `{% translate %}` (gabarits).
- **Montants** : entiers en FCFA (`MoneyField`), jamais de décimales. Affichage avec le filtre `{{ montant|fcfa }}`.
- **Téléphones** : `PhoneField` / `PhoneFormField`, normalisés au format `+237XXXXXXXXX`. Affichage avec `{{ numero|phone }}`.
- **Règles métier** dans des modules `services.py` (ex. `apps/orders/services.py`), pas dans les vues.
- **Commentaires** : courts et utiles. Une docstring d'une ligne suffit en général.
- **Style** : `ruff` (lint + format), longueur de ligne 100.
- **Commits** : messages courts à l'impératif, en anglais (`Add booking reminders`).

## Interface : Tailwind et HTMX

- Les classes réutilisables (`btn-primary`, `card`, `card-hover`, `glass`, `input`, `badge-green`, `skeleton`...) sont définies dans `static/src/app.css`.
- La couleur principale est `brand` (vert, `brand-600` = `#138a43`), la couleur d'accent `sun` (jaune). Voir `tailwind.config.js`.
- **Thèmes clair, sombre et système** : les palettes `stone`, `brand`, `red`, `amber`, `sky` et `sun` sont des variables CSS (`static/src/tokens.css`) qui s'inversent en mode sombre (50 ↔ 950). Écrivez `text-stone-900` ou `bg-brand-50` : la classe reste correcte dans les deux thèmes. Utilisez `bg-surface` (et non `bg-white`) pour les fonds de cartes, et la palette fixe `night` pour les zones toujours sombres (héros, pied de page). Le variant `dark:` reste disponible pour les rares cas particuliers.
- **Animations** : `data-reveal` fait apparaître un élément au défilement ; les transitions entre pages utilisent les View Transitions du navigateur. Tout est désactivé si l'utilisateur demande de réduire les animations.
- **Palette de recherche** : `Ctrl+K` ou `/`, fragment `core/_palette_results.html`. Ajoutez `data-palette-open` à un lien pour qu'il ouvre la palette.
- Après ajout de classes dans un gabarit, relancer `make css` (ou laisser tourner `make css-watch`).
- HTMX est utilisé pour l'ajout au panier, la mise à jour des quantités, la recherche instantanée et les actions du tableau de bord. Une vue détecte une requête HTMX avec `request.htmx` et renvoie alors un fragment (`_nom.html`).
- Les événements `toast` (en-tête `HX-Trigger`) affichent une notification.
- **Icônes** : `{% icon "shopping-bag" class="h-5 w-5" %}` avec un nom du catalogue [Lucide](https://lucide.dev/icons/). Après avoir utilisé une nouvelle icône, lancez `make icons` et commitez `apps/core/icons.json` (la CI échoue sinon). Une icône choisie dynamiquement (variable) doit être ajoutée à la liste `extra` de `static/src/icons.json`. Pas d'emoji dans l'interface.
- **Valeurs numériques dans le CSS** (`style="width: {{ x }}%"`) : utilisez `{{ x|unlocalize }}` (`{% load l10n %}`), sinon le français écrit `81,8` et le navigateur ignore la règle.

## Formulaires

Hériter de `apps.core.forms.StyledFormMixin` pour appliquer les classes Tailwind. Dans les gabarits :

```jinja
{% include "includes/form.html" %}
{% include "includes/field.html" with field=form.name wrapper="sm:col-span-2" %}
```

## Images téléversées

Pour un champ image, utilisez le widget `ImagePicker` et le mixin `OptimizedImagesMixin` :

```python
class LogoForm(OptimizedImagesMixin, StyledFormMixin, forms.ModelForm):
    image_specs = {"logo": {"size": (512, 512), "crop": True, "min_size": (128, 128)}}

    class Meta:
        model = Shop
        fields = ("logo",)
        widgets = {"logo": ImagePicker(ratio="aspect-square w-40")}
```

Décorez le modèle avec `@cleanup_files` pour que les anciens fichiers soient supprimés du stockage.

## PWA

Le service worker n'est actif qu'en HTTPS ou sur `localhost`. Après modification de `apps/core/templates/core/sw.js`, rechargez deux fois la page (ou « Update on reload » dans les outils du navigateur). La version du cache change automatiquement avec les fichiers statiques.

## Tests

```bash
pytest
pytest apps/orders -k pickup
```

- Les fixtures communes (`customer`, `merchant`, `shop`, `product`, `salon`, clients connectés) sont dans `conftest.py`.
- Les tests utilisent `config.settings.test` (SQLite en mémoire, e-mails en mémoire).
- Chaque nouvelle règle métier doit être couverte par un test.

## Traductions

```bash
make messages
```

Puis compléter `locale/en/LC_MESSAGES/django.po` (les entrées `msgstr ""` sont à traduire) et relancer `python manage.py compilemessages --ignore=node_modules`. Les fichiers `.mo` ne sont pas versionnés.

Les types de boutique ont un champ `name_en` dédié, géré depuis l'administration.

## Ajouter un type de boutique

Depuis l'administration (**Boutiques > Types de boutique**) : nom, nom anglais, icône et fonctionnalités (`vend des produits`, `prend des rendez-vous`, `réserve des tables`). Aucune modification de code nécessaire si l'icône voulue est déjà embarquée ; sinon, ajoutez son nom à `extra` dans `static/src/icons.json`, lancez `make icons` et déployez.
