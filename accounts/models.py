from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db.models.fields.related import ForeignKey, OneToOneField

from django.contrib.gis.db import models as gismodels
from django.contrib.gis.geos import Point


# Create your models here.
class UserManager(BaseUserManager):
    """
    Manager for custom user profiles model
    For more on user models with authentication see https://github.com/django/django/blob/stable/3.0.x/django/contrib/auth/models.py#L131-L158
    """

    # Function that Django CLI will use when creating users
    # password=None means that if a password is not set it wil default to None,
    # preventing authentication with the user until a password is set.
    def create_user(self, firstname, lastname, username, email, password=None):
        """Create a new user profile"""
        if not firstname:
            raise ValueError("Users must have a firstname.")
        if not lastname:
            raise ValueError("Users must have a lastname.")
        if not email:
            raise ValueError("Users must have an email address.")

        # Normalize the email address (makes the 2nd part of the address all lowercase)
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            username=username,
            firstname=firstname,
            lastname=lastname,
        )
        # set_password will encrypt the provided password - good practice to do so!
        # Even though there's only one database, it's good practice to name the database anyway, using:
        # user.save(using=self._db)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Function for creating super-users
    # NB. all superusers must have a password, hence no "password=None"
    def create_superuser(self, firstname, lastname, username, email, password=None):
        """Create a new superuser profile"""
        user = self.create_user(
            email=self.normalize_email(email),
            username=username,
            password=password,
            firstname=firstname,
            lastname=lastname,
        )
        user.is_admin = True
        user.is_active = True
        user.is_staff = True
        user.is_superadmin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """User model: a user in the system."""

    VENDOR = 1
    CUSTOMER = 2

    ROLE_CHOICE = (
        (VENDOR, "Vendor"),
        (CUSTOMER, "Customer"),
    )
    firstname = models.CharField(max_length=50, help_text="Firstname of the user.")
    lastname = models.CharField(max_length=50, help_text="Lastname of the user.")
    username = models.CharField(
        max_length=50, unique=True, help_text="The username of that user."
    )
    email = models.EmailField(
        max_length=100, unique=True, help_text="Email address of the user."
    )
    phone_number = models.CharField(
        max_length=12, blank=True, help_text="The phone number of the user."
    )
    role = models.PositiveSmallIntegerField(
        choices=ROLE_CHOICE,
        blank=True,
        null=True,
        help_text="Select the role of the user (Customer or Vendor.",
    )

    # required fields
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now_add=True)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "firstname", "lastname"]

    # Use our UserManager instead of default UserManager
    objects = UserManager()

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True

    def get_role(self):
        if self.role == 1:
            user_role = "Vendor"
        elif self.role == 2:
            user_role = "Customer"
        return user_role


class UserProfile(models.Model):
    user = OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="users/profile_pictures", blank=True, null=True
    )
    cover_photo = models.ImageField(
        upload_to="users/cover_photos", blank=True, null=True
    )
    address = models.CharField(max_length=250, blank=True, null=True)
    country = models.CharField(max_length=15, blank=True, null=True)
    state = models.CharField(max_length=15, blank=True, null=True)
    city = models.CharField(max_length=15, blank=True, null=True)
    po_box = models.CharField(max_length=6, blank=True, null=True)
    latitude = models.CharField(max_length=20, blank=True, null=True)
    longitude = models.CharField(max_length=20, blank=True, null=True)
    location = gismodels.PointField(blank=True, null=True, srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    # def full_address(self):
    #     return f'{self.address_line_1}, {self.address_line_2}'

    def __str__(self):
        return self.user.email

    def save(self, *args, **kwargs):
        if self.latitude and self.longitude:
            self.location = Point(float(self.longitude), float(self.latitude))
            return super(UserProfile, self).save(*args, **kwargs)
        return super(UserProfile, self).save(*args, **kwargs)
