from django.db import models
from accounts.models import User, UserProfile
from accounts.utils import send_notification


# Create your models here.
class Vendor(models.Model):
    user = models.OneToOneField(User, related_name='user', on_delete=models.CASCADE)
    user_profile = models.OneToOneField(UserProfile, related_name='userprofile', on_delete=models.CASCADE)
    vendor_name = models.CharField(max_length=50, help_text="Fill the name of the vendor.")
    vendor_slug = models.SlugField(max_length=100, unique=True, help_text="The slug of the vendor.")
    vendor_license = models.ImageField(upload_to='vendor/license', help_text="Upload a capture of the licence of the vendor (image).")
    is_approved = models.BooleanField(default=False, help_text="Set if the vendor is approved or not.")
    created_at = models.DateTimeField(auto_now_add=True, help_text="The date of registration of the vendor.")
    modified_at = models.DateTimeField(auto_now=True, help_text="The date where the vendor has been edited or updated.")

    def __str__(self):
        return self.vendor_name

    def save(self, *args, **kwargs):
        if self.pk is not None:
            # Update
            orig = Vendor.objects.get(pk=self.pk)
            if orig.is_approved != self.is_approved:
                mail_template = 'accounts/emails/admin-approval-email.html'
                context = {
                    'user': self.user,
                    'is_approved': self.is_approved,
                    'to_email': self.user.email,
                }
                if self.is_approved == True:
                    # Send notification email
                    mail_subject = "Congratulations! Your shop has been approved."
                    send_notification(mail_subject, mail_template, context)
                else:
                    # Send notification email
                    mail_subject = "We're sorry! You are not eligible for publishing your goods on our flea marketplace."
                    send_notification(mail_subject, mail_template, context)
        return super(Vendor, self).save(*args, **kwargs)
