FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json tailwind.config.js ./
RUN npm ci
COPY static ./static
COPY templates ./templates
COPY apps ./apps
RUN npm run build

FROM python:3.12-slim AS app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 app
WORKDIR /app
COPY requirements ./requirements
RUN pip install -r requirements/prod.txt
COPY . .
COPY --from=assets /app/static/css/app.css ./static/css/app.css
RUN SECRET_KEY=build python manage.py compilemessages --ignore=node_modules -v0 \
    && SECRET_KEY=build python manage.py collectstatic --noinput -v0 \
    && mkdir -p /app/media && chown -R app:app /app/media /app/staticfiles
USER app
EXPOSE 8000
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["gunicorn", "config.asgi:application", "--worker-class", "uvicorn_worker.UvicornWorker", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
