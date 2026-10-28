---
title: Contribuer
description: Comment proposer une amélioration ou signaler un problème.
---

Les contributions sont les bienvenues : signalement de bug, idée, correction, traduction ou documentation.

1. **Ouvrez une issue** avant un changement important, pour en discuter.
2. **Créez une branche** depuis `master` : `feature/reservation-rappel`, `fix/stock-annulation`.
3. **Installez le projet** : [Installation](/fleaMarketOnline/developpeur/installation/).
4. **Respectez les conventions** : [Développement](/fleaMarketOnline/developpeur/developpement/).
5. **Vérifiez** avant de pousser :
   ```bash
   make lint
   make test
   ```
6. **Ouvrez une pull request** en remplissant le modèle. La CI doit être verte.

Le guide complet est dans [CONTRIBUTING.md](https://github.com/Aziguy/fleaMarketOnline/blob/master/CONTRIBUTING.md) et le [code de conduite](https://github.com/Aziguy/fleaMarketOnline/blob/master/CODE_OF_CONDUCT.md) s'applique à tous les échanges.

## Modifier cette documentation

Chaque page a un lien « Modifier la page » en bas. Le site est dans le dossier `docs/` (Astro Starlight) :

```bash
cd docs
npm install
npm run dev
```
