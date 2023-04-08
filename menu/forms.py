from django import forms

from accounts.validators import allow_only_images_validator
from .models import Category, Items


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ["category_name", "description"]


class ItemForm(forms.ModelForm):
    image_1 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )
    image_2 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )
    image_3 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )
    image_4 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )
    image_5 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )
    image_6 = forms.FileField(
        widget=forms.FileInput(attrs={"class": "btn btn-info w-100"}),
        validators=[allow_only_images_validator],
    )

    class Meta:
        model = Items
        fields = [
            "category",
            "item_title",
            "description",
            "price",
            "image_1",
            "image_2",
            "image_3",
            "image_4",
            "image_5",
            "image_6",
            "is_available",
        ]
