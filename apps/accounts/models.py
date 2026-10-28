from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.fields import PhoneField
from apps.core.phone import normalize_phone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, phone, password=None, **extra):
        if not phone:
            raise ValueError("Le numéro de téléphone est obligatoire.")
        email = extra.pop("email", None)
        user = self.model(
            phone=normalize_phone(phone),
            email=self.normalize_email(email) or None,
            **extra,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True, role=User.Role.ADMIN)
        return self.create_user(phone, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = "customer", _("Client")
        MERCHANT = "merchant", _("Commerçant")
        ADMIN = "admin", _("Administrateur du mall")

    first_name = models.CharField(_("prénom"), max_length=60)
    last_name = models.CharField(_("nom"), max_length=60, blank=True)
    phone = PhoneField(_("téléphone"), unique=True)
    email = models.EmailField(_("e-mail"), unique=True, null=True, blank=True)
    role = models.CharField(_("rôle"), max_length=10, choices=Role, default=Role.CUSTOMER)
    is_active = models.BooleanField(_("actif"), default=True)
    is_staff = models.BooleanField(_("accès administration"), default=False)
    date_joined = models.DateTimeField(_("inscrit le"), default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        verbose_name = _("utilisateur")
        verbose_name_plural = _("utilisateurs")

    def __str__(self):
        return self.get_full_name() or self.phone

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def save(self, *args, **kwargs):
        if self.email == "":
            self.email = None
        super().save(*args, **kwargs)

    @property
    def is_merchant(self):
        return self.role == self.Role.MERCHANT
