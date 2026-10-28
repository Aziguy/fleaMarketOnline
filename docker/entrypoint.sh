#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    python manage.py migrate --noinput
fi

if [ "${COLLECTSTATIC:-1}" = "1" ]; then
    python manage.py collectstatic --noinput -v0
fi

exec "$@"
