from django.db import migrations

# (slug, nom, nom anglais, icône, produits, rendez-vous, tables)
SHOP_TYPES = [
    ("epicerie", "Épicerie", "Grocery", "🛒", True, False, False),
    ("alimentation-generale", "Alimentation générale", "General store", "🥫", True, False, False),
    ("technologie", "Technologie & téléphonie", "Tech & phones", "📱", True, False, False),
    ("electromenager", "Électroménager", "Home appliances", "🔌", True, False, False),
    ("coiffure-beaute", "Coiffure & beauté", "Hair & beauty", "💇", True, True, False),
    ("restaurant", "Restaurant", "Restaurant", "🍽️", True, False, True),
    ("bar", "Bar & lounge", "Bar & lounge", "🍹", True, False, True),
    ("cave", "Cave & boissons", "Wine & drinks", "🍷", True, False, False),
    ("parfumerie", "Parfumerie & cosmétiques", "Perfume & cosmetics", "🌸", True, False, False),
    ("mode", "Mode & vêtements", "Fashion & clothing", "👗", True, False, False),
    ("chaussures", "Chaussures & maroquinerie", "Shoes & leather goods", "👟", True, False, False),
    ("maison", "Maison & décoration", "Home & decor", "🛋️", True, False, False),
    ("pharmacie", "Pharmacie & santé", "Pharmacy & health", "💊", True, False, False),
    ("librairie", "Librairie & papeterie", "Books & stationery", "📚", True, False, False),
    ("services", "Services", "Services", "🛠️", False, True, False),
    ("autre", "Autre", "Other", "🏪", True, False, False),
]


def seed(apps, schema_editor):
    ShopType = apps.get_model("shops", "ShopType")
    for position, (slug, name, name_en, icon, products, appointments, tables) in enumerate(SHOP_TYPES):
        ShopType.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "name_en": name_en,
                "icon": icon,
                "sells_products": products,
                "takes_appointments": appointments,
                "takes_table_bookings": tables,
                "position": position,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("shops", "0001_initial")]

    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
