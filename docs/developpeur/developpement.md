# Développement

## Commandes courantes

| Commande | Effet |
| --- | --- |
| `make run` | Serveur de développement |
| `make css-watch` | Recompile le CSS à chaque modification de template |
| `make test` | Lance la suite de tests (pytest) |
| `make lint` | Vérifie le style (ruff) |
| `make format` | Corrige et formate le code |
| `make messages` | Met à jour puis compile les traductions |
| `make seed` | Charge les données de démonstration |

## Arborescence

```
apps/            Applications Django (voir architecture.md)
config/          Réglages (settings/base, dev, test, prod), URLs, WSGI
templates/       Gabarits communs : base, en-tête, pied de page, composants
static/src/      Source CSS Tailwind (app.css)
static/css/      CSS compilé (généré, non versionné)
static/js/       htmx.min.js et app.js
locale/en/       Traduction anglaise
docker/          Entrypoint et configuration Nginx
docs/            Documentation
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

- Les classes réutilisables (`btn-primary`, `card`, `input`, `badge-green`...) sont définies dans `static/src/app.css`.
- La couleur principale est `brand` (vert, `brand-600` = `#138a43`), la couleur d'accent `sun` (jaune). Voir `tailwind.config.js`.
- Après ajout de classes dans un gabarit, relancer `make css` (ou laisser tourner `make css-watch`).
- HTMX est utilisé pour l'ajout au panier, la mise à jour des quantités, la recherche instantanée et les actions du tableau de bord. Une vue détecte une requête HTMX avec `request.htmx` et renvoie alors un fragment (`_nom.html`).
- Les événements `toast` (en-tête `HX-Trigger`) affichent une notification.

## Formulaires

Hériter de `apps.core.forms.StyledFormMixin` pour appliquer les classes Tailwind. Dans les gabarits :

```django
{% include "includes/form.html" %}
{% include "includes/field.html" with field=form.name wrapper="sm:col-span-2" %}
```

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

Depuis l'administration (**Boutiques > Types de boutique**) : nom, nom anglais, emoji, et fonctionnalités (`vend des produits`, `prend des rendez-vous`, `réserve des tables`). Aucune modification de code nécessaire.
