.PHONY: install css css-watch run migrate seed test cov lint format messages docs docs-build up down prod

PY ?= python

install:          ## Dépendances Python (dev) et front
	$(PY) -m pip install -r requirements/dev.txt
	npm install

css:              ## Compile le CSS Tailwind
	npm run build

css-watch:        ## Compile le CSS en continu
	npm run watch

run:              ## Serveur de développement
	$(PY) manage.py runserver

migrate:
	$(PY) manage.py migrate

seed:             ## Données de démonstration
	$(PY) manage.py seed_demo

test:
	pytest

cov:              ## Tests avec couverture
	pytest --cov=apps --cov-report=term-missing

lint:
	ruff check .
	ruff format --check .

format:
	ruff check --fix .
	ruff format .

messages:         ## Met à jour et compile les traductions
	$(PY) manage.py makemessages -l en --ignore=node_modules --ignore=docs --no-location --no-obsolete
	$(PY) manage.py compilemessages --ignore=node_modules --ignore=docs

docs:             ## Site de documentation en local
	cd docs && npm install && npm run dev

docs-build:
	cd docs && npm ci && npm run build

up:               ## Docker (dev)
	docker compose up --build

down:
	docker compose down

prod:             ## Docker (prod)
	docker compose -f docker-compose.prod.yml up -d --build
