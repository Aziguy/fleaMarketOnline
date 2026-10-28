"""Données de démonstration : boutiques, produits, prestations."""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.catalog.models import Category, Product, Service
from apps.shops.models import Shop, ShopType
from apps.shops.services import ensure_opening_hours

DEMO_PASSWORD = "demo12345"

SHOPS = [
    {
        "type": "epicerie",
        "name": "Épicerie Chez Mama Ngono",
        "unit": "A04",
        "level": "rdc",
        "tagline": "Produits frais et vivres du quotidien",
        "phone": "677000001",
        "momo": "677000001",
        "delivery": True,
        "fee": 1000,
        "categories": {
            "Vivres": [
                ("Riz parfumé 5 kg", 4500, None, 40),
                ("Huile Diamaor 1 L", 1500, 1700, 25),
                ("Sucre en morceaux 1 kg", 900, None, 60),
            ],
            "Boissons": [
                ("Eau Supermont 1,5 L", 400, None, 120),
                ("Jus Top Ananas 1 L", 700, None, 30),
            ],
        },
    },
    {
        "type": "technologie",
        "name": "Mfoundi Tech",
        "unit": "B12",
        "level": "1",
        "tagline": "Smartphones, accessoires et réparations",
        "phone": "699000002",
        "momo": "677000002",
        "orange": "699000002",
        "categories": {
            "Smartphones": [
                ("Tecno Spark 20", 85000, 95000, 5),
                ("Samsung Galaxy A15", 120000, None, 3),
            ],
            "Accessoires": [
                ("Chargeur rapide USB-C", 5000, None, 30),
                ("Écouteurs Bluetooth", 12000, 15000, 12),
            ],
        },
        "services": [("Remplacement d'écran", 25000, 60), ("Diagnostic téléphone", 2000, 20)],
    },
    {
        "type": "coiffure-beaute",
        "name": "Salon Belle Afrique",
        "unit": "C03",
        "level": "1",
        "tagline": "Tresses, coupes et soins",
        "phone": "677000003",
        "momo": "677000003",
        "categories": {"Soins": [("Huile de karité 250 ml", 3500, None, 20)]},
        "services": [
            ("Tresses africaines", 10000, 180),
            ("Coupe homme", 1500, 30),
            ("Manucure", 3000, 45),
        ],
    },
    {
        "type": "restaurant",
        "name": "Le Bon Ndolè",
        "unit": "D01",
        "level": "2",
        "tagline": "Cuisine camerounaise",
        "phone": "699000004",
        "orange": "699000004",
        "delivery": True,
        "fee": 500,
        "categories": {
            "Plats": [
                ("Ndolè crevettes + plantain", 3500, None, None),
                ("Poulet DG", 4500, None, None),
                ("Eru + water fufu", 3000, None, None),
            ],
            "Boissons": [("Jus de foléré", 500, None, None)],
        },
    },
    {
        "type": "parfumerie",
        "name": "Parfums d'Ivoire",
        "unit": "A11",
        "level": "rdc",
        "tagline": "Parfums et cosmétiques",
        "phone": "677000005",
        "momo": "677000005",
        "categories": {
            "Parfums": [
                ("Eau de parfum 100 ml", 25000, 30000, 8),
                ("Brume corporelle", 6000, None, 15),
            ]
        },
    },
    {
        "type": "electromenager",
        "name": "Électro Plus",
        "unit": "B02",
        "level": "rdc",
        "tagline": "Tout pour la maison",
        "phone": "699000006",
        "orange": "699000006",
        "delivery": True,
        "fee": 2000,
        "categories": {
            "Cuisine": [
                ("Mixeur 1,5 L", 18000, None, 6),
                ("Réfrigérateur 150 L", 165000, 180000, 2),
            ]
        },
    },
]


class Command(BaseCommand):
    help = "Crée des boutiques et produits de démonstration (mot de passe : demo12345)."

    @transaction.atomic
    def handle(self, *args, **options):
        for i, data in enumerate(SHOPS, start=1):
            owner, _ = User.objects.get_or_create(
                phone=f"+2376500000{i:02d}",
                defaults={"first_name": f"Commerçant {i}", "role": User.Role.MERCHANT},
            )
            owner.set_password(DEMO_PASSWORD)
            owner.save()
            shop, _ = Shop.objects.update_or_create(
                owner=owner,
                name=data["name"],
                defaults={
                    "shop_type": ShopType.objects.get(slug=data["type"]),
                    "tagline": data["tagline"],
                    "unit": data["unit"],
                    "level": data["level"],
                    "phone": data["phone"],
                    "whatsapp": data["phone"],
                    "mtn_momo_number": data.get("momo", ""),
                    "orange_money_number": data.get("orange", ""),
                    "offers_delivery": data.get("delivery", False),
                    "delivery_fee": data.get("fee", 0),
                    "delivery_area": "Yaoundé" if data.get("delivery") else "",
                    "status": Shop.Status.APPROVED,
                    "is_featured": i <= 4,
                },
            )
            ensure_opening_hours(shop)
            for position, (cat_name, products) in enumerate(data["categories"].items()):
                category, _ = Category.objects.get_or_create(
                    shop=shop, name=cat_name, defaults={"position": position}
                )
                for name, price, old, stock in products:
                    Product.objects.update_or_create(
                        shop=shop,
                        name=name,
                        defaults={
                            "category": category,
                            "price": price,
                            "compare_at_price": old,
                            "stock": stock,
                        },
                    )
            for name, price, minutes in data.get("services", []):
                Service.objects.update_or_create(
                    shop=shop, name=name, defaults={"price": price, "duration_minutes": minutes}
                )

        customer, created = User.objects.get_or_create(
            phone="+237670000000", defaults={"first_name": "Client", "last_name": "Démo"}
        )
        if created:
            customer.set_password(DEMO_PASSWORD)
            customer.save()
        self.stdout.write(
            self.style.SUCCESS(
                f"{len(SHOPS)} boutiques créées. Client : 670000000 / {DEMO_PASSWORD}. "
                f"Commerçants : 650000001..{len(SHOPS):02d} / {DEMO_PASSWORD}."
            )
        )
