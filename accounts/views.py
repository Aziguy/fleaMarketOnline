from django.shortcuts import render, redirect
from django.utils.text import slugify

from vendor.forms import VendorForm
from .forms import UserForm
from .models import User, UserProfile
from django.contrib import messages


# Create your views here.
def registerUser(request):
    if request.method == 'POST':
        # print(request.POST)
        form = UserForm(request.POST)
        if form.is_valid():
            # Create the user using the form
            # password = form.cleaned_data['password']
            # user = form.save(commit=False)
            # user.set_password(password)
            # user.role = User.CUSTOMER
            # user.save()

            # Create user using create_user() method
            firstname = form.cleaned_data['firstname']
            lastname = form.cleaned_data['lastname']
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            user = User.objects.create_user(
                firstname=firstname,
                lastname=lastname,
                username=username,
                email=email,
                password=password
            )
            user.role = User.CUSTOMER
            user.save()
            messages.success(request, 'Your account has been registered sucessfully!')
            return redirect('register-user')
        else:
            print('Invalid form!!!')
            print(form.errors)
    else:
        form = UserForm()
    context = {
        'form': form,
    }
    return render(request, 'accounts/register-user.html', context)


def registerVendor(request):
    if request.method == 'POST':
        # store the data and create the user
        form = UserForm(request.POST)
        v_form = VendorForm(request.POST, request.FILES)
        if form.is_valid() and v_form.is_valid:
            firstname = form.cleaned_data['firstname']
            lastname = form.cleaned_data['lastname']
            username = form.cleaned_data['username']
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            user = User.objects.create_user(firstname=firstname, lastname=lastname, username=username, email=email, password=password)
            user.role = User.VENDOR
            user.save()
            vendor = v_form.save(commit=False)
            vendor.user = user
            vendor_name = v_form.cleaned_data['vendor_name']
            vendor.vendor_slug = slugify(vendor_name)+'-'+str(user.id)
            user_profile = UserProfile.objects.get(user=user)
            vendor.user_profile = user_profile
            vendor.save()

            # # Send verification email
            # mail_subject = 'Please activate your account'
            # email_template = 'accounts/emails/account_verification_email.html'
            # send_verification_email(request, user, mail_subject, email_template)

            messages.success(request, 'Your account has been registered sucessfully! Please wait for the approval.')
            return redirect('register-vendor')
        else:
            print('invalid form')
            print(form.errors)
    else:
        form = UserForm()
        v_form = VendorForm()

    context = {
        'form': form,
        'v_form': v_form,
    }

    return render(request, 'accounts/register-vendor.html', context)