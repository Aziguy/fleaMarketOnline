import json

from django.core.management.base import BaseCommand, CommandError

from apps.core.observability import run_checks


class Command(BaseCommand):
    help = "Vérifie base de données et cache (utilisé par le healthcheck Docker)."

    def handle(self, *args, **options):
        healthy, checks = run_checks()
        self.stdout.write(json.dumps(checks))
        if not healthy:
            raise CommandError("Service indisponible")
