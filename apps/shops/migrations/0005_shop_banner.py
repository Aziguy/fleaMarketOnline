from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shops", "0004_shop_type_lucide_icon"),
    ]

    operations = [
        migrations.RenameField(model_name="shop", old_name="cover", new_name="banner"),
        migrations.AlterField(
            model_name="shop",
            name="banner",
            field=models.ImageField(blank=True, upload_to="shops/banners/", verbose_name="bannière"),
        ),
    ]
