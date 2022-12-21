from django.shortcuts import render, redirect

from .forms import UserForm
from .models import User
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
    pass
