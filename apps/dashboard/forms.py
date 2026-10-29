from typing import cast

from django import forms
from django.utils.translation import gettext_lazy as _

from apps.catalog.models import MAX_EXTRA_IMAGES, Category, Product, ProductImage, Service
from apps.core.forms import StyledFormMixin


class CategoryForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Category
        fields = ("name", "position")


class ProductForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Product
        fields = (
            "name",
            "category",
            "description",
            "price",
            "compare_at_price",
            "stock",
            "image",
            "is_active",
        )
        widgets = {"description": forms.Textarea(attrs={"rows": 5})}

    def __init__(self, *args, shop, **kwargs):
        super().__init__(*args, **kwargs)
        cast(forms.ModelChoiceField, self.fields["category"]).queryset = shop.categories.all()
        for name in ("price", "compare_at_price", "stock"):
            self.fields[name].widget.attrs.update(min=0, inputmode="numeric")

    def clean(self):
        super().clean()
        data = self.cleaned_data
        price, old = data.get("price"), data.get("compare_at_price")
        if old is not None and price is not None and old <= price:
            self.add_error("compare_at_price", _("L'ancien prix doit être supérieur au prix."))
        return data


class ProductImageForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ("image", "position")


ProductImageFormSet = forms.inlineformset_factory(
    Product,
    ProductImage,
    form=ProductImageForm,
    extra=2,
    max_num=MAX_EXTRA_IMAGES,
    can_delete=True,
)


class ServiceForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Service
        fields = ("name", "description", "price", "duration_minutes", "position", "is_active")
        widgets = {"description": forms.Textarea(attrs={"rows": 3})}
