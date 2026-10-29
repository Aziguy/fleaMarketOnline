from django import forms

IMAGE_TYPES = "image/jpeg,image/png,image/webp"


class ImagePicker(forms.ClearableFileInput):
    """Sélecteur d'image avec aperçu, glisser-déposer et suppression."""

    template_name = "widgets/image_picker.html"

    def __init__(self, *, ratio="aspect-square", hint="", preview="", attrs=None):
        attrs = {"accept": IMAGE_TYPES, "class": "sr-only", **(attrs or {})}
        if preview:
            attrs["data-preview-target"] = preview
        super().__init__(attrs=attrs)
        self.ratio, self.hint = ratio, hint

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context["widget"].update(ratio=self.ratio, hint=self.hint)
        return context
