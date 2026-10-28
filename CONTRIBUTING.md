# Contribuer à Mfoundi Mall en ligne

Merci de votre intérêt ! Toute contribution est bienvenue : bug, idée, code, traduction, documentation.

## Avant de commencer

- Lisez le [code de conduite](CODE_OF_CONDUCT.md).
- Pour un bug ou une idée, cherchez d'abord dans les [issues](https://github.com/Aziguy/fleaMarketOnline/issues), puis ouvrez-en une avec le modèle adapté.
- Pour un changement important (nouveau module, modèle de données, dépendance), discutez-en dans une issue **avant** d'écrire le code.
- Une faille de sécurité se signale en privé : voir [SECURITY.md](SECURITY.md).

## Mettre en place l'environnement

Suivez le [guide d'installation](https://aziguy.github.io/fleaMarketOnline/developpeur/installation/). En bref :

```bash
python3 -m venv .venv && source .venv/bin/activate
make install && make css
python manage.py compilemessages --ignore=node_modules
python manage.py migrate && python manage.py seed_demo
make run
```

## Flux de travail

1. Forkez le dépôt (ou créez une branche si vous êtes membre) depuis `master`.
2. Nommez la branche selon le type : `feature/...`, `fix/...`, `docs/...`, `chore/...`.
3. Faites des commits petits et ciblés.
4. Vérifiez localement :
   ```bash
   make lint
   make test
   ```
5. Ouvrez une pull request vers `master` en remplissant le modèle. La CI doit être verte et au moins une relecture approuvée avant la fusion.

## Conventions

| Sujet | Règle |
| --- | --- |
| Style Python | `ruff` (lint et format), lignes de 100 caractères |
| Langue | Code en anglais ; textes affichés en français, traduits via `gettext` (`make messages`) |
| Montants | Entiers en FCFA (`MoneyField`), affichés avec le filtre `fcfa` |
| Téléphones | `PhoneField` / `PhoneFormField`, format `+237XXXXXXXXX` |
| Règles métier | Dans `services.py`, pas dans les vues |
| Tests | Toute règle métier ou correction de bug s'accompagne d'un test (`pytest`) |
| Commentaires | Courts et utiles, pas de paraphrase du code |
| Interface | Classes Tailwind et composants de `static/src/app.css` ; HTMX pour l'interactivité |

Détails : [guide de développement](https://aziguy.github.io/fleaMarketOnline/developpeur/developpement/).

## Messages de commit

En anglais, à l'impératif, courts et précis :

```
Add booking reminders
Fix stock restore on cancelled orders
Update deployment guide
```

## Documentation

Le site de documentation est dans `docs/` (Astro Starlight). Pour le prévisualiser (Node.js 22.23 ou plus) :

```bash
cd docs
npm install
npm run dev
```

Il est publié automatiquement sur GitHub Pages à chaque fusion dans `master`.

## Branche protégée et licence

La branche `master` est protégée : pas de push direct, fusion uniquement par pull request avec CI verte et relecture approuvée (voir `.github/CODEOWNERS`).

En contribuant, vous acceptez que votre contribution soit distribuée sous la [licence MIT](LICENSE) du projet.
