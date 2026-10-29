from django.db import migrations, models

ICONS = {
    "epicerie": "shopping-basket",
    "alimentation-generale": "apple",
    "technologie": "smartphone",
    "electromenager": "refrigerator",
    "coiffure-beaute": "scissors",
    "restaurant": "utensils-crossed",
    "bar": "martini",
    "cave": "wine",
    "parfumerie": "flower-2",
    "mode": "shirt",
    "chaussures": "footprints",
    "maison": "sofa",
    "pharmacie": "pill",
    "librairie": "book-open",
    "services": "wrench",
}


def to_lucide(apps, schema_editor):
    ShopType = apps.get_model("shops", "ShopType")
    for shop_type in ShopType.objects.all():
        shop_type.icon = ICONS.get(shop_type.slug, "store")
        shop_type.save(update_fields=["icon"])


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0003_shop_owner_multiple"),
    ]

    operations = [
        migrations.AlterField(
            model_name="shoptype",
            name="icon",
            field=models.CharField(
                default="store",
                help_text="Icône Lucide",
                max_length=40,
                verbose_name="icône",
            ),
        ),
        migrations.RunPython(to_lucide, migrations.RunPython.noop),
    ]
