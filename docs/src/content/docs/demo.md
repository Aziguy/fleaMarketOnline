---
title: Essayer en local
description: Lancer la plateforme avec des données de démonstration en quelques minutes.
---

```bash
git clone https://github.com/Aziguy/fleaMarketOnline.git
cd fleaMarketOnline
python3 -m venv .venv && source .venv/bin/activate
make install && make css
python manage.py compilemessages --ignore=node_modules
python manage.py migrate
python manage.py seed_demo
make run
```

Ouvrez `http://localhost:8000`.

## Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
| --- | --- | --- |
| Client | `670000000` | `demo12345` |
| Commerçants | `650000001` à `650000006` | `demo12345` |

`seed_demo` crée six boutiques validées : épicerie, technologie, salon de coiffure, restaurant, parfumerie et électroménager, avec produits et prestations.

:::caution
Ne jamais exécuter `seed_demo` en production.
:::

Pour une installation détaillée ou avec Docker, voir [Installation](/fleaMarketOnline/developpeur/installation/).
