from django.db import models
from vendor.models import Vendor


class Category(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    category_name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "category"
        verbose_name_plural = "categories"

    def clean(self):
        self.category_name = self.category_name.capitalize()

    def __str__(self):
        return self.category_name


class Items(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="items"
    )
    item_title = models.CharField(max_length=50)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_1 = models.ImageField(upload_to="items_images", blank=False)
    image_2 = models.ImageField(upload_to="items_images", blank=False)
    image_3 = models.ImageField(upload_to="items_images", blank=False)
    image_4 = models.ImageField(upload_to="items_images", blank=False)
    image_5 = models.ImageField(upload_to="items_images", blank=False)
    image_6 = models.ImageField(upload_to="items_images", blank=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "item"
        verbose_name_plural = "items"

    def __str__(self):
        return self.item_title
