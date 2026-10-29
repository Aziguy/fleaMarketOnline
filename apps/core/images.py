from io import BytesIO
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.db.models import FileField, Model
from django.db.models.signals import post_delete, post_save, pre_save
from django.utils.translation import gettext as _
from PIL import Image, ImageOps

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def optimize_image(upload, *, size, crop=False, min_size=(0, 0)):
    """Redimensionne (et recadre si demandé) une image téléversée, convertie en WebP."""
    if upload.size > MAX_UPLOAD_BYTES:
        raise ValidationError(_("Image trop lourde : 5 Mo maximum."))
    upload.seek(0)
    image = ImageOps.exif_transpose(Image.open(upload))
    if image.width < min_size[0] or image.height < min_size[1]:
        raise ValidationError(
            _("Image trop petite : au moins %(w)s × %(h)s pixels."),
            params={"w": min_size[0], "h": min_size[1]},
        )
    image = image.convert("RGBA" if image.mode in ("RGBA", "LA", "P") else "RGB")
    if crop:
        image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
    else:
        image.thumbnail(size, Image.Resampling.LANCZOS)
    buffer = BytesIO()
    image.save(buffer, "WEBP", quality=82, method=6)
    return ContentFile(buffer.getvalue(), name=f"{Path(upload.name).stem[:60]}.webp")


class OptimizedImagesMixin:
    """Optimise les champs image listés dans `image_specs` à la validation du formulaire."""

    image_specs: dict[str, dict] = {}
    cleaned_data: dict

    def clean(self):
        data = super().clean()  # type: ignore[misc]
        for name, spec in self.image_specs.items():
            value = self.cleaned_data.get(name)
            if isinstance(value, UploadedFile):
                try:
                    self.cleaned_data[name] = optimize_image(value, **spec)
                except ValidationError as error:
                    self.add_error(name, error)  # type: ignore[attr-defined]
        return data


def _file_fields(instance):
    return [f.name for f in instance._meta.fields if isinstance(f, FileField)]


def _delete(storage, name):
    transaction.on_commit(lambda: storage.delete(name))


def _remember_files(sender, instance, **kwargs):
    if not instance.pk:
        return
    old = sender.objects.filter(pk=instance.pk).values(*_file_fields(instance)).first() or {}
    instance._previous_files = old


def _delete_replaced_files(sender, instance, **kwargs):
    for name, old in getattr(instance, "_previous_files", {}).items():
        current = getattr(instance, name)
        if old and old != current.name:
            _delete(current.storage, old)


def _delete_files(sender, instance, **kwargs):
    for name in _file_fields(instance):
        if file := getattr(instance, name):
            _delete(file.storage, file.name)


def cleanup_files(model: type[Model]):
    """Supprime du stockage les fichiers remplacés, vidés ou dont l'objet est supprimé."""
    pre_save.connect(_remember_files, sender=model, weak=False)
    post_save.connect(_delete_replaced_files, sender=model, weak=False)
    post_delete.connect(_delete_files, sender=model, weak=False)
    return model
